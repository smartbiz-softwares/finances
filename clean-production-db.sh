#!/bin/bash
# Script de Limpieza de Datos de Producción (clean-production-db.sh)
# Ejecución: bash clean-production-db.sh

set -e

echo "⚠️  Limpiando datos de usuarios y transacciones en producción..."

# Detener temporalmente el backend
pm2 stop hera-api || true

# Ejecutar limpieza SQL conservando planes, proveedores de IA, admin y config de pagos
node -e "
const Database = require('better-sqlite3');
const db = new Database('hera.db');

console.log('🧹 Limpiando tablas de datos de usuario...');
db.prepare(\"DELETE FROM users WHERE role != 'admin'\").run();
db.prepare(\"DELETE FROM accounts\").run();
db.prepare(\"DELETE FROM transactions\").run();
db.prepare(\"DELETE FROM goals\").run();
db.prepare(\"DELETE FROM debts\").run();
db.prepare(\"DELETE FROM debt_payments\").run();
db.prepare(\"DELETE FROM chat_messages\").run();
db.prepare(\"DELETE FROM user_notifications\").run();
db.prepare(\"DELETE FROM user_subscriptions\").run();
db.prepare(\"DELETE FROM cuba_payment_requests\").run();
db.prepare(\"DELETE FROM token_transactions\").run();
db.prepare(\"DELETE FROM audit_logs\").run();

console.log('✅ Base de datos limpia conservando Planes, Modelos IA, Config Cuba y Admin.');
"

# Reiniciar el backend
pm2 restart hera-api || pm2 start tsx --name "hera-api" -- server.ts

echo "🚀 Base de datos lista y limpia para producción."
