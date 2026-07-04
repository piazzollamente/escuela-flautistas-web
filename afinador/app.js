const missingDomIds = [];

function createFallbackElement(id) {
  return {
    id,
    dataset: {},
    disabled: false,
    textContent: "",
    value: id === "a4Reference" ? "442" : "",
    style: {},
    classList: {
      add() {},
      remove() {}
    },
    addEventListener() {},
    getBoundingClientRect: () => ({ width: 0, height: 0 }),
    getContext: () => null
  };
}

function getDomElement(id) {
  const element = document.getElementById(id);
  if (element) return element;

  missingDomIds.push(id);
  return createFallbackElement(id);
}

const startBtn = getDomElement("startBtn");
const noteNameEl = getDomElement("noteName");
const octaveEl = getDomElement("octave");
const frequencyEl = getDomElement("frequency");
const centsEl = getDomElement("cents");
const needleEl = getDomElement("needle");
const feedbackEl = getDomElement("feedback");
const a4Select = getDomElement("a4Reference");
const exerciseText = getDomElement("exerciseText");
const debugPanelEl = document.getElementById("debugPanel");
const debugLogEl = document.getElementById("debugLog");
const currentCentsEl = getDomElement("currentCents");
const trendEl = getDomElement("trend");
const stabilityEl = getDomElement("stability");
const historyCanvas = getDomElement("historyCanvas");
const historyContext = historyCanvas.getContext("2d");

const noteNames = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const MIN_FREQUENCY = 120;
const MAX_FREQUENCY = 2600;
const DEFAULT_MIN_RMS = 0.006;
const IOS_MIN_RMS = 0.003;
const CLARITY_THRESHOLD = 0.12;
const STABLE_HISTORY_SIZE = 5;
const HISTORY_DURATION_MS = 30000;
const TREND_WINDOW_MS = 5000;
const STABILITY_WINDOW_MS = 10000;
const HISTORY_PADDING = {
  top: 12,
  right: 10,
  bottom: 16,
  left: 34
};
const DEBUG_MODE = new URLSearchParams(window.location.search).get("debug") === "1";
const userAgent = navigator.userAgent || "";
const platform = navigator.platform || "";
const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isMobileSafari = isIOS && /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent);
const minRms = isIOS ? IOS_MIN_RMS : DEFAULT_MIN_RMS;
const analyserFftSize = isIOS ? 4096 : 8192;

let audioContext;
let analyser;
let micSource;
let micStream;
let buffer;
let animationId;
let isRunning = false;
let lastPitch = null;
let pitchHistory = [];
let centsHistory = [];
let lastCanvasWidth = 0;
let lastCanvasHeight = 0;
let lastDebugRmsLog = 0;
let lastDebugPitchLog = 0;

function setFeedback(message, state = "") {
  feedbackEl.textContent = message;
  feedbackEl.className = `feedback${state ? ` ${state}` : ""}`;
}

function addDebugLog(message) {
  if (!DEBUG_MODE) return;

  const time = new Date().toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  debugPanelEl?.classList.add("visible");
  if (debugLogEl) {
    const line = document.createElement("div");
    line.textContent = `${time} · ${message}`;
    debugLogEl.appendChild(line);

    while (debugLogEl.childNodes.length > 80) {
      debugLogEl.removeChild(debugLogEl.firstChild);
    }

    debugLogEl.scrollTop = debugLogEl.scrollHeight;
  }
}

