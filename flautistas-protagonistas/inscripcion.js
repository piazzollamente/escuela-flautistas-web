/* Flautistas Protagonistas 2027 — inscripción y verificación del WhatsApp.
   El endpoint se configura únicamente después de desplegar el Apps Script de esta carpeta.
   Nunca incluir credenciales de Twilio ni Google en el HTML o JavaScript público. */
(function () {
  "use strict";

  const form = document.getElementById("fpForm");
  const bridge = document.getElementById("fpBridgeForm");
  const iframe = document.getElementById("fp-submit-target");
  if (!form || !bridge || !iframe) return;

  const endpoint = (form.dataset.endpoint || "").trim();
  const phone = document.getElementById("whatsapp");
  const name = document.getElementById("nombre");
  const surname = document.getElementById("apellido");
  const country = document.getElementById("pais");
  const currency = document.getElementById("moneda");
  const installments = document.getElementById("cuotas");
  const consent = document.getElementById("consentimiento");
  const code = document.getElementById("codigo");
  const sendButton = document.getElementById("enviarCodigo");
  const verifyButton = document.getElementById("verificarCodigo");
  const changeButton = document.getElementById("cambiarNumero");
  const registerButton = document.getElementById("submitBtn");
  const codeField = document.getElementById("codigoField");
  const phoneStatus = document.getElementById("whatsappStatus");
  const formStatus = document.getElementById("formStatus");

  let pending = null;
  let verifiedPhone = "";
  let verificationToken = "";

  function normalizePhone(value) {
    return (value || "").replace(/[\s().-]/g, "");
  }

  function phoneIsValid(value) {
    return /^\+[1-9]\d{7,14}$/.test(value);
  }

  function showStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = "form-status is-visible " + (type === "success" ? "is-success" : "is-error");
  }

  function phoneMessage(message, type) {
    phoneStatus.textContent = message;
    phoneStatus.className = "verification-status " + (type || "");
  }

  function resetVerification() {
    verifiedPhone = "";
    verificationToken = "";
    code.value = "";
    codeField.hidden = true;
    phone.readOnly = false;
    sendButton.hidden = false;
    changeButton.hidden = true;
    registerButton.disabled = !endpoint;
    phoneMessage("El número se verificará mediante un código enviado por WhatsApp.", "");
  }

  function busy(flag) {
    sendButton.disabled = flag || !endpoint;
    verifyButton.disabled = flag || !endpoint;
    registerButton.disabled = flag || !endpoint || !verificationToken;
    changeButton.disabled = flag;
  }

  function createRequestId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, function (value) { return value.toString(16).padStart(2, "0"); }).join("");
  }

  function request(action, fields) {
    if (!endpoint || pending) return;
    const requestId = createRequestId();
    bridge.action = endpoint;
    bridge.replaceChildren();
    const data = Object.assign({ accion: action, solicitudId: requestId }, fields);
    Object.keys(data).forEach(function (key) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = String(data[key]);
      bridge.appendChild(input);
    });

    pending = { id: requestId, action: action, timeout: null };
    busy(true);
    pending.timeout = window.setTimeout(function () {
      pending = null;
      busy(false);
      showStatus("No pudimos confirmar la respuesta del sistema. Comprueba tu conexión antes de intentarlo nuevamente. Si ya enviaste la inscripción, consulta primero si fue recibida.", "error");
    }, 25000);
    try {
      bridge.submit();
    } catch (_) {
      window.clearTimeout(pending.timeout);
      pending = null;
      busy(false);
      showStatus("No fue posible conectar con el formulario. Intenta nuevamente.", "error");
    }
  }

  function eventIsTrusted(event) {
    // Solo respuestas del dominio de ejecución de Google Apps Script.
    return /^https:\/\/(?:script\.google\.com|(?:[a-z0-9-]+\.)?googleusercontent\.com)$/.test(event.origin);
  }

  window.addEventListener("message", function (event) {
    if (!pending || !eventIsTrusted(event)) return;
    const data = event.data;
    if (!data || data.source !== "fp2027-inscripcion" || data.solicitudId !== pending.id) return;

    const action = pending.action;
    window.clearTimeout(pending.timeout);
    pending = null;
    busy(false);

    if (!data.ok) {
      showStatus(data.message || "No se completó la operación. Revisa los datos e inténtalo nuevamente.", "error");
      return;
    }
    formStatus.className = "form-status";
    formStatus.textContent = "";

    if (action === "enviar_codigo") {
      codeField.hidden = false;
      phoneMessage("Te enviamos un código por WhatsApp. Escríbelo para confirmar tu número.", "pending");
      code.focus();
    } else if (action === "verificar_codigo") {
      if (!data.verificationToken || !phoneIsValid(normalizePhone(phone.value))) {
        showStatus("No se pudo validar el número. Solicita un código nuevo.", "error");
        return;
      }
      verifiedPhone = normalizePhone(phone.value);
      verificationToken = data.verificationToken;
      phone.value = verifiedPhone;
      phone.readOnly = true;
      sendButton.hidden = true;
      changeButton.hidden = false;
      codeField.hidden = true;
      phoneMessage("WhatsApp verificado ✓", "verified");
      busy(false);
    } else if (action === "inscribir") {
      if (!data.registrationId) {
        showStatus("El registro no devolvió una confirmación válida. Comprueba su estado antes de reenviar.", "error");
        return;
      }
      form.reset();
      resetVerification();
      form.querySelectorAll("input,select,button").forEach(function (control) {
        control.disabled = true;
      });
      showStatus("Inscripción registrada. Recibimos tus preferencias de pago y tu WhatsApp verificado. El cupo y el pago se confirmarán por separado. Código de registro: " + data.registrationId, "success");
      if (typeof window.gtag === "function") {
        window.gtag("event", "inscripcion_flautistas_protagonistas", {
          event_category: "conversion",
          event_label: "Flautistas Protagonistas 2027"
        });
      }
    }
  });

  phone.addEventListener("input", function () {
    if (verificationToken) resetVerification();
  });

  sendButton.addEventListener("click", function () {
    formStatus.className = "form-status";
    const normalized = normalizePhone(phone.value);
    if (!phoneIsValid(normalized)) {
      phone.setCustomValidity("Incluye el signo +, código de país y número sin el cero inicial.");
      phone.reportValidity();
      phone.setCustomValidity("");
      return;
    }
    phone.value = normalized;
    request("enviar_codigo", { whatsapp: normalized });
  });

  verifyButton.addEventListener("click", function () {
    const normalized = normalizePhone(phone.value);
    if (!phoneIsValid(normalized) || !/^\d{4,10}$/.test(code.value.trim())) {
      code.setCustomValidity("Introduce el código numérico que recibiste.");
      code.reportValidity();
      code.setCustomValidity("");
      return;
    }
    request("verificar_codigo", { whatsapp: normalized, codigo: code.value.trim() });
  });

  changeButton.addEventListener("click", function () {
    resetVerification();
    phone.focus();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (pending) return;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const normalized = normalizePhone(phone.value);
    if (!verificationToken || normalized !== verifiedPhone) {
      phoneMessage("Verifica tu número antes de continuar.", "error");
      phone.focus();
      return;
    }
    request("inscribir", {
      nombre: name.value.trim(),
      apellido: surname.value.trim(),
      pais: country.value.trim(),
      whatsapp: verifiedPhone,
      moneda: currency.value,
      cuotas: installments.value,
      consentimiento: consent.checked ? "si" : "no",
      verificationToken: verificationToken
    });
  });

  if (!endpoint || !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(endpoint)) {
    sendButton.disabled = true;
    verifyButton.disabled = true;
    registerButton.disabled = true;
    showStatus("La inscripción en línea todavía no está habilitada. El formulario se activará al finalizar la configuración segura de WhatsApp.", "error");
  } else {
    resetVerification();
  }
})();
