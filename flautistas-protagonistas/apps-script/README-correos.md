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
- **El programa debe estar completamente abonado antes del inicio de las clases**.
- Quien elige tres cuotas debe responder al primer correo con **tres fechas concretas**; nunca se interpretan automáticamente sus respuestas.
- Solo una persona autorizada puede completar las fechas en la hoja y marcar «Aprobado».
- El calendario solo se confirma si las tres fechas son válidas, están en orden y ocurren antes de la fecha oficial de inicio.

## Configurar la hoja privada

**Pestaña «Configuración pagos FP2027»:**

| Columna | Contenido |
|---|---|
| A | Mercado: Chile, Argentina u Otro país |
| B | Medio de pago (Chile/Argentina: completar según instrucciones oficiales; Otro país: Western Union) |
| C | Datos de pago verificados, completos y redactados para el destinatario |
| D | «Sí» solo después de aprobar las instrucciones; por defecto «No» |
| E | Observaciones internas |
| F2 | Fecha oficial de inicio de clases, tipo fecha de Google Sheets |

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
- E–G: tres fechas comprometidas (llenar manualmente).
- H: calendario aprobado «Aprobado» o «No».
- I–K: estado de cada pago; escribir «Acreditado» solo tras verificarlo.
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

**Advertencia antes de habilitar Argentina:** hay una inscripción pendiente de Emma Rioseco, con email reconciliado desde dos citas de mentoría. Cuando se habilite Argentina, el sistema le enviará automáticamente el correo de tres cuotas. No se ha enviado previamente desde esta automatización.

## Secuencia automática

1. **Inscripción registrada**: se guarda la fila en «Inscripciones web» (R = Pendiente). El disparador consulta el mercado, la modalidad y la configuración.
2. **Correo inicial**: si los datos del mercado están completos y habilitados, envía instrucciones de pago de la hoja privada. Para tres cuotas solicita responder con tres fechas y recuerda que el programa debe estar pagado antes de comenzar las clases.
3. **Calendario aprobado**: después de que la dirección de Escuela de Flautistas registre tres fechas y marque H = Aprobado, envía automáticamente el correo de fechas aceptadas **solo si existe una fecha de inicio en F2 y las tres cuotas vencen antes**.
4. **Recordatorios**: para tres cuotas, entre dos días y el mismo día antes de cada vencimiento no acreditado, como máximo uno por cuota; solo después de confirmar el calendario.
5. **Pago completo**: únicamente cuando se marca «Confirmado» en la columna L de «Inscripciones web» y, para tres cuotas, I–K constan como «Acreditado», envía la confirmación de pago completo.

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

- Datos de pago aprobados para Chile y Argentina.
- Datos de recepción verificables de Western Union para otros países en USD.
- Fecha exacta de inicio de clases (para aprobar los calendarios).
- Configurar y autorizar el disparador desde el Apps Script real; ejecutar prueba controlada.
