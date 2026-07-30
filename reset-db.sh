#!/bin/bash
# Script para Reiniciar la Base de Datos de HeraWallet (reset-db.sh)
# Ejecución: bash reset-db.sh

set -e

echo "⚠️  ATENCIÓN: Esto reiniciará la base de datos de HeraWallet."
echo "🛑 Deteniendo el servidor backend..."
pm2 stop hera-api || true

echo "🗑️  Eliminando archivos de la base de datos (hera.db)..."
rm -f hera.db hera.db-wal hera.db-shm finances.db finances.db-wal finances.db-shm

echo "🚀 Reiniciando el servidor backend (recreará las tablas de forma limpia)..."
pm2 restart hera-api || pm2 start "npx tsx server.ts" --name "hera-api"

echo "✅ Base de datos reiniciada con éxito y tablas por defecto inicializadas."
