import Database from 'better-sqlite3';
import mysql from 'mysql2/promise';

console.log('🧹 Iniciando limpieza profunda de la base de datos de producción...');

async function cleanAll() {
  // 1. Limpieza en SQLite si existe hera.db
  try {
    const db = new Database('hera.db');
    db.pragma('journal_mode = WAL');
    db.prepare("DELETE FROM users WHERE role != 'admin'").run();
    db.prepare("DELETE FROM accounts").run();
    db.prepare("DELETE FROM transactions").run();
    db.prepare("DELETE FROM goals").run();
    db.prepare("DELETE FROM debts").run();
    db.prepare("DELETE FROM debt_payments").run();
    db.prepare("DELETE FROM chat_messages").run();
    db.prepare("DELETE FROM user_notifications").run();
    db.prepare("DELETE FROM user_subscriptions").run();
    db.prepare("DELETE FROM cuba_payment_requests").run();
    db.prepare("DELETE FROM token_transactions").run();
    db.prepare("DELETE FROM audit_logs").run();
    console.log('✅ Base de datos SQLite hera.db limpia.');
  } catch (err: any) {
    console.log('ℹ️ Omitiendo SQLite (no presente o bloqueado).');
  }

  // 2. Limpieza en MySQL si están configuradas las credenciales de entorno
  if (process.env.MYSQL_HOST || process.env.MYSQL_DATABASE) {
    try {
      const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || '127.0.0.1',
        port: Number(process.env.MYSQL_PORT) || 3306,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'hera_db'
      });

      await connection.query("DELETE FROM users WHERE role != 'admin'");
      await connection.query("DELETE FROM accounts");
      await connection.query("DELETE FROM transactions");
      await connection.query("DELETE FROM goals");
      await connection.query("DELETE FROM debts");
      await connection.query("DELETE FROM debt_payments");
      await connection.query("DELETE FROM chat_messages");
      await connection.query("DELETE FROM user_notifications");
      await connection.query("DELETE FROM user_subscriptions");
      await connection.query("DELETE FROM cuba_payment_requests");
      await connection.query("DELETE FROM token_transactions");
      await connection.query("DELETE FROM audit_logs");
      await connection.end();
      console.log('✅ Base de datos MySQL/MariaDB limpia.');
    } catch (err: any) {
      console.log(`ℹ️ MySQL no conectado durante limpieza: ${err.message}`);
    }
  }

  console.log('✨ Base de datos 100% limpia para producción (Planes, Modelos IA, Config Cuba y Admin preservados).');
}

cleanAll().catch(console.error);
