/* Flautistas Protagonistas 2027 — precio dentro del formulario tras país.
   Tarifas comerciales fijas del documento maestro y dossier de Argentina.
   No usar conversión monetaria automática; 2 cuotas no tiene cifra definida. */
(function () {
  "use strict";

  const markets = Object.freeze({
    CL: Object.freeze({code:"CLP", name:"Chile · Pesos chilenos",
      option:"CLP — pesos chilenos", one:399900, threeEach:139900, threeTotal:419700}),
    AR: Object.freeze({code:"ARS", name:"Argentina · Pesos argentinos",
      option:"ARS — pesos argentinos", one:399000, threeEach:139900, threeTotal:419700}),
    INTL: Object.freeze({code:"USD", name:"Pago internacional · Dólares estadounidenses",
      option:"USD — dólares", one:419, threeEach:147, threeTotal:441})
  });

  const country = document.getElementById("pais");
  const currency = document.getElementById("moneda");
  const installments = document.getElementById("cuotas");
  const panel = document.getElementById("preciosPanel");
  const context = document.getElementById("precioContexto");
  const one = document.getElementById("precioUnPago");
  const three = document.getElementById("precioTresCuotas");
  const threeTotal = document.getElementById("precioTotalCuotas");
  const payOne = document.getElementById("precioElegirUno");
  const payThree = document.getElementById("precioElegirTres");
  const payTwo = document.getElementById("precioElegirDos");

  if (!country || !currency || !installments || !panel || !context ||
      !one || !three || !threeTotal) return;

  function normalize(value) {
    return String(value || "").trim().normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function countryMarket(value) {
    const text = normalize(value);
    if (!text) return "";
    if (text === "chile") return "CL";
    if (text === "argentina") return "AR";
    return "INTL";
  }

  function currencyMarket(value) {
    for (const key of Object.keys(markets)) {
      if (markets[key].option === value) return key;
    }
    return "";
  }

  function format(amount, code) {
    const locale = code === "ARS" ? "es-AR" : code === "USD" ? "en-US" : "es-CL";
    const digits = new Intl.NumberFormat(locale, {maximumFractionDigits:0}).format(amount);
    return code === "USD" ? "USD " + digits : code + " $" + digits;
  }

  function updateButtons() {
    const chosen = installments.value;
    [[payOne, "1"], [payThree, "3"], [payTwo, "2"]].forEach(function (entry) {
      if (entry[0]) entry[0].setAttribute("aria-pressed", String(chosen === entry[1]));
    });
  }

  function showMarket(key) {
    const market = markets[key];
    panel.hidden = !market;
    if (!market) {
      context.textContent = "Completa tu país de residencia para ver las modalidades y precios.";
      updateButtons();
      return;
    }
    context.textContent = market.name;
    one.textContent = format(market.one, market.code);
    three.textContent = "3 × " + format(market.threeEach, market.code);
    threeTotal.textContent = "Total: " + format(market.threeTotal, market.code);
    updateButtons();
  }

  function syncCountry() {
    const marketKey = countryMarket(country.value);
    if (!marketKey) {
      currency.value = "";
      showMarket("");
      return;
    }
    currency.value = markets[marketKey].option;
    showMarket(marketKey);
  }

  // Cuando el país se elige del listado se puede actualizar al instante.
  // Para países escritos libremente se muestra al terminar el campo (change).
  const listedCountries = new Set(Array.from(
    document.querySelectorAll("#fp-paises option"),
    function (option) { return normalize(option.value); }
  ));

  country.addEventListener("input", function () {
    const typed = normalize(country.value);
    if (!typed) {
      syncCountry();
    } else if (listedCountries.has(typed) || typed === "chile" || typed === "argentina") {
      syncCountry();
    } else {
      // No inferir "pago internacional" a partir de una palabra a medio escribir.
      currency.value = "";
      panel.hidden = true;
      context.textContent = "Termina de indicar tu país para consultar los precios.";
    }
  });
  country.addEventListener("change", syncCountry);
  country.addEventListener("blur", function () {
    if (country.value.trim()) syncCountry();
  });

  // El país preselecciona la moneda. Si se cambia manualmente, el importe
  // mostrado se ajusta a la nueva moneda para evitar incoherencias de pago.
  currency.addEventListener("change", function () {
    const key = currencyMarket(currency.value);
    if (country.value.trim() && key) showMarket(key);
  });

  installments.addEventListener("change", updateButtons);
  function choose(count) {
    installments.value = String(count);
    installments.dispatchEvent(new Event("change", {bubbles:true}));
    updateButtons();
  }
  if (payOne) payOne.addEventListener("click", function () { choose(1); });
  if (payThree) payThree.addEventListener("click", function () { choose(3); });
  if (payTwo) payTwo.addEventListener("click", function () { choose(2); });

  if (country.value.trim()) syncCountry();
  else showMarket("");
})();