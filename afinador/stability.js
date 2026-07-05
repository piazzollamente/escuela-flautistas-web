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
})();
