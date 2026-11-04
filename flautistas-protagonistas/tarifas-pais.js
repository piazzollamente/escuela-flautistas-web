/* País primero, tarifas de lanzamiento fijas y 1, 2 o 3 cuotas.
   Esta vista es informativa: no procesa pagos y no modifica Apps Script. */
(function () {
  "use strict";

  const country = document.getElementById("pais");
  const panel = document.getElementById("tarifasPorPais");
  const marketLabel = document.getElementById("precioMercado");
  const singlePrice = document.getElementById("precioUnPago");
  const doublePrice = document.getElementById("precioDosCuotas");
  const doubleTotal = document.getElementById("precioTotalDosCuotas");
  const triplePrice = document.getElementById("precioTresCuotas");
  const tripleTotal = document.getElementById("precioTotalCuotas");
  const currency = document.getElementById("moneda");
  const installments = document.getElementById("cuotas");
  const radios = Array.from(document.querySelectorAll('input[name="modalidad"]'));

  if (!country || !panel || !marketLabel || !singlePrice || !doublePrice ||
      !doubleTotal || !triplePrice || !tripleTotal || !currency ||
      !installments || radios.length !== 3) return;

  const tariffs = Object.freeze({
    "Chile": Object.freeze({
      market: "Chile · Pesos chilenos", currency: "CLP — pesos chilenos",
      one: "CLP $399.900", two: "CLP $209.850",
      three: "CLP $139.900", total: "CLP $419.700"
    }),
    "Argentina": Object.freeze({
      market: "Argentina · Pesos argentinos", currency: "ARS — pesos argentinos",
      one: "ARS $399.000", two: "ARS $209.850",
      three: "ARS $139.900", total: "ARS $419.700"
    }),
    "Otro país": Object.freeze({
      market: "Otros países · Dólares", currency: "USD — dólares",
      one: "USD 419", two: "USD 220,50",
      three: "USD 147", total: "USD 441"
    })
  });

  function updateTariffs() {
    const selected = tariffs[country.value];
    panel.hidden = !selected;
    if (!selected) {
      currency.value = "";
      installments.value = "";
      return;
    }

    marketLabel.textContent = selected.market;
    singlePrice.textContent = selected.one;
    doublePrice.textContent = selected.two;
    doubleTotal.textContent = "Cada cuota · Total: " + selected.total;
    triplePrice.textContent = selected.three;
    tripleTotal.textContent = "Cada cuota · Total: " + selected.total;
    currency.value = selected.currency;
    updateInstallments();
  }

  function updateInstallments() {
    const checked = radios.find(function (radio) { return radio.checked; });
    installments.value = checked ? checked.value : "";
  }

  country.addEventListener("change", updateTariffs);
  radios.forEach(function (radio) {
    radio.addEventListener("change", updateInstallments);
  });

  // El navegador puede restaurar el formulario tras retroceder en el historial.
  window.addEventListener("pageshow", updateTariffs);
  updateTariffs();
})();
