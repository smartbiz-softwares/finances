#!/bin/bash
# Script de Configuración Automatizada de MySQL / MariaDB para Producción (setup-mysql.sh)
# Ejecución en VPS: sudo bash setup-mysql.sh [PASSWORD_DESEADO]

set -e

DB_PASS="${1:-HeraWallet2026SecurePass!}"
DB_NAME="hera_db"
DB_USER="hera_user"

echo "🐬 Instalando y configurando MySQL/MariaDB para Producción..."

# 1. Instalar MySQL Server
sudo apt update
sudo apt install -y mysql-server

# 2. Iniciar y habilitar servicio MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 3. Crear base de datos y usuario con permisos
echo "🔐 Creando base de datos '${DB_NAME}' y usuario '${DB_USER}'..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
sudo mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo "✅ Base de datos MySQL '${DB_NAME}' lista."
echo ""
echo "📌 Añade estas líneas al archivo /var/www/finances/.env de tu VPS:"
echo "MYSQL_HOST=127.0.0.1"
echo "MYSQL_PORT=3306"
echo "MYSQL_USER=${DB_USER}"
echo "MYSQL_PASSWORD=${DB_PASS}"
echo "MYSQL_DATABASE=${DB_NAME}"
