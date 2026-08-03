# HeraWallet — iPhone

No hay app nativa de iOS y no la habrá mientras no exista una cuenta del Apple
Developer Program (99 $ al año). En iPhone, HeraWallet se instala como PWA:
Safari la añade a la pantalla de inicio, con su icono y a pantalla completa, sin
cuenta, sin revisión y sin tienda.

## Qué funciona

| | |
|---|---|
| Micrófono y Modo Live | Sí, en la app añadida a la pantalla de inicio |
| Cámara para recibos | Sí |
| Notificaciones push | Sí, pero **solo** si está añadida a la pantalla de inicio (iOS 16.4+) |
| Sesión de 30 días | Sobrevive: las PWA instaladas no sufren el borrado de datos a los 7 días que Safari aplica a las webs normales |
| Arranque sin cobertura | Sí, por el service worker |

## Por qué no hay un botón que instale

Apple no expone ninguna API de instalación. En Android existe
`beforeinstallprompt` y basta un toque; en iOS ese evento no existe y no hay
forma de abrir "Añadir a pantalla de inicio" desde código.

Lo más cerca que se puede estar: el aviso de la pantalla de acceso muestra el
mismo botón que en Android y, al pulsarlo, abre una hoja con los dos pasos y el
icono de Compartir que la persona va a ver en su barra.

El aviso distingue tres situaciones (`plataformaAviso` en `App.tsx`):

- **android** — descarga del APK.
- **ios** — Safari en iPhone: se ofrecen los pasos.
- **safari** — iPhone pero fuera de Safari (Chrome, o el navegador incrustado de
  Instagram o WhatsApp). Ahí esa opción **no existe en el menú**, así que en vez
  de dar pasos que no se pueden seguir, se pide abrirla en Safari.

Si ya está instalada, no aparece nada: se detecta con `navigator.standalone` y
con `display-mode: standalone`.

## Iconos

iOS **no** recorta el `apple-touch-icon` ni le pone fondo: lo que se le da es lo
que sale en la pantalla de inicio, solo con las esquinas redondeadas. Por eso
`public/apple-touch-icon.png` va cuadrado, con el margen ya dibujado y **sin
transparencia** — donde hay alfa, iOS pinta negro.

Todos los iconos se generan del logo vectorizado. Si cambia el logo, hay que
rehacerlos: son `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`,
`icon-maskable-512.png` y `favicon.png`.

El `maskable` lleva el trazo más pequeño porque el sistema puede quedarse solo
con el 80 % central.

## Service worker

`public/sw.js` existe para que la app arranque sin cobertura, que es además
requisito para que se pueda instalar. Sus reglas son conservadoras a propósito:
un service worker mal ajustado sirve una versión vieja para siempre, y eso es
peor que no tenerlo.

- **Nada de `/api`.** Los datos financieros se piden siempre a la red; una
  respuesta cacheada mostraría saldos falsos.
- **La navegación va primero a la red.** Así un despliegue nuevo llega en la
  primera carga, no en la segunda.
- **`/assets` se sirve de caché.** Vite pone un hash en el nombre: cuando el
  archivo cambia, cambia la URL.

No se registra dentro del APK: allí el contenido ya está en el teléfono y una
capa de caché de más solo estorba al depurar.

Si alguna vez hay que retirarlo, no basta con borrar el archivo — los
navegadores que ya lo tienen registrado seguirían usándolo. Hay que publicar un
`sw.js` que llame a `self.registration.unregister()`.

## Probarlo

Desde un iPhone real, en Safari, sobre HTTPS (una PWA no se instala por HTTP):

1. Abre `https://herawallet.app`
2. Compartir → Añadir a pantalla de inicio
3. Ábrela desde el icono: no debe verse la barra de Safari, y el icono debe
   tener margen, no salir estirado
