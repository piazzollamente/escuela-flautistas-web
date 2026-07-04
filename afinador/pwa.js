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

  const STORAGE_KEYS = {
    reference: "edf-tuner-a4-reference",
    installDismissedUntil: "edf-tuner-install-dismissed-until"
  };

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|Android/.test(userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

  let deferredInstallPrompt = null;

  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // El afinador continúa funcionando aunque el navegador bloquee el almacenamiento.
    }
  }

  function isInstallSuggestionDismissed() {
    const dismissedUntil = Number(readStorage(STORAGE_KEYS.installDismissedUntil));
    return Number.isFinite(dismissedUntil) && dismissedUntil > Date.now();
  }

  function updateConnectionState() {
    if (!connectionState) return;

    const online = navigator.onLine;
    connectionState.textContent = online ? "En línea" : "Sin conexión";
    connectionState.classList.toggle("offline", !online);
  }

  function updateDisplayModeState() {
    if (!displayModeState) return;
    displayModeState.textContent = isStandalone ? "Aplicación instalada" : "Versión web";
  }

  function configureInstallCard({ force = false } = {}) {
    if (!installCard || isStandalone) return;
    if (!force && isInstallSuggestionDismissed()) return;

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

    if (deferredInstallPrompt) {
      installBtn.disabled = false;
      installBtn.textContent = "Instalar aplicación";
      installDescription.textContent = "Ábrelo desde tu pantalla de inicio y úsalo incluso cuando la conexión sea inestable.";
    } else {
      installBtn.disabled = false;
      installBtn.textContent = "Ver opciones de instalación";
      installDescription.textContent = "Puedes instalarlo desde el menú de Chrome, Edge o tu navegador compatible.";
    }
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

    if (choice.outcome === "accepted") {
      hideInstallCard();
    } else {
      configureInstallCard({ force: true });
    }
  }

  function restoreReferencePreference() {
    if (!a4Reference) return;

    const savedReference = readStorage(STORAGE_KEYS.reference);
    if (["440", "442", "443"].includes(savedReference)) {
      a4Reference.value = savedReference;
      a4Reference.dispatchEvent(new Event("change"));
    }

    a4Reference.addEventListener("change", () => {
      if (["440", "442", "443"].includes(a4Reference.value)) {
        writeStorage(STORAGE_KEYS.reference, a4Reference.value);
      }
    });
  }

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
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;
    writeStorage(STORAGE_KEYS.installDismissedUntil, String(Date.now() + fourteenDays));
    hideInstallCard();
  });

  showInstallHelpBtn?.addEventListener("click", () => {
    configureInstallCard({ force: true });
    installCard?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  updateConnectionState();
  updateDisplayModeState();
  restoreReferencePreference();

  if (!isStandalone && isIOS && !isInstallSuggestionDismissed()) {
    configureInstallCard();
  }
})();
