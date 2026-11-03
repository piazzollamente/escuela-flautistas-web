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

function doGet(e) {
  const p = (e && e.parameter) || {};
  const token = String(p.token || "");
  // Permite a la web confirmar que esta versión ya guarda la columna de email.
  // La versión anterior no responde; así evitamos perder direcciones de correo.
  if (p.accion === "comprobar_correo" && /^[a-zA-Z0-9-]{8,80}$/.test(token)) {
    const payload = JSON.stringify({
      source: "fp2027-servicio", version: "email-v2", token: token
    }).replace(/</g, "\\u003c");
    const html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
      '<script>window.top.postMessage(' + payload + ',' +
      JSON.stringify(FP_ALLOWED_ORIGIN) + ');' +
      'if(window.parent!==window.top)window.parent.postMessage(' + payload + ',' +
      JSON.stringify(FP_ALLOWED_ORIGIN) + ');</' + 'script></body></html>';
    return HtmlService.createHtmlOutput(html)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
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
  const encabezados = hoja.getRange(1, 1, 1, 22).getDisplayValues()[0];
  const camposEsperados = ["Fecha de inscripción", "ID de inscripción", "Nombre", "Apellido", "País de residencia"];
  if (camposEsperados.some(function (campo, i) { return encabezados[i] !== campo; }) ||
      encabezados[16] !== "Correo electrónico" ||
      encabezados[17] !== "Estado correo inicial" ||
      encabezados[20] !== "Estado correo pago completo") {
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

function fpEmail_(value) {
  const email = String(value || "").trim().toLowerCase();
  if (email.length > 254 ||
      !/^[a-z0-9][a-z0-9._%+-]*@[a-z0-9][a-z0-9.-]*[.][a-z]{2,}$/i.test(email)) {
    throw new Error("EMAIL_INVALID");
  }
  return email;
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
  const email = fpEmail_(p.correo);
  const country = fpSafeCell_(fpRequiredText_(p.pais, 90));
  const currency = String(p.moneda || "");
  const installments = String(p.cuotas || "");
  if (!FP_CURRENCIES.includes(currency) ||
      !["1", "3"].includes(installments)) throw new Error("FORM_INVALID");
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
      "",
      email,
      "Pendiente",
      "",
      "",
      "",
      ""
    ]);
    SpreadsheetApp.flush();
    return { ok: true, registrationId: registrationId, emailCaptured: true };
  } finally {
    lock.releaseLock();
  }
}

function fpPublicError_(err) {
  const messages = {
    PHONE_INVALID: "Revisa el número. Incluye +, código de país y número.",
    PHONE_MISMATCH: "Los dos números de WhatsApp no coinciden.",
    EMAIL_INVALID: "Revisa tu correo electrónico e inténtalo nuevamente.",
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

/* ----------------------------------------------------------------------
 * Automatización transaccional de correos — FP2027
 * 
 * No se envían correos si los datos de pago del mercado no están revisados
 * y habilitados en la hoja privada «Configuración pagos FP2027».
 * No utiliza direcciones de alumnos de otras fuentes por coincidencia de nombre.
 * El pago, el calendario y las acreditaciones requieren revisión humana.
 * ---------------------------------------------------------------------- */

const FP_MAIL_CONFIG_SHEET = "Configuración pagos FP2027";
const FP_MAIL_HISTORY_SHEET = "Historial correo FP2027";
const FP_MAIL_PLAN_SHEET = "Plan pagos FP2027";
const FP_MAIL_REPLY_TO = "valentina@escueladeflautistas.cl";
const FP_MAIL_TIMEZONE = "America/Santiago";
const FP_MAIL_MAX_PER_RUN = 10;

const FP_MAIL_PRICES = {
  "Chile": {
    currency: "CLP — pesos chilenos", one: "CLP $399.900",
    three: "CLP $139.900", total: "CLP $419.700"
  },
  "Argentina": {
    currency: "ARS — pesos argentinos", one: "ARS $399.000",
    three: "ARS $139.900", total: "ARS $419.700"
  },
  "Otro país": {
    currency: "USD — dólares", one: "USD 419",
    three: "USD 147", total: "USD 441"
  }
};

function fpEscaparHtml_(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;" }[char];
  });
}

function fpEmailValido_(value) {
  const email = String(value || "").trim().toLowerCase();
  return email.length <= 254 &&
    /^[a-z0-9][a-z0-9._%+-]*@[a-z0-9][a-z0-9.-]*[.][a-z]{2,}$/i.test(email);
}

function fpCorreoConfiguracion_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(FP_MAIL_CONFIG_SHEET);
  if (!sheet) throw new Error("Falta la pestaña de configuración de pagos.");
  const result = {};
  if (sheet.getLastRow() < 2) return result;
  sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getDisplayValues()
    .forEach(function (row) {
      const market = String(row[0] || "").trim();
      if (!FP_MAIL_PRICES[market]) return;
      result[market] = {
        method: String(row[1] || "").trim(),
        instructions: String(row[2] || "").trim(),
        enabled: String(row[3] || "").trim().toLowerCase() === "sí" ||
          String(row[3] || "").trim().toLowerCase() === "si"
      };
    });
  return result;
}

function fpCorreoDisponible_(market, configs) {
  const settings = configs[market];
  return !!(settings && settings.enabled && settings.instructions &&
    settings.instructions.length >= 12 && settings.method);
}

function fpCorreoPlantilla_(title, innerHtml) {
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"></head>' +
    '<body style="margin:0;padding:26px 12px;background:#F7F5F2;">' +
    '<div style="max-width:600px;margin:auto;border:1px solid #D8D0C6;' +
    'background:#FCFAF7;color:#111111;">' +
    '<div style="padding:22px 30px;border-top:4px solid #E31C23;' +
    'background:#111111;color:#FFFFFF;">' +
    '<div style="font:700 11px/1.5 Arial,sans-serif;letter-spacing:2px;' +
    'color:#D9F2EE;">ESCUELA DE FLAUTISTAS</div>' +
    '<div style="margin-top:8px;font:500 34px/1 Georgia,serif;">' +
    'Flautistas Protagonistas</div>' +
    '<div style="margin-top:7px;font:600 11px/1.5 Arial,sans-serif;' +
    'letter-spacing:2px;color:#D9F2EE;">EDICIÓN 2027</div></div>' +
    '<div style="padding:26px 30px;font:15px/1.7 Arial,sans-serif;">' +
    '<h1 style="font:500 31px/1.1 Georgia,serif;margin:0 0 20px;">' +
    fpEscaparHtml_(title) + '</h1>' + innerHtml +
    '<p style="margin:25px 0 0;">Un abrazo,<br><strong>Valentina Galaz</strong>' +
    '<br>Escuela de Flautistas</p></div>' +
    '<div style="border-top:1px solid #D8D0C6;padding:15px 30px;' +
    'font:11px/1.6 Arial,sans-serif;color:#5F5A56;">' +
    'Mensaje relacionado exclusivamente con tu inscripción al programa.</div>' +
    '</div></body></html>';
}

function fpCorreoPago_(person, settings) {
  const price = FP_MAIL_PRICES[person.market];
  const triple = person.installments === "3";
  const subject = "Flautistas Protagonistas 2027 · " +
    (triple ? "Tu calendario de tres pagos" : "Datos para tu pago") +
    " · " + person.id;

  const modeText = triple ?
    "3 cuotas de " + price.three + " cada una (total " + price.total + ")" :
    "1 pago de " + price.one;
  const paymentText = settings.instructions;
  const intro = "Hola, " + person.firstName + ":\n\n" +
    "Recibimos tu inscripción a Flautistas Protagonistas 2027.\n\n" +
    "Modalidad elegida: " + modeText + ".\n";
  const commitment = triple ?
    "\nResponde este correo con las tres fechas en que te comprometes " +
    "a pagar (DD/MM/AAAA):\nPrimera cuota:\nSegunda cuota:\nTercera cuota:\n" +
    "Revisaré las fechas y te confirmaré el calendario.\n" : "";
  const conditions = "\nEl programa debe estar completamente abonado " +
    "antes del comienzo de las clases.\n" +
    "Datos de pago (" + person.market + " — " + settings.method + "):\n" +
    paymentText + "\n\nCuando realices un pago, responde a este correo " +
    "con el comprobante para verificarlo. La recepción de la inscripción " +
    "no garantiza por sí sola una plaza.\n\nUn abrazo,\nValentina Galaz" +
    "\nEscuela de Flautistas";
  const body = intro + commitment + conditions;

  const safeMode = fpEscaparHtml_(modeText);
  const datesHtml = triple ?
    '<p><strong>Responde este correo con las tres fechas de pago:</strong></p>' +
    '<p style="padding:15px;background:#F7F5F2;border-left:3px solid #E31C23;">' +
    'Primera cuota: DD/MM/AAAA<br>Segunda cuota: DD/MM/AAAA<br>' +
    'Tercera cuota: DD/MM/AAAA</p>' +
    '<p>Revisaré las fechas y te confirmaré el calendario.</p>' : "";

  const instructions = fpEscaparHtml_(paymentText).replace(/\r?\n/g, "<br>");
  const inside = '<p>Hola, ' + fpEscaparHtml_(person.firstName) + ':</p>' +
    '<p>Recibimos tu inscripción a <strong>Flautistas Protagonistas 2027</strong>.</p>' +
    '<div style="padding:19px;margin:19px 0;background:#F7F5F2;">' +
    '<div style="color:#E31C23;font:bold 11px Arial,sans-serif;' +
    'letter-spacing:1px;">MODALIDAD ELEGIDA</div>' +
    '<div style="font:500 21px/1.4 Georgia,serif;margin-top:9px;">' +
    safeMode + '</div></div>' + datesHtml +
    '<p><strong>El programa debe estar completamente abonado antes del ' +
    'comienzo de las clases.</strong></p>' +
    '<p><strong>Datos de pago · ' + fpEscaparHtml_(person.market) +
    ' · ' + fpEscaparHtml_(settings.method) + '</strong></p>' +
    '<p style="padding:15px;border:1px solid #D8D0C6;background:#FFFFFF;">' +
    instructions + '</p>' +
    '<p>Cuando realices un pago, responde a este correo con el comprobante ' +
    'para verificarlo.</p>' +
    '<p style="font-size:12px;color:#5F5A56;">Tu código de inscripción: ' +
    fpEscaparHtml_(person.id) +
    '. El registro inicial no garantiza por sí solo una plaza.</p>';

  return {subject:subject, body:body,
    htmlBody:fpCorreoPlantilla_("Tu inscripción y modalidad de pago", inside)};
}

function fpEnviarMail_(email, mail) {
  MailApp.sendEmail({
    to: email,
    subject: mail.subject,
    body: mail.body,
    htmlBody: mail.htmlBody,
    name: "Escuela de Flautistas",
    replyTo: FP_MAIL_REPLY_TO
  });
}

function fpCorreoLog_(spreadsheet, id, email, type, status, detail) {
  try {
    const log = spreadsheet.getSheetByName(FP_MAIL_HISTORY_SHEET);
    if (log) log.appendRow([
      new Date(), id, email, type, status, String(detail || "").slice(0, 400)
    ]);
  } catch (error) {
    console.error("No se pudo registrar el historial de correo: " + String(error));
  }
}

function fpCorreoRevisar_(sheet, row, message) {
  sheet.getRange(row, 18).setValue("Revisión requerida");
  sheet.getRange(row, 20).setValue(String(message).slice(0, 350));
}

function fpSincronizarPlanesCorreo_(book) {
  const registrations = book.getSheetByName(FP_SHEET_NAME);
  const plans = book.getSheetByName(FP_MAIL_PLAN_SHEET);
  if (!registrations || !plans) throw new Error("Faltan hojas de inscripciones/pagos.");
  if (registrations.getLastRow() <= 1) return;
  const existing = new Set(
    plans.getLastRow() > 1
      ? plans.getRange(2, 1, plans.getLastRow() - 1, 1)
        .getDisplayValues().map(function (r) { return String(r[0]).trim(); })
      : []
  );
  registrations.getRange(2, 1, registrations.getLastRow() - 1, 22)
    .getValues().forEach(function (row) {
      const id = String(row[1] || "").trim();
      const email = String(row[16] || "").trim();
      if (!id || existing.has(id) || !fpEmailValido_(email)) return;
      const cuotas = String(row[9] || "").trim();
      if (cuotas !== "1" && cuotas !== "3") return;
      plans.appendRow([
        id, email, String(row[4] || ""), cuotas, "", "", "", "No",
        "Pendiente", cuotas === "3" ? "Pendiente" : "No aplica",
        cuotas === "3" ? "Pendiente" : "No aplica",
        "", "", "", "", ""
      ]);
      existing.add(id);
    });
}

function fpEnviarCorreosIniciales_(book, configs, quota) {
  const sheet = book.getSheetByName(FP_SHEET_NAME);
  const last = sheet.getLastRow();
  if (last <= 1) return quota;
  const rows = sheet.getRange(2, 1, last - 1, 22).getValues();
  for (let i = 0; i < rows.length && quota > 0; i++) {
    const row = rows[i];
    const rowIndex = i + 2;
    const status = String(row[17] || "").trim();
    if (status && status !== "Pendiente") continue;

    const person = {
      id: String(row[1] || "").trim(),
      firstName: String(row[2] || "").trim(),
      market: String(row[4] || "").trim(),
      email: String(row[16] || "").trim().toLowerCase(),
      installments: String(row[9] || "").trim()
    };
    if (!person.id || !person.firstName ||
        !fpEmailValido_(person.email) ||
        !FP_MAIL_PRICES[person.market] ||
        (person.installments !== "1" && person.installments !== "3") ||
        String(row[14] || "") !== "Sí" ||
        String(row[8] || "") !== FP_MAIL_PRICES[person.market].currency) {
      fpCorreoRevisar_(sheet, rowIndex,
        "Falta dato, consentimiento o moneda coherente; revisar manualmente.");
      continue;
    }
    if (!fpCorreoDisponible_(person.market, configs)) continue;

    // La marca previa al envío evita reintentos automáticos de resultado incierto.
    sheet.getRange(rowIndex, 18).setValue("Enviando");
    sheet.getRange(rowIndex, 20).setValue("Intento iniciado; no reenviar sin comprobar.");
    SpreadsheetApp.flush();
    try {
      fpEnviarMail_(person.email, fpCorreoPago_(person, configs[person.market]));
      sheet.getRange(rowIndex, 18).setValue("Enviado");
      sheet.getRange(rowIndex, 19).setValue(new Date());
      sheet.getRange(rowIndex, 20).clearContent();
      fpCorreoLog_(book, person.id, person.email,
        "Inscripción y condiciones", "Enviado", person.market);
      quota--;
    } catch (error) {
      fpCorreoRevisar_(sheet, rowIndex,
        "Resultado incierto; comprobar Enviados antes de reintentar: " + String(error));
      fpCorreoLog_(book, person.id, person.email,
        "Inscripción y condiciones", "Error/revisión", String(error));
    }
  }
  return quota;
}

function fpFechaPagoDias_(value, today) {
  if (!(value instanceof Date) || isNaN(value.getTime())) return null;
  const start = Utilities.formatDate(value, FP_MAIL_TIMEZONE, "yyyy-MM-dd")
    .split("-").map(Number);
  const end = Utilities.formatDate(today, FP_MAIL_TIMEZONE, "yyyy-MM-dd")
    .split("-").map(Number);
  return Math.round(
    (Date.UTC(start[0], start[1] - 1, start[2]) -
      Date.UTC(end[0], end[1] - 1, end[2])) / 86400000
  );
}

function fpInicioClases_(book) {
  const config = book.getSheetByName(FP_MAIL_CONFIG_SHEET);
  if (!config) return null;
  const date = config.getRange(2, 6).getValue();
  return date instanceof Date && !isNaN(date.getTime()) ? date : null;
}

function fpCalendarioValido_(plan, startDate) {
  if (!startDate || !(startDate instanceof Date)) return false;
  const dates = [plan[4], plan[5], plan[6]];
  return dates.every(function (date) {
    return date instanceof Date && !isNaN(date.getTime());
  }) && dates[0].getTime() < dates[1].getTime() &&
    dates[1].getTime() < dates[2].getTime() &&
    dates[2].getTime() < startDate.getTime();
}

