import mysql from 'mysql2/promise';

export const mysqlConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'hera_db',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  charset: 'utf8mb4'
};

// Connection pool instance
export const pool = mysql.createPool(mysqlConfig);

// Helper query function for MySQL pool
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(sql: string, params: any[] = []): Promise<mysql.ResultSetHeader> {
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

// Initialize MySQL Schema and Tables
export async function initMySQLSchema() {
  console.log('🐬 Inicializando esquemas y tablas de MySQL/MariaDB...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255),
      displayName VARCHAR(255),
      phone VARCHAR(64) UNIQUE,
      photoURL TEXT,
      birthDate VARCHAR(32),
      address TEXT,
      theme VARCHAR(32) DEFAULT 'dark',
      currency VARCHAR(16) DEFAULT 'EUR',
      role VARCHAR(32) DEFAULT 'standard',
      createdAt VARCHAR(64)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id VARCHAR(64) PRIMARY KEY,
      userId VARCHAR(64) NOT NULL,
      type VARCHAR(32) NOT NULL,
      name VARCHAR(255) NOT NULL,
      balance DECIMAL(15,2) DEFAULT 0.00,
      currency VARCHAR(16) DEFAULT 'EUR',
      icon VARCHAR(64),
      color VARCHAR(32),
      INDEX idx_accounts_userId (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(64) PRIMARY KEY,
      userId VARCHAR(64) NOT NULL,
      accountId VARCHAR(64) NOT NULL,
      type VARCHAR(32) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      category VARCHAR(128) NOT NULL,
      description TEXT,
      date VARCHAR(32) NOT NULL,
      receiptUrl TEXT,
      INDEX idx_tx_userId_date (userId, date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS goals (
      id VARCHAR(64) PRIMARY KEY,
      userId VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      targetAmount DECIMAL(15,2) NOT NULL,
      currentAmount DECIMAL(15,2) DEFAULT 0.00,
      deadline VARCHAR(32) NOT NULL,
      weeklyTarget DECIMAL(15,2) DEFAULT 0.00,
      planData TEXT,
      status VARCHAR(32) DEFAULT 'active',
      INDEX idx_goals_userId (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id VARCHAR(64) PRIMARY KEY,
      userId VARCHAR(64) NOT NULL,
      role VARCHAR(32) NOT NULL,
      content LONGTEXT NOT NULL,
      type VARCHAR(32) DEFAULT 'text',
      data LONGTEXT,
      createdAt VARCHAR(64) NOT NULL,
      INDEX idx_chat_userId (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_providers (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      model VARCHAR(128) NOT NULL,
      apiKey TEXT,
      isActive TINYINT(1) DEFAULT 0,
      createdAt VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS debts (
      id VARCHAR(64) PRIMARY KEY,
      userId VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      personOrEntity VARCHAR(255) NOT NULL,
      type VARCHAR(32) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      paidAmount DECIMAL(15,2) DEFAULT 0.00,
      dueDate VARCHAR(32) NOT NULL,
      status VARCHAR(32) DEFAULT 'pending',
      INDEX idx_debts_userId (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_notifications (
      id VARCHAR(64) PRIMARY KEY,
      userId VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(32) DEFAULT 'info',
      actionData TEXT,
      isRead TINYINT(1) DEFAULT 0,
      createdAt VARCHAR(64) NOT NULL,
      INDEX idx_notifications_userId (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS debt_payments (
      id VARCHAR(64) PRIMARY KEY,
      debtId VARCHAR(64) NOT NULL,
      userId VARCHAR(64) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      date VARCHAR(32) NOT NULL,
      createdAt VARCHAR(64) NOT NULL,
      INDEX idx_debt_payments (debtId, userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      userId VARCHAR(64),
      action VARCHAR(128) NOT NULL,
      details TEXT,
      createdAt VARCHAR(64) NOT NULL,
      INDEX idx_audit_userId (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      description TEXT,
      priceMonthly DECIMAL(15,2) NOT NULL,
      priceQuarterly DECIMAL(15,2) NOT NULL,
      priceAnnual DECIMAL(15,2) NOT NULL,
      tokensCount INT NOT NULL,
      renewIntervalHours INT DEFAULT 24,
      isRecommended TINYINT(1) DEFAULT 0,
      isActive TINYINT(1) DEFAULT 1,
      createdAt VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_subscriptions (
      id VARCHAR(64) PRIMARY KEY,
      userId VARCHAR(64) NOT NULL,
      planId VARCHAR(64) NOT NULL,
      billingFrequency VARCHAR(32) DEFAULT 'monthly',
      status VARCHAR(32) DEFAULT 'active',
      tokensLimit INT NOT NULL,
      tokensRemaining INT NOT NULL,
      startDate VARCHAR(64) NOT NULL,
      endDate VARCHAR(64),
      lastRefillDate VARCHAR(64),
      createdAt VARCHAR(64) NOT NULL,
      INDEX idx_user_subscriptions (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cuba_payment_config (
      id INT PRIMARY KEY DEFAULT 1,
      cardNumber VARCHAR(64) NOT NULL,
      cardHolder VARCHAR(128) NOT NULL,
      phoneNumber VARCHAR(64) NOT NULL,
      cupExchangeRate DECIMAL(15,2) DEFAULT 320.00,
      updatedAt VARCHAR(64) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cuba_payment_requests (
      id VARCHAR(64) PRIMARY KEY,
      userId VARCHAR(64) NOT NULL,
      userDisplayName VARCHAR(255),
      userEmail VARCHAR(255),
      userPhone VARCHAR(64),
      planId VARCHAR(64),
      planName VARCHAR(128),
      billingFrequency VARCHAR(32),
      isTopUp TINYINT(1) DEFAULT 0,
      amountUSD DECIMAL(15,2) DEFAULT 0.00,
      amountCUP DECIMAL(15,2) DEFAULT 0.00,
      transactionId VARCHAR(128) NOT NULL,
      status VARCHAR(32) DEFAULT 'pending',
      createdAt VARCHAR(64) NOT NULL,
      INDEX idx_cuba_requests_userId (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS token_transactions (
      id VARCHAR(64) PRIMARY KEY,
      userId VARCHAR(64) NOT NULL,
      type VARCHAR(32) NOT NULL,
      tokens INT NOT NULL,
      amountUSD DECIMAL(15,2) DEFAULT 0.00,
      description TEXT,
      date VARCHAR(32) NOT NULL,
      createdAt VARCHAR(64) NOT NULL,
      INDEX idx_tokens_userId (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('✅ Esquemas y tablas de MySQL/MariaDB inicializados correctamente.');
}
