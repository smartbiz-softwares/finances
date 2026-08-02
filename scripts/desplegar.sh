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

PM2_APP="${PM2_APP:-hera}"
CON_APP=1
[[ "${1:-}" == "--sin-app" ]] && CON_APP=0

log() { printf '\033[36m[desplegar]\033[0m %s\n' "$*"; }
aviso() { printf '\033[33m[desplegar]\033[0m %s\n' "$*" >&2; }

ANTES="$(git rev-parse --short HEAD)"

# --- Traer cambios --------------------------------------------------------
#
# `--ff-only` a propósito: si el servidor tiene commits propios, es mejor
# enterarse aquí que descubrir un merge automático raro más tarde.
log "Trayendo cambios…"
git fetch --quiet origin
if ! git merge --ff-only origin/"$(git rev-parse --abbrev-ref HEAD)" 2>/dev/null; then
  aviso "No se pudo avanzar sin merge. El servidor tiene commits locales:"
  git --no-pager log --oneline origin/"$(git rev-parse --abbrev-ref HEAD)"..HEAD
  aviso "Resuélvelo a mano antes de desplegar."
  exit 1
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

log "Compilando la web…"
npm run build

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
