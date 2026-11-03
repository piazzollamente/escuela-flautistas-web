/* Flautistas Protagonistas 2027 — tarifas comerciales fijas por mercado.
   Fuentes: documento de trabajo FP2027 (sección 9.2), dossier general
   FP2027 y dossier Argentina — 3 cuotas. No se aplican tipos de cambio.
   Los precios de 2 cuotas NO están definidos en las fuentes. */
(function () {
  "use strict";

  const prices = Object.freeze({
    CL: Object.freeze({
      code: "CLP",
      name: "Chile · Pesos chilenos",
      currencyOption: "CLP — pesos chilenos",
      one: 399900,
      threeEach: 139900,
      threeTotal: 419700
    }),
    AR: Object.freeze({
      code: "ARS",
      name: "Argentina · Pesos argentinos",
      currencyOption: "ARS — pesos argentinos",
      one: 399000,
      threeEach: 139900,
      threeTotal: 419700
    }),
    INTL: Object.freeze({
      code: "USD",
      name: "Pago internacional · Dólares estadounidenses",
      currencyOption: "USD — dólares",
      one: 419,
      threeEach: 147,
      threeTotal: 441
    })
  });

  const region = document.getElementById("precioPais");
  const panel = document.getElementById("preciosPanel");
  const summary = document.getElementById("precioContexto");
  const onePrice = document.getElementById("precioUnPago");
  const threePrice = document.getElementById("precioTresCuotas");
  const threeTotal = document.getElementById("precioTotalCuotas");
  const oneChoice = document.getElementById("precioElegirUno");
  const threeChoice = document.getElementById("precioElegirTres");
  const twoChoice = document.getElementById("precioElegirDos");
  const countryField = document.getElementById("pais");
  const currencyField = document.getElementById("moneda");
  const installmentsField = document.getElementById("cuotas");
  const formSection = document.getElementById("inscripcion-heading");

  if (!region || !panel || !onePrice || !threePrice || !threeTotal) return;

  function formatPrice(amount, code) {
    const locale = code === "ARS" ? "es-AR" : code === "USD" ? "en-US" : "es-CL";
    const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
    return code === "USD" ? "USD " + number : code + " $" + number;
  }

  function groupForCountry(country) {
    const normalized = String(country || "").trim().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (!normalized) return "";
    if (normalized === "chile") return "CL";
    if (normalized === "argentina") return "AR";
    return "INTL";
  }

  function groupForCurrency(value) {
    if (value === "CLP — pesos chilenos") return "CL";
    if (value === "ARS — pesos argentinos") return "AR";
    if (value === "USD — dólares") return "INTL";
    return "";
  }

  function showPrices() {
    const market = prices[region.value];
    panel.hidden = !market;
    if (!market) {
      summary.textContent = "Selecciona el país desde el que te inscribes para conocer la inversión.";
      return;
    }

    summary.textContent = market.name;
    onePrice.textContent = formatPrice(market.one, market.code);
    threePrice.textContent = "3 × " + formatPrice(market.threeEach, market.code);
    threeTotal.textContent = "Total: " + formatPrice(market.threeTotal, market.code);
    updateChoice();
  }

  function updateChoice() {
    const choice = installmentsField ? installmentsField.value : "";
    [[oneChoice, "1"], [threeChoice, "3"], [twoChoice, "2"]].forEach(function (pair) {
      if (!pair[0]) return;
      pair[0].setAttribute("aria-pressed", choice === pair[1] ? "true" : "false");
    });
  }

  function chooseInstallments(count) {
    if (installmentsField) {
      installmentsField.value = String(count);
      installmentsField.dispatchEvent(new Event("change", { bubbles: true }));
    }
    updateChoice();
    if (formSection) formSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // La consulta de precios adapta la moneda propuesta, sin modificar el estado
  // de pago. El formulario y Apps Script solo guardan preferencias de pago.
  region.addEventListener("change", function () {
    const selected = prices[region.value];
    if (!selected) {
      showPrices();
      return;
    }

    if (currencyField) currencyField.value = selected.currencyOption;
    if (countryField) {
      const currentGroup = groupForCountry(countryField.value);
      if (region.value === "CL") countryField.value = "Chile";
      else if (region.value === "AR") countryField.value = "Argentina";
      else if (currentGroup === "CL" || currentGroup === "AR") countryField.value = "";
    }
    showPrices();
  });

  // Si la persona empieza por el formulario, el módulo de precios también cambia.
  if (countryField) {
    countryField.addEventListener("change", function () {
      const group = groupForCountry(countryField.value);
      if (!group) return;
      region.value = group;
      if (currencyField) currencyField.value = prices[group].currencyOption;
      showPrices();
    });
    countryField.addEventListener("input", function () {
      const group = groupForCountry(countryField.value);
      if (!group) return;
      region.value = group;
      if (currencyField) currencyField.value = prices[group].currencyOption;
      showPrices();
    });
  }

  if (currencyField) {
    currencyField.addEventListener("change", function () {
      const group = groupForCurrency(currencyField.value);
      if (!group) return;
      region.value = group;
      showPrices();
    });
  }

  if (installmentsField) {
    installmentsField.addEventListener("change", updateChoice);
  }

  if (oneChoice) oneChoice.addEventListener("click", function () { chooseInstallments(1); });
  if (threeChoice) threeChoice.addEventListener("click", function () { chooseInstallments(3); });
  if (twoChoice) twoChoice.addEventListener("click", function () { chooseInstallments(2); });

  // Evitar asumir país de residencia a partir de la geolocalización o del idioma.
  const initialGroup = groupForCountry(countryField && countryField.value) ||
    groupForCurrency(currencyField && currencyField.value);
  if (initialGroup) region.value = initialGroup;
  showPrices();
})();
