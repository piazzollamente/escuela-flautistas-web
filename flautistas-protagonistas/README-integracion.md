# Conexión de inscripciones a Google Sheets — Flautistas Protagonistas 2027

## Estado de integración

- **Aplicación Google Apps Script:** la administradora ejecutó `probarConexion()` y obtuvo «Conexión correcta con Inscripciones web. No se escribieron datos.»
- **URL de despliegue suministrada:** `https://script.google.com/macros/s/AKfycbwE1gLqw2rEew7G1RauCN00_Q-U7Qi154zT4nYVV9sz4j0snJUTdKDEL1rG68AYm4zJ/exec`.
- **Sitio web:** el formulario apunta a esta URL mediante `data-endpoint`; ahora solo se habilita cuando el servidor confirma que puede conservar el correo electrónico (`email-v2`). Si el despliegue está desactualizado, la página muestra temporalmente la alternativa de contacto.
- **Prueba real de envío:** pendiente. La comprobación de acceso a la hoja **no** prueba por sí sola la recepción de una inscripción enviada desde el navegador.
- **Privacidad:** no se envían códigos a WhatsApp ni se comprueba la titularidad del número; los dos valores se comparan para evitar errores de escritura.
- **Estados iniciales:** `Recibida` para inscripción y `Pendiente` para pago. Elegir moneda o cuotas no procesa pagos.

### Prueba de extremo a extremo

