(() => {
  const installCard = document.getElementById("installCard");
  const installBtn = document.getElementById("installBtn");
  const dismissInstallBtn = document.getElementById("dismissInstallBtn");
  const iosInstallHelp = document.getElementById("iosInstallHelp");
  const installDescription = document.getElementById("installDescription");
  const showInstallHelpBtn = document.getElementById("showInstallHelpBtn");
  const connectionState = document.getElementById("connectionState");
  const displayModeState = document.getElementById("displayModeState");
  const a4Reference = document.getElementById("a4Reference");
  const startBtn = document.getElementById("startBtn");

  const STORAGE_KEYS = {
    reference: "edf-tuner-a4-reference",
    installDismissedUntil: "edf-tuner-install-dismissed-until",
    promoDismissedUntil: "edf-tuner-challenge-promo-dismissed-until"
  };

  const PROMO_DELAY_AFTER_MIC_MS = 25000;
  const PROMO_FALLBACK_DELAY_MS = 60000;
  const PROMO_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
  const BACKGROUND_RESET_DELAY_MS = 1800;

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|Android/.test(userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

  let deferredInstallPrompt = null;
  let promoTimer = null;
  let promoShownThisSession = false;
  let lastFocusedElement = null;
  let backgroundedAt = 0;
  let audioWasActiveBeforeBackground = false;
  let resumeReloadScheduled = false;

  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // La aplicación continúa aunque el navegador bloquee el almacenamiento.
    }
  }

  function trackEvent(name, parameters = {}) {
    if (typeof window.gtag === "function") window.gtag("event", name, parameters);
  }

  function isInstallSuggestionDismissed() {
    const dismissedUntil = Number(readStorage(STORAGE_KEYS.installDismissedUntil));
    return Number.isFinite(dismissedUntil) && dismissedUntil > Date.now();
  }

  function isPromoDismissed() {
    const dismissedUntil = Number(readStorage(STORAGE_KEYS.promoDismissedUntil));
    return Number.isFinite(dismissedUntil) && dismissedUntil > Date.now();
  }

  function updateConnectionState() {
    if (!connectionState) return;
    const online = navigator.onLine;
    connectionState.textContent = online ? "En línea" : "Sin conexión";
    connectionState.classList.toggle("offline", !online);
  }

  function updateDisplayModeState() {
    if (displayModeState) displayModeState.textContent = isStandalone ? "Aplicación instalada" : "Versión web";
  }

  function configureInstallCard({ force = false } = {}) {
    if (!installCard || isStandalone || (!force && isInstallSuggestionDismissed())) return;
    installCard.hidden = false;

    if (isIOS) {
      iosInstallHelp.hidden = false;
      installBtn.textContent = "Ver cómo instalar";
      installDescription.textContent = isSafari
        ? "Añádelo a la pantalla de inicio desde Safari para abrirlo como una aplicación."
        : "Para instalarlo en iPhone o iPad, abre esta página en Safari y agrégala a la pantalla de inicio.";
      return;
    }

    iosInstallHelp.hidden = true;
    installBtn.disabled = false;
    installBtn.textContent = deferredInstallPrompt ? "Instalar aplicación" : "Ver opciones de instalación";
    installDescription.textContent = deferredInstallPrompt
      ? "Ábrelo desde tu pantalla de inicio y úsalo incluso cuando la conexión sea inestable."
      : "Puedes instalarlo desde el menú de Chrome, Edge o tu navegador compatible.";
  }

  function hideInstallCard() {
    if (installCard) installCard.hidden = true;
  }

  async function requestInstallation() {
    if (isIOS) {
      configureInstallCard({ force: true });
      iosInstallHelp.hidden = false;
      iosInstallHelp.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    if (!deferredInstallPrompt) {
      configureInstallCard({ force: true });
      installDescription.textContent = "Abre el menú del navegador y selecciona “Instalar aplicación” o “Agregar a pantalla de inicio”.";
      return;
    }

    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    if (choice.outcome === "accepted") hideInstallCard();
    else configureInstallCard({ force: true });
  }

  function restoreReferencePreference() {
    if (!a4Reference) return;
    const savedReference = readStorage(STORAGE_KEYS.reference);
    if (["440", "442", "443"].includes(savedReference)) {
      a4Reference.value = savedReference;
      a4Reference.dispatchEvent(new Event("change"));
    }
    a4Reference.addEventListener("change", () => {
      if (["440", "442", "443"].includes(a4Reference.value)) writeStorage(STORAGE_KEYS.reference, a4Reference.value);
    });
  }

  function createPromoModal() {
    if (document.getElementById("challengePromo")) return;
    document.body.insertAdjacentHTML("beforeend", `
      <div id="challengePromo" class="promo-modal" hidden>
        <button class="promo-backdrop" type="button" aria-label="Cerrar promoción" data-promo-close></button>
        <section class="promo-dialog" role="dialog" aria-modal="true" aria-labelledby="promoTitle" aria-describedby="promoDescription" tabindex="-1">
          <button class="promo-close" type="button" aria-label="Cerrar" data-promo-close>×</button>
          <div class="promo-accent" aria-hidden="true"><span>21</span><small>días</small></div>
          <div class="promo-content">
            <p class="promo-kicker">Desafío Embocadura Organizada</p>
            <h2 id="promoTitle">Tu afinación no empieza en la aguja.</h2>
            <p id="promoDescription">Durante 21 días trabajas la organización de la embocadura con ejercicios breves y progresivos. Los videos se liberan uno por día.</p>
            <div class="promo-points"><span>Práctica diaria</span><span>Acceso online</span><span>Para flautistas reales</span></div>
            <div class="promo-actions">
              <a id="promoCta" class="promo-cta" href="https://escueladeflautistas.cl/embocadura-organizada/?utm_source=afinador&utm_medium=popup&utm_campaign=desafio_21_dias&utm_content=afinador_pwa">Conocer el desafío</a>
              <button class="promo-secondary" type="button" data-promo-close>Seguir afinando</button>
            </div>
          </div>
        </section>
      </div>`);
  }

  function getPromoElements() {
    const modal = document.getElementById("challengePromo");
    return {
      modal,
      dialog: modal?.querySelector(".promo-dialog"),
      closeControls: modal ? Array.from(modal.querySelectorAll("[data-promo-close]")) : [],
      cta: document.getElementById("promoCta")
    };
  }

  function closePromo({ remember = true, source = "close" } = {}) {
    const { modal } = getPromoElements();
    if (!modal || modal.hidden) return;
    modal.classList.remove("is-visible");
    document.body.classList.remove("promo-open");
    if (remember) writeStorage(STORAGE_KEYS.promoDismissedUntil, String(Date.now() + PROMO_COOLDOWN_MS));
    trackEvent("challenge_promo_close", { source });
    window.setTimeout(() => {
      modal.hidden = true;
      lastFocusedElement?.focus?.();
    }, 220);
  }

  function openPromo() {
    if (promoShownThisSession || isPromoDismissed() || document.visibilityState !== "visible") return;
    const { modal, dialog } = getPromoElements();
    if (!modal || !dialog) return;
    promoShownThisSession = true;
    lastFocusedElement = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("promo-open");
    window.requestAnimationFrame(() => {
      modal.classList.add("is-visible");
      dialog.focus();
    });
    trackEvent("challenge_promo_view", { placement: "afinador" });
  }

  function schedulePromo(delay) {
    if (promoShownThisSession || isPromoDismissed()) return;
    if (promoTimer) window.clearTimeout(promoTimer);
    promoTimer = window.setTimeout(openPromo, delay);
  }

  function setupPromoModal() {
    createPromoModal();
    const { modal, dialog, closeControls, cta } = getPromoElements();
    if (!modal || !dialog) return;

    closeControls.forEach((control) => {
      control.addEventListener("click", () => closePromo({ source: control.classList.contains("promo-backdrop") ? "backdrop" : "button" }));
    });

    cta?.addEventListener("click", () => {
      writeStorage(STORAGE_KEYS.promoDismissedUntil, String(Date.now() + 30 * 24 * 60 * 60 * 1000));
      trackEvent("challenge_promo_click", { placement: "afinador" });
    });

    document.addEventListener("keydown", (event) => {
      if (modal.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closePromo({ source: "escape" });
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialog.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    startBtn?.addEventListener("click", () => schedulePromo(PROMO_DELAY_AFTER_MIC_MS), { once: true });
    schedulePromo(PROMO_FALLBACK_DELAY_MS);
  }

  function tunerAppearsActive() {
    if (!startBtn) return false;
    const label = (startBtn.textContent || "").toLowerCase();
    return startBtn.disabled || label.includes("afinador activo") || label.includes("solicitando micrófono");
  }

  function reloadStaleAudioSession() {
    if (resumeReloadScheduled || !audioWasActiveBeforeBackground) return;
    resumeReloadScheduled = true;
    window.location.reload();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      backgroundedAt = Date.now();
      audioWasActiveBeforeBackground = tunerAppearsActive();
      return;
    }

    const backgroundDuration = Date.now() - backgroundedAt;
    if (audioWasActiveBeforeBackground && backgroundDuration >= BACKGROUND_RESET_DELAY_MS) {
      reloadStaleAudioSession();
    }
  });

  window.addEventListener("pageshow", (event) => {
    if (event.persisted && tunerAppearsActive()) {
      audioWasActiveBeforeBackground = true;
      reloadStaleAudioSession();
    }
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    configureInstallCard();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    hideInstallCard();
    if (displayModeState) displayModeState.textContent = "Aplicación instalada";
  });

  window.addEventListener("online", updateConnectionState);
  window.addEventListener("offline", updateConnectionState);
  installBtn?.addEventListener("click", requestInstallation);

  dismissInstallBtn?.addEventListener("click", () => {
    writeStorage(STORAGE_KEYS.installDismissedUntil, String(Date.now() + 14 * 24 * 60 * 60 * 1000));
    hideInstallCard();
  });

  showInstallHelpBtn?.addEventListener("click", () => {
    configureInstallCard({ force: true });
    installCard?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  updateConnectionState();
  updateDisplayModeState();
  restoreReferencePreference();
  setupPromoModal();

  if (!isStandalone && isIOS && !isInstallSuggestionDismissed()) configureInstallCard();
})();
