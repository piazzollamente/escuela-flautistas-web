# Automatización de correos — Flautistas Protagonistas 2027

## Estado al 3 de noviembre de 2026

**Código preparado y probado mediante simulaciones; NO está activo en el Apps Script desplegado hasta que su administradora copie la nueva versión de `Code.gs`, la publique y cree el disparador.**

La hoja de Google Sheets es [Inscripciones — Flautistas Protagonistas 2027](https://docs.google.com/spreadsheets/d/19ODt7wTppY6FJsE7ZQsH-lqNTiGJv4Ll9RqOvp7a2dQ/edit).

La implementación se diseñó como comunicación **transaccional**, no como campaña promocional. Solo utiliza los emails registrados con consentimiento para gestionar el programa.

## Reglas comerciales

- Modalidades: **1 pago** o **3 cuotas**.
- Chile: CLP 399.900 en 1 pago; 3 × CLP 139.900 (total CLP 419.700).
- Argentina: ARS 399.000 en 1 pago; 3 × ARS 139.900 (total ARS 419.700).
- Otro país: USD 419 en 1 pago; 3 × USD 147 (total USD 441).
- El pago total debe acreditarse **antes del 15 de enero de 2027**. Por lo tanto, el **14 de enero** es el último día admisible.
- En tres cuotas, la persona responde con tres fechas. El sistema revisa y **aprueba automáticamente** las fechas cuando son válidas, ordenadas, distintas, no anteriores al día de revisión y anteriores al 15/01/2027.
- El calendario se registra **aunque todavía no exista ningún pago**. Las acreditaciones bancarias siguen requiriendo revisión independiente.
- Una respuesta incompleta o con fechas inválidas recibe un correo automático solicitando corrección; no se registra como calendario aprobado.

## Configurar la hoja privada

**Pestaña «Configuración pagos FP2027»:**

| Columna | Contenido |
|---|---|
| A | Mercado: Chile, Argentina u Otro país |
| B | Medio de pago (Chile/Argentina: completar según instrucciones oficiales; Otro país: Western Union) |
| C | Datos de pago verificados, completos y redactados para el destinatario |
| D | «Sí» solo después de aprobar las instrucciones; por defecto «No» |
| E | Observaciones internas |
| F2 | Fecha límite exclusiva de pago, fijada en **15/01/2027** (último día para abonar: 14/01/2027) |

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
- E–G: fechas propuestas que el sistema escribe automáticamente tras validar la respuesta por correo.
- H: calendario aprobado «Aprobado» automáticamente cuando las tres fechas cumplen las condiciones; «No» mientras estén pendientes.
- I–K: estado de cada pago; escribir «Acreditado» solo tras verificarlo.
- L–N: fecha/estado de cada recordatorio.
- O–P: reservadas para confirmar pago completo.
- Q–R: confirmación por email del calendario aprobado y fecha de envío.
- S–T: ID de la última respuesta procesada y resultado de revisión automática (evitan procesarla dos veces).

La pestaña «Historial correo FP2027» almacena el tipo de mensaje, el destinatario, la fecha y el resultado, sin adjuntar comprobantes. No se crean eventos en Google Calendar; el calendario de pagos se registra en «Plan pagos FP2027».

## Instalar en Google Apps Script

1. Abrir el proyecto Apps Script que procesa las inscripciones y sustituir **todo** su `Code.gs` por [el archivo actualizado](./Code.gs). Guardar.
2. Ejecutar `probarConexion()`: verifica los encabezados de la hoja (sin registrar ni enviar nada).
3. Ejecutar `probarConfiguracionCorreosFP2027()`: devuelve por mercado «Pendiente» o «Listo para enviar» (sin enviar nada).
4. Ejecutar **`probarBuzonRespuestasFP2027()`** y autorizar Gmail. La cuenta que ejecute Apps Script debe tener acceso a las respuestas que llegan a `valentina@escueladeflautistas.cl`. Si es otro buzón, configurar el reenvío a la cuenta ejecutora; sin acceso, la revisión automática no funcionará.
5. Ejecutar `instalarCorreosFP2027()` una única vez. Autorizar Gmail, MailApp y Sheets. Crea un disparador de `procesarCorreosFP2027` cada 15 minutos sin duplicarlo.
6. Actualizar la implementación web existente en **Implementar → Gestionar implementaciones → Editar → Nueva versión → Implementar**, conservando la URL `/exec` si es posible.
7. Después de revisar las instrucciones de pago, poner D = «Sí» solo para los mercados listos. El siguiente disparador enviará los emails pendientes. Las respuestas de fechas se registran automáticamente sin exigir pagos previos.
8. Revisar «Historial correo FP2027», R/S en inscripciones y S/T en plan de pagos. Un correo marcado «Revisión requerida» o «Enviando» requiere comprobar Enviados antes de forzar otro intento.

**Advertencia antes de habilitar Argentina:** hay una inscripción pendiente de Emma Rioseco, con email reconciliado desde dos citas de mentoría. Cuando se habilite Argentina, el sistema le enviará automáticamente el correo de tres cuotas. No se ha enviado previamente desde esta automatización.

## Secuencia automática

1. **Inscripción registrada**: se guarda la fila en «Inscripciones web» (R = Pendiente). El disparador consulta el mercado, la modalidad y la configuración.
2. **Correo inicial**: envía instrucciones de pago cuando están aprobadas y solicita las tres fechas para esa modalidad. El límite es el 14/01/2027 inclusive.
3. **Respuesta revisada automáticamente**: GmailApp busca respuestas asociadas al ID de inscripción y provenientes de su correo registrado. Analiza fechas en formato DD/MM/AAAA, comprueba que estén en orden, sean futuras o del mismo día, y que todas ocurran **antes del 15/01/2027**. Si son válidas, guarda E–G, marca H = Aprobado y envía la confirmación del calendario; si no, solicita corrección. **No depende de una transferencia previa.**
4. **Recordatorios**: para tres cuotas, entre dos días y el mismo día antes de cada vencimiento no acreditado, como máximo uno por cuota; solo después de confirmar el calendario.
5. **Pago completo**: únicamente cuando se marca «Confirmado» en la columna L de «Inscripciones web» y, para tres cuotas, I–K constan como «Acreditado», envía la confirmación de pago completo.

El remitente visible será «Escuela de Flautistas». La cuenta de envío real será la cuenta propietaria/autorizada que ejecute el Apps Script; las respuestas van a `valentina@escueladeflautistas.cl`. Antes de activar, comprobar que esa dirección recibe efectivamente las respuestas.

## Controles contra errores

- Un envío pasa de «Pendiente» a «Enviando» antes de ejecutarse y a «Enviado» después; no se reintenta automáticamente un estado incierto.
- Un nuevo contacto sin email no recibe correos hasta que se actualice su registro.
- No se vincula un email de una base anterior por semejanza de nombre. La conciliación de personas existentes se hace con evidencia explícita.
- Las propuestas de fechas se validan automáticamente, pero los comprobantes de pago no se toman como autorización bancaria ni se consideran acreditaciones. Los correos sin propuesta de fechas se ignoran.
- No se confirma un pago sobre la base de un comprobante sin comprobación humana.
- Máximo 10 mensajes por ejecución y respeto al cupo diario de MailApp.
- La hoja y los mensajes reales contienen datos personales: restringir el acceso a personas autorizadas.

## Pendientes reales antes del primer envío

- Los datos de pago de los tres mercados ya están escritos en la hoja privada; su presentación e instrucciones deben revisarse antes de poner «Sí» en la columna D.
- El límite de pago ya está fijado como **15/01/2027 exclusivo** en F2.
- Asegurar acceso a las respuestas de `valentina@escueladeflautistas.cl` desde la cuenta que ejecuta Apps Script; autorizar Gmail y el disparador; ejecutar prueba controlada.