1. Abrir [Flautistas Protagonistas 2027](https://escueladeflautistas.cl/flautistas-protagonistas/) en una ventana de incógnito y recargar para evitar caché.
2. Confirmar que se ve el formulario de inscripción y que no aparece ningún aviso sobre Google Sheets o configuración técnica.
3. Introducir un número de WhatsApp diferente en cada campo: el navegador debe bloquear el envío con un mensaje de discordancia.
4. Seleccionar Chile, Argentina u Otro país, elegir 1 pago o 3 cuotas e ingresar datos de **prueba claramente identificados**, incluido un **correo electrónico de prueba**; aceptar el consentimiento y enviar.
5. Debe mostrarse un **código de registro** solo después del mensaje positivo del servidor.
6. Abrir la [hoja de inscripciones](https://docs.google.com/spreadsheets/d/19ODt7wTppY6FJsE7ZQsH-lqNTiGJv4Ll9RqOvp7a2dQ/edit), pestaña `Inscripciones web`. Confirmar que hay **una fila**, con el número normalizado, `Coinciden`, `No realizada`, moneda y cuotas correctas y el email en la columna **Q**.
7. Eliminar cuidadosamente **solo el registro de prueba**. No modificar inscripciones reales.
8. Si aparece error o no se escribe la fila, comprobar la ejecución en Apps Script (**Ejecuciones**) y confirmar que la URL activa sigue siendo la implementación más reciente (`/exec`). Si se edita Code.gs después de implementarlo, se debe actualizar la versión de la implementación.


## Tarifas públicas de lanzamiento 2027

**Flujo visible:** país de residencia (Chile, Argentina u Otro país) → dos tarjetas de precios (**1 pago** o **3 cuotas**) → nombre, apellido, correo electrónico, doble WhatsApp y consentimiento → registro.

No existen tablas de precios adicionales, un segundo selector de moneda ni resúmenes duplicados. La tarjeta elegida determina la cantidad de cuotas; el país determina automáticamente la moneda enviada al receptor de Google Sheets. Los importes se muestran solamente después de seleccionar el país. El código que realiza esta correspondencia es [tarifas-pais.js](./tarifas-pais.js).

| País / mercado | 1 pago | 3 cuotas (importe de cada cuota) | Total con 3 cuotas |
|---|---:|---:|---:|
| Chile (CLP) | 399.900 | 139.900 | 419.700 |
| Argentina (ARS) | 399.000 | 139.900 | 419.700 |
| Otro país (USD) | 419 | 147 | 441 |

**Fuentes cotejadas:**
- [Documento de trabajo FP2027](https://docs.google.com/document/d/1MqkeEdS9RS9hkMWw0CwAbykkKd7D-l667brhnkOufPw/edit), sección 9.2: CLP y USD.
- [Dossier público FP2027](https://drive.google.com/file/d/142hHbwOIfBmINAMQIyIB3xh0HgQ4i4Lm/view): CLP y USD.
- [Dossier Argentina — 3 cuotas](https://drive.google.com/file/d/1GNqTMqkVymMYuYu_tOcVitrLejde9xzL/view): ARS.

**Datos transmitidos:** el formulario envía la opción de país escogida, nombre, apellido, **correo electrónico**, WhatsApp, la moneda determinada para ese mercado y **1** o **3** como cantidad de cuotas. No envía importes monetarios ni procesa pagos. El backend mantiene los mismos nombres de parámetros y la URL `/exec` existente.

## Hoja de destino

[Inscripciones — Flautistas Protagonistas 2027](https://docs.google.com/spreadsheets/d/19ODt7wTppY6FJsE7ZQsH-lqNTiGJv4Ll9RqOvp7a2dQ/edit)

La pestaña que recibe los datos es **Inscripciones web**. No se modifica la hoja original de preinscripciones.

El servidor escribe:
- fecha e identificador de inscripción;
- nombre, apellido y país;
- correo electrónico (columna **Q**, tras las 16 columnas originales, sin reordenarlas);
- el WhatsApp normalizado en formato `+código número` (solo una copia);
- **Confirmación WhatsApp = Coinciden** y **Verificación externa = No realizada**;
- moneda USD, ARS o CLP y 1 o 3 cuotas;
- **Estado inscripción = Recibida**, **Estado pago = Pendiente**;
- origen y consentimiento.

El registro **no cobra cuotas ni garantiza cupos**.

## Activación del campo correo electrónico

La hoja [Inscripciones web](https://docs.google.com/spreadsheets/d/19ODt7wTppY6FJsE7ZQsH-lqNTiGJv4Ll9RqOvp7a2dQ/edit) ya tiene creada la columna **Q · Correo electrónico**. El código actualizado de este repositorio valida y escribe el campo `correo` como valor 17, sin alterar A:P.

**Paso manual obligatorio:** la propietaria debe abrir el proyecto **Inscripciones Flautistas Protagonistas 2027** en Google Apps Script, reemplazar el contenido de `Code.gs` por el archivo [apps-script/Code.gs](./apps-script/Code.gs), guardar, ejecutar `probarConexion()` y actualizar la implementación de aplicación web mediante **Implementar → Gestionar implementaciones → Editar → Versión: Nueva versión → Implementar**. Se mantiene la misma URL `/exec` si se edita la implementación existente.

**Control contra pérdida de datos:** la web pide al servidor una confirmación `email-v2` mediante `doGet(?accion=comprobar_correo&token=...)`. Hasta que responda la nueva versión, el formulario permanece oculto y se ofrece la alternativa de solicitud de información. No se debe aceptar como válida una inscripción cuyo correo no esté almacenado. La respuesta de `doPost` ahora incluye `emailCaptured: true`.

**Prueba final:** abrir la página desde navegador privado, comprobar que aparece correo electrónico obligatorio, enviar una inscripción de prueba, verificar email en la misma fila Q, y retirar únicamente la fila de prueba. **Ningún correo automático se envía todavía**; esta actualización solo incorpora la captura y el almacenamiento del email.

## Seguridad y experiencia

- Los datos enviados por el público, incluido el formato del email, se comprueban tanto en el navegador como en Apps Script.
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
- [precios.css](./precios.css): estilos responsivos de las dos tarjetas de tarifas.
- [tarifas-pais.js](./tarifas-pais.js): asociación de país, moneda y cantidad de cuotas.
- [apps-script/Code.gs](./apps-script/Code.gs): receptor para Google Sheets.
- [solicitar-informacion.html](./solicitar-informacion.html): alternativa de contacto que continúa usando el sistema anterior.
