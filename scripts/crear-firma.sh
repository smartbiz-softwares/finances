#!/usr/bin/env bash
#
# Crea la clave con la que se firma la app. Se ejecuta UNA sola vez, en el
# servidor que compila.
#
# Por qué hace falta: Android solo instala una actualización encima de otra si
# ambas están firmadas con la misma clave. Hasta ahora se usaba la de
# depuración, que cada máquina se inventa por su cuenta, y por eso un APK nuevo
# fallaba con "no se instaló debido a un conflicto con un paquete".
#
# ⚠️  Esta clave es irreemplazable. Si se pierde, ningún APK futuro podrá
#     instalarse encima de los ya repartidos: habría que cambiar de nombre de
#     paquete y pedirle a todo el mundo que desinstale. Guarda una copia de
#     `android/hera.jks` y de `android/firma.properties` fuera del servidor.
#
# Uso:
#   scripts/crear-firma.sh

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ALMACEN="$RAIZ/android/hera.jks"
PROPIEDADES="$RAIZ/android/firma.properties"

log() { printf '\033[36m[firma]\033[0m %s\n' "$*"; }

if [[ -f "$ALMACEN" || -f "$PROPIEDADES" ]]; then
  echo "Ya existe una clave en $ALMACEN." >&2
  echo "No se toca: sobrescribirla dejaría sin actualizaciones a quien ya tiene la app." >&2
  exit 1
fi

command -v keytool >/dev/null || { echo "Falta keytool (viene con el JDK)." >&2; exit 1; }

# La contraseña se genera sola y queda en firma.properties, que no se sube al
# repositorio. No hay que recordarla, sí hay que respaldarla.
CLAVE="$(head -c 32 /dev/urandom | base64 | tr -d '/+=' | head -c 32)"

log "Generando la clave (válida 10.000 días)…"
keytool -genkeypair -v \
  -keystore "$ALMACEN" \
  -alias hera \
  -keyalg RSA -keysize 4096 -validity 10000 \
  -storepass "$CLAVE" -keypass "$CLAVE" \
  -dname "CN=HeraWallet, OU=HeraWallet, O=HeraWallet, L=, ST=, C=US" >/dev/null

cat > "$PROPIEDADES" <<PROPS
# Generado por scripts/crear-firma.sh. No subir al repositorio.
almacen=hera.jks
alias=hera
claveAlmacen=$CLAVE
claveClave=$CLAVE
PROPS

chmod 600 "$ALMACEN" "$PROPIEDADES"

log "Listo:"
log "  $ALMACEN"
log "  $PROPIEDADES"
echo
echo "Haz una copia de esos dos archivos FUERA del servidor antes de seguir."
echo "Sin ellos no se podrá volver a actualizar la app nunca más."
