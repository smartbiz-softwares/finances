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

## Instalar el APK de pruebas

```bash
adb install -r apk/HeraWallet-debug.apk
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
