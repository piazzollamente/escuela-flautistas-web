(() => {
  const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  const nativeCancelAnimationFrame = window.cancelAnimationFrame.bind(window);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || "") || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const targetInterval = isIOS ? 1000 / 18 : 1000 / 30;
  let lastPitchFrame = 0;
  let syntheticId = 0;
  const pending = new Map();

  window.requestAnimationFrame = (callback) => {
    if (typeof callback !== "function" || callback.name !== "updatePitch") {
      return nativeRequestAnimationFrame(callback);
    }

    const id = ++syntheticId;
    const tick = (timestamp) => {
      if (!pending.has(id)) return;
      const elapsed = timestamp - lastPitchFrame;
      if (elapsed >= targetInterval) {
        pending.delete(id);
        lastPitchFrame = timestamp;
        callback(timestamp);
      } else {
        const nextNativeId = nativeRequestAnimationFrame(tick);
        pending.set(id, nextNativeId);
      }
    };

    const nativeId = nativeRequestAnimationFrame(tick);
    pending.set(id, nativeId);
    return -id;
  };

  window.cancelAnimationFrame = (id) => {
    if (id < 0) {
      const synthetic = Math.abs(id);
      const nativeId = pending.get(synthetic);
      if (nativeId) nativeCancelAnimationFrame(nativeId);
      pending.delete(synthetic);
      return;
    }
    nativeCancelAnimationFrame(id);
  };

  const style = document.createElement("style");
  style.textContent = `
    .history-chart-wrap {
      contain: layout paint;
      transform: translateZ(0);
      backface-visibility: hidden;
      isolation: isolate;
    }

    .history-chart {
      transform: translateZ(0);
      backface-visibility: hidden;
      image-rendering: auto;
    }

    @media (max-width: 680px) {
      .history-panel {
        contain: layout paint;
        transform: translateZ(0);
        backface-visibility: hidden;
      }
    }
  `;
  document.head.appendChild(style);

  const feedback = document.getElementById("feedback");
  if (feedback) {
    const suppressUnstableMessage = () => {
      if (feedback.textContent?.startsWith("Señal inestable.")) {
        feedback.textContent = "Micrófono activo.";
        feedback.className = "feedback listening";
      }
    };

    suppressUnstableMessage();
    new MutationObserver(suppressUnstableMessage).observe(feedback, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  const GA_ID = "G-DCXF3B1KV9";
  const params = new URLSearchParams(window.location.search);
  const displayMode = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true
    ? "installed_app"
    : "web";

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  const analyticsScript = document.createElement("script");
  analyticsScript.async = true;
  analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(analyticsScript);

  window.gtag("js", new Date());
  window.gtag("config", GA_ID, {
    page_title: "Afinador Cromático EDF",
    page_location: window.location.href,
    page_path: "/afinador/",
    send_page_view: true
  });

  const campaignData = {
    app_mode: displayMode,
    campaign_source: params.get("utm_source") || "direct",
    campaign_medium: params.get("utm_medium") || "none",
    campaign_name: params.get("utm_campaign") || "none",
    campaign_content: params.get("utm_content") || "none"
  };

  window.gtag("event", "tuner_open", campaignData);
  window.gtag("event", "pwa_mode", { app_mode: displayMode });

  const startBtn = document.getElementById("startBtn");
  startBtn?.addEventListener("click", () => {
    window.gtag("event", "tuner_start", campaignData);
  });

  const noteName = document.getElementById("noteName");
  let effectiveUseTracked = false;
  if (noteName) {
    const detectEffectiveUse = () => {
      const value = noteName.textContent?.trim();
      if (!effectiveUseTracked && value && value !== "—") {
        effectiveUseTracked = true;
        window.gtag("event", "pitch_detected", {
          ...campaignData,
          first_note: value
        });
      }
    };

    new MutationObserver(detectEffectiveUse).observe(noteName, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  document.querySelectorAll('a[href*="embocadura-organizada"]').forEach((link) => {
    link.addEventListener("click", () => {
      window.gtag("event", "challenge_link_click", {
        ...campaignData,
        link_location: link.id === "promoCta" ? "popup" : "page_cta"
      });
    });
  });

  window.addEventListener("appinstalled", () => {
    window.gtag("event", "tuner_install", campaignData);
  });
})();
