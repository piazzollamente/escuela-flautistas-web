/**
 * Registro de inscripciones — Flautistas Protagonistas 2027.
 * Google Apps Script independiente de la preinscripción anterior.
 *
 * Vinculado a la hoja de inscripciones, no a la preinscripción.
 * No utiliza Twilio, OTP ni otros servicios de verificación telefónica.
 * Para activarlo: ejecutar probarConexion(), autorizar y desplegar como aplicación web.
 *
 * Se solicita escribir el WhatsApp dos veces; los valores deben coincidir.
 * Esto NO verifica que la persona sea titular del número ni que exista una cuenta de WhatsApp.
 */

const FP_SPREADSHEET_ID = "19ODt7wTppY6FJsE7ZQsH-lqNTiGJv4Ll9RqOvp7a2dQ";
const FP_ALLOWED_ORIGIN = "https://escueladeflautistas.cl";
const FP_SHEET_NAME = "Inscripciones web";
const FP_ORIGIN = "Landing inscripción Flautistas Protagonistas 2027";
const FP_CURRENCIES = ["USD — dólares", "ARS — pesos argentinos", "CLP — pesos chilenos"];

function doGet() {
  return HtmlService.createHtmlOutput("Servicio de inscripciones. Envía los datos desde la página oficial.");
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  const requestId = /^[a-zA-Z0-9-]{8,80}$/.test(String(p.solicitudId || ""))
    ? p.solicitudId : "";
  let result;
  try {
    if (!requestId || p.accion !== "inscribir") throw new Error("REQUEST_INVALID");
    result = fpRegister_(p);
  } catch (err) {
    console.error("Error en inscripción: " + String(err && err.message || "Desconocido"));
    result = { ok: false, message: fpPublicError_(err) };
  }
  return fpReply_(result, requestId);
}

/** Ejecutar una sola vez desde el editor para verificar acceso y autorizar Sheets. */
function probarConexion() {
  const libro = SpreadsheetApp.openById(FP_SPREADSHEET_ID);
  const hoja = libro.getSheetByName(FP_SHEET_NAME);
  if (!hoja) throw new Error("No se encontró la pestaña de inscripciones.");
  const encabezados = hoja.getRange(1, 1, 1, 16).getDisplayValues()[0];
  const camposEsperados = ["Fecha de inscripción", "ID de inscripción", "Nombre", "Apellido", "País de residencia"];
  if (camposEsperados.some(function (campo, i) { return encabezados[i] !== campo; })) {
    throw new Error("Los encabezados de la hoja no coinciden con el formulario.");
  }
  const resultado = "Conexión correcta con " + FP_SHEET_NAME + ". No se escribieron datos.";
  Logger.log(resultado);
  return resultado;
}

function fpNormalizePhone_(value) {
  return String(value || "").replace(/[\s().-]/g, "");
}

function fpPhone_(value) {
  const phone = fpNormalizePhone_(value);
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error("PHONE_INVALID");
  return phone;
}

function fpRequiredText_(value, maxLength) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  if (!text || text.length > maxLength) throw new Error("FORM_INVALID");
  return text;
}

function fpSafeCell_(value) {
  // Evita inyección de fórmulas en Sheets a través de campos de texto libre.
  const text = String(value);
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

function fpRegister_(p) {
  const phone = fpPhone_(p.whatsapp);
  const repeatPhone = fpPhone_(p.confirmarWhatsapp);
  if (phone !== repeatPhone) throw new Error("PHONE_MISMATCH");

  const name = fpSafeCell_(fpRequiredText_(p.nombre, 80));
  const surname = fpSafeCell_(fpRequiredText_(p.apellido, 80));
  const country = fpSafeCell_(fpRequiredText_(p.pais, 90));
  const currency = String(p.moneda || "");
  const installments = String(p.cuotas || "");
  if (!FP_CURRENCIES.includes(currency) ||
      !["1", "2", "3"].includes(installments)) throw new Error("FORM_INVALID");
  if (p.consentimiento !== "si") throw new Error("CONSENT_REQUIRED");

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = SpreadsheetApp.openById(FP_SPREADSHEET_ID)
      .getSheetByName(FP_SHEET_NAME);
    if (!sheet) throw new Error("CONFIG_ERROR");

    const last = sheet.getLastRow();
    if (last > 1) {
      const oldPhones = sheet.getRange(2, 6, last - 1, 1).getDisplayValues();
      if (oldPhones.some(function (row) { return row[0] === phone; })) {
        throw new Error("ALREADY_REGISTERED");
      }
    }

    const now = new Date();
    const registrationId = Utilities.getUuid().slice(0, 8).toUpperCase();
    sheet.appendRow([
      now,
      registrationId,
      name,
      surname,
      country,
      phone,
      "Coinciden",
      "No realizada",
      currency,
      installments,
      "Recibida",
      "Pendiente",
      "",
      FP_ORIGIN,
      "Sí",
      ""
    ]);
    SpreadsheetApp.flush();
    return { ok: true, registrationId: registrationId };
  } finally {
    lock.releaseLock();
  }
}

function fpPublicError_(err) {
  const messages = {
    PHONE_INVALID: "Revisa el número. Incluye +, código de país y número.",
    PHONE_MISMATCH: "Los dos números de WhatsApp no coinciden.",
    FORM_INVALID: "Revisa los datos de tu inscripción e inténtalo nuevamente.",
    CONSENT_REQUIRED: "Debes aceptar el uso de los datos para gestionar tu inscripción.",
    ALREADY_REGISTERED: "Este WhatsApp ya figura en las inscripciones. Contacta a la escuela si necesitas modificar tu registro."
  };
  return messages[err && err.message] ||
    "No se pudo completar la solicitud. Intenta nuevamente o contacta a Escuela de Flautistas.";
}

function fpReply_(result, requestId) {
  const origin = FP_ALLOWED_ORIGIN;
  if (!/^https:\/\/[a-z0-9.-]+$/.test(origin)) throw new Error("ALLOWED_ORIGIN inválido.");
  const payload = Object.assign(
    { source: "fp2027-inscripcion", solicitudId: requestId },
    result
  );
  const safePayload = JSON.stringify(payload).replace(/</g, "\\u003c");
  const safeOrigin = JSON.stringify(origin);
  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    '<script>window.top.postMessage(' + safePayload + ',' + safeOrigin + ');' +
    'if(window.parent!==window.top)window.parent.postMessage(' +
    safePayload + ',' + safeOrigin + ');<\/script></body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}