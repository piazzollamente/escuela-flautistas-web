/**
 * Receptor de inscripción — Flautistas Protagonistas 2027.
 * Proyecto independiente de Google Apps Script, desplegado como aplicación web.
 *
 * Script Properties (configurar en Apps Script, nunca en GitHub):
 * SPREADSHEET_ID, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 * TWILIO_VERIFY_SERVICE_SID, ALLOWED_ORIGIN=https://escueladeflautistas.cl
 *
 * Implementación: Google Sheets + Twilio Verify WhatsApp.
 * Se recomienda activar también los controles de fraude y límites por país de Twilio.
 */

const FP_SHEET_NAME = "Inscripciones web";
const FP_ORIGIN = "Landing inscripción Flautistas Protagonistas 2027";
const FP_CURRENCIES = ["USD — dólares", "ARS — pesos argentinos", "CLP — pesos chilenos"];

function doGet() {
  return HtmlService.createHtmlOutput("Servicio de inscripciones. Envía los datos desde la página oficial.");
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  const requestId = /^[a-zA-Z0-9-]{8,80}$/.test(String(p.solicitudId || "")) ? p.solicitudId : "";
  let answer;
  try {
    if (!requestId) throw new Error("Solicitud inválida.");
    if (p.accion === "enviar_codigo") {
      answer = fpStartVerification_(p);
    } else if (p.accion === "verificar_codigo") {
      answer = fpCheckVerification_(p);
    } else if (p.accion === "inscribir") {
      answer = fpRegister_(p);
    } else {
      throw new Error("Acción no admitida.");
    }
  } catch (err) {
    console.error("Error de inscripción: " + String(err && err.message || "Desconocido"));
    answer = { ok: false, message: fpPublicError_(err) };
  }
  return fpReply_(answer, requestId);
}

function fpProps_() {
  return PropertiesService.getScriptProperties();
}

function fpRequired_(key) {
  const value = fpProps_().getProperty(key);
  if (!value) throw new Error("CONFIG_ERROR");
  return value;
}

function fpPhone_(p) {
  const phone = String(p.whatsapp || "").trim();
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error("PHONE_INVALID");
  return phone;
}

function fpHash_(phone) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, phone);
  return digest.map(function (byte) {
    return ("0" + ((byte + 256) % 256).toString(16)).slice(-2);
  }).join("");
}

function fpTwilio_(resource, values) {
  const account = fpRequired_("TWILIO_ACCOUNT_SID");
  const authToken = fpRequired_("TWILIO_AUTH_TOKEN");
  const service = fpRequired_("TWILIO_VERIFY_SERVICE_SID");
  const url = "https://verify.twilio.com/v2/Services/" + encodeURIComponent(service) + "/" + resource;
  const response = UrlFetchApp.fetch(url, {
    method: "post",
    payload: values,
    headers: { Authorization: "Basic " + Utilities.base64Encode(account + ":" + authToken) },
    muteHttpExceptions: true
  });
  const statusCode = response.getResponseCode();
  let result = {};
  try { result = JSON.parse(response.getContentText()); } catch (_) {}
  if (statusCode < 200 || statusCode >= 300) {
    console.error("Twilio Verify HTTP " + statusCode + " / code " + (result.code || "?"));
    throw new Error(statusCode === 429 ? "RATE_LIMIT" : "VERIFICATION_FAILED");
  }
  return result;
}

function fpStartVerification_(p) {
  const phone = fpPhone_(p);
  const cache = CacheService.getScriptCache();
  const hash = fpHash_(phone);
  const now = Date.now();
  const last = Number(cache.get("sendLast:" + hash) || 0);
  if (last && now - last < 60000) throw new Error("RATE_LIMIT");
  const count = Number(cache.get("sendCount:" + hash) || 0);
  if (count >= 5) throw new Error("RATE_LIMIT");
  const res = fpTwilio_("Verifications", { To: phone, Channel: "whatsapp" });
  if (!res.sid || res.status !== "pending") throw new Error("VERIFICATION_FAILED");
  cache.put("sendLast:" + hash, String(now), 60);
  cache.put("sendCount:" + hash, String(count + 1), 3600);
  return { ok: true };
}

function fpCheckVerification_(p) {
  const phone = fpPhone_(p);
  const code = String(p.codigo || "").trim();
  if (!/^\d{4,10}$/.test(code)) throw new Error("CODE_INVALID");
  const res = fpTwilio_("VerificationCheck", { To: phone, Code: code });
  if (res.status !== "approved") throw new Error("CODE_INVALID");

  const token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put("verified:" + token, phone, 900);
  return { ok: true, verificationToken: token };
}

