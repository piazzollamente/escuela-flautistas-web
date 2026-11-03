/* Flautistas Protagonistas 2027 · importes comerciales FIJOS.
   Fuente: documento maestro 9.2 y dossier Argentina — 3 cuotas.
   Solo se ofrecen las modalidades documentadas: 1 cuota o 3 cuotas.
   No se aplican tipos de cambio y este módulo no procesa pagos. */
(function () {
  "use strict";

  const markets = Object.freeze({
    CL: Object.freeze({ code: "CLP", name: "Chile · Pesos chilenos",
      option: "CLP — pesos chilenos", one: 399900, threeEach: 139900, threeTotal: 419700 }),
    AR: Object.freeze({ code: "ARS", name: "Argentina · Pesos argentinos",
      option: "ARS — pesos argentinos", one: 399000, threeEach: 139900, threeTotal: 419700 }),
    INTL: Object.freeze({ code: "USD", name: "Pago internacional · Dólares estadounidenses",
      option: "USD — dólares", one: 419, threeEach: 147, threeTotal: 441 })
  });

  const country = document.getElementById("pais");
  const currency = document.getElementById("moneda");
  const installments = document.getElementById("cuotas");
  const section = document.getElementById("precioSeccion");
  const panel = document.getElementById("preciosPanel");
  const context = document.getElementById("precioContexto");
  const one = document.getElementById("precioUnPago");
  const three = document.getElementById("precioTresCuotas");
  const threeTotal = document.getElementById("precioTotalCuotas");
  const payOne = document.getElementById("precioElegirUno");
  const payThree = document.getElementById("precioElegirTres");
  const oneOption = document.getElementById("cuotaUnoOption");
  const threeOption = document.getElementById("cuotaTresOption");
  const paymentSummary = document.getElementById("cuotasMonto");

  if (!country || !currency || !installments || !section || !panel || !context ||
      !one || !three || !threeTotal || !oneOption || !threeOption || !paymentSummary) return;

  let activeMarket = "";

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
    return Object.keys(markets).find(function (key) {
      return markets[key].option === value;
    }) || "";
  }

  function format(amount, code) {
    const locale = code === "ARS" ? "es-AR" : code === "USD" ? "en-US" : "es-CL";
    const digits = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
    return code === "USD" ? "USD " + digits : code + " $" + digits;
  }

  function updateChoice() {
    const count = installments.value;
    if (count !== "1" && count !== "3" && count !== "") {
      installments.value = "";
    }

    if (payOne) payOne.setAttribute("aria-pressed", String(installments.value === "1"));
    if (payThree) payThree.setAttribute("aria-pressed", String(installments.value === "3"));

    const market = markets[activeMarket];
    if (!market) {
      paymentSummary.textContent = "Indica tu país de residencia para ver el monto de 1 o 3 cuotas.";
      return;
    }

    if (installments.value === "1") {
      paymentSummary.textContent = "1 cuota: " + format(market.one, market.code) + " en total.";
    } else if (installments.value === "3") {
      paymentSummary.textContent = "3 cuotas de " + format(market.threeEach, market.code) +
        " cada una. Total: " + format(market.threeTotal, market.code) + ".";
    } else {
      paymentSummary.textContent = "Selecciona 1 cuota o 3 cuotas para continuar.";
    }
  }

  function showMarket(key) {
    const market = markets[key];
    activeMarket = market ? key : "";
    section.hidden = !market;
    panel.hidden = !market;

    if (!market) {
      context.textContent = "Completa tu país de residencia para ver los precios.";
      oneOption.textContent = "1 cuota — indica tu país para ver el monto";
      threeOption.textContent = "3 cuotas — indica tu país para ver el monto";
      updateChoice();
      return;
    }

    const oneAmount = format(market.one, market.code);
    const threeAmount = format(market.threeEach, market.code);
    const totalAmount = format(market.threeTotal, market.code);
    context.textContent = market.name;
    one.textContent = oneAmount;
    three.textContent = "3 × " + threeAmount;
    threeTotal.textContent = "Total: " + totalAmount;

    // El select del formulario muestra montos concretos, no solo "1" o "3".
    oneOption.textContent = "1 cuota — " + oneAmount;
    threeOption.textContent = "3 cuotas — " + threeAmount + " cada una (total " + totalAmount + ")";
    updateChoice();
  }

  function syncCountry() {
    const key = countryMarket(country.value);
    if (!key) {
      currency.value = "";
      showMarket("");
      return;
    }
    currency.value = markets[key].option;
    showMarket(key);
  }

  const listedCountries = new Set(Array.from(
    document.querySelectorAll("#fp-paises option"),
    function (option) { return normalize(option.value); }
  ));

  country.addEventListener("input", function () {
    const typed = normalize(country.value);
    if (!typed || listedCountries.has(typed)) {
      syncCountry();
    } else {
      // Espera a que se complete un país escrito libremente.
      currency.value = "";
      activeMarket = "";
      section.hidden = true;
      panel.hidden = true;
      oneOption.textContent = "1 cuota — indica tu país para ver el monto";
      threeOption.textContent = "3 cuotas — indica tu país para ver el monto";
      updateChoice();
    }
  });
  country.addEventListener("change", syncCountry);
  country.addEventListener("blur", function () {
    if (country.value.trim()) syncCountry();
  });

  // Si se elige otra moneda, actualizar los importes en las tarjetas y en el select.
  currency.addEventListener("change", function () {
    const key = currencyMarket(currency.value);
    if (country.value.trim() && key) showMarket(key);
  });

  installments.addEventListener("change", updateChoice);
  function choose(count) {
    installments.value = count;
    installments.dispatchEvent(new Event("change", { bubbles: true }));
    updateChoice();
  }
  if (payOne) payOne.addEventListener("click", function () { choose("1"); });
  if (payThree) payThree.addEventListener("click", function () { choose("3"); });

  if (country.value.trim()) syncCountry();
  else showMarket("");
})();