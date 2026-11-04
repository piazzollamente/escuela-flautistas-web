# Automatización de correos — Flautistas Protagonistas 2027

## Estado al 3 de noviembre de 2026

**Código preparado y probado mediante simulaciones; NO está activo en el Apps Script desplegado hasta que su administradora copie la nueva versión de `Code.gs`, la publique y cree el disparador.**

La hoja de Google Sheets es [Inscripciones — Flautistas Protagonistas 2027](https://docs.google.com/spreadsheets/d/19ODt7wTppY6FJsE7ZQsH-lqNTiGJv4Ll9RqOvp7a2dQ/edit).

La implementación se diseñó como comunicación **transaccional**, no como campaña promocional. Solo utiliza los emails registrados con consentimiento para gestionar el programa.

## Reglas comerciales

- Modalidades: **1 pago**, **2 cuotas** o **3 cuotas**.
- Chile: CLP 399.900 en 1 pago; 2 × CLP 209.850 o 3 × CLP 139.900 (total financiado CLP 419.700).
- Argentina: ARS 399.000 en 1 pago; 2 × ARS 209.850 o 3 × ARS 139.900 (total financiado ARS 419.700).
- Otro país: USD 419 en 1 pago; 2 × USD 220,50 o 3 × USD 147 (total financiado USD 441).
- **El programa debe estar completamente abonado antes del 15/01/2027** (último día: 14/01/2027).
- Quien elige dos o tres cuotas responde al primer correo con **dos o tres fechas concretas**, según la modalidad. Esta versión todavía requiere revisión humana de las respuestas.
- Solo una persona autorizada puede completar las fechas en la hoja y marcar «Aprobado».
- El calendario solo se confirma si las fechas de todas las cuotas son válidas, están ordenadas y ocurren antes del 15/01/2027.

## Configurar la hoja privada

**Pestaña «Configuración pagos FP2027»:**

| Columna | Contenido |
|---|---|
| A | Mercado: Chile, Argentina u Otro país |
| B | Medio de pago (Chile/Argentina: completar según instrucciones oficiales; Otro país: Western Union) |
| C | Datos de pago verificados, completos y redactados para el destinatario |
| D | «Sí» solo después de aprobar las instrucciones; por defecto «No» |
| E | Observaciones internas |
| F2 | Fecha límite exclusiva de pago, 15/01/2027, tipo fecha de Google Sheets |

**Importante:** los datos bancarios y la información del beneficiario de Western Union se almacenan solamente en la hoja privada. Nunca deben añadirse como información real al repositorio GitHub público. Para Western Union, especificar beneficiario exacto, país, modalidad y referencias que correspondan, sin adivinar datos. Cuando C esté vacío o D sea «No», **no se envía correo inicial para ese mercado**.

**Pestaña «Inscripciones web»:**
- Q: correo electrónico.
- R: estado correo inicial (Pendiente, Enviando, Enviado, Revisión requerida).
- S: fecha correo inicial.
- T: detalle del último intento.
- U: estado correo de pago completo.
- V: fecha confirmación de pago completo.

**Pestaña «Plan pagos FP2027»:**
- A–D: ID, email, país y modalidad.
- E–G: dos o tres fechas comprometidas (llenar manualmente); para 2 cuotas se utilizan E y F, y G queda vacía.
- H: calendario aprobado «Aprobado» o «No».
- I–K: estado de cada pago; escribir «Acreditado» solo tras verificarlo. En 2 cuotas, K queda «No aplica».
- L–N: fecha/estado de cada recordatorio.
- O–P: reservadas para confirmar pago completo.
- Q–R: confirmación por email del calendario aprobado y fecha de envío.

La pestaña «Historial correo FP2027» almacena el tipo de mensaje, el destinatario, la fecha y el resultado, sin adjuntar comprobantes.

## Instalar en Google Apps Script

1. Abrir el proyecto Apps Script que procesa las inscripciones y sustituir **todo** su `Code.gs` por [el archivo actualizado](./Code.gs). Guardar.
2. Ejecutar `probarConexion()`: verifica los encabezados de la hoja (sin registrar ni enviar nada).
3. Ejecutar `probarConfiguracionCorreosFP2027()`: devuelve por mercado «Pendiente» o «Listo para enviar» (sin enviar nada).
4. Ejecutar `instalarCorreosFP2027()` una única vez. Autorizar los permisos necesarios de Gmail/Email y Sheets. Crea un disparador de `procesarCorreosFP2027` cada 15 minutos, sin duplicarlo.
5. Actualizar la implementación web existente en **Implementar → Gestionar implementaciones → Editar → Nueva versión → Implementar**, conservando la URL `/exec` si es posible.
6. Después de revisar las instrucciones de pago y verificar el correo de respuesta, poner D = «Sí» solo para los mercados listos. El siguiente disparador enviará los emails pendientes.
7. Revisar «Historial correo FP2027» y el estado R/S de las inscripciones. Un correo marcado «Revisión requerida» o «Enviando» requiere comprobar los enviados antes de forzar otro intento.

**Antes de habilitar correos:** contrastar los estados R/S con los mensajes realmente enviados desde el correo oficial. No reenviar inscripciones anteriores cuyos correos ya se enviaron manualmente.

## Secuencia automática

1. **Inscripción registrada**: se guarda la fila en «Inscripciones web» (R = Pendiente). El disparador consulta el mercado, la modalidad y la configuración.
2. **Correo inicial**: envía instrucciones de pago desde la hoja privada. Para 2 o 3 cuotas solicita, respectivamente, 2 o 3 fechas, recordando el límite de pago del 14/01/2027 inclusive.
3. **Calendario aprobado**: después de registrar y aprobar manualmente 2 o 3 fechas, envía la confirmación solo si todas están antes del 15/01/2027 y F2 contiene esa fecha límite. El calendario puede organizarse antes de transferir.
4. **Recordatorios**: para 2 o 3 cuotas, desde dos días antes hasta el mismo día del vencimiento no acreditado, como máximo uno por cuota; solo después de confirmar el calendario.
5. **Pago completo**: únicamente cuando se marca «Confirmado» en la columna L de «Inscripciones web» y, si hay cuotas, las dos (I–J) o tres (I–K) figuran acreditadas.

El remitente visible será «Escuela de Flautistas». La cuenta de envío real será la cuenta propietaria/autorizada que ejecute el Apps Script; las respuestas van a `valentina@escueladeflautistas.cl`. Antes de activar, comprobar que esa dirección recibe efectivamente las respuestas.

## Controles contra errores

- Un envío pasa de «Pendiente» a «Enviando» antes de ejecutarse y a «Enviado» después; no se reintenta automáticamente un estado incierto.
- Un nuevo contacto sin email no recibe correos hasta que se actualice su registro.
- No se vincula un email de una base anterior por semejanza de nombre. La conciliación de personas existentes se hace con evidencia explícita.
- Las respuestas con fechas **no se interpretan ni aceptan automáticamente**.
- No se confirma un pago sobre la base de un comprobante sin comprobación humana.
- Máximo 10 mensajes por ejecución y respeto al cupo diario de MailApp.
- La hoja y los mensajes reales contienen datos personales: restringir el acceso a personas autorizadas.

## Pendientes reales antes del primer envío

- Revisar que los datos de pago de Chile, Argentina y Western Union coincidan con la hoja privada antes de habilitar envíos.
- F2 debe contener 15/01/2027 (fecha límite exclusiva), no una fecha de inicio de clases.
- Configurar y autorizar el disparador desde el Apps Script real; ejecutar prueba controlada.

## Verificación segura de la nueva implementación

Tras pegar el `Code.gs` completo, guardarlo y desplegar una **nueva versión**, abre esta URL en el navegador:

`https://script.google.com/macros/s/AKfycbzAoTW2si582RyzX_tynEuH2hQzfZTgH3zskm_GlUDTFBN4fTWJqzh3gkrWXR5pyBEs/exec?accion=comprobar_dos_cuotas`

Si devuelve `FP2027 - OK: esta version acepta 1, 2 y 3 cuotas.`, el endpoint publicado contiene la versión compatible con el nuevo formulario. Este diagnóstico **no registra inscripciones, no modifica Sheets y no envía correos**. No sustituye una prueba posterior de extremo a extremo, pero evita publicar la interfaz contra una versión anterior del receptor.

El formulario actualizado solicita también la capacidad `capacidad=2` y solo se habilita si el Apps Script confirma la versión `cuotas-2-v1`; el formulario viejo sigue pudiendo comprobar `email-v2`.

## Despliegue de la modalidad de 2 cuotas

El código publicado en GitHub **no actualiza automáticamente** la implementación `/exec` de Apps Script. Para activar 2 cuotas sin rechazos, primero copiar `Code.gs` al proyecto real y desplegar una **nueva versión** en la implementación existente. Después publicar la interfaz de las tres modalidades. Probar una inscripción de prueba con `cuotas=2` y confirmar que se guarda `2` en la columna J, sin enviar mensajes a personas reales. La plantilla solicita dos fechas y el plan de pagos utiliza solo las cuotas 1 y 2. No activar el disparador de correos sin verificar que utiliza `valentina@escueladeflautistas.cl` como remitente real.