function setDebugValue(id, value) {
  if (!DEBUG_MODE) return;
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function formatAudioState(state) {
  return state === "running" ? "activo" : state || "desconocido";
}

function initDebugPanel() {
  if (!DEBUG_MODE) return;

  debugPanelEl?.classList.add("visible");
  addDebugLog(isMobileSafari ? "Safari detectado" : isIOS ? "iOS detectado" : "Navegador no iOS detectado");
  setDebugValue("debugBrowser", isMobileSafari ? "Safari móvil" : isIOS ? "iOS" : "Desktop/otro");
  setDebugValue("debugFft", String(analyserFftSize));
  setDebugValue("debugMinRms", minRms.toFixed(4));
}

function showDomWarning() {
  if (!missingDomIds.length) return;

  const message = `Algunos elementos visuales no están disponibles (${missingDomIds.join(", ")}). Recarga la página para limpiar una versión anterior en caché.`;
  setFeedback(message, "error");

  if (document.getElementById("domWarning")) return;

  const warning = document.createElement("p");
  warning.id = "domWarning";
  warning.className = "feedback error";
  warning.textContent = message;
  const target = document.querySelector(".tuner-card") || document.body;
  target?.prepend(warning);
}

function resetDisplay(message = "Toca una nota clara y sostenida.", state = "warning") {
  noteNameEl.textContent = "—";
  octaveEl.textContent = "";
  frequencyEl.textContent = "— Hz";
  centsEl.textContent = "— cents";
  needleEl.style.left = "50%";
  setFeedback(message, state);
  updateHistoryStats();
  drawHistory();
}

function frequencyToMidi(freq, a4 = 442) {
  return 69 + 12 * Math.log2(freq / a4);
}

function midiToFrequency(midi, a4 = 442) {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

function getRms(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

function parabolicInterpolation(values, index) {
  const previous = values[index - 1];
  const current = values[index];
  const next = values[index + 1];
  const divisor = previous + next - 2 * current;

  if (!Number.isFinite(divisor) || Math.abs(divisor) < 1e-12) return index;
  return index + (previous - next) / (2 * divisor);
}

function detectPitchYin(samples, sampleRate) {
  const rms = getRms(samples);
  if (rms < minRms) return { frequency: null, rms, clarity: 0, reason: "quiet" };

  const minTau = Math.max(2, Math.floor(sampleRate / MAX_FREQUENCY));
  const maxTau = Math.min(Math.floor(sampleRate / MIN_FREQUENCY), Math.floor(samples.length / 2) - 1);
  const yin = new Float32Array(maxTau + 1);
  let runningSum = 0;

  for (let tau = 1; tau <= maxTau; tau += 1) {
    let difference = 0;
    for (let i = 0; i < maxTau; i += 1) {
      const delta = samples[i] - samples[i + tau];
      difference += delta * delta;
    }

    runningSum += difference;
    yin[tau] = runningSum === 0 ? 1 : (difference * tau) / runningSum;
  }

  let tauEstimate = -1;
  for (let tau = minTau; tau <= maxTau; tau += 1) {
    if (yin[tau] < CLARITY_THRESHOLD) {
      while (tau + 1 <= maxTau && yin[tau + 1] < yin[tau]) tau += 1;
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === -1) {
    let bestTau = minTau;
    for (let tau = minTau + 1; tau <= maxTau; tau += 1) {
      if (yin[tau] < yin[bestTau]) bestTau = tau;
    }

    if (yin[bestTau] > 0.22) {
      return { frequency: null, rms, clarity: 1 - yin[bestTau], reason: "unclear" };
    }
    tauEstimate = bestTau;
  }

  const refinedTau = parabolicInterpolation(yin, tauEstimate);
  const frequency = sampleRate / refinedTau;
  const clarity = Math.max(0, Math.min(1, 1 - yin[tauEstimate]));

  if (!Number.isFinite(frequency) || frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) {
    return { frequency: null, rms, clarity, reason: "out-of-range" };
  }

  return { frequency, rms, clarity, reason: "ok" };
}

function smoothFrequency(frequency) {
  if (!lastPitch) {
    lastPitch = frequency;
  }

  const centsFromLast = Math.abs(1200 * Math.log2(frequency / lastPitch));
  if (centsFromLast > 80) pitchHistory = [];

  pitchHistory.push(frequency);
  if (pitchHistory.length > STABLE_HISTORY_SIZE) pitchHistory.shift();

  const sorted = [...pitchHistory].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  lastPitch = median;

  return median;
}

function renderPitch(frequency) {
  const a4 = Number(a4Select.value);
  const midi = frequencyToMidi(frequency, a4);
  const roundedMidi = Math.round(midi);
  const noteIndex = ((roundedMidi % 12) + 12) % 12;
  const octave = Math.floor(roundedMidi / 12) - 1;
  const targetFreq = midiToFrequency(roundedMidi, a4);
  const cents = Math.round(1200 * Math.log2(frequency / targetFreq));
  const limitedCents = Math.max(-50, Math.min(50, cents));

  noteNameEl.textContent = noteNames[noteIndex];
  octaveEl.textContent = octave;
  frequencyEl.textContent = `${frequency.toFixed(1)} Hz`;
  centsEl.textContent = `${cents > 0 ? "+" : ""}${cents} cents`;
  needleEl.style.left = `${50 + limitedCents}%`;
  recordCents(cents);

  if (Math.abs(cents) <= 5) {
    setFeedback("Centro estable. Mantén la calidad del sonido.", "listening");
  } else if (cents < -5) {
    setFeedback("La nota está baja. Revisa dirección del aire, apoyo y estabilidad.", "listening");
  } else {
    setFeedback("La nota está alta. Evita apretar la embocadura.", "listening");
  }
}

function getMicrophoneErrorMessage(error) {
  if (!navigator.mediaDevices?.getUserMedia) {
    return "Este navegador no expone acceso al micrófono. Prueba Safari o Chrome actualizado.";
  }

  if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
    return "El micrófono está bloqueado. Actívalo en los permisos del navegador y vuelve a intentarlo.";
  }

  if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
    return "No se encontró un micrófono disponible en este dispositivo.";
  }

  if (error?.name === "NotReadableError" || error?.name === "TrackStartError") {
    return "El micrófono está ocupado o el sistema no permite abrirlo ahora.";
  }

  return "No se pudo acceder al micrófono. Revisa permisos del navegador.";
}

function formatCents(cents) {
  return `${cents > 0 ? "+" : ""}${Math.round(cents)} cents`;
}

function pruneCentsHistory(now = performance.now()) {
  centsHistory = centsHistory.filter((sample) => now - sample.time <= HISTORY_DURATION_MS);
}

function getAverageCents(samples) {
  if (!samples.length) return null;
  return samples.reduce((sum, sample) => sum + sample.cents, 0) / samples.length;
}

function getTrend(now = performance.now()) {
  const windowSamples = centsHistory.filter((sample) => now - sample.time <= TREND_WINDOW_MS);
  if (windowSamples.length < 4) return "estable";

  const midpoint = windowSamples[0].time + (windowSamples[windowSamples.length - 1].time - windowSamples[0].time) / 2;
  const initialAverage = getAverageCents(windowSamples.filter((sample) => sample.time <= midpoint));
  const finalAverage = getAverageCents(windowSamples.filter((sample) => sample.time > midpoint));

  if (initialAverage === null || finalAverage === null) return "estable";
  if (finalAverage - initialAverage > 5) return "sube";
  if (initialAverage - finalAverage > 5) return "baja";
  return "estable";
}

function getStability(now = performance.now()) {
  const recentSamples = centsHistory.filter((sample) => now - sample.time <= STABILITY_WINDOW_MS);
  if (!recentSamples.length) return null;

  const stableSamples = recentSamples.filter((sample) => Math.abs(sample.cents) <= 5);
  return Math.round((stableSamples.length / recentSamples.length) * 100);
}

function updateHistoryStats(now = performance.now()) {
  const latest = centsHistory[centsHistory.length - 1];
  const stability = getStability(now);

  currentCentsEl.textContent = latest ? `Actual: ${formatCents(latest.cents)}` : "Actual: — cents";
  trendEl.textContent = `Tendencia: ${getTrend(now)}`;
  stabilityEl.textContent = stability === null ? "Estabilidad: —%" : `Estabilidad: ${stability}%`;
}

function getCentsColor(cents) {
  const absolute = Math.abs(cents);
  if (absolute <= 5) return "#2E8B57";
  if (absolute <= 20) return "#D9902F";
  return "#8E1F2F";
}

function setupCanvasSize() {
  if (!historyCanvas || !historyContext) return false;

  const rect = historyCanvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * pixelRatio));
  const height = Math.max(1, Math.round(rect.height * pixelRatio));

  if (width !== lastCanvasWidth || height !== lastCanvasHeight) {
    historyCanvas.width = width;
    historyCanvas.height = height;
    lastCanvasWidth = width;
    lastCanvasHeight = height;
  }

  historyContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  return true;
}

