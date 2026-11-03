# Conexión de inscripciones a Google Sheets — Flautistas Protagonistas 2027

## Estado de integración

- **Aplicación Google Apps Script:** la administradora ejecutó `probarConexion()` y obtuvo «Conexión correcta con Inscripciones web. No se escribieron datos.»
- **URL de despliegue suministrada:** `https://script.google.com/macros/s/AKfycbwE1gLqw2rEew7G1RauCN00_Q-U7Qi154zT4nYVV9sz4j0snJUTdKDEL1rG68AYm4zJ/exec`.
- **Sitio web:** el formulario ahora utiliza esta URL mediante `data-endpoint`; deja de mostrar el mensaje técnico o la alternativa de preinscripción cuando se carga el JavaScript.
- **Prueba real de envío:** pendiente. La comprobación de acceso a la hoja **no** prueba por sí sola la recepción de una inscripción enviada desde el navegador.
- **Privacidad:** no se envían códigos a WhatsApp ni se comprueba la titularidad del número; los dos valores se comparan para evitar errores de escritura.
- **Estados iniciales:** `Recibida` para inscripción y `Pendiente` para pago. Elegir moneda o cuotas no procesa pagos.

### Prueba de extremo a extremo

1. Abrir [Flautistas Protagonistas 2027](https://escueladeflautistas.cl/flautistas-protagonistas/) en una ventana de incógnito y recargar para evitar caché.
2. Confirmar que se ve el formulario de inscripción y que no aparece ningún aviso sobre Google Sheets o configuración técnica.
3. Introducir un número de WhatsApp diferente en cada campo: el navegador debe bloquear el envío con un mensaje de discordancia.
4. Ingresar datos de **prueba claramente identificados**, una moneda y 1, 2 o 3 cuotas; aceptar el consentimiento y enviar.
5. Debe mostrarse un **código de registro** solo después del mensaje positivo del servidor.
6. Abrir la [hoja de inscripciones](https://docs.google.com/spreadsheets/d/19ODt7wTppY6FJsE7ZQsH-lqNTiGJv4Ll9RqOvp7a2dQ/edit), pestaña `Inscripciones web`. Confirmar que hay **una fila**, con el número normalizado, `Coinciden`, `No realizada`, moneda y cuotas correctas.
7. Eliminar cuidadosamente **solo el registro de prueba**. No modificar inscripciones reales.
8. Si aparece error o no se escribe la fila, comprobar la ejecución en Apps Script (**Ejecuciones**) y confirmar que la URL activa sigue siendo la implementación más reciente (`/exec`). Si se edita Code.gs después de implementarlo, se debe actualizar la versión de la implementación.


## Tarifas públicas de lanzamiento 2027

El módulo de precios integrado en la página usa importes comerciales **fijos**, sin conversión de divisas ni llamadas a servicios de cotización. Cambia por país o mercado y refleja la selección en la moneda del formulario.

| País / mercado | Pago único | 3 cuotas | Total 3 cuotas | 2 cuotas |
|---|---:|---:|---:|---|
| Chile (CLP) | 399.900 | 139.900 cada una | 419.700 | No definido |
| Argentina (ARS) | 399.000 | 139.900 cada una | 419.700 | No definido |
| Otros países (USD) | 419 | 147 cada una | 441 | No definido |

**Fuentes cotejadas:**

- [Flautistas Protagonistas 2027 — documento de trabajo](https://docs.google.com/document/d/1MqkeEdS9RS9hkMWw0CwAbykkKd7D-l667brhnkOufPw/edit), sección 9.2: CLP y USD.
- [Flautistas Protagonistas 2027 — dossier público](https://drive.google.com/file/d/142hHbwOIfBmINAMQIyIB3xh0HgQ4i4Lm/view): CLP y USD.
- [Flautistas Protagonistas 2027 — Argentina, 3 cuotas](https://drive.google.com/file/d/1GNqTMqkVymMYuYu_tOcVitrLejde9xzL/view): ARS.

La elección de 2 cuotas permanece disponible en el formulario **sin publicar ningún valor no aprobado**. Los importes del módulo no implican que haya un checkout activo, una plaza confirmada ni un pago realizado.

El anuncio principal ya no tiene cuenta regresiva. La página muestra **«INSCRIPCIONES ABIERTAS»** y no presenta condiciones especiales de estudiantes activos.

Código de precios: [precios.js](./precios.js) y [precios.css](./precios.css). Modificar los importes **solo** después de una decisión comercial confirmada, manteniendo actualizados los totales y esta tabla.

## Hoja de destino

[Inscripciones — Flautistas Protagonistas 2027](https://docs.google.com/spreadsheets/d/19ODt7wTppY6FJsE7ZQsH-lqNTiGJv4Ll9RqOvp7a2dQ/edit)

La pestaña que recibe los datos es **Inscripciones web**. No se modifica la hoja original de preinscripciones.

El servidor escribe:
- fecha e identificador de inscripción;
- nombre, apellido y país;
- el WhatsApp normalizado en formato `+código número` (solo una copia);
- **Confirmación WhatsApp = Coinciden** y **Verificación externa = No realizada**;
- moneda USD, ARS o CLP y 1, 2 o 3 cuotas;
- **Estado inscripción = Recibida**, **Estado pago = Pendiente**;
- origen y consentimiento.

El registro **no cobra cuotas ni garantiza cupos**.

## Actualización del despliegue

La URL /exec ya fue incorporada al sitio. Si la implementación cambia, actualizar el atributo `data-endpoint` en `index.html`, publicar el cambio y repetir la prueba anterior.

## Seguridad y experiencia

- Los datos enviados por el público se comprueban tanto en el navegador como en Apps Script.
- Se aplica un bloqueo de escritura para evitar duplicación simultánea, y se controla la repetición del número registrado.
- Se neutralizan las posibles fórmulas en texto libre que podría introducir un visitante.
- El servidor tiene acceso a la hoja privada mediante la autorización de la cuenta de despliegue; **no** es necesario hacer pública la hoja de Google Sheets.
- La verificación mediante doble escritura evita errores, pero **no acredita la titularidad del número**.
- Esta API pública puede ser objeto de spam; si el tráfico lo requiere, agregar medidas antiautomatización sin almacenar más datos de los necesarios.
- Revisar la información de privacidad antes de ofrecer la inscripción públicamente.

## Archivos

- [index.html](./index.html): página y formulario.
- [inscripcion.js](./inscripcion.js): validación de campos y envío.
- [inscripcion.css](./inscripcion.css): estilos editoriales del formulario.
- [apps-script/Code.gs](./apps-script/Code.gs): receptor para Google Sheets.
- [solicitar-informacion.html](./solicitar-informacion.html): alternativa de contacto que continúa usando el sistema anterior.
