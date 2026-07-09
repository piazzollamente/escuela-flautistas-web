(() => {
  "use strict";

  if (!window.AnalyserNode) return;

  const noteNames = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  const analyserState = new WeakMap();
  const prototype = window.AnalyserNode.prototype;
  if (prototype.getFloatTimeDomainData.__edfHighRegister) return;

  const originalGetData = prototype.getFloatTimeDomainData;

  function magnitudeAt(buffer, sampleRate, frequency) {
    let real = 0;
    let imaginary = 0;
    const step = 2 * Math.PI * frequency / sampleRate;
    for (let i = 0; i < buffer.length; i++) {
      const phase = step * i;
      real += buffer[i] * Math.cos(phase);
      imaginary -= buffer[i] * Math.sin(phase);
    }
    return Math.hypot(real, imaginary) / buffer.length;
  }

  function detectHighPitch(buffer, sampleRate) {
    let mean = 0;
    let peak = 0;
    for (let i = 0; i < buffer.length; i++) mean += buffer[i];
    mean /= buffer.length || 1;

    const data = new Float32Array(buffer.length);
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) {
      const value = buffer[i] - mean;
      data[i] = value;
      rms += value * value;
      peak = Math.max(peak, Math.abs(value));
    }
    rms = Math.sqrt(rms / (buffer.length || 1));
    if (rms < 0.0045 || peak < 0.012) return null;

    const minFrequency = 2050;
    const maxFrequency = 5000;
    const minTau = Math.max(2, Math.floor(sampleRate / maxFrequency));
    const maxTau = Math.min(64, Math.ceil(sampleRate / minFrequency));
    const difference = new Float32Array(maxTau + 1);

    for (let tau = 1; tau <= maxTau; tau++) {
      let sum = 0;
      const limit = data.length - tau;
      for (let i = 0; i < limit; i++) {
        const delta = data[i] - data[i + tau];
        sum += delta * delta;
      }
      difference[tau] = sum;
    }

    let running = 0;
    let bestTau = -1;
    let bestValue = Infinity;
    for (let tau = 1; tau <= maxTau; tau++) {
      running += difference[tau];
      if (tau < minTau || running <= 0) continue;
      const normalized = difference[tau] * tau / running;
      if (normalized < bestValue) {
        bestValue = normalized;
        bestTau = tau;
      }
    }

    if (bestTau < 0 || bestValue > 0.34) return null;

    let refinedTau = bestTau;
    if (bestTau > minTau && bestTau < maxTau) {
      const left = difference[bestTau - 1];
      const center = difference[bestTau];
      const right = difference[bestTau + 1];
      const denominator = 2 * (2 * center - left - right);
      if (Math.abs(denominator) > 1e-9) refinedTau += (right - left) / denominator;
    }

    const frequency = sampleRate / refinedTau;
    if (frequency < minFrequency || frequency > maxFrequency) return null;

    const fundamentalMagnitude = magnitudeAt(data, sampleRate, frequency);
    const halfMagnitude = magnitudeAt(data, sampleRate, frequency / 2);
    if (halfMagnitude > fundamentalMagnitude * 0.72) return null;

    let risingCrossings = 0;
    const threshold = Math.max(0.002, peak * 0.09);
    for (let i = 1; i < data.length; i++) {
      if (data[i - 1] < -threshold && data[i] >= threshold) risingCrossings++;
    }
    const crossingFrequency = risingCrossings * sampleRate / data.length;
    if (crossingFrequency && Math.abs(crossingFrequency - frequency) / frequency > 0.42) return null;

    return { frequency, confidence: 1 - bestValue };
  }

  function renderHighPitch(frequency) {
    const status = document.querySelector("#tunerStatus");
    if (!status?.classList.contains("live")) return;

    const calibration = Math.min(450, Math.max(430, Number(document.querySelector("#calibrationInput")?.value) || 440));
    const midi = 69 + 12 * Math.log2(frequency / calibration);
    const nearest = Math.round(midi);
    const cents = Math.round((midi - nearest) * 100);
    const note = noteNames[(nearest % 12 + 12) % 12];
    const octave = Math.floor(nearest / 12) - 1;

    const noteElement = document.querySelector("#detectedNote");
    const octaveElement = document.querySelector("#detectedOctave");
    const frequencyElement = document.querySelector("#frequencyDisplay");
    const centsElement = document.querySelector("#centDisplay");
    const needle = document.querySelector("#centNeedle");
    const advice = document.querySelector("#tunerAdvice");

    if (noteElement) noteElement.textContent = note;
    if (octaveElement) octaveElement.textContent = octave;
    if (frequencyElement) frequencyElement.textContent = `${frequency.toFixed(1)} Hz`;
    if (centsElement) centsElement.textContent = `${cents > 0 ? "+" : ""}${cents} cents`;
    if (needle) needle.style.left = `${50 + Math.min(50, Math.max(-50, cents))}%`;
    if (advice) {
      advice.textContent = Math.abs(cents) <= 7
        ? "Registro sobreagudo estable. Mantén el aire veloz y evita apretar la embocadura."
        : cents > 0
          ? "Registro sobreagudo alto. Revisa apoyo y dirección del aire antes de cerrar más."
          : "Registro sobreagudo bajo. Sostén la velocidad del aire sin aumentar la tensión.";
    }
  }

  const patchedGetData = function(array) {
    originalGetData.call(this, array);
    const detected = detectHighPitch(array, this.context.sampleRate);
    const state = analyserState.get(this) || { values: [] };

    if (detected) {
      state.values.push(detected.frequency);
      if (state.values.length > 4) state.values.shift();
      analyserState.set(this, state);

      if (state.values.length >= 2) {
        const sorted = [...state.values].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const spread = Math.max(...state.values) - Math.min(...state.values);
        if (spread / median < 0.045) queueMicrotask(() => renderHighPitch(median));
      }
    } else {
      state.values.length = 0;
      analyserState.set(this, state);
    }
  };

  patchedGetData.__edfHighRegister = true;
  prototype.getFloatTimeDomainData = patchedGetData;
})();
