# Conexión de inscripciones a Google Sheets — Flautistas Protagonistas 2027

## Estado verificado

- La página está diseñada con el branding de Escuela de Flautistas y valida que el WhatsApp se escriba dos veces.
- El receptor de Google Apps Script ya está programado en [apps-script/Code.gs](./apps-script/Code.gs), vinculado a la hoja de destino sin necesidad de introducir IDs ni propiedades.
- Se ha comprobado con pruebas simuladas el guardado de las 16 columnas, coincidencia de números, consentimiento, moneda, cuotas y prevención de registros duplicados.
- **La aplicación de Apps Script todavía no está implementada en la cuenta de Google.** La nueva hoja **no recibe inscripciones** hasta realizar los pasos de activación.
- Hasta activar la conexión, la página oculta el formulario inoperante y muestra un CTA editorial hacia el formulario de solicitud de información que ya existía. No aparecen avisos técnicos.

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

## Activación desde la cuenta de Google

El paso de autorización y despliegue debe ejecutarse en una sesión de Google con permisos de edición sobre la hoja. Esta operación no está disponible mediante el conector de Google Drive utilizado para preparar los archivos.

1. Abrir la [hoja de inscripciones](https://docs.google.com/spreadsheets/d/19ODt7wTppY6FJsE7ZQsH-lqNTiGJv4Ll9RqOvp7a2dQ/edit) desde una computadora y seleccionar **Extensiones → Apps Script**.
2. En el archivo `Código.gs`, eliminar el código de ejemplo y pegar **todo** el contenido del archivo [apps-script/Code.gs](./apps-script/Code.gs) de este repositorio. Guardar el proyecto con el nombre **Inscripciones Flautistas Protagonistas 2027**.
3. En el selector de funciones, elegir **`probarConexion`** y pulsar **Ejecutar**. Autorizar la lectura/escritura de Google Sheets si Google lo solicita. El registro de ejecución debe indicar: **«Conexión correcta con Inscripciones web. No se escribieron datos.»** Si falla, detenerse aquí.
4. Seleccionar **Implementar → Nueva implementación → Aplicación web**. Configurar **Ejecutar como: Yo** y **Quién tiene acceso: Cualquier persona** (incluidas personas sin sesión de Google; si la cuenta no ofrece esa opción, no estará disponible un registro público). Confirmar la implementación y copiar su URL que termina en `/exec`. <https://developers.google.com/apps-script/guides/web>
5. Enviar **únicamente la URL `/exec`** para actualizar el atributo `data-endpoint` de `flautistas-protagonistas/index.html` en GitHub. Esa URL no es una credencial privada; jamás compartir contraseñas ni tokens.
6. Tras incorporar la URL al sitio, probar una inscripción con datos de ensayo y comprobar que aparece **una sola fila nueva** en la pestaña **Inscripciones web**, que los dos números se comparan correctamente y que la página solo muestra éxito después del acuse del servidor. Borrar cualquier registro de ensayo en la hoja al finalizar.

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