function fpConfirmarCalendarios_(book, quota) {
  const plans = book.getSheetByName(FP_MAIL_PLAN_SHEET);
  const enrollments = book.getSheetByName(FP_SHEET_NAME);
  const kickoff = fpInicioClases_(book);
  if (!plans || !enrollments || !kickoff ||
      plans.getLastRow() <= 1 || enrollments.getLastRow() <= 1) return quota;

  const paidRows = enrollments.getRange(2, 1,
    enrollments.getLastRow() - 1, 22).getValues();
  const eligible = new Set(paidRows.filter(function (r) {
    return String(r[17] || "") === "Enviado";
  }).map(function (r) { return String(r[1] || "").trim(); }));

  const rows = plans.getRange(2, 1, plans.getLastRow() - 1, 18).getValues();
  for (let i = 0; i < rows.length && quota > 0; i++) {
    const row = rows[i];
    const id = String(row[0] || "").trim();
    const email = String(row[1] || "").trim();
    const market = String(row[2] || "").trim();
    const approved = ["sí", "si", "aprobado"].includes(
      String(row[7] || "").trim().toLowerCase());
    if (!id || !eligible.has(id) || !fpEmailValido_(email) ||
        !FP_MAIL_PRICES[market] || String(row[3]) !== "3" ||
        !approved || row[16] || !fpCalendarioValido_(row, kickoff)) continue;

    const dates = [row[4], row[5], row[6]].map(function (date) {
      return Utilities.formatDate(date, FP_MAIL_TIMEZONE, "dd/MM/yyyy");
    });
    const price = FP_MAIL_PRICES[market];
    const textDates = "1. " + dates[0] + "\n2. " + dates[1] +
      "\n3. " + dates[2];
    const body = "Hola:\n\nConfirmamos tu calendario de tres pagos " +
      "para Flautistas Protagonistas 2027:\n\n" + textDates +
      "\n\nCada cuota: " + price.three + " (total: " + price.total + ")." +
      "\n\nTodos los pagos deben estar acreditados antes del inicio " +
      "de las clases. Conserva tus comprobantes y respóndenos " +
      "en este hilo después de cada transferencia.\n\n" +
      "Valentina Galaz\nEscuela de Flautistas";
    const html = "<p>Confirmamos las fechas de tus tres pagos:</p>" +
      '<p style="border-left:3px solid #E31C23;padding:14px;' +
      'background:#F7F5F2;">' + dates.map(function (d, j) {
        return "Cuota " + (j + 1) + ": <strong>" +
          fpEscaparHtml_(d) + "</strong>";
      }).join("<br>") + "</p>" +
      "<p>Valor de cada cuota: <strong>" +
      fpEscaparHtml_(price.three) + "</strong>. Total: " +
      fpEscaparHtml_(price.total) + ".</p>" +
      "<p><strong>El total debe estar abonado antes del comienzo " +
      "de las clases.</strong></p>" +
      "<p>Responde con el comprobante de cada pago para verificarlo.</p>";

    const cell = plans.getRange(i + 2, 17);
    cell.setValue("Enviando");
    SpreadsheetApp.flush();
    try {
      fpEnviarMail_(email, {
        subject: "Flautistas Protagonistas 2027 · Fechas aceptadas · " + id,
        body: body,
        htmlBody: fpCorreoPlantilla_("Calendario de pagos confirmado", html)
      });
      cell.setValue("Enviado");
      plans.getRange(i + 2, 18).setValue(new Date());
      fpCorreoLog_(book, id, email, "Calendario aprobado", "Enviado", "");
      quota--;
    } catch (error) {
      cell.setValue("Revisión requerida");
      fpCorreoLog_(book, id, email, "Calendario aprobado",
        "Error/revisión", String(error));
    }
  }
  return quota;
}

