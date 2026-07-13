(() => {
  "use strict";

  const isIPad = /iPad/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIPad && !document.querySelector('script[data-edf-ipad-tuner]')) {
    const ipadTunerScript = document.createElement("script");
    ipadTunerScript.src = "./ipad-tuner-fix.js";
    ipadTunerScript.async = false;
    ipadTunerScript.dataset.edfIpadTuner = "true";
    document.head.appendChild(ipadTunerScript);
  }

  if (!document.querySelector('script[data-edf-high-register]')) {
    const highRegisterScript = document.createElement("script");
    highRegisterScript.src = "./high-register-tuner.js";
    highRegisterScript.async = false;
    highRegisterScript.dataset.edfHighRegister = "true";
    document.head.appendChild(highRegisterScript);
  }

  const $ = selector => document.querySelector(selector);
  let lastType = null;

  function setType(type) {
    if (!navigator.audioSession || !("type" in navigator.audioSession) || lastType === type) return;
    try {
      navigator.audioSession.type = type;
      lastType = type;
    } catch (_) {}
  }

  function focusRunning() {
    try {
      const saved = JSON.parse(localStorage.getItem("edf_focus_state") || "null");
      return Boolean(saved?.running && Number(saved?.endAt) > Date.now());
    } catch (_) {
      return false;
    }
  }

  function tunerRunning() {
    return $("#tunerStatus")?.classList.contains("live") || $("#tunerToggle")?.textContent.includes("Detener");
  }

  function metronomeRunning() {
    return $("#metronomeToggle")?.textContent.includes("Detener");
  }

  function referenceRunning() {
    return $("#referenceToggle")?.textContent.includes("Detener");
  }

  function sync() {
    if (tunerRunning()) setType("play-and-record");
    else if (metronomeRunning() || referenceRunning() || focusRunning()) setType("playback");
    else setType("auto");
  }

  function installMetronomeTouchFix() {
    const metronomeView = $("#view-metronome");
    if (!metronomeView || $("#edfMetronomeTouchFix")) return;

    const style = document.createElement("style");
    style.id = "edfMetronomeTouchFix";
    style.textContent = `
      #view-metronome,
      #view-metronome button,
      #view-metronome input,
      #view-metronome select,
      #view-metronome label,
      #view-metronome .panel {
        touch-action: manipulation;
      }
    `;
    document.head.appendChild(style);
    metronomeView.addEventListener("dblclick", event => event.preventDefault(), { passive: false });
  }

  let tunerWasActiveBeforeHide = false;
  let tunerRecoveryInProgress = false;
  let tunerRecoveryTimer = null;

  function rememberTunerState() {
    tunerWasActiveBeforeHide = tunerRunning();
    if (tunerRecoveryTimer) {
      clearTimeout(tunerRecoveryTimer);
      tunerRecoveryTimer = null;
    }
  }

  function recoverTunerAfterReturn() {
    const tunerView = $("#view-tuner");
    const tunerToggle = $("#tunerToggle");
    if (
      !tunerWasActiveBeforeHide ||
      tunerRecoveryInProgress ||
      document.visibilityState !== "visible" ||
      !tunerView?.classList.contains("active") ||
      !tunerToggle
    ) return;

    tunerRecoveryInProgress = true;
    if (tunerRunning()) tunerToggle.click();

    tunerRecoveryTimer = setTimeout(() => {
      if (
        document.visibilityState === "visible" &&
        tunerView.classList.contains("active") &&
        !tunerRunning()
      ) {
        tunerToggle.click();
      }

      tunerWasActiveBeforeHide = false;
      tunerRecoveryInProgress = false;
      tunerRecoveryTimer = null;
      setTimeout(sync, 80);
    }, 220);
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

  function installReferenceNotes() {
    const select = $("#referenceNote");
    if (!select) return;

    const a4Option = [...select.options].find(option => option.value === "A4") || select.options[0] || null;
    if (![...select.options].some(option => option.value === "F4")) {
      select.add(new Option("Fa 4", "F4"), a4Option);
    }
    if (![...select.options].some(option => option.value === "G4")) {
      const currentA4 = [...select.options].find(option => option.value === "A4") || null;
      select.add(new Option("Sol 4", "G4"), currentA4);
    }
  }

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
    const button = $("#referenceToggle");
    if (button) button.textContent = "Reproducir referencia";
    sync();
  }

  async function startReference() {
    const select = $("#referenceNote");
    const calibrationInput = $("#calibrationInput");
    const button = $("#referenceToggle");
    const semitones = referenceSemitones[select?.value];
    if (!Number.isFinite(semitones) || !button) return;

    const context = await ensureReferenceAudio();
    const calibration = Math.min(450, Math.max(430, Number(calibrationInput?.value) || 440));
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = calibration * Math.pow(2, semitones / 12);
    gain.gain.value = 0.10;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    referenceOscillator = oscillator;
    referenceGain = gain;
    button.textContent = "Detener referencia";
    setType("playback");
  }

  document.addEventListener("click", event => {
    if (event.target !== $("#referenceToggle")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (referenceOscillator) stopReference();
    else startReference().catch(() => {
      stopReference();
      const button = $("#referenceToggle");
      if (button) button.textContent = "No se pudo reproducir";
    });
  }, true);

  document.addEventListener("change", event => {
    if (event.target === $("#referenceNote")) {
      event.stopImmediatePropagation();
      if (referenceOscillator) {
        stopReference();
        startReference().catch(stopReference);
      }
      return;
    }

    if (event.target === $("#calibrationInput") && referenceOscillator) {
      stopReference();
      startReference().catch(stopReference);
    }
  }, true);

  document.addEventListener("click", event => {
    const route = event.target.closest?.("[data-route]");
    if (route?.dataset.route === "focus" && tunerRunning()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.dataset.view === "focus"));
      document.querySelectorAll(".bottom-nav button").forEach(button => button.classList.toggle("active", button.dataset.route === "focus"));
      history.replaceState(null, "", `${location.pathname}#focus`);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setType("play-and-record");
      return;
    }

    const id = event.target.closest?.("button")?.id;
    if (["tunerToggle", "referenceToggle", "metronomeToggle", "tapTempo", "focusToggle", "focusCompanionToggle"].includes(id)) {
      setType(tunerRunning() || id === "tunerToggle" ? "play-and-record" : "playback");
      setTimeout(sync, 50);
      setTimeout(sync, 250);
    }
  }, true);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") rememberTunerState();
    else {
      recoverTunerAfterReturn();
      sync();
    }
  });
  window.addEventListener("pagehide", rememberTunerState);
  window.addEventListener("pageshow", () => {
    recoverTunerAfterReturn();
    sync();
  });
  window.addEventListener("storage", sync);

  function boot() {
    installMetronomeTouchFix();
    installReferenceNotes();

    const observer = new MutationObserver(sync);
    ["#tunerStatus", "#tunerToggle", "#metronomeToggle", "#referenceToggle", "#focusState"].forEach(selector => {
      const node = $(selector);
      if (node) observer.observe(node, { attributes: true, childList: true, subtree: true, characterData: true });
    });
    const focusState = $("#focusState");
    if (focusState && "vibrate" in navigator) {
      new MutationObserver(() => {
        if (focusState.textContent.includes("terminada")) navigator.vibrate([180, 90, 180]);
      }).observe(focusState, { childList: true, subtree: true, characterData: true });
    }
    sync();
    setInterval(sync, 500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();