# Inscripciones — Flautistas Protagonistas 2027

La página `/flautistas-protagonistas/` conserva su identidad editorial y añade un formulario de inscripción destinado a una **nueva hoja de Google Sheets**, independiente de la preinscripción anterior.

**Estado:** los cambios están preparados en una rama del repositorio. La página todavía **no envía inscripciones reales**: falta desplegar el nuevo Google Apps Script, obtener su URL y hacer una prueba de escritura. No sustituir la página pública hasta completar estos pasos.

## Campos de la página

- Nombre
- Apellido
- País de residencia
- WhatsApp, con código internacional
- Confirma tu WhatsApp: se escribe el mismo número por segunda vez
- Moneda de pago: USD, ARS o CLP
- Cantidad de cuotas: 1, 2 o 3
- Consentimiento para gestionar y responder a la inscripción

El navegador comprueba coincidencia y formato. El receptor de Apps Script **vuelve a validar ambos números**. Se conserva únicamente un número normalizado en la hoja.

**Importante:** este procedimiento reduce errores de digitación, pero **no confirma la identidad, la existencia del número ni la titularidad de la cuenta de WhatsApp**. No envía códigos ni requiere servicios externos de verificación.

## Google Sheets de destino

[Inscripciones — Flautistas Protagonistas 2027](https://docs.google.com/spreadsheets/d/19ODt7wTppY6FJsE7ZQsH-lqNTiGJv4Ll9RqOvp7a2dQ/edit)

Pestaña: **Inscripciones web**. Columnas A:P:

| Columna | Registro |
|---|---|
| A | Fecha de inscripción |
| B | ID de inscripción |
| C–D | Nombre, apellido |
| E | País |
| F | WhatsApp normalizado |
| G | Confirmación WhatsApp: **Coinciden** |
| H | Verificación externa: **No realizada** |
| I | Moneda |
| J | Cuotas |
| K | Estado de inscripción: Recibida |
| L | Estado de pago: Pendiente |
| M | Fecha de pago (vacía hasta confirmación) |
| N | Origen |
| O | Consentimiento |
| P | Observaciones internas |

La hoja no procesa pagos y no confirma automáticamente ninguna plaza.

## Pasos para conectar la página

1. Crear un **nuevo** proyecto Google Apps Script con una cuenta que tenga permiso de edición sobre la hoja. No reutilizar el receptor de preinscripciones.
2. Copiar el contenido de [apps-script/Code.gs](./apps-script/Code.gs).
3. En **Configuración del proyecto → Propiedades de secuencia de comandos**, ingresar:
   
   | Propiedad | Valor |
   |---|---|
   | `SPREADSHEET_ID` | `19ODt7wTppY6FJsE7ZQsH-lqNTiGJv4Ll9RqOvp7a2dQ` |
   | `ALLOWED_ORIGIN` | `https://escueladeflautistas.cl` |

4. En Apps Script, **Implementar → Nueva implementación → Aplicación web**. Ejecutar como la cuenta administradora. Conceder acceso público al endpoint únicamente si el formulario está destinado al público general, y revisar los permisos de la cuenta.
5. Copiar la URL final del tipo `https://script.google.com/macros/s/.../exec` y sustituir `data-endpoint="#"` en [index.html](./index.html). No colocar credenciales de Google en HTML o JavaScript.
6. Probar los casos siguientes con un número de prueba y borrar después los registros de prueba. Verificar la respuesta real de Apps Script en navegador, no dar por exitoso solo porque el iframe cargó.
7. Comprobar la hoja de preinscripciones original: no debe sufrir cambios ni recibir nuevos registros de esta versión.
8. Una vez verificado todo, integrar la rama a `main`.

## Pruebas de aceptación

| Caso | Comportamiento esperado |
|---|---|
| Primer y segundo WhatsApp distintos | Impide enviar; muestra «Los números de WhatsApp no coinciden» |
| Mismo teléfono con espacios distintos | Coinciden tras normalización |
| Número sin código internacional | Impide enviar |
| No seleccionar moneda, cuotas o país | Impide enviar |
| Consentimiento sin marcar | Impide enviar |
| Envío válido | Backend crea una sola fila con `Coinciden` y `No realizada` |
| Enviar mismo número otra vez | El servidor impide duplicar |
| Se cae el receptor | No aparece confirmación falsa |
| Endpoint sin configurar | Botón inactivo y aviso visible |
| Cualquier elección de cuota | Solo se registra preferencia; no confirma pago |

## Mantenimiento y privacidad

- El frontend de esta funcionalidad se encuentra en [inscripcion.js](./inscripcion.js) y su CSS en [inscripcion.css](./inscripcion.css).
- El receptor utiliza los permisos de Google Apps Script. La hoja permanece privada; no se comparte con «cualquiera que tenga el enlace».
- Se protege la hoja frente a fórmulas escritas en entradas libres y se impide el registro duplicado por número.
- **No existe prueba de titularidad**: cualquier persona podría registrar un número ajeno si lo conoce. Si se necesita protección más sólida contra registros falsos, se requerirá otro mecanismo de verificación o moderación.
- Revisar aviso de privacidad y política de conservación de números de teléfono antes de publicarlo.

Documentación oficial: [Implementar una aplicación web de Apps Script](https://developers.google.com/apps-script/guides/web), [HTML Service](https://developers.google.com/apps-script/guides/html).
