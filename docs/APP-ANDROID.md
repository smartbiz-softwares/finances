# HeraWallet — App Android

La app es un contenedor de [Capacitor](https://capacitorjs.com) que **carga la
interfaz desde `herawallet.app`**. No lleva el cliente empaquetado dentro.

## Por qué la interfaz viene del servidor

Con el cliente empaquetado, cada cambio de la web obligaba a reinstalar el APK:
quien lo tuviera de ayer se quedaba sin lo de hoy, y en un día de trabajo normal
eso son diez reinstalaciones.

Ahora los cambios de la web llegan al abrir la app, sin que nadie haga nada.
Solo hace falta un APK nuevo cuando cambia algo **nativo**: permisos, icono,
plugins o el widget.

El service worker cachea el contenido, así que después de la primera apertura la
app sigue funcionando sin conexión. Esa primera vez sí necesita red — la tiene,
porque se acaba de descargar la app.

## Versiones y actualizaciones

Android solo reconoce una actualización si `versionCode` **sube**. Estaba fijo
en 1, así que ni siquiera se podía detectar que había algo nuevo.

Ahora lo inyecta la compilación con el número de ejecución del flujo, que
siempre crece:

```
./gradlew assembleDebug -PheraVersionCode=57 -PheraVersionName="1.57 (a1b2c3d)"
```

El nombre visible lleva el commit, para poder rastrear qué versión tiene alguien
instalada. Compilando en local sin esas propiedades queda en 1, que basta para
probar.

`apk/version.json` publica ese `versionCode`, y `/api/app/latest` lo expone. La
app compara con el suyo (`App.getInfo().build`) y, si hay uno mayor, ofrece
actualizar.

El aviso **no es obligatorio**: se puede posponer y no vuelve a insistir con la
misma versión hasta el día siguiente. Una app que bloquea hasta actualizar es
una app que se desinstala.

## Compilar

```bash
npm run apk           # APK de depuración
npm run apk:release   # APK de publicación (hay que firmarlo)
```

Resultado en `android/app/build/outputs/apk/debug/app-debug.apk`.

## Requisitos del equipo que compila

| | |
|---|---|
| JDK | **21** (Gradle no admite Java 26) |
| Android SDK | platform-tools, platforms;android-36, build-tools;35.0.0 |
| Variables | `ANDROID_HOME`, `JAVA_HOME` |

Si `gradlew` no consigue descargar Gradle, usa una copia local:

```bash
export ANDROID_HOME=~/Android/Sdk
export JAVA_HOME=~/jdks/jdk-21.0.12+8
cd android && ~/gradle-8.14.3/bin/gradle assembleDebug
```

## Publicación automática

Cada `git push` que toque el cliente compila el APK en GitHub Actions y lo sube
al servidor. Ver `.github/workflows/deploy.yml`.

El APK se sirve en `/descargar/HeraWallet.apk`, y `/api/app/latest` devuelve
versión, `versionCode`, peso y fecha. La sección de descarga de la web y el
aviso de la pantalla de acceso leen ese endpoint: sin APK publicado, ambos
desaparecen en lugar de ofrecer un enlace roto.

Para republicar sin cambios de código: pestaña Actions → Run workflow.

## Micrófono y cámara

El WebView de Android **deniega por defecto** las peticiones de `getUserMedia()`
aunque la app tenga los permisos del sistema concedidos. `MainActivity.java`
intercepta `onPermissionRequest` y concede solo micrófono y cámara, y solo si
Android ya nos los otorgó.

Sin ese enganche, el dictado por voz y el Modo Live fallan en silencio.

Permisos declarados: `INTERNET`, `ACCESS_NETWORK_STATE`, `RECORD_AUDIO`,
`MODIFY_AUDIO_SETTINGS`, `CAMERA`. Micrófono y cámara van como
`required="false"`: un teléfono sin ellos debe poder instalar la app.

## El icono

El logo original ocupa todo su lienzo, sin márgenes. Como icono quedaba mal:
Android recorta el icono adaptativo a círculo, cuadrado redondeado o *squircle*
según el lanzador, y solo garantiza el 66 % central.

De `public/logo.svg` salen:

- `drawable/ic_launcher_foreground.xml` — el trazo como vector, a 46 unidades
  sobre el lienzo de 108. Lo que tiene que caber en el círculo seguro es la
  diagonal del logo, no su alto.
- `drawable/ic_launcher_monochrome.xml` — para los iconos con tema de Android 13+.
- `mipmap-*/ic_launcher*.png` — para Android 7 y anteriores, que no recortan
  nada, así que llevan margen y forma ya dibujados.

Si cambias los iconos, Gradle puede fallar con `resource ... not found`: guarda
los recursos ya fusionados y no detecta los borrados. `gradle clean` lo resuelve,
y `publicar-app.sh` lo reintenta solo.

## Instalar

```bash
adb install -r apk/HeraWallet.apk
```

O abrir el archivo en el teléfono. Android pedirá permitir la instalación de
orígenes desconocidos, que es lo normal fuera de Play Store.

## Publicar en Play Store

El APK de depuración va firmado con una clave de prueba y **no sirve** para
publicar.

1. Generar la clave (guárdala: sin ella no podrás actualizar la app):
   ```bash
   keytool -genkey -v -keystore hera-release.keystore \
     -alias herawallet -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Declararla en `android/key.properties`, fuera del repositorio.
3. `npm run apk:release`, o mejor un *App Bundle* (`bundleRelease`).
