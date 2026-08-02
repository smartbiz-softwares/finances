# HeraWallet — App Android

La app empaqueta el mismo cliente web con [Capacitor](https://capacitorjs.com)
y habla con el servidor de producción por HTTPS. No hay código duplicado: lo
que se arregla en la web llega a la app en la siguiente compilación.

## Compilar

```bash
npm run apk           # APK de depuración, listo para instalar y probar
npm run apk:release   # APK de publicación (hay que firmarlo, ver abajo)
```

El resultado queda en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

`npm run apk` hace tres cosas: compila el cliente con `VITE_API_BASE`
apuntando a `https://herawallet.app`, copia ese `dist/` dentro del proyecto
Android y lanza Gradle.

## Requisitos del equipo que compila

| | |
|---|---|
| JDK | **21** (Gradle no admite Java 26; usa un Temurin portable si el sistema trae uno más nuevo) |
| Android SDK | platform-tools, platforms;android-35, build-tools;35.0.0 |
| Variables | `ANDROID_HOME`, `JAVA_HOME` |

Si el `gradlew` del proyecto no consigue descargar Gradle, usa una copia local:

```bash
export ANDROID_HOME=~/Android/Sdk
export JAVA_HOME=~/jdks/jdk-21.0.12+8
cd android && ~/gradle-8.14.3/bin/gradle assembleDebug
```

## Por qué `VITE_API_BASE`

En la web el cliente usa rutas relativas (`/api/...`) que van al mismo origen
que sirve la página. Dentro del APK **no hay servidor propio**: esas rutas
apuntarían al paquete local y todo fallaría. Por eso la compilación para
Android inyecta la URL absoluta del servidor, y `src/api.ts` la antepone a
cada llamada mediante `apiUrl()`.

Si algún día se añade un `fetch` nuevo, tiene que pasar por `apiUrl()`. Un
`fetch('/api/...')` suelto funciona en web y rompe en la app.

## Micrófono y cámara

El WebView de Android **deniega por defecto** las peticiones de
`getUserMedia()` aunque la app tenga los permisos del sistema concedidos.
`MainActivity.java` intercepta `onPermissionRequest` y concede solo micrófono
y cámara, y solo si Android ya nos los otorgó.

Sin ese enganche, el dictado por voz y el Modo Live fallan en silencio: la web
pide permiso, nadie contesta y la promesa se rechaza.

Permisos declarados: `INTERNET`, `ACCESS_NETWORK_STATE`, `RECORD_AUDIO`,
`MODIFY_AUDIO_SETTINGS`, `CAMERA`. Micrófono y cámara van como
`required="false"`: un teléfono sin ellos debe poder instalar la app y usar el
resto.

## Publicar la app junto con la web

En el servidor, el despliegue normal deja la app al día sin pasos aparte:

```bash
scripts/desplegar.sh          # trae cambios, compila la web, reinicia y rehace el APK
scripts/desplegar.sh --sin-app
```

El APK se rehace solo si el commit cambió desde el último publicado, porque
compilar Android tarda minutos. Si el servidor no tiene `ANDROID_HOME` o
`JAVA_HOME`, `scripts/publicar-app.sh` avisa y termina sin error: la web se
despliega igual y se conserva el APK anterior.

El resultado se copia a `apk/HeraWallet.apk` (fuera de `dist/`, para no
arrastrar siete megas en cada build del cliente) y se sirve en:

| Ruta | Qué devuelve |
|---|---|
| `/descargar/HeraWallet.apk` | El archivo, sin caché |
| `/api/app/latest` | Versión, peso y fecha reales |

La sección de descarga de la web y el aviso de la pantalla de acceso leen
`/api/app/latest`: si no hay APK publicado, ambos desaparecen en lugar de
ofrecer un enlace roto. El aviso solo se muestra a quien entra desde Android
por navegador, y se puede descartar.

## El icono

El logo original ocupa todo su lienzo, sin márgenes. Como icono quedaba mal:
Android recorta el icono adaptativo a círculo, cuadrado redondeado o
*squircle* según el lanzador, y solo garantiza el 66 % central.

`public/logo.svg` es el logo vectorizado, y de ahí salen:

- `drawable/ic_launcher_foreground.xml` — el trazo como vector, a 46 unidades
  de alto sobre el lienzo de 108. Lo que tiene que caber en el círculo seguro
  es la diagonal del logo, no su alto.
- `drawable/ic_launcher_monochrome.xml` — la misma silueta para los iconos con
  tema de Android 13+.
- `mipmap-*/ic_launcher*.png` — versiones para Android 7 y anteriores, que no
  recortan nada, así que llevan el margen y la forma ya dibujados.

Si cambias los iconos, Gradle puede fallar con `resource ... not found`: guarda
los recursos ya fusionados y no se entera de los que se borran. Un
`gradle clean` lo resuelve, y `publicar-app.sh` lo reintenta solo.

## Instalar el APK de pruebas

```bash
adb install -r apk/HeraWallet.apk
```

O copiar el archivo al teléfono y abrirlo. Android pedirá permitir la
instalación de orígenes desconocidos, que es lo normal fuera de Play Store.

## Publicar en Play Store

El APK de depuración va firmado con una clave de prueba y **no sirve** para
publicar. Para la versión de tienda:

1. Generar la clave de firma (guárdala: sin ella no podrás actualizar la app):
   ```bash
   keytool -genkey -v -keystore hera-release.keystore \
     -alias herawallet -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Declararla en `android/key.properties` (fuera del repositorio).
3. `npm run apk:release`, o mejor un *App Bundle* (`bundleRelease`), que es lo
   que Play Store prefiere.

## Cambio de versión

En `android/app/build.gradle`: `versionCode` (entero, ha de subir en cada
publicación) y `versionName` (lo que ve el usuario).
