#!/bin/bash
# Script de Despliegue Automatizado para HeraWallet (deploy.sh)
# Ejecución: bash deploy.sh

set -e

echo "🚀 Iniciando despliegue de actualización para HeraWallet..."

# 1. Obtener los últimos cambios desde el repositorio remoto
echo "📥 Descargando cambios desde GitHub (git pull)..."
git pull origin main

# 2. Instalar dependencias npm
echo "📦 Instalando/actualizando dependencias npm..."
npm install

# 3. Compilar la aplicación Frontend (Vite -> dist/)
echo "🔨 Compilando el frontend (npm run build)..."
npm run build

# 4. Reiniciar el servidor Backend con PM2
echo "🔄 Reiniciando proceso backend en PM2..."
pm2 restart hera-api || pm2 start tsx --name "hera-api" -- server.ts

echo "✅ ¡Despliegue completado con éxito! La aplicación ya está actualizada en producción."