function fpRecordatoriosCuotas_(book, configs, quota) {
  const plans = book.getSheetByName(FP_MAIL_PLAN_SHEET);
  if (!plans || plans.getLastRow() <= 1) return quota;
  const rows = plans.getRange(2, 1, plans.getLastRow() - 1, 18).getValues();
  const kickoff = fpInicioClases_(book);
  if (!kickoff) return quota;
  const today = new Date();
  const enrollmentSheet = book.getSheetByName(FP_SHEET_NAME);
  const settled = new Set(enrollmentSheet && enrollmentSheet.getLastRow() > 1 ?
    enrollmentSheet.getRange(2, 1, enrollmentSheet.getLastRow() - 1, 12)
      .getValues().filter(function (r) {
        return String(r[11] || "").trim().toLowerCase() === "confirmado";
      }).map(function (r) { return String(r[1] || "").trim(); }) : []);
  for (let i = 0; i < rows.length && quota > 0; i++) {
    const row = rows[i];
    const id = String(row[0] || "").trim();
    const email = String(row[1] || "").trim();
    const market = String(row[2] || "").trim();
    if (!id || settled.has(id) || !fpEmailValido_(email) ||
        String(row[3]) !== "3" ||
        !["sí", "si", "aprobado"].includes(
          String(row[7] || "").trim().toLowerCase()) ||
        !fpCorreoDisponible_(market, configs) ||
        String(row[16] || "") !== "Enviado" ||
        !fpCalendarioValido_(row, kickoff)) continue;

    // Los vencimientos y pagos son revisados por la directora de la escuela.
    for (let j = 0; j < 3 && quota > 0; j++) {
      const paymentStatus = String(row[8 + j] || "").trim().toLowerCase();
      const reminderState = row[11 + j];
      const days = fpFechaPagoDias_(row[4 + j], today);
      if (["acreditado", "pagado"].includes(paymentStatus) ||
          reminderState || days === null || days < 0 || days > 2) continue;

      const price = FP_MAIL_PRICES[market];
      const amount = price && price.three;
      if (!amount) continue;
      const dateText = Utilities.formatDate(
        row[4 + j], FP_MAIL_TIMEZONE, "dd/MM/yyyy");
      const subject = "Flautistas Protagonistas 2027 · " +
        "Recordatorio cuota " + (j + 1) + " · " + id;
      const message = "Hola:\n\nTe recordamos que tu cuota " + (j + 1) +
        " de " + amount + " tiene fecha comprometida " + dateText +
        ".\n\n" + configs[market].method + ":\n" +
        configs[market].instructions +
        "\n\nResponde a este correo con el comprobante una vez " +
        "realizado el pago.\n\nValentina Galaz\nEscuela de Flautistas";
      const html = '<p>Tu cuota <strong>' + (j + 1) + " de 3</strong> (" +
        fpEscaparHtml_(amount) + ') vence el <strong>' +
        fpEscaparHtml_(dateText) + '</strong>.</p>' +
        '<p>Medio de pago: ' +
        fpEscaparHtml_(configs[market].method) + '</p><p>' +
        fpEscaparHtml_(configs[market].instructions)
          .replace(/\r?\n/g, "<br>") + '</p>' +
        '<p>Responde con el comprobante cuando realices el pago.</p>';

      const cell = plans.getRange(i + 2, 12 + j);
      cell.setValue("Enviando"); SpreadsheetApp.flush();
      try {
        fpEnviarMail_(email, {
          subject: subject,
          body: message,
          htmlBody: fpCorreoPlantilla_("Recordatorio de cuota", html)
        });
        cell.setValue(new Date());
        fpCorreoLog_(book, id, email, "Recordatorio cuota " + (j + 1),
          "Enviado", dateText);
        quota--;
      } catch (err) {
        cell.setValue("Revisión requerida");
        fpCorreoLog_(book, id, email, "Recordatorio cuota " + (j + 1),
          "Error/revisión", String(err));
      }
    }
  }
  return quota;
}

