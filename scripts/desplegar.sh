#!/usr/bin/env bash
#
# Despliegue en el servidor: trae los cambios, recompila la web, reinicia el
# backend y deja el APK al día.
#
# El APK se rehace al final y solo si el commit cambió, porque compilar Android
# tarda minutos y no debe retrasar la web. Si el servidor no puede compilarlo,
# el despliegue termina bien igual y se conserva el APK anterior.
#
# Uso:
#   scripts/desplegar.sh              # despliegue normal
#   scripts/desplegar.sh --sin-app    # no tocar el APK
#   PM2_APP=hera scripts/desplegar.sh # si el proceso de pm2 tiene otro nombre

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

PM2_APP="${PM2_APP:-hera-api}"
CON_APP=1
[[ "${1:-}" == "--sin-app" ]] && CON_APP=0

log() { printf '\033[36m[desplegar]\033[0m %s\n' "$*"; }
aviso() { printf '\033[33m[desplegar]\033[0m %s\n' "$*" >&2; }

ANTES="$(git rev-parse --short HEAD)"

# --- Traer cambios --------------------------------------------------------
#
# Se intenta primero sin merge. El servidor arrastra commits propios de antes de
# automatizar el despliegue, así que si no se puede avanzar en línea recta se
# hace el merge —que es lo que ya hace el flujo de GitHub Actions— pero dejando
# constancia de qué había suelto.
RAMA="$(git rev-parse --abbrev-ref HEAD)"
log "Trayendo cambios…"
git fetch --quiet origin

if ! git merge --ff-only "origin/$RAMA" 2>/dev/null; then
  aviso "El servidor tiene commits que no están en origin:"
  git --no-pager log --oneline "origin/$RAMA..HEAD"
  git merge --no-edit "origin/$RAMA"
fi

DESPUES="$(git rev-parse --short HEAD)"

if [[ "$ANTES" == "$DESPUES" ]]; then
  log "Ya estaba en $DESPUES; no hay nada nuevo."
else
  log "$ANTES -> $DESPUES"
fi

# --- Dependencias y compilación ------------------------------------------
if ! git diff --quiet "$ANTES" "$DESPUES" -- package-lock.json package.json 2>/dev/null; then
  log "Cambiaron las dependencias; instalando…"
  npm ci
fi

# Vite vacía el directorio de salida ANTES de escribir nada. Si el build muere
# a mitad —en este servidor, con 1 GB de RAM, lo hace el OOM killer— `dist/`
# se queda sin index.html y el sitio entero devuelve 404: se cae producción
# justo por intentar actualizarla (ocurrió el 20-09-2026).
#
# Por eso se compila aparte y solo se cambia por el bueno si el build terminó
# y el index.html existe de verdad.
NUEVO="dist.nuevo"
ANTERIOR="dist.anterior"

rm -rf "$NUEVO"
log "Compilando la web en $NUEVO…"
if ! npm run build -- --outDir "$NUEVO" --emptyOutDir; then
  rm -rf "$NUEVO"
  aviso "El build falló: producción se queda con la versión anterior, intacta."
  aviso "Si no dio error claro, casi siempre es memoria: comprueba 'free -m'."
  exit 1
fi

if [[ ! -s "$NUEVO/index.html" ]]; then
  rm -rf "$NUEVO"
  aviso "El build terminó sin index.html; no se toca producción."
  exit 1
fi

rm -rf "$ANTERIOR"
[[ -d dist ]] && mv dist "$ANTERIOR"
mv "$NUEVO" dist
log "Web actualizada (la versión anterior queda en $ANTERIOR/ por si hay que volver)."

# --- Reiniciar el backend -------------------------------------------------
#
# Sin este paso el proceso sigue con el código viejo en memoria aunque el
# repositorio ya esté actualizado: la causa más común de "arreglaste algo y
# sigue igual".
if command -v pm2 >/dev/null 2>&1; then
  log "Reiniciando $PM2_APP…"
  pm2 restart "$PM2_APP" --update-env
else
  aviso "pm2 no está instalado: reinicia el backend a mano."
fi

# --- Comprobación ---------------------------------------------------------
sleep 2
VERSION_VIVA="$(curl -fsS --max-time 5 "http://localhost:${PORT:-4000}/api/version" 2>/dev/null || echo '')"
if [[ -n "$VERSION_VIVA" ]]; then
  log "El servidor responde: $VERSION_VIVA"
else
  aviso "No obtuve respuesta de /api/version. Revisa: pm2 logs $PM2_APP"
fi

# --- App Android ----------------------------------------------------------
if [[ $CON_APP -eq 1 ]]; then
  log "Actualizando la app…"
  scripts/publicar-app.sh || aviso "El APK no se pudo rehacer; queda publicado el anterior."
fi

log "Listo."
