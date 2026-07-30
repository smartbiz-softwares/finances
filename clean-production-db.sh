#!/bin/bash
# Script de Limpieza de Datos de Producción (clean-production-db.sh)
# Ejecución: bash clean-production-db.sh

set -e

echo "⚠️  Limpiando datos de usuarios y transacciones en producción..."

# Detener temporalmente el backend
pm2 stop hera-api || true

# Ejecutar limpieza SQL conservando planes, proveedores de IA, admin y config de pagos
npx tsx scripts/cleanDb.ts

# Reiniciar el backend
pm2 restart hera-api || pm2 start tsx --name "hera-api" -- server.ts

echo "🚀 Base de datos lista y limpia para producción."