function fpRequiredText_(value, maxLength) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  if (!text || text.length > maxLength) throw new Error("FORM_INVALID");
  return text;
}

function fpSafeCell_(value) {
  // Impide que Google Sheets interprete datos escritos por visitantes como fórmulas.
  const text = String(value);
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

function fpRegister_(p) {
  const phone = fpPhone_(p);
  const name = fpSafeCell_(fpRequiredText_(p.nombre, 80));
  const surname = fpSafeCell_(fpRequiredText_(p.apellido, 80));
  const country = fpSafeCell_(fpRequiredText_(p.pais, 90));
  const currency = String(p.moneda || "");
  const installments = String(p.cuotas || "");
  const token = String(p.verificationToken || "");
  if (!FP_CURRENCIES.includes(currency) || !["1", "2", "3"].includes(installments)) throw new Error("FORM_INVALID");
  if (p.consentimiento !== "si") throw new Error("CONSENT_REQUIRED");
  if (!/^[0-9a-f-]{72}$/.test(token)) throw new Error("VERIFICATION_REQUIRED");

  const cache = CacheService.getScriptCache();
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (cache.get("verified:" + token) !== phone) throw new Error("VERIFICATION_REQUIRED");
    const spreadsheet = SpreadsheetApp.openById(fpRequired_("SPREADSHEET_ID"));
    const sheet = spreadsheet.getSheetByName(FP_SHEET_NAME);
    if (!sheet) throw new Error("CONFIG_ERROR");
    const last = sheet.getLastRow();
    if (last > 1) {
      // Evita inscribir repetidamente el mismo WhatsApp, incluso si se repite el envío.
      const oldPhones = sheet.getRange(2, 6, last - 1, 1).getDisplayValues();
      if (oldPhones.some(function (row) { return row[0] === phone; })) {
        throw new Error("ALREADY_REGISTERED");
      }
    }

    const now = new Date();
    const registrationId = Utilities.getUuid().slice(0, 8).toUpperCase();
    sheet.appendRow([
      now, registrationId, name, surname, country, phone,
      "Verificado", now, currency, installments, "Recibida", "Pendiente",
      "", FP_ORIGIN, "Sí", ""
    ]);
    SpreadsheetApp.flush();
    cache.remove("verified:" + token);
    return { ok: true, registrationId: registrationId };
  } finally {
    lock.releaseLock();
  }
}

function fpPublicError_(err) {
  const code = err && err.message;
  const errors = {
    PHONE_INVALID: "Revisa el número de WhatsApp. Debe incluir + y el código de país.",
    CODE_INVALID: "El código es incorrecto o venció. Solicita uno nuevo si es necesario.",
    RATE_LIMIT: "Se alcanzó el límite temporal de intentos. Prueba nuevamente más tarde.",
    VERIFICATION_FAILED: "No pudimos enviar o comprobar el código por WhatsApp. Intenta nuevamente.",
    VERIFICATION_REQUIRED: "La verificación venció. Debes verificar otra vez tu número.",
    FORM_INVALID: "Revisa los datos de tu inscripción e inténtalo nuevamente.",
    CONSENT_REQUIRED: "Debes aceptar el uso de tus datos para gestionar la inscripción.",
    ALREADY_REGISTERED: "Este WhatsApp ya figura como inscrito. Contacta a la escuela si necesitas modificar tu registro."
  };
  return errors[code] || "No pudimos completar la solicitud. Intenta nuevamente o contacta a Escuela de Flautistas.";
}

function fpReply_(result, requestId) {
  const origin = fpRequired_("ALLOWED_ORIGIN");
  if (!/^https:\/\/[a-z0-9.-]+$/.test(origin)) throw new Error("ALLOWED_ORIGIN inválido.");
  const payload = Object.assign({ source: "fp2027-inscripcion", solicitudId: requestId }, result);
  // No interpolar texto del usuario en HTML ejecutable sin neutralizar etiquetas.
  const safePayload = JSON.stringify(payload).replace(/</g, "\\u003c");
  const safeOrigin = JSON.stringify(origin);
  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    '<script>window.top.postMessage(' + safePayload + ',' + safeOrigin + ');' +
    'if(window.parent!==window.top)window.parent.postMessage(' + safePayload + ',' + safeOrigin + ');<\/script></body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
