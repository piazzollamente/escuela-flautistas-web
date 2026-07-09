(() => {
  "use strict";
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
    if (document.visibilityState === "visible") sync();
  });
  window.addEventListener("pageshow", sync);
  window.addEventListener("storage", sync);

  function boot() {
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
