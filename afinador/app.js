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

let audioContext;
let analyser;
let micSource;
let buffer;
let isRunning = false;

function frequencyToMidi(freq, a4 = 442) {
  return 69 + 12 * Math.log2(freq / a4);
}

function midiToFrequency(midi, a4 = 442) {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

function autoCorrelate(buf, sampleRate) {
  let size = buf.length;
  let rms = 0;

  for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / size);
  if (rms < 0.01) return -1;

  let r1 = 0;
  let r2 = size - 1;
  const threshold = 0.2;

  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(buf[i]) < threshold) {
      r1 = i;
      break;
    }
  }

  for (let i = 1; i < size / 2; i++) {
    if (Math.abs(buf[size - i]) < threshold) {
      r2 = size - i;
      break;
    }
  }

  buf = buf.slice(r1, r2);
  size = buf.length;

  const correlations = new Array(size).fill(0);
  for (let lag = 0; lag < size; lag++) {
    for (let i = 0; i < size - lag; i++) {
      correlations[lag] += buf[i] * buf[i + lag];
    }
  }

  let d = 0;
  while (correlations[d] > correlations[d + 1]) d++;

  let maxValue = -1;
  let maxPosition = -1;
  for (let i = d; i < size; i++) {
    if (correlations[i] > maxValue) {
      maxValue = correlations[i];
      maxPosition = i;
    }
  }

  let t0 = maxPosition;
  if (t0 <= 0) return -1;

  const x1 = correlations[t0 - 1];
  const x2 = correlations[t0];
  const x3 = correlations[t0 + 1];

  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) t0 = t0 - b / (2 * a);

  return sampleRate / t0;
}

async function startTuner() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 4096;
    buffer = new Float32Array(analyser.fftSize);

    micSource = audioContext.createMediaStreamSource(stream);
    micSource.connect(analyser);

    isRunning = true;
    startBtn.textContent = "Afinador activo";
    startBtn.disabled = true;
    updatePitch();
  } catch (error) {
    feedbackEl.textContent = "No se pudo acceder al micrófono. Revisa permisos del navegador.";
  }
}

function updatePitch() {
  if (!isRunning) return;

  analyser.getFloatTimeDomainData(buffer);
  const freq = autoCorrelate(buffer, audioContext.sampleRate);
  const a4 = Number(a4Select.value);

  if (freq > 60 && freq < 2500) {
    const midi = frequencyToMidi(freq, a4);
    const roundedMidi = Math.round(midi);
    const noteIndex = ((roundedMidi % 12) + 12) % 12;
    const octave = Math.floor(roundedMidi / 12) - 1;
    const targetFreq = midiToFrequency(roundedMidi, a4);
    const cents = Math.round(1200 * Math.log2(freq / targetFreq));

    noteNameEl.textContent = noteNames[noteIndex];
    octaveEl.textContent = octave;
    frequencyEl.textContent = `${freq.toFixed(1)} Hz`;
    centsEl.textContent = `${cents > 0 ? "+" : ""}${cents} cents`;

    const limited = Math.max(-50, Math.min(50, cents));
    const percent = 50 + limited;
    needleEl.style.left = `${percent}%`;

    if (Math.abs(cents) <= 5) {
      feedbackEl.textContent = "Centro estable. Mantén la calidad del sonido.";
    } else if (cents < -5) {
      feedbackEl.textContent = "La nota está baja. Revisa dirección del aire, apoyo y estabilidad.";
    } else {
      feedbackEl.textContent = "La nota está alta. Evita apretar la embocadura.";
    }
  } else {
    noteNameEl.textContent = "—";
    octaveEl.textContent = "";
    frequencyEl.textContent = "— Hz";
    centsEl.textContent = "— cents";
    needleEl.style.left = "50%";
    feedbackEl.textContent = "Toca una nota clara y sostenida.";
  }

  requestAnimationFrame(updatePitch);
}

startBtn.addEventListener("click", startTuner);

document.querySelectorAll(".exercise").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".exercise").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    exerciseText.textContent = button.dataset.instruction;
  });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
