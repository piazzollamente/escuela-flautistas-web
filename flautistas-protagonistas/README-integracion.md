# Inscripciones — Flautistas Protagonistas 2027

Integración de la página estática \`/flautistas-protagonistas/\` con **Google Sheets + Apps Script + Twilio Verify (WhatsApp)**.

> **Estado:** código preparado, sin despliegue ni credenciales conectadas. La página no debe publicarse como formulario operativo hasta completar los pasos y probar el recorrido de extremo a extremo. La URL anterior de preinscripción no sirve para esta nueva hoja.

## Destino

Hoja nativa, independiente de la preinscripción:

- [Inscripciones — Flautistas Protagonistas 2027](https://docs.google.com/spreadsheets/d/19ODt7wTppY6FJsE7ZQsH-lqNTiGJv4Ll9RqOvp7a2dQ/edit)
- Pestaña de escritura: **Inscripciones web**
- Encabezados A:P: fecha de inscripción, ID, nombre, apellido, país, WhatsApp, verificado, fecha de verificación, moneda, cuotas, estado de inscripción, estado de pago, fecha de pago, origen, consentimiento, observaciones.

Se recogen preferencias, **no se cobran cuotas**. El estado inicial es \`Recibida / Pendiente\`, no \`Confirmada / Pagado\`.

## Activación del backend (requiere acceso de administradora)

1. Crear un proyecto **nuevo** de Google Apps Script desde la cuenta con acceso de edición a la hoja de destino. No reutilizar la aplicación de preinscripciones.
2. Copiar el contenido completo de [apps-script/Code.gs](./apps-script/Code.gs).
3. En **Configuración del proyecto → Propiedades de secuencia de comandos**, agregar:

   | Propiedad | Valor |
   |---|---|
   | \`SPREADSHEET_ID\` | \`19ODt7wTppY6FJsE7ZQsH-lqNTiGJv4Ll9RqOvp7a2dQ\` |
   | \`ALLOWED_ORIGIN\` | \`https://escueladeflautistas.cl\` |
   | \`TWILIO_ACCOUNT_SID\` | SID de cuenta Twilio |
   | \`TWILIO_AUTH_TOKEN\` | Token de autenticación Twilio |
   | \`TWILIO_VERIFY_SERVICE_SID\` | SID de un servicio Twilio Verify habilitado para WhatsApp |

4. En Twilio, configurar **Verify con canal WhatsApp**, verificar restricciones geográficas, plantillas habilitadas, condiciones de la cuenta y protección antifraude. La API requiere que los teléfonos estén en formato E.164. Esta integración tiene costes asociados al envío de códigos.
5. En Apps Script, **Implementar → Nueva implementación → Aplicación web**. Ejecutar como la cuenta propietaria, y conceder acceso según el modelo requerido para un formulario público (**Cualquier persona**, si está permitido por la cuenta). Autorizar Sheets y UrlFetchApp. Guardar la URL \`https://script.google.com/macros/s/…/exec\`.
6. En [index.html](./index.html), sustituir **solo** \`data-endpoint="#"\` en \`<form id="fpForm">\` por la URL real \`/exec\`. **No** guardar secretos ni credenciales en GitHub. El código público solo contiene la URL de invocación.
7. Probar envío real a un WhatsApp autorizado y verificar que se recibe el código; ingresar un código inválido; luego usar el código válido y confirmar que se añade **una sola fila** en la hoja **Inscripciones web**.
8. Validar el comportamiento en móvil, también en una ventana privada, y comprobar en Google Sheets que \`WhatsApp verificado = Verificado\`, \`Estado de inscripción = Recibida\`, \`Estado de pago = Pendiente\`. Eliminar los registros de prueba de forma controlada.
9. Comprobar que los formularios anteriores siguen escribiendo en la **hoja original** y no en esta. Solo después integrar este cambio en \`main\` y publicarlo.

## Comportamiento y seguridad

- El sitio usa el diseño original y un pequeño complemento [inscripcion.css](./inscripcion.css). La lógica reside en [inscripcion.js](./inscripcion.js).
- El número se valida estructuralmente en formato **E.164**, pero esto **no** acredita su titularidad. La verificación real es un código OTP entregado por el servicio Twilio Verify a través de WhatsApp.
- El servidor entrega un token temporal solo tras comprobar con Twilio que el código es válido. El token se usa una sola vez para registrar la inscripción y queda vinculado al WhatsApp.
- Los códigos OTP y los secretos de Twilio **no se guardan en Sheets** ni viajan por GitHub.
- El servidor impide registros duplicados por WhatsApp, valida moneda y cuotas, y protege las celdas frente a fórmulas inyectadas.
- La comunicación hacia Google Apps Script se hace por formulario POST a un iframe de respuesta; el navegador solo considera éxito cuando llega un mensaje con identificador de solicitud desde un dominio de Google confiable. **Una carga del iframe por sí sola no significa éxito.** Debe comprobarse el comportamiento real con el navegador y la política de iframes vigente de Apps Script.
- Se incorporó limitación básica de reenvíos; además deben habilitarse los controles de abuso y fraude de Twilio, ya que el punto de acceso es público.
- La hoja permanece privada. No compartirla con “cualquiera con el enlace”. Solo el Apps Script de la cuenta autorizada puede escribir usando los permisos delegados.

## Pruebas de aceptación

| Caso | Resultado esperado |
|---|---|
| Campos obligatorios vacíos | Navegador no permite enviar |
| WhatsApp sin código de país | Mensaje de validación |
| WhatsApp correcto, código pendiente | No se puede registrar |
| Código incorrecto | No se crea fila |
| Código correcto | Se desbloquea la inscripción |
| USD / ARS / CLP y 1 / 2 / 3 cuotas | Se guarda exactamente la elección |
| Consentimiento sin marcar | No se permite registrar |
| Inscripción confirmada por backend | Se crea una sola fila con estado Recibida / Pendiente |
| Reintento con WhatsApp ya registrado | No duplica la fila |
| Backend caído / respuesta no autenticada | Mensaje de error, **sin éxito falso** |
| Sin URL de Apps Script | Botones inactivos y explicación visible |
| Preinscripción 2026 previa | Continúa independiente, sin migración de sus datos |

## Alcance pendiente

Para activar esta integración hacen falta las credenciales de Twilio, desplegar el proyecto de Apps Script y validar que el puente por iframe funcione en el navegador publicado. No se puede afirmar que existan registros reales sin una prueba de extremo a extremo.

El consentimiento actual cubre el contacto sobre la inscripción. Antes de ponerlo en producción, revisar el texto y la información de privacidad, retención de datos, acceso interno y derechos aplicables a participantes de distintos países.

Documentación de referencia: [Twilio Verify API](https://www.twilio.com/docs/verify/api), [Verifications](https://www.twilio.com/docs/verify/api/verification), [Verification Check](https://www.twilio.com/docs/verify/api/verification-check), [Google Apps Script HtmlService iframe](https://developers.google.com/apps-script/reference/html/x-frame-options-mode).