function mapCentsToY(cents, chartTop, chartHeight) {
  const limited = Math.max(-50, Math.min(50, cents));
  return chartTop + ((50 - limited) / 100) * chartHeight;
}

function drawHistoryLabels(ctx, width, height, chartTop, chartHeight) {
  const labels = [50, 25, 0, -25, -50];

  ctx.font = "700 11px Montserrat, Inter, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  labels.forEach((value) => {
    const y = mapCentsToY(value, chartTop, chartHeight);
    ctx.strokeStyle = value === 0 ? "rgba(22, 19, 19, 0.35)" : "rgba(22, 19, 19, 0.09)";
    ctx.lineWidth = value === 0 ? 1.4 : 1;
    ctx.beginPath();
    ctx.moveTo(HISTORY_PADDING.left, y);
    ctx.lineTo(width - HISTORY_PADDING.right, y);
    ctx.stroke();

    ctx.fillStyle = value === 0 ? "#161313" : "#726861";
    ctx.fillText(value > 0 ? `+${value}` : String(value), HISTORY_PADDING.left - 7, y);
  });
}

function drawHistory(now = performance.now()) {
  if (!setupCanvasSize()) return;

  const ctx = historyContext;
  const rect = historyCanvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  const chartLeft = HISTORY_PADDING.left;
  const chartRight = width - HISTORY_PADDING.right;
  const chartTop = HISTORY_PADDING.top;
  const chartBottom = height - HISTORY_PADDING.bottom;
  const chartWidth = chartRight - chartLeft;
  const chartHeight = chartBottom - chartTop;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255, 253, 249, 0.72)";
  ctx.fillRect(0, 0, width, height);

  drawHistoryLabels(ctx, width, height, chartTop, chartHeight);

  if (centsHistory.length < 2) {
    ctx.fillStyle = "#726861";
    ctx.font = "700 12px Montserrat, Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Toca una nota larga para ver el historial", chartLeft + chartWidth / 2, chartTop + chartHeight / 2);
    return;
  }

  const samples = centsHistory.filter((sample) => now - sample.time <= HISTORY_DURATION_MS);

  for (let i = 1; i < samples.length; i += 1) {
    const previous = samples[i - 1];
    const current = samples[i];
    const previousX = chartRight - ((now - previous.time) / HISTORY_DURATION_MS) * chartWidth;
    const currentX = chartRight - ((now - current.time) / HISTORY_DURATION_MS) * chartWidth;
    const previousY = mapCentsToY(previous.cents, chartTop, chartHeight);
    const currentY = mapCentsToY(current.cents, chartTop, chartHeight);

    ctx.strokeStyle = getCentsColor(current.cents);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(previousX, previousY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
  }
}

