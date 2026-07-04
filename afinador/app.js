const startBtn = document.getElementById("startBtn");
const noteNameEl = document.getElementById("noteName");
const octaveEl = document.getElementById("octave");
const frequencyEl = document.getElementById("frequency");
const centsEl = document.getElementById("cents");
const needleEl = document.getElementById("needle");
const feedbackEl = document.getElementById("feedback");
const a4Select = document.getElementById("a4Reference");
const exerciseText = document.getElementById("exerciseText");

const noteNames = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const MIN_FREQUENCY = 120;
const MAX_FREQUENCY = 2600;
const MIN_RMS = 0.006;
const CLARITY_THRESHOLD = 0.12;
const STABLE_HISTORY_SIZE = 5;

let audioContext;
let analyser;
let micSource;
let micStream;
let buffer;
let animationId;
let isRunning = false;
let lastPitch = null;
let pitchHistory = [];

function setFeedback(message, state = "") {
  feedbackEl.textContent = message;
  feedbackEl.className = `feedback${state ? ` ${state}` : ""}`;
}

function resetDisplay(message = "Toca una nota clara y sostenida.", state = "warning") {
  noteNameEl.textContent = "—";
  octaveEl.textContent = "";
  frequencyEl.textContent = "— Hz";
  centsEl.textContent = "— cents";
  needleEl.style.left = "50%";
  setFeedback(message, state);
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
  if (rms < MIN_RMS) return { frequency: null, rms, clarity: 0, reason: "quiet" };

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

async function requestMicrophoneStream() {
  const preferredConstraints = {
    audio: {
      autoGainControl: false,
      channelCount: 1,
      echoCancellation: false,
      noiseSuppression: false
    },
    video: false
  };

  try {
    return await navigator.mediaDevices.getUserMedia(preferredConstraints);
  } catch (error) {
    if (error?.name !== "OverconstrainedError" && error?.name !== "ConstraintNotSatisfiedError") {
      throw error;
    }

    return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
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
    await audioContext.resume();

    micStream = await requestMicrophoneStream();

    if (audioContext.state === "suspended") await audioContext.resume();

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 8192;
    analyser.smoothingTimeConstant = 0;
    buffer = new Float32Array(analyser.fftSize);

    micSource = audioContext.createMediaStreamSource(micStream);
    micSource.connect(analyser);

    isRunning = true;
    startBtn.textContent = "Afinador activo";
    setFeedback("Micrófono activo. Toca una nota larga y estable.", "listening");
    updatePitch();
  } catch (error) {
    startBtn.disabled = false;
    startBtn.textContent = "Activar micrófono";
    resetDisplay(getMicrophoneErrorMessage(error), "error");
  }
}

function updatePitch() {
  if (!isRunning || !analyser || !audioContext) return;

  analyser.getFloatTimeDomainData(buffer);
  const result = detectPitchYin(buffer, audioContext.sampleRate);

  if (result.frequency) {
    renderPitch(smoothFrequency(result.frequency));
  } else {
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((registration) => registration.update())
      .catch(() => {});
  });
}
