/* Vista previa del pago, opcional y desacoplada del registro en Sheets.
   Los importes aprobados permanecen SIEMPRE visibles en HTML,
   incluso si este archivo no llega a cargar. */
(function () {
  "use strict";

  const country = document.getElementById("pais");
  const currency = document.getElementById("moneda");
  const installments = document.getElementById("cuotas");
  const preview = document.getElementById("vistaPagoActual");
  if (!country || !currency || !installments || !preview) return;

  const prices = Object.freeze({
    CL: Object.freeze({ code: "CLP", one: 399900, threeEach: 139900, total: 419700, name: "Chile" }),
    AR: Object.freeze({ code: "ARS", one: 399000, threeEach: 139900, total: 419700, name: "Argentina" }),
    USD: Object.freeze({ code: "USD", one: 419, threeEach: 147, total: 441, name: "pago internacional" })
  });

  function normalize(value) {
    return String(value || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  const countryOptions = new Set(Array.from(
    document.querySelectorAll("#fp-paises option"),
    function (o) { return normalize(o.value); }
  ));

  function marketFromCountry(value, partial) {
    const normalized = normalize(value);
    if (!normalized) return "";
    if (normalized === "chile") return "CL";
    if (normalized === "argentina") return "AR";
    if (partial && !countryOptions.has(normalized)) return "";
    return "USD";
  }

  function marketFromCurrency(value) {
    if (value === "CLP — pesos chilenos") return "CL";
    if (value === "ARS — pesos argentinos") return "AR";
    if (value === "USD — dólares") return "USD";
    return "";
  }

  function formatted(value, code) {
    const locale = code === "ARS" ? "es-AR" : code === "USD" ? "en-US" : "es-CL";
    const digits = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
    return code === "USD" ? "USD " + digits : code + " $" + digits;
  }

  function render(partial) {
    const sourceCountry = marketFromCountry(country.value, partial);
    const sourceCurrency = marketFromCurrency(currency.value);
    const current = prices[sourceCurrency || sourceCountry];
    const count = installments.value;

    if (!sourceCountry && !sourceCurrency) {
      preview.textContent = "Selecciona tu país de residencia y elige 1 pago o 3 cuotas para consultar el importe.";
      return;
    }
    if (!current) return;
    if (count === "1") {
      preview.textContent = "1 pago: " + formatted(current.one, current.code) + " en total.";
      return;
    }
    if (count === "3") {
      preview.textContent = "3 cuotas de " + formatted(current.threeEach, current.code) +
        " cada una · Total: " + formatted(current.total, current.code) + ".";
      return;
    }
    preview.textContent = "Para " + current.name + ": 1 pago de " +
      formatted(current.one, current.code) + " o 3 cuotas de " +
      formatted(current.threeEach, current.code) + " cada una.";
  }

  country.addEventListener("input", function () { render(true); });
  country.addEventListener("change", function () { render(false); });
  country.addEventListener("blur", function () { render(false); });
  currency.addEventListener("change", function () { render(false); });
  installments.addEventListener("change", function () { render(false); });

  render(false);
})();