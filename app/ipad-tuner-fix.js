(() => {
  "use strict";

  const isIPad = /iPad/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!isIPad) return;

  const mediaDevices = navigator.mediaDevices;
  if (mediaDevices?.getUserMedia && !mediaDevices.getUserMedia.__edfPatched) {
    const originalGetUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
    const patchedGetUserMedia = constraints => {
      const next = { ...(constraints || {}) };
      if (next.audio) {
        const requested = typeof next.audio === "object" ? next.audio : {};
        next.audio = {
          ...requested,
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 48000 },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true
        };
      }
      return originalGetUserMedia(next);
    };
    patchedGetUserMedia.__edfPatched = true;
    mediaDevices.getUserMedia = patchedGetUserMedia;
  }

  if (window.MediaStreamAudioSourceNode && window.AnalyserNode) {
    const sourcePrototype = window.MediaStreamAudioSourceNode.prototype;
    if (!sourcePrototype.connect.__edfPatched) {
      const originalConnect = sourcePrototype.connect;
      const patchedConnect = function(destination, ...args) {
        if (destination instanceof window.AnalyserNode && !this.__edfTunerChain) {
          const context = this.context;
          const highPass = context.createBiquadFilter();
          const lowPass = context.createBiquadFilter();
          const gain = context.createGain();

          highPass.type = "highpass";
          highPass.frequency.value = 150;
          highPass.Q.value = 0.55;

          lowPass.type = "lowpass";
          lowPass.frequency.value = 5600;
          lowPass.Q.value = 0.55;

          gain.gain.value = 2.25;

          originalConnect.call(this, highPass);
          highPass.connect(lowPass);
          lowPass.connect(gain);
          this.__edfTunerChain = { highPass, lowPass, gain };
          return gain.connect(destination, ...args);
        }
        return originalConnect.call(this, destination, ...args);
      };
      patchedConnect.__edfPatched = true;
      sourcePrototype.connect = patchedConnect;
    }

    const analyserPrototype = window.AnalyserNode.prototype;
    if (!analyserPrototype.getFloatTimeDomainData.__edfPatched) {
      const originalGetData = analyserPrototype.getFloatTimeDomainData;
      const patchedGetData = function(array) {
        originalGetData.call(this, array);

        let mean = 0;
        for (let i = 0; i < array.length; i++) mean += array[i];
        mean /= array.length || 1;

        let rms = 0;
        for (let i = 0; i < array.length; i++) {
          array[i] -= mean;
          rms += array[i] * array[i];
        }
        rms = Math.sqrt(rms / (array.length || 1));

        const adaptiveGain = rms > 0 ? Math.min(4.2, Math.max(1, 0.045 / rms)) : 1;
        let previous = array[0] || 0;
        for (let i = 0; i < array.length; i++) {
          const current = array[i];
          const softened = i ? current * 0.90 + previous * 0.10 : current;
          array[i] = Math.max(-1, Math.min(1, softened * adaptiveGain));
          previous = current;
        }
      };
      patchedGetData.__edfPatched = true;
      analyserPrototype.getFloatTimeDomainData = patchedGetData;
    }
  }
})();
