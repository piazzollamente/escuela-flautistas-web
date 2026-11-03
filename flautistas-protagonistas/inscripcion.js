/* Flautistas Protagonistas 2027 — doble ingreso de WhatsApp y registro en Google Sheets.
   El endpoint se activa solo al desplegar el nuevo Google Apps Script.
   No se realiza validación de titularidad ni se envían códigos por WhatsApp. */
(function () {
  "use strict";

  const form = document.getElementById("fpForm");
  const bridge = document.getElementById("fpBridgeForm");
  const iframe = document.getElementById("fp-submit-target");
  if (!form || !bridge || !iframe) return;

  const endpoint = (form.dataset.endpoint || "").trim();
  const phone = document.getElementById("whatsapp");
  const confirmPhone = document.getElementById("confirmarWhatsapp");
  const help = document.getElementById("whatsappHelp");
  const name = document.getElementById("nombre");
  const surname = document.getElementById("apellido");
  const country = document.getElementById("pais");
  const currency = document.getElementById("moneda");
  const installments = document.getElementById("cuotas");
  const consent = document.getElementById("consentimiento");
  const registerButton = document.getElementById("submitBtn");
  const formStatus = document.getElementById("formStatus");
  let pending = null;

  // Se normalizan espacios y separadores para que +56 9 ... y +569... coincidan.
  function normalizePhone(value) {
    return String(value || "").replace(/[\s().-]/g, "");
  }

  function phoneIsValid(value) {
    return /^\+[1-9]\d{7,14}$/.test(value);
  }

  function validatePhones() {
    const a = normalizePhone(phone.value);
    const b = normalizePhone(confirmPhone.value);
    const hasSecond = b.length > 0;

    phone.setCustomValidity(a && !phoneIsValid(a) ?
      "Incluye +, código de país y número. Ejemplo: +56912345678." : "");

    const mismatch = hasSecond && a !== b;
    confirmPhone.setCustomValidity(mismatch ? "Los números de WhatsApp no coinciden." : "");
    confirmPhone.setAttribute("aria-invalid", mismatch ? "true" : "false");
    help.textContent = mismatch ? "Los números de WhatsApp no coinciden." : "";
    return phoneIsValid(a) && a === b;
  }

  function showStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = "form-status is-visible " +
      (type === "success" ? "is-success" : "is-error");
  }

  function createRequestId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, function (byte) {
      return byte.toString(16).padStart(2, "0");
    }).join("");
  }

  function request(fields) {
    if (!endpoint || pending) return;
    const requestId = createRequestId();
    bridge.action = endpoint;
    bridge.replaceChildren();

    const data = Object.assign({
      accion: "inscribir",
      solicitudId: requestId
    }, fields);

    Object.keys(data).forEach(function (key) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = String(data[key]);
      bridge.appendChild(input);
    });

    pending = { id: requestId, timeout: null };
    registerButton.disabled = true;
    registerButton.textContent = "Enviando…";
    pending.timeout = window.setTimeout(function () {
      pending = null;
      registerButton.disabled = false;
      registerButton.textContent = "Registrar mi inscripción";
      showStatus("No pudimos confirmar la respuesta del sistema. Si ya enviaste la inscripción, consulta primero si fue recibida antes de repetir el envío.", "error");
    }, 25000);
    try {
      bridge.submit();
    } catch (_) {
      window.clearTimeout(pending.timeout);
      pending = null;
      registerButton.disabled = false;
      registerButton.textContent = "Registrar mi inscripción";
      showStatus("No fue posible enviar la inscripción. Intenta nuevamente.", "error");
    }
  }

  function eventIsTrusted(event) {
    return /^https:\/\/(?:script\.google\.com|(?:[a-z0-9-]+\.)?googleusercontent\.com)$/.test(event.origin);
  }

  window.addEventListener("message", function (event) {
    if (!pending || !eventIsTrusted(event)) return;
    const data = event.data;
    if (!data || data.source !== "fp2027-inscripcion" ||
        data.solicitudId !== pending.id) return;

    window.clearTimeout(pending.timeout);
    pending = null;
    registerButton.disabled = false;
    registerButton.textContent = "Registrar mi inscripción";

    if (!data.ok) {
      showStatus(data.message || "No se completó la inscripción. Revisa los datos e inténtalo nuevamente.", "error");
      return;
    }
    if (!data.registrationId) {
      showStatus("El sistema no devolvió una confirmación válida. Comprueba el estado de la inscripción antes de reenviar.", "error");
      return;
    }

    form.reset();
    confirmPhone.setCustomValidity("");
    phone.setCustomValidity("");
    confirmPhone.setAttribute("aria-invalid", "false");
    help.textContent = "";
    form.querySelectorAll("input,select,button").forEach(function (control) {
      control.disabled = true;
    });
    showStatus("Recibimos tu inscripción y tus preferencias de pago. Los dos números de WhatsApp coincidieron, pero no se ha comprobado la titularidad del número. El cupo y el pago se confirmarán por separado. Código de registro: " + data.registrationId, "success");

    if (typeof window.gtag === "function") {
      window.gtag("event", "inscripcion_flautistas_protagonistas", {
        event_category: "conversion",
        event_label: "Flautistas Protagonistas 2027"
      });
    }
  });

  phone.addEventListener("input", validatePhones);
  confirmPhone.addEventListener("input", validatePhones);

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (pending) return;
    validatePhones();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const normalized = normalizePhone(phone.value);
    if (!phoneIsValid(normalized) ||
        normalized !== normalizePhone(confirmPhone.value)) {
      confirmPhone.focus();
      return;
    }

    formStatus.className = "form-status";
    formStatus.textContent = "";

    request({
      nombre: name.value.trim(),
      apellido: surname.value.trim(),
      pais: country.value.trim(),
      whatsapp: normalized,
      confirmarWhatsapp: normalizePhone(confirmPhone.value),
      moneda: currency.value,
      cuotas: installments.value,
      consentimiento: consent.checked ? "si" : "no"
    });
  });

  // La hoja de Google Sheets no es un endpoint público. El script receptor
  // debe desplegarse por separado; nunca usar URLs privadas o claves en cliente.
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(endpoint)) {
    registerButton.disabled = true;
    showStatus("La inscripción en línea estará disponible cuando finalice la conexión segura con Google Sheets.", "error");
  } else {
    registerButton.disabled = false;
  }
})();