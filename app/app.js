(() => {
  "use strict";

  const ACCESS_HASH = "e48f8bf401af148de10536786e5aa64ff016465ee987c1109c192776c332ec83";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const state = {
    route: "home",
    installPrompt: null,
    audioContext: null,
    tuner: { active: false, stream: null, analyser: null, raf: null, oscillator: null, gain: null },
    metro: {
      active: false, timer: null, nextNoteTime: 0, step: 0, subdivision: 1,
      accents: [2, 1, 1, 1], bars: 0, lastVisualBeat: -1
    },
    focus: {
      duration: 25 * 60, remaining: 25 * 60, running: false,
      endAt: null, interval: null, startedAt: null, wakeLock: null
    }
  };

  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  }

  function unlockApp() {
    $("#accessGate").hidden = true;
    $("#appShell").hidden = false;
    updateDashboard();
    restoreFocus();
    renderHistory();
  }

  $("#accessForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = $("#accessCode");
    const hash = await sha256(input.value.trim());
    if (hash === ACCESS_HASH) {
      localStorage.setItem("edf_access", "granted");
      $("#accessError").textContent = "";
      input.value = "";
      unlockApp();
    } else {
      $("#accessError").textContent = "El código no es correcto.";
      input.select();
    }
  });

  $("#logoutButton").addEventListener("click", () => {
    localStorage.removeItem("edf_access");
    location.reload();
  });

  if (localStorage.getItem("edf_access") === "granted") unlockApp();

  function routeTo(route) {
    if (!["home", "tuner", "metronome", "focus"].includes(route)) route = "home";
    if (state.route === "tuner" && route !== "tuner" && state.tuner.active) stopTuner();
    state.route = route;
    $$(".view").forEach(view => view.classList.toggle("active", view.dataset.view === route));
    $$(".bottom-nav button").forEach(button => button.classList.toggle("active", button.dataset.route === route));
    history.replaceState(null, "", route === "home" ? location.pathname : `#${route}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (route === "home") updateDashboard();
    if (route === "focus") renderHistory();
  }

  $$('[data-route]').forEach(button => button.addEventListener("click", () => routeTo(button.dataset.route)));
  window.addEventListener("hashchange", () => routeTo(location.hash.slice(1) || "home"));
  if (location.hash) routeTo(location.hash.slice(1));

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.installPrompt = event;
    $("#installButton").hidden = false;
  });
  $("#installButton").addEventListener("click", async () => {
    if (!state.installPrompt) return;
    state.installPrompt.prompt();
    await state.installPrompt.userChoice;
    state.installPrompt = null;
    $("#installButton").hidden = true;
  });
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (isIos && !isStandalone) $("#iosInstallTip").hidden = false;

  async function ensureAudio() {
    if (!state.audioContext) state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (state.audioContext.state === "suspended") await state.audioContext.resume();
    return state.audioContext;
  }

  function playClick(time, frequency = 900, volume = 0.18, duration = 0.045) {
    const ctx = state.audioContext;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.type = "sine";
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(time);
    oscillator.stop(time + duration);
  }

  const noteNames = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

  function autoCorrelate(buffer, sampleRate) {
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / buffer.length);
    if (rms < 0.012) return -1;

    const minLag = Math.max(2, Math.floor(sampleRate / 2200));
    const maxLag = Math.min(buffer.length / 2, Math.floor(sampleRate / 140));
    const correlations = new Float32Array(maxLag + 1);
    let bestLag = -1;
    let bestCorrelation = 0;

    for (let lag = minLag; lag <= maxLag; lag++) {
      let sum = 0;
      let energyA = 0;
      let energyB = 0;
      const limit = buffer.length - lag;
      for (let i = 0; i < limit; i++) {
        const a = buffer[i];
        const b = buffer[i + lag];
        sum += a * b;
        energyA += a * a;
        energyB += b * b;
      }
      const correlation = sum / Math.sqrt(energyA * energyB || 1);
      correlations[lag] = correlation;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestLag = lag;
      }
    }

    if (bestLag < 0 || bestCorrelation < 0.72) return -1;
    let period = bestLag;
    if (bestLag > minLag && bestLag < maxLag) {
      const left = correlations[bestLag - 1];
      const center = correlations[bestLag];
      const right = correlations[bestLag + 1];
      const denominator = 2 * (2 * center - left - right);
      if (denominator) period += (right - left) / denominator;
    }
    const frequency = sampleRate / period;
    return frequency >= 140 && frequency <= 2200 ? frequency : -1;
  }

  function frequencyToNoteData(frequency) {
    const calibration = clamp(Number($("#calibrationInput").value) || 440, 430, 450);
    const midi = 69 + 12 * Math.log2(frequency / calibration);
    const nearest = Math.round(midi);
    const cents = Math.round((midi - nearest) * 100);
    return {
      name: noteNames[(nearest % 12 + 12) % 12],
      octave: Math.floor(nearest / 12) - 1,
      cents
    };
  }

  function updateTunerVisual(frequency) {
    if (frequency < 0) {
      $("#tunerAdvice").textContent = "No detecto una altura estable. Sostén una nota larga.";
      return;
    }
    const data = frequencyToNoteData(frequency);
    $("#detectedNote").textContent = data.name;
    $("#detectedOctave").textContent = data.octave;
    $("#frequencyDisplay").textContent = `${frequency.toFixed(1)} Hz`;
    $("#centDisplay").textContent = `${data.cents > 0 ? "+" : ""}${data.cents} cents`;
    $("#centNeedle").style.left = `${50 + clamp(data.cents, -50, 50)}%`;

    const absolute = Math.abs(data.cents);
    if (absolute <= 5) {
      $("#tunerAdvice").textContent = "Estable. Escucha cómo se siente antes de mover la embocadura.";
    } else if (data.cents > 0) {
      $("#tunerAdvice").textContent = "Está alta. Evita corregir con un movimiento brusco.";
    } else {
      $("#tunerAdvice").textContent = "Está baja. Revisa velocidad y dirección del aire.";
    }
  }

  async function startTuner() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false }
      });
      const ctx = await ensureAudio();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(analyser);
      state.tuner.stream = stream;
      state.tuner.analyser = analyser;
      state.tuner.active = true;
      $("#tunerToggle").textContent = "Detener afinador";
      $("#tunerStatus").textContent = "Escuchando";
      $("#tunerStatus").classList.add("live");
      const buffer = new Float32Array(analyser.fftSize);
      let lastAnalysis = 0;
      const loop = (timestamp = 0) => {
        if (timestamp - lastAnalysis > 65) {
          analyser.getFloatTimeDomainData(buffer);
          updateTunerVisual(autoCorrelate(buffer, ctx.sampleRate));
          lastAnalysis = timestamp;
        }
        state.tuner.raf = requestAnimationFrame(loop);
      };
      loop();
    } catch (error) {
      toast("No fue posible acceder al micrófono.");
      $("#tunerAdvice").textContent = "Revisa el permiso de micrófono del navegador.";
    }
  }

  function stopTuner() {
    if (state.tuner.raf) cancelAnimationFrame(state.tuner.raf);
    state.tuner.stream?.getTracks().forEach(track => track.stop());
    state.tuner.active = false;
    state.tuner.stream = null;
    $("#tunerToggle").textContent = "Activar micrófono";
    $("#tunerStatus").textContent = "Micrófono apagado";
    $("#tunerStatus").classList.remove("live");
  }

  $("#tunerToggle").addEventListener("click", () => state.tuner.active ? stopTuner() : startTuner());
  $("#calibrationInput").addEventListener("change", (event) => {
    event.target.value = clamp(Number(event.target.value) || 440, 430, 450);
    localStorage.setItem("edf_calibration", event.target.value);
  });
  $("#calibrationInput").value = localStorage.getItem("edf_calibration") || "440";

  const referenceSemitones = { A4: 0, Bb4: 1, C5: 3, D5: 5, E5: 7 };
  async function toggleReference() {
    if (state.tuner.oscillator) {
      state.tuner.oscillator.stop();
      state.tuner.oscillator = null;
      $("#referenceToggle").textContent = "Reproducir referencia";
      return;
    }
    const ctx = await ensureAudio();
    const calibration = clamp(Number($("#calibrationInput").value) || 440, 430, 450);
    const frequency = calibration * Math.pow(2, referenceSemitones[$("#referenceNote").value] / 12);
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.10;
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    state.tuner.oscillator = oscillator;
    state.tuner.gain = gain;
    $("#referenceToggle").textContent = "Detener referencia";
  }
  $("#referenceToggle").addEventListener("click", toggleReference);
  $("#referenceNote").addEventListener("change", () => {
    if (state.tuner.oscillator) {
      state.tuner.oscillator.stop();
      state.tuner.oscillator = null;
      toggleReference();
    }
  });

  function getBpm() {
    return clamp(Number($("#bpmInput").value) || 72, 30, 240);
  }
  function setBpm(value) {
    value = clamp(Math.round(value), 30, 240);
    $("#bpmInput").value = value;
    $("#bpmRange").value = value;
    localStorage.setItem("edf_bpm", value);
  }
  setBpm(Number(localStorage.getItem("edf_bpm")) || 72);
  $("#bpmInput").addEventListener("change", event => setBpm(event.target.value));
  $("#bpmRange").addEventListener("input", event => setBpm(event.target.value));
  $("#bpmDown").addEventListener("click", () => setBpm(getBpm() - 1));
  $("#bpmUp").addEventListener("click", () => setBpm(getBpm() + 1));

  let taps = [];
  $("#tapTempo").addEventListener("click", () => {
    const now = performance.now();
    taps = taps.filter(time => now - time < 2500);
    taps.push(now);
    if (taps.length >= 2) {
      const intervals = taps.slice(1).map((time, index) => time - taps[index]);
      setBpm(60000 / (intervals.reduce((sum, item) => sum + item, 0) / intervals.length));
    }
  });

  function renderAccents() {
    const numerator = clamp(Number($("#numeratorInput").value) || 4, 1, 16);
    while (state.metro.accents.length < numerator) state.metro.accents.push(1);
    state.metro.accents = state.metro.accents.slice(0, numerator);
    if (!state.metro.accents.some(level => level === 2)) state.metro.accents[0] = 2;
    const root = $("#accentPattern");
    root.innerHTML = "";
    state.metro.accents.forEach((level, index) => {
      const button = document.createElement("button");
      button.className = `accent-button ${level === 2 ? "strong" : level === 0 ? "muted" : ""}`;
      button.textContent = index + 1;
      button.title = level === 2 ? "Acento fuerte" : level === 1 ? "Pulso normal" : "Silencio";
      button.addEventListener("click", () => {
        state.metro.accents[index] = level === 2 ? 1 : level === 1 ? 0 : 2;
        renderAccents();
      });
      root.appendChild(button);
    });
  }
  $("#numeratorInput").addEventListener("change", event => {
    event.target.value = clamp(Number(event.target.value) || 4, 1, 16);
    state.metro.step = 0;
    renderAccents();
  });
  renderAccents();

  $("#subdivisionButtons").addEventListener("click", event => {
    const button = event.target.closest("[data-subdivision]");
    if (!button) return;
    state.metro.subdivision = Number(button.dataset.subdivision);
    $$("#subdivisionButtons button").forEach(item => item.classList.toggle("active", item === button));
    state.metro.step = 0;
  });

  function metroScheduler() {
    const ctx = state.audioContext;
    const numerator = clamp(Number($("#numeratorInput").value) || 4, 1, 16);
    const subdivision = state.metro.subdivision;
    const interval = (60 / getBpm()) / subdivision;

    while (state.metro.nextNoteTime < ctx.currentTime + 0.11) {
      const beat = Math.floor(state.metro.step / subdivision);
      const sub = state.metro.step % subdivision;
      const level = state.metro.accents[beat] ?? 1;

      if (sub === 0) {
        if (level > 0) playClick(state.metro.nextNoteTime, level === 2 ? 1350 : 980, level === 2 ? .24 : .16);
        const visualBeat = beat;
        const delay = Math.max(0, (state.metro.nextNoteTime - ctx.currentTime) * 1000);
        setTimeout(() => {
          if (!state.metro.active) return;
          $("#pulseCount").textContent = visualBeat + 1;
          const orb = $("#pulseOrb");
          orb.classList.add("hit");
          setTimeout(() => orb.classList.remove("hit"), 80);
        }, delay);
      } else {
        playClick(state.metro.nextNoteTime, 620, .075, .025);
      }

      state.metro.step++;
      if (state.metro.step >= numerator * subdivision) {
        state.metro.step = 0;
        state.metro.bars++;
        const rampEvery = Number($("#rampEvery").value);
        if (rampEvery && state.metro.bars % rampEvery === 0) {
          setBpm(getBpm() + Number($("#rampAmount").value));
        }
      }
      state.metro.nextNoteTime += interval;
    }
  }

  async function startMetronome() {
    await ensureAudio();
    state.metro.active = true;
    state.metro.step = 0;
    state.metro.bars = 0;
    state.metro.nextNoteTime = state.audioContext.currentTime + .06;
    state.metro.timer = setInterval(metroScheduler, 25);
    $("#metronomeToggle").textContent = "Detener";
  }
  function stopMetronome() {
    state.metro.active = false;
    clearInterval(state.metro.timer);
    $("#metronomeToggle").textContent = "Comenzar";
    $("#pulseCount").textContent = "1";
  }
  $("#metronomeToggle").addEventListener("click", () => state.metro.active ? stopMetronome() : startMetronome());

  function formatTime(totalSeconds) {
    const seconds = Math.max(0, Math.ceil(totalSeconds));
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function setFocusDuration(minutes) {
    if (state.focus.running) return;
    const safe = clamp(Number(minutes) || 25, 1, 180);
    state.focus.duration = safe * 60;
    state.focus.remaining = state.focus.duration;
    $("#customMinutes").value = safe;
    $$(".preset-row button").forEach(button => button.classList.toggle("active", Number(button.dataset.minutes) === safe));
    updateFocusDisplay();
  }

  function updateFocusDisplay() {
    if (state.focus.running && state.focus.endAt) {
      state.focus.remaining = Math.max(0, (state.focus.endAt - Date.now()) / 1000);
    }
    $("#focusTime").textContent = formatTime(state.focus.remaining);
    const elapsed = state.focus.duration - state.focus.remaining;
    const progress = state.focus.duration ? clamp(elapsed / state.focus.duration, 0, 1) : 0;
    $("#focusRing").style.setProperty("--progress", `${progress * 360}deg`);
    $("#focusState").textContent = state.focus.running ? $("#focusCategory").value : (state.focus.remaining < state.focus.duration ? "Sesión en pausa" : "Preparar sesión");
    document.title = state.focus.running ? `${formatTime(state.focus.remaining)} · Hiperfoco` : "Sala de Estudio · Escuela de Flautistas";
    persistFocus();
    if (state.focus.running && state.focus.remaining <= 0) finishFocus();
  }

  function persistFocus() {
    localStorage.setItem("edf_focus_state", JSON.stringify({
      duration: state.focus.duration,
      remaining: state.focus.remaining,
      running: state.focus.running,
      endAt: state.focus.endAt,
      startedAt: state.focus.startedAt,
      category: $("#focusCategory").value,
      objective: $("#focusObjective").value
    }));
  }

  function restoreFocus() {
    const saved = JSON.parse(localStorage.getItem("edf_focus_state") || "null");
    if (!saved) return updateFocusDisplay();
    state.focus.duration = saved.duration || 1500;
    state.focus.remaining = saved.remaining ?? state.focus.duration;
    state.focus.running = Boolean(saved.running);
    state.focus.endAt = saved.endAt;
    state.focus.startedAt = saved.startedAt;
    if (saved.category) $("#focusCategory").value = saved.category;
    if (saved.objective) $("#focusObjective").value = saved.objective;
    $("#customMinutes").value = Math.round(state.focus.duration / 60);
    if (state.focus.running && state.focus.endAt) {
      state.focus.remaining = Math.max(0, (state.focus.endAt - Date.now()) / 1000);
      if (state.focus.remaining > 0) {
        $("#focusToggle").textContent = "Pausar";
        state.focus.interval = setInterval(updateFocusDisplay, 250);
        requestWakeLock();
      } else {
        state.focus.running = false;
        state.focus.remaining = 0;
        setTimeout(() => finishFocus({ silent: true }), 0);
        return;
      }
    }
    updateFocusDisplay();
  }

  async function requestWakeLock() {
    if (!$("#wakeLockToggle").checked || !("wakeLock" in navigator) || document.visibilityState !== "visible") return;
    try {
      state.focus.wakeLock = await navigator.wakeLock.request("screen");
    } catch (_) {}
  }
  async function releaseWakeLock() {
    try { await state.focus.wakeLock?.release(); } catch (_) {}
    state.focus.wakeLock = null;
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && state.focus.running) {
      updateFocusDisplay();
      requestWakeLock();
    }
  });

  async function toggleFocus() {
    if (state.focus.running) {
      state.focus.remaining = Math.max(0, (state.focus.endAt - Date.now()) / 1000);
      state.focus.running = false;
      state.focus.endAt = null;
      clearInterval(state.focus.interval);
      $("#focusToggle").textContent = "Continuar";
      await releaseWakeLock();
      updateFocusDisplay();
      return;
    }
    if (state.focus.remaining <= 0) setFocusDuration($("#customMinutes").value);
    state.focus.running = true;
    state.focus.startedAt ||= Date.now();
    state.focus.endAt = Date.now() + state.focus.remaining * 1000;
    $("#focusToggle").textContent = "Pausar";
    state.focus.interval = setInterval(updateFocusDisplay, 250);
    await ensureAudio();
    await requestWakeLock();
    updateFocusDisplay();
  }

  async function finishFocus({ silent = false } = {}) {
    clearInterval(state.focus.interval);
    state.focus.running = false;
    state.focus.endAt = null;
    state.focus.remaining = 0;
    $("#focusToggle").textContent = "Nueva sesión";
    $("#focusState").textContent = "Sesión terminada";
    await releaseWakeLock();

    const completedMinutes = Math.max(1, Math.round(state.focus.duration / 60));
    const history = getHistory();
    history.unshift({
      id: Date.now(),
      date: new Date().toISOString(),
      minutes: completedMinutes,
      category: $("#focusCategory").value,
      objective: $("#focusObjective").value.trim()
    });
    localStorage.setItem("edf_history", JSON.stringify(history.slice(0, 120)));
    localStorage.removeItem("edf_focus_state");
    if (!silent) {
      playCompletionSound();
      if ($("#notificationToggle").checked && "Notification" in window && Notification.permission === "granted") {
        const options = {
          body: `${completedMinutes} minutos de ${$("#focusCategory").value.toLowerCase()}.`,
          icon: "./icons/icon-192.svg"
        };
        try {
          const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.ready : null;
          if (registration) await registration.showNotification("Hiperfoco terminado", options);
          else new Notification("Hiperfoco terminado", options);
        } catch (_) {}
      }
    }
    renderHistory();
    updateDashboard();
    toast("Sesión registrada.");
  }

  async function playCompletionSound() {
    const ctx = await ensureAudio();
    [0, .18, .36].forEach((offset, index) => playClick(ctx.currentTime + offset, [660, 820, 990][index], .16, .13));
  }

  function resetFocus() {
    clearInterval(state.focus.interval);
    releaseWakeLock();
    state.focus.running = false;
    state.focus.startedAt = null;
    state.focus.endAt = null;
    state.focus.remaining = state.focus.duration;
    $("#focusToggle").textContent = "Comenzar";
    localStorage.removeItem("edf_focus_state");
    updateFocusDisplay();
  }

  $$(".preset-row button").forEach(button => button.addEventListener("click", () => setFocusDuration(button.dataset.minutes)));
  $("#customMinutes").addEventListener("change", event => setFocusDuration(event.target.value));
  $("#focusToggle").addEventListener("click", toggleFocus);
  $("#focusReset").addEventListener("click", resetFocus);
  $("#focusAdd").addEventListener("click", () => {
    state.focus.duration += 300;
    state.focus.remaining += 300;
    if (state.focus.running) state.focus.endAt += 300000;
    $("#customMinutes").value = Math.round(state.focus.duration / 60);
    updateFocusDisplay();
  });
  $("#focusCategory").addEventListener("change", persistFocus);
  $("#focusObjective").addEventListener("input", persistFocus);
  $("#notificationToggle").addEventListener("change", async event => {
    if (!event.target.checked) return;
    if (!("Notification" in window)) {
      event.target.checked = false;
      toast("Este navegador no admite notificaciones web.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      event.target.checked = false;
      toast("Las notificaciones no fueron autorizadas.");
    }
  });

  function getHistory() {
    try { return JSON.parse(localStorage.getItem("edf_history") || "[]"); }
    catch (_) { return []; }
  }

  function renderHistory() {
    const root = $("#historyList");
    const history = getHistory();
    if (!history.length) {
      root.innerHTML = '<p class="empty-state">Aún no hay sesiones terminadas.</p>';
      return;
    }
    root.innerHTML = "";
    history.slice(0, 12).forEach(item => {
      const date = new Date(item.date);
      const article = document.createElement("article");
      article.className = "history-item";
      article.innerHTML = `
        <strong>${escapeHtml(item.category)}</strong>
        <span>${item.minutes} min</span>
        <small>${date.toLocaleDateString("es-CL", { weekday:"short", day:"numeric", month:"short" })}${item.objective ? ` · ${escapeHtml(item.objective)}` : ""}</small>`;
      root.appendChild(article);
    });
  }

  function escapeHtml(value = "") {
    return value.replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[char]));
  }

  $("#clearHistory").addEventListener("click", () => {
    if (!confirm("¿Borrar el historial guardado en este dispositivo?")) return;
    localStorage.removeItem("edf_history");
    renderHistory();
    updateDashboard();
  });

  function updateDashboard() {
    const now = new Date();
    const monday = new Date(now);
    const weekday = (now.getDay() + 6) % 7;
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - weekday);
    const weeklyMinutes = getHistory()
      .filter(item => new Date(item.date) >= monday)
      .reduce((total, item) => total + Number(item.minutes || 0), 0);
    $("#weeklyTotal").textContent = weeklyMinutes < 60 ? `${weeklyMinutes} min` : `${Math.floor(weeklyMinutes / 60)} h ${weeklyMinutes % 60} min`;
    $("#weeklyProgress").style.width = `${clamp(weeklyMinutes / 300, 0, 1) * 100}%`;
    $("#weeklyMessage").textContent = weeklyMinutes
      ? `${getHistory().filter(item => new Date(item.date) >= monday).length} sesiones registradas desde el lunes.`
      : "Tu historial comenzará con la primera sesión.";
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
})();