function fpConfirmacionesPagoCompleto_(book, quota) {
  const sheet = book.getSheetByName(FP_SHEET_NAME);
  const plans = book.getSheetByName(FP_MAIL_PLAN_SHEET);
  if (!sheet || !plans || sheet.getLastRow() <= 1) return quota;

  const planRows = plans.getLastRow() > 1 ?
    plans.getRange(2, 1, plans.getLastRow() - 1, 16).getValues() : [];
  const planById = {};
  planRows.forEach(function (row) { planById[String(row[0] || "")] = row; });
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 22).getValues();
  for (let i = 0; i < rows.length && quota > 0; i++) {
    const row = rows[i];
    const status = String(row[20] || "");
    if (status || String(row[11] || "").toLowerCase() !== "confirmado" ||
        String(row[17] || "") !== "Enviado") continue;

    const id = String(row[1] || "");
    const email = String(row[16] || "");
    if (!fpEmailValido_(email)) continue;
    const installments = String(row[9] || "");
    const plan = planById[id];
    if (installments === "3" &&
        (!plan || ![8, 9, 10].every(function (index) {
          return ["acreditado", "pagado"].includes(
            String(plan[index] || "").toLowerCase());
        }))) continue;
    if (installments !== "1" && installments !== "3") continue;

    const cell = sheet.getRange(i + 2, 21);
    cell.setValue("Enviando"); SpreadsheetApp.flush();
    const name = String(row[2] || "");
    const plain = "Hola, " + name + ":\n\nVerificamos la recepción " +
      "del pago completo de Flautistas Protagonistas 2027.\n\n" +
      "Te enviaremos por este medio los próximos pasos del programa.\n\n" +
      "Un abrazo,\nValentina Galaz\nEscuela de Flautistas";
    const html = '<p>Hola, ' + fpEscaparHtml_(name) + ':</p>' +
      '<p>Hemos verificado el <strong>pago completo</strong> de ' +
      'Flautistas Protagonistas 2027.</p>' +
      '<p>Te comunicaremos los próximos pasos por este medio.</p>';
    try {
      fpEnviarMail_(email, {
        subject:"Flautistas Protagonistas 2027 · Pago completo · " + id,
        body:plain,
        htmlBody:fpCorreoPlantilla_("Pago completo registrado", html)
      });
      cell.setValue("Enviado");
      sheet.getRange(i + 2, 22).setValue(new Date());
      fpCorreoLog_(book, id, email, "Pago completo", "Enviado", "");
      quota--;
    } catch (err) {
      cell.setValue("Revisión requerida");
      fpCorreoLog_(book, id, email, "Pago completo",
        "Error/revisión", String(err));
    }
  }
  return quota;
}

/** Función de ejecución periódica (15 minutos). */
function procesarCorreosFP2027() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return "Otro proceso ya está ejecutándose.";
  try {
    const book = SpreadsheetApp.openById(FP_SPREADSHEET_ID);
    const configs = fpCorreoConfiguracion_(book);
    fpSincronizarPlanesCorreo_(book);
    const quota = Math.min(FP_MAIL_MAX_PER_RUN,
      MailApp.getRemainingDailyQuota());
    let left = fpEnviarCorreosIniciales_(book, configs, quota);
    left = fpConfirmarCalendarios_(book, left);
    left = fpRecordatoriosCuotas_(book, configs, left);
    left = fpConfirmacionesPagoCompleto_(book, left);
    return "Correos procesados. Enviados: " + (quota - left) + ".";
  } finally {
    lock.releaseLock();
  }
}

/** Ejecutar manualmente UNA VEZ para autorizar MailApp y crear el disparador. */
function instalarCorreosFP2027() {
  const handler = "procesarCorreosFP2027";
  const exists = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === handler;
  });
  if (!exists) {
    ScriptApp.newTrigger(handler).timeBased().everyMinutes(15).create();
  }
  return "Disparador de correos FP2027: " +
    (exists ? "ya existía" : "creado") +
    ". Los envíos esperan datos de pago aprobados en la hoja de configuración.";
}

/** Diagnóstico sin enviar ningún mensaje. */
function probarConfiguracionCorreosFP2027() {
  const book = SpreadsheetApp.openById(FP_SPREADSHEET_ID);
  const configs = fpCorreoConfiguracion_(book);
  const result = {};
  ["Chile", "Argentina", "Otro país"].forEach(function (market) {
    result[market] = fpCorreoDisponible_(market, configs) ?
      "Listo para enviar" : "Pendiente: revisar instrucciones y habilitar";
  });
  result["Inicio de clases"] = fpInicioClases_(book) ?
    "Fecha configurada" : "Pendiente: definir la fecha para validar cuotas";
  Logger.log(JSON.stringify(result));
  return result;
}
