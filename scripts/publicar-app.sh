#!/usr/bin/env bash
#
# Publica la app Android: compila el cliente, arma el APK y lo deja donde el
# servidor lo sirve en /descargar/HeraWallet.apk.
#
# Pensado para ejecutarse en el servidor después de cada despliegue, de modo
# que la app que la gente descarga nunca se quede atrás de la web. Ver
# `scripts/desplegar.sh`, que lo llama al final.
#
# Uso:
#   scripts/publicar-app.sh            # solo si hay cambios desde el último APK
#   scripts/publicar-app.sh --forzar   # recompila siempre
#
# Si el servidor no tiene el SDK de Android, el script avisa y termina sin
# error: el despliegue de la web no debe romperse por no poder rehacer el APK.

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

DESTINO="$RAIZ/apk"
APK_PUBLICADO="$DESTINO/HeraWallet.apk"
APK_COMPILADO="$RAIZ/android/app/build/outputs/apk/debug/app-debug.apk"
SELLO="$DESTINO/.ultimo-commit"

FORZAR=0
[[ "${1:-}" == "--forzar" ]] && FORZAR=1

log() { printf '\033[36m[app]\033[0m %s\n' "$*"; }
aviso() { printf '\033[33m[app]\033[0m %s\n' "$*" >&2; }

# --- ¿Hace falta recompilar? ---------------------------------------------
#
# Se compara el commit actual con el que produjo el APK publicado. Compilar
# Android tarda minutos, así que no se hace en despliegues que no tocaron el
# cliente.
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo desconocido)"

if [[ $FORZAR -eq 0 && -f "$APK_PUBLICADO" && -f "$SELLO" ]]; then
  if [[ "$(cat "$SELLO")" == "$COMMIT" ]]; then
    log "El APK publicado ya corresponde a $COMMIT. Nada que hacer."
    exit 0
  fi
fi

# --- Comprobar herramientas ----------------------------------------------
if [[ -z "${ANDROID_HOME:-}" && -z "${ANDROID_SDK_ROOT:-}" ]]; then
  aviso "Sin ANDROID_HOME: este equipo no puede compilar la app. Se deja el APK actual."
  exit 0
fi

if [[ -z "${JAVA_HOME:-}" ]]; then
  aviso "Sin JAVA_HOME: Gradle necesita JDK 21. Se deja el APK actual."
  exit 0
fi

# Gradle no admite versiones de Java más nuevas que las que conoce; avisar aquí
# ahorra un error largo y críptico más adelante.
VERSION_JAVA="$("$JAVA_HOME/bin/java" -version 2>&1 | head -1 | grep -oP '"\K[0-9]+' || echo 0)"
if [[ "$VERSION_JAVA" -gt 21 ]]; then
  aviso "JAVA_HOME apunta a Java $VERSION_JAVA; Gradle necesita 21 o menos. Se deja el APK actual."
  exit 0
fi

# --- Compilar -------------------------------------------------------------
log "Compilando el cliente para la app (commit $COMMIT)…"
npm run build:app

log "Sincronizando con el proyecto Android…"
npx cap sync android

log "Armando el APK…"

# `gradlew` necesita descargarse Gradle la primera vez; si el servidor no tiene
# salida a internet o ya hay un Gradle instalado, se usa el del sistema.
gradle_de() {
  if [[ -x "$RAIZ/android/gradlew" ]]; then
    (cd android && ./gradlew "$@")
  else
    (cd android && gradle "$@")
  fi
}

# Gradle cachea los recursos ya fusionados y no se entera de los que se borran,
# así que un cambio de iconos puede fallar con "resource not found" hasta que se
# limpia. Se reintenta una vez en limpio antes de darlo por perdido.
if ! gradle_de --quiet assembleDebug; then
  aviso "Falló el primer intento; limpiando y reintentando…"
  gradle_de --quiet clean
  gradle_de --quiet assembleDebug
fi

[[ -f "$APK_COMPILADO" ]] || { aviso "Gradle terminó pero no encuentro $APK_COMPILADO"; exit 1; }

# --- Publicar -------------------------------------------------------------
#
# Se escribe primero a un temporal y luego se mueve: así nadie descarga un
# archivo a medio copiar.
mkdir -p "$DESTINO"
cp "$APK_COMPILADO" "$APK_PUBLICADO.tmp"
mv "$APK_PUBLICADO.tmp" "$APK_PUBLICADO"

VERSION="$(grep -oP 'versionName\s+"\K[^"]+' android/app/build.gradle || echo '1.0')"
cat > "$DESTINO/version.json" <<JSON
{
  "version": "$VERSION",
  "commit": "$COMMIT",
  "publicado": "$(date -Iseconds)"
}
JSON

echo "$COMMIT" > "$SELLO"

TAMANO="$(du -h "$APK_PUBLICADO" | cut -f1)"
log "Publicado: HeraWallet.apk v$VERSION ($TAMANO) — disponible en /descargar/HeraWallet.apk"
