(() => {
  "use strict";

  const tunerToggle = document.getElementById("tunerToggle");
  const tunerView = document.getElementById("view-tuner");
  const metronomeView = document.getElementById("view-metronome");
  const referenceNote = document.getElementById("referenceNote");
  const referenceToggle = document.getElementById("referenceToggle");
  const calibrationInput = document.getElementById("calibrationInput");

  if (metronomeView) {
    metronomeView.style.touchAction = "manipulation";
    metronomeView.addEventListener("dblclick", event => event.preventDefault(), { passive: false });
  }

  let tunerWasActiveBeforeHide = false;
  let recoveryInProgress = false;
  let recoveryTimer = null;

  function tunerIsActive() {
    return tunerToggle?.textContent.trim() === "Detener afinador";
  }

  function rememberTunerState() {
    tunerWasActiveBeforeHide = tunerIsActive();
    if (recoveryTimer) {
      clearTimeout(recoveryTimer);
      recoveryTimer = null;
    }
  }

  function recoverTunerAfterReturn() {
    if (
      !tunerWasActiveBeforeHide ||
      recoveryInProgress ||
      document.visibilityState !== "visible" ||
      !tunerView?.classList.contains("active") ||
      !tunerToggle
    ) return;

    recoveryInProgress = true;

    if (tunerIsActive()) tunerToggle.click();

    recoveryTimer = setTimeout(() => {
      if (
        document.visibilityState === "visible" &&
        tunerView.classList.contains("active") &&
        !tunerIsActive()
      ) {
        tunerToggle.click();
      }

      tunerWasActiveBeforeHide = false;
      recoveryInProgress = false;
      recoveryTimer = null;
    }, 180);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") rememberTunerState();
    else recoverTunerAfterReturn();
  });

  window.addEventListener("pagehide", rememberTunerState);
  window.addEventListener("pageshow", recoverTunerAfterReturn);

  if (!referenceNote || !referenceToggle || !calibrationInput) return;

  const firstOption = referenceNote.options[0] || null;
  if (![...referenceNote.options].some(option => option.value === "F4")) {
    referenceNote.add(new Option("Fa 4", "F4"), firstOption);
  }
  if (![...referenceNote.options].some(option => option.value === "G4")) {
    const a4Option = [...referenceNote.options].find(option => option.value === "A4") || null;
    referenceNote.add(new Option("Sol 4", "G4"), a4Option);
  }

  const referenceSemitones = {
    F4: -4,
    G4: -2,
    A4: 0,
    Bb4: 1,
    C5: 3,
    D5: 5,
    E5: 7
  };

  let referenceAudioContext = null;
  let referenceOscillator = null;
  let referenceGain = null;

  async function ensureReferenceAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio API no disponible");
    if (!referenceAudioContext) referenceAudioContext = new AudioContextClass();
    if (referenceAudioContext.state === "suspended") await referenceAudioContext.resume();
    return referenceAudioContext;
  }

  function stopReference() {
    try { referenceOscillator?.stop(); } catch (_) {}
    try { referenceOscillator?.disconnect(); } catch (_) {}
    try { referenceGain?.disconnect(); } catch (_) {}
    referenceOscillator = null;
    referenceGain = null;
    referenceToggle.textContent = "Reproducir referencia";
  }

  async function startReference() {
    const semitones = referenceSemitones[referenceNote.value];
    if (!Number.isFinite(semitones)) return;

    const context = await ensureReferenceAudio();
    const calibration = Math.min(450, Math.max(430, Number(calibrationInput.value) || 440));
    const frequency = calibration * Math.pow(2, semitones / 12);
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.10;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();

    referenceOscillator = oscillator;
    referenceGain = gain;
    referenceToggle.textContent = "Detener referencia";
  }

  async function toggleReference() {
    if (referenceOscillator) stopReference();
    else await startReference();
  }

  document.addEventListener("click", event => {
    if (event.target !== referenceToggle) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    toggleReference().catch(() => {
      stopReference();
      referenceToggle.textContent = "No se pudo reproducir";
    });
  }, true);

  document.addEventListener("change", event => {
    if (event.target !== referenceNote) return;
    event.stopImmediatePropagation();
    if (!referenceOscillator) return;
    stopReference();
    startReference().catch(stopReference);
  }, true);

  calibrationInput.addEventListener("change", () => {
    if (!referenceOscillator) return;
    stopReference();
    startReference().catch(stopReference);
  });
})();
