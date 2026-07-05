(() => {
  const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  const nativeCancelAnimationFrame = window.cancelAnimationFrame.bind(window);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || "") || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const targetInterval = isIOS ? 1000 / 18 : 1000 / 30;
  let lastPitchFrame = 0;
  let syntheticId = 0;
  const pending = new Map();

  window.requestAnimationFrame = (callback) => {
    if (typeof callback !== "function" || callback.name !== "updatePitch") return nativeRequestAnimationFrame(callback);
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
    .history-chart-wrap{contain:layout paint;transform:translateZ(0);backface-visibility:hidden;isolation:isolate}
    .history-chart{transform:translateZ(0);backface-visibility:hidden;image-rendering:auto}
    .study-guide-list{display:grid;gap:12px}
    .study-guide-step{padding:18px;border:1px solid rgba(57,50,50,.1);border-radius:20px;background:rgba(255,255,255,.8)}
    .study-guide-step span{display:block;margin-bottom:6px;color:var(--red);font-size:.66rem;font-weight:900;letter-spacing:.12em}
    .study-guide-step h3{margin:0;color:var(--dark);font-family:var(--sans);font-size:.98rem;font-weight:900;letter-spacing:0}
    .study-guide-step p{margin:8px 0 0;color:var(--muted);font-size:.84rem;line-height:1.5}
    .study-guide-note{margin:16px 2px 0;padding-top:15px;border-top:1px solid var(--line);color:var(--muted);font-size:.84rem;font-weight:650}
    @media(max-width:680px){.history-panel{contain:layout paint;transform:translateZ(0);backface-visibility:hidden}.study-guide-step{padding:16px}}
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
    new MutationObserver(suppressUnstableMessage).observe(feedback,{childList:true,characterData:true,subtree:true});
  }

  const exerciseCard = document.querySelector(".exercise-card");
  if (exerciseCard) {
    const title = exerciseCard.querySelector("h2");
    if (title) title.textContent = "Guía de observación";
    const kicker = exerciseCard.querySelector(".section-kicker");
    if (kicker) kicker.textContent = "Cómo usar el afinador";
    const list = exerciseCard.querySelector(".exercise-list");
    const note = exerciseCard.querySelector("#exerciseText");
    if (list) {
      list.className = "study-guide-list";
      list.innerHTML = `
        <article class="study-guide-step"><span>01 · SOSTÉN</span><h3>Nota larga</h3><p>Observa si la afinación permanece centrada o cambia al final de la respiración.</p></article>
        <article class="study-guide-step"><span>02 · COMPARA</span><h3>Octavas</h3><p>Toca una nota grave y su octava. Busca continuidad de centro, no solo más volumen.</p></article>
        <article class="study-guide-step"><span>03 · ESCUCHA</span><h3>Inicio de la nota</h3><p>Comprueba que la afinación aparezca centrada desde el ataque, sin golpe excesivo de lengua.</p></article>
        <article class="study-guide-step"><span>04 · REGULA</span><h3>Diminuendo</h3><p>Reduce el sonido sin cerrar la embocadura ni dejar que la afinación suba.</p></article>`;
    }
    if (note) {
      note.id = "";
      note.className = "study-guide-note";
      note.textContent = "El afinador no corrige por ti: úsalo para reconocer tendencias y relacionarlas con lo que haces al tocar.";
    }
  }

  const GA_ID = "G-DCXF3B1KV9";
  const params = new URLSearchParams(window.location.search);
  const displayMode = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true ? "installed_app" : "web";
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){window.dataLayer.push(arguments)};
  const analyticsScript = document.createElement("script");
  analyticsScript.async = true;
  analyticsScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(analyticsScript);
  window.gtag("js",new Date());
  window.gtag("config",GA_ID,{page_title:"Afinador Cromático EDF",page_location:window.location.href,page_path:"/afinador/",send_page_view:true});
  const campaignData = {
    app_mode: displayMode,
    campaign_source: params.get("utm_source") || "direct",
    campaign_medium: params.get("utm_medium") || "none",
    campaign_name: params.get("utm_campaign") || "none",
    campaign_content: params.get("utm_content") || "none"
  };
  window.gtag("event","tuner_open",campaignData);
  window.gtag("event","pwa_mode",{app_mode:displayMode});
  document.getElementById("startBtn")?.addEventListener("click",()=>window.gtag("event","tuner_start",campaignData));

  const noteName = document.getElementById("noteName");
  let effectiveUseTracked = false;
  if (noteName) {
    const detectEffectiveUse = () => {
      const value = noteName.textContent?.trim();
      if (!effectiveUseTracked && value && value !== "—") {
        effectiveUseTracked = true;
        window.gtag("event","pitch_detected",{...campaignData,first_note:value});
      }
    };
    new MutationObserver(detectEffectiveUse).observe(noteName,{childList:true,characterData:true,subtree:true});
  }

  document.querySelectorAll('a[href*="embocadura-organizada"],a[href*="pay.hotmart.com"]').forEach((link)=>{
    link.addEventListener("click",()=>{
      const isCheckout = link.href.includes("pay.hotmart.com");
      window.gtag("event",isCheckout ? "hotmart_checkout_click" : "challenge_link_click",{
        ...campaignData,
        link_location:link.id === "promoCta" ? "popup" : link.id === "challengeHotmartCta" ? "final_offer_card" : "page_cta",
        value:isCheckout ? 39 : undefined,
        currency:isCheckout ? "USD" : undefined
      });
    });
  });
  window.addEventListener("appinstalled",()=>window.gtag("event","tuner_install",campaignData));
})();
