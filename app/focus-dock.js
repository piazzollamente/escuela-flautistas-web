(() => {
  "use strict";

  const $ = selector => document.querySelector(selector);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function parseClock(value = "00:00") {
    const [minutes, seconds] = value.split(":").map(Number);
    return (minutes || 0) * 60 + (seconds || 0);
  }

  function formatClock(totalSeconds) {
    const safe = Math.max(0, Math.ceil(totalSeconds || 0));
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function readSavedFocus() {
    try {
      return JSON.parse(localStorage.getItem("edf_focus_state") || "null");
    } catch (_) {
      return null;
    }
  }

  function installStyles() {
    const style = document.createElement("style");
    style.id = "edfFocusCompanionStyles";
    style.textContent = `
      .focus-companion{--dock-progress:0%;position:fixed;left:50%;bottom:94px;z-index:79;width:min(720px,calc(100% - 24px));display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;padding:10px 12px 10px 16px;border:1px solid rgba(255,255,255,.12);border-radius:20px;background:rgba(23,21,19,.96);color:#fff;box-shadow:0 18px 55px rgba(0,0,0,.30);backdrop-filter:blur(22px);transform:translateX(-50%);overflow:hidden}
      .focus-companion[hidden]{display:none!important}
      .focus-companion:before{content:"";position:absolute;left:0;bottom:0;width:var(--dock-progress);height:4px;background:#e7bf55;transition:width .25s linear}
      .focus-companion.is-running:before{background:#a9d6c5}
      .focus-companion.is-paused:before{background:#e7bf55}
      .focus-companion-summary{min-width:0;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:14px;align-items:center;border:0;background:transparent;color:inherit;text-align:left;padding:2px 4px}
      .focus-companion-time{grid-row:1/3;font-family:"League Spartan",Montserrat,sans-serif;font-size:2rem;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.04em;line-height:1}
      .focus-companion-copy{min-width:0;display:block;font-size:.72rem;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#a9d6c5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .focus-companion-detail{min-width:0;display:block;margin-top:3px;font-size:.73rem;color:rgba(255,255,255,.62);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .focus-companion-actions{display:flex;align-items:center;gap:7px}
      .focus-companion-actions button{border:0;border-radius:12px;padding:10px 13px;font-size:.76rem;font-weight:800}
      .focus-companion-toggle{min-width:88px;background:#cf3f35;color:#fff}
      .focus-companion.is-running .focus-companion-toggle{background:#a9d6c5;color:#171513}
      .focus-companion-add{background:rgba(255,255,255,.10);color:#fff}
      .focus-companion-open{width:38px;height:38px;padding:0!important;background:rgba(255,255,255,.10);color:#fff;font-size:1rem}
      .app-shell.has-focus-companion{padding-bottom:164px}
      .app-shell.has-focus-companion .toast{bottom:174px}
      @media(max-width:560px){
        .focus-companion{bottom:88px;grid-template-columns:minmax(0,1fr) auto;padding:9px 9px 9px 12px;border-radius:18px}
        .focus-companion-time{font-size:1.65rem}
        .focus-companion-summary{column-gap:10px}
        .focus-companion-detail{max-width:150px}
        .focus-companion-actions{gap:5px}
        .focus-companion-actions button{padding:9px 10px}
        .focus-companion-toggle{min-width:72px}
        .focus-companion-add{display:none}
        .app-shell.has-focus-companion{padding-bottom:154px}
      }
    `;
    document.head.appendChild(style);
  }

  function boot() {
    const shell = $("#appShell");
    const nav = $(".bottom-nav");
    const focusToggle = $("#focusToggle");
    if (!shell || !nav || !focusToggle || $("#focusCompanion")) return;

    installStyles();

    const dock = document.createElement("aside");
    dock.id = "focusCompanion";
    dock.className = "focus-companion";
    dock.setAttribute("aria-label", "Controles globales de Hiperfoco");
    dock.innerHTML = `
      <button id="focusCompanionSummary" class="focus-companion-summary" type="button" aria-label="Abrir Hiperfoco">
        <strong id="focusCompanionTime" class="focus-companion-time">25:00</strong>
        <span id="focusCompanionCopy" class="focus-companion-copy">Hiperfoco listo</span>
        <small id="focusCompanionDetail" class="focus-companion-detail">Sonido · toca Iniciar para estudiar con el afinador o metrónomo</small>
      </button>
      <div class="focus-companion-actions">
        <button id="focusCompanionToggle" class="focus-companion-toggle" type="button">Iniciar</button>
        <button id="focusCompanionAdd" class="focus-companion-add" type="button" aria-label="Agregar cinco minutos">+5</button>
        <button id="focusCompanionOpen" class="focus-companion-open" type="button" aria-label="Abrir configuración de Hiperfoco">↗</button>
      </div>
    `;
    shell.insertBefore(dock, nav);

    const openFocus = () => {
      const routeButton = $('.bottom-nav [data-route="focus"]');
      routeButton?.click();
    };

    $("#focusCompanionSummary").addEventListener("click", openFocus);
    $("#focusCompanionOpen").addEventListener("click", openFocus);
    $("#focusCompanionToggle").addEventListener("click", event => {
      event.stopPropagation();
      focusToggle.click();
      setTimeout(update, 30);
    });
    $("#focusCompanionAdd").addEventListener("click", event => {
      event.stopPropagation();
      $("#focusAdd")?.click();
      setTimeout(update, 30);
    });

    function update() {
      const activeView = $(".view.active")?.dataset.view;
      const appUnlocked = !shell.hidden;
      dock.hidden = !appUnlocked || activeView === "focus";
      shell.classList.toggle("has-focus-companion", !dock.hidden);
      if (dock.hidden) return;

      const saved = readSavedFocus();
      const category = $("#focusCategory")?.value || "Hiperfoco";
      const objective = $("#focusObjective")?.value.trim();
      const defaultDuration = (Number($("#customMinutes")?.value) || 25) * 60;
      const duration = Math.max(1, Number(saved?.duration) || defaultDuration);
      let remaining = Number(saved?.remaining);
      if (!Number.isFinite(remaining)) remaining = parseClock($("#focusTime")?.textContent);
      if (saved?.running && saved.endAt) remaining = Math.max(0, (Number(saved.endAt) - Date.now()) / 1000);

      const running = Boolean(saved?.running && remaining > 0);
      const paused = Boolean(saved && !running && remaining > 0 && remaining < duration);
      const progress = clamp((duration - remaining) / duration, 0, 1) * 100;
      const time = formatClock(remaining || (focusToggle.textContent.includes("Nueva") ? 0 : defaultDuration));

      dock.classList.toggle("is-running", running);
      dock.classList.toggle("is-paused", paused);
      dock.style.setProperty("--dock-progress", `${progress}%`);
      $("#focusCompanionTime").textContent = time;
      $("#focusCompanionCopy").textContent = running ? `${category} en curso` : paused ? `${category} en pausa` : "Hiperfoco listo";
      $("#focusCompanionDetail").textContent = objective || (running ? "Puedes seguir usando esta herramienta" : paused ? "Continúa cuando estés lista" : `${category} · úsalo junto al afinador o metrónomo`);
      $("#focusCompanionToggle").textContent = running ? "Pausar" : paused ? "Continuar" : "Iniciar";
      $("#focusCompanionToggle").setAttribute("aria-label", running ? "Pausar Hiperfoco" : paused ? "Continuar Hiperfoco" : "Iniciar Hiperfoco");
    }

    update();
    setInterval(update, 250);
    window.addEventListener("storage", update);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