function recordCents(cents) {
  const now = performance.now();
  centsHistory.push({
    time: now,
    cents: Math.max(-50, Math.min(50, cents))
  });

  pruneCentsHistory(now);
  updateHistoryStats(now);
  drawHistory(now);
}

function clearHistory() {
  centsHistory = [];
  updateHistoryStats();
  drawHistory();
}

async function requestMicrophoneStream() {
  addDebugLog("Permiso de micrófono solicitado");

  if (isIOS) {
    addDebugLog("Configuración iOS conservadora: audio true");
    return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  }

  addDebugLog("Configuración desktop: audio true");
  return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
}

async function applyDesktopAudioConstraints(stream) {
  if (isIOS) return;

  const [track] = stream.getAudioTracks();
  if (!track?.applyConstraints) return;

  try {
    await track.applyConstraints({
      autoGainControl: false,
      echoCancellation: false,
      noiseSuppression: false
    });
    addDebugLog("Constraints avanzadas aplicadas");
  } catch (error) {
    addDebugLog(`Constraints avanzadas omitidas: ${error?.name || "desconocido"}`);
  }
}

async function startTuner() {
  if (isRunning) return;

  if (!window.isSecureContext && !["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    resetDisplay("El micrófono sólo funciona en HTTPS. Abre el afinador desde https://escueladeflautistas.cl/afinador/.", "error");
    return;
  }

  if (!AudioContextClass) {
    resetDisplay("Este navegador no soporta Web Audio API. Prueba Safari o Chrome actualizado.", "error");
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    resetDisplay("Este navegador no permite usar el micrófono desde esta página.", "error");
    return;
  }

  try {
    startBtn.disabled = true;
    startBtn.textContent = "Solicitando micrófono...";
    setFeedback("Acepta el permiso del micrófono para iniciar el afinador.", "listening");

    audioContext = audioContext || new AudioContextClass({ latencyHint: "interactive" });
    addDebugLog("AudioContext creado");
    setDebugValue("debugAudioState", formatAudioState(audioContext.state));
    await audioContext.resume();
    addDebugLog(`AudioContext ${formatAudioState(audioContext.state)}`);
    setDebugValue("debugAudioState", formatAudioState(audioContext.state));

    micStream = await requestMicrophoneStream();
    addDebugLog("Stream recibido");
    await applyDesktopAudioConstraints(micStream);

    if (audioContext.state === "suspended") await audioContext.resume();
    addDebugLog(`AudioContext ${formatAudioState(audioContext.state)}`);
    setDebugValue("debugAudioState", formatAudioState(audioContext.state));

    analyser = audioContext.createAnalyser();
    analyser.fftSize = analyserFftSize;
    analyser.smoothingTimeConstant = 0;
    buffer = new Float32Array(analyser.fftSize);

    micSource = audioContext.createMediaStreamSource(micStream);
    micSource.connect(analyser);
    addDebugLog("Analyser conectado");
    setDebugValue("debugFft", String(analyser.fftSize));

    isRunning = true;
    startBtn.textContent = "Afinador activo";
    setFeedback("Micrófono activo. Toca una nota larga y estable.", "listening");
    updatePitch();
  } catch (error) {
    addDebugLog(`Error al iniciar: ${error?.name || "desconocido"}`);
    startBtn.disabled = false;
    startBtn.textContent = "Activar micrófono";
    resetDisplay(getMicrophoneErrorMessage(error), "error");
  }
}

function updatePitch() {
  if (!isRunning || !analyser || !audioContext) return;

  analyser.getFloatTimeDomainData(buffer);
  const result = detectPitchYin(buffer, audioContext.sampleRate);
  const now = performance.now();

  setDebugValue("debugAudioState", formatAudioState(audioContext.state));
  setDebugValue("debugRms", result.rms.toFixed(4));

  if (DEBUG_MODE && now - lastDebugRmsLog > 1200) {
    addDebugLog(`Señal RMS: ${result.rms.toFixed(4)}`);
    lastDebugRmsLog = now;
  }

  if (result.frequency) {
    setDebugValue("debugPitch", `${result.frequency.toFixed(1)} Hz`);
    if (DEBUG_MODE && now - lastDebugPitchLog > 1200) {
      addDebugLog(`Pitch detectado: ${result.frequency.toFixed(1)} Hz`);
      lastDebugPitchLog = now;
    }
    renderPitch(smoothFrequency(result.frequency));
  } else {
    setDebugValue("debugPitch", "—");
    if (result.reason === "quiet") {
      resetDisplay("No hay señal suficiente. Acerca la flauta o toca una nota más sostenida.", "warning");
    } else if (result.reason === "out-of-range") {
      resetDisplay("La señal está fuera del rango esperado para flauta.", "warning");
    } else {
      resetDisplay("Señal inestable. Toca una nota larga, sin ruido alrededor.", "warning");
    }
  }

  animationId = requestAnimationFrame(updatePitch);
}

startBtn.addEventListener("click", startTuner);

a4Select.addEventListener("change", () => {
  pitchHistory = [];
  lastPitch = null;
  clearHistory();
});

document.querySelectorAll(".exercise").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".exercise").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    exerciseText.textContent = button.dataset.instruction;
  });
});

window.addEventListener("pagehide", () => {
  if (animationId) cancelAnimationFrame(animationId);
  micStream?.getTracks().forEach((track) => track.stop());
});

window.addEventListener("resize", drawHistory);

initDebugPanel();
showDomWarning();
drawHistory();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((registration) => registration.update())
      .catch(() => {});
  });
}
