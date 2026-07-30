import Database from 'better-sqlite3';

console.log('🧹 Iniciando limpieza profunda de la base de datos de producción...');

const db = new Database('hera.db');
db.pragma('journal_mode = WAL');

// Limpiar todas las tablas operativas de usuarios conservando configuración
const resultUsers = db.prepare("DELETE FROM users WHERE role != 'admin'").run();
const resultAccounts = db.prepare("DELETE FROM accounts").run();
const resultTxs = db.prepare("DELETE FROM transactions").run();
const resultGoals = db.prepare("DELETE FROM goals").run();
const resultDebts = db.prepare("DELETE FROM debts").run();
const resultDebtPay = db.prepare("DELETE FROM debt_payments").run();
const resultChat = db.prepare("DELETE FROM chat_messages").run();
const resultNotif = db.prepare("DELETE FROM user_notifications").run();
const resultSubs = db.prepare("DELETE FROM user_subscriptions").run();
const resultCuba = db.prepare("DELETE FROM cuba_payment_requests").run();
const resultTokens = db.prepare("DELETE FROM token_transactions").run();
const resultAudit = db.prepare("DELETE FROM audit_logs").run();

console.log(`✅ Usuarios no administradores eliminados: ${resultUsers.changes}`);
console.log(`✅ Cuentas eliminadas: ${resultAccounts.changes}`);
console.log(`✅ Transacciones eliminadas: ${resultTxs.changes}`);
console.log(`✅ Metas eliminadas: ${resultGoals.changes}`);
console.log(`✅ Deudas eliminadas: ${resultDebts.changes}`);
console.log(`✅ Mensajes de chat eliminados: ${resultChat.changes}`);
console.log(`✅ Notificaciones eliminadas: ${resultNotif.changes}`);
console.log(`✅ Historial de tokens y suscripciones limpiadas.`);
console.log('✨ Base de datos 100% limpia para producción (Planes, Modelos IA, Config Cuba y Admin preservados).');
