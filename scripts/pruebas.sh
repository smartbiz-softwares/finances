#!/usr/bin/env bash
#
# Ejecuta todas las pruebas (*.prueba.ts) y falla si alguna falla.
# Lo usa `npm test` y el flujo de despliegue antes de publicar nada.

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

fallidas=()
for archivo in server/*.prueba.ts src/*.prueba.ts; do
  [[ -f "$archivo" ]] || continue
  if salida="$(npx tsx "$archivo" 2>&1)"; then
    printf '  ok     %s\n' "$archivo"
  else
    printf '  FALLO  %s\n' "$archivo"
    printf '%s\n' "$salida" | grep -E 'FALLO|Error' | head -20 | sed 's/^/         /'
    fallidas+=("$archivo")
  fi
done

if (( ${#fallidas[@]} )); then
  echo ""
  echo "${#fallidas[@]} archivo(s) de pruebas con fallos."
  exit 1
fi
echo ""
echo "Todas las pruebas pasan."
