# Sala de Estudio · Escuela de Flautistas

PWA con tres herramientas principales:

- Afinador cromático con calibración La = 430–450 Hz.
- Metrónomo con compases, subdivisiones de 1 a 6, acentos y aumento progresivo.
- Hiperfoco con temporizador, objetivo de sesión, pantalla activa e historial local.

## Arquitectura canónica

La implementación activa y canónica de Sala de Estudio se mantiene en `main/app`.

La rama histórica `feature/sala-estudio-pwa` contiene experimentos y parches previos para iPad/iOS (`audio-session.js`, `ipad-tuner-fix.js`, `high-register-tuner.js`) que no deben incorporarse automáticamente a producción. Cualquier lógica útil debe revisarse y trasladarse de forma explícita a la implementación canónica.

El afinador validado actualmente en iPad utiliza `app.js` como motor principal. `app-fixes.js` funciona como capa de compatibilidad para recuperación al volver a la app, referencias adicionales y correcciones táctiles. La meta de mantenimiento es evitar nuevas capas paralelas y consolidar futuros cambios en una única ruta de ejecución.

## Privacidad y acceso

La aplicación no utiliza servidor ni base de datos. El acceso y el historial se guardan en `localStorage` del dispositivo. El código privado es una barrera ligera para una prueba cerrada, no un sistema de autenticación de alta seguridad.

## Publicación

El proyecto se publica desde el repositorio `piazzollamente/escuela-flautistas-web` con `app` como directorio de salida para Sala de Estudio y el dominio `app.escueladeflautistas.cl`.

Los cambios técnicos deben desarrollarse primero en una rama de prueba, validarse en Safari de iPad y PWA instalada, y recién después integrarse a `main`.

## Límites conocidos de la versión web

- No mantiene un contador en vivo en la pantalla bloqueada de iOS.
- Las notificaciones al finalizar dependen de los permisos y de que el sistema no suspenda completamente el navegador.
- El sonido del metrónomo requiere que la aplicación permanezca activa.
- El historial no se sincroniza entre dispositivos.
