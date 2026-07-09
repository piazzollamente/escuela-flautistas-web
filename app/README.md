# Sala de Estudio · Escuela de Flautistas

Piloto PWA con tres herramientas:

- Afinador cromático con calibración La = 430–450 Hz.
- Metrónomo con compases, subdivisiones de 1 a 6, acentos y aumento progresivo.
- Hiperfoco con temporizador, objetivo de sesión, pantalla activa e historial local.

## Privacidad y acceso

La aplicación no utiliza servidor ni base de datos. El acceso y el historial se guardan en `localStorage` del dispositivo. El código privado es una barrera ligera para una prueba cerrada, no un sistema de autenticación de alta seguridad.

## Publicación gratuita en Cloudflare Pages

1. Crear un proyecto de Pages conectado a `piazzollamente/escuela-flautistas-web`.
2. Seleccionar la rama `feature/sala-estudio-pwa` durante la prueba.
3. Framework preset: `None`.
4. Build command: dejar vacío.
5. Build output directory: `app`.
6. Agregar el dominio personalizado `app.escueladeflautistas.cl`.

Cuando se apruebe la prueba, fusionar la rama a `main` y cambiar la rama de producción del proyecto Pages a `main`.

## Límites conocidos de la versión web

- No mantiene un contador en vivo en la pantalla bloqueada de iOS.
- Las notificaciones al finalizar dependen de los permisos y de que el sistema no suspenda completamente el navegador.
- El sonido del metrónomo requiere que la aplicación permanezca activa.
- El historial no se sincroniza entre dispositivos.
