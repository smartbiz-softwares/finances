// Carga .env ANTES de cualquier otro import: sin esto process.env.STRIPE_SECRET_KEY
// y las credenciales de Twilio llegan vacías y las integraciones quedan mudas.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import nodemailer from 'nodemailer';
import { AgentOrchestrator } from './src/agent/brain/orchestrator.ts';
import { MirrorToneEngine } from './src/agent/profile/mirrorToneEngine.ts';
import { initMySQLSchema } from './src/db/mysql.ts';
import * as notificaciones from './server/notificaciones.ts';
import * as reglasNotificaciones from './server/reglas.ts';
import * as referidos from './server/referidos.ts';
import * as logros from './server/logros.ts';
import * as apertura from './server/apertura.ts';

if (process.env.MYSQL_HOST || process.env.MYSQL_DATABASE) {
  initMySQLSchema().catch(err => console.error('⚠️ [MySQL WARN] Error inicializando esquemas MySQL:', err.message));
}

const app = express();

// Redirección HTTP 301 Permanente de dominios antiguos (ej: mobilerepair.com.uy) a https://herawallet.app
app.use((req, res, next) => {
  const host = (req.headers.host || '').toLowerCase();
  if (
    host.includes('mobilerepair.com.uy') ||
    host.includes('herawallet.com') ||
    host.startsWith('www.herawallet.app')
  ) {
    const targetUrl = `https://herawallet.app${req.originalUrl || ''}`;
    return res.redirect(301, targetUrl);
  }
  next();
});

app.use(cors());
// El webhook de Stripe necesita el cuerpo crudo para poder validar la firma HMAC.
// Debe montarse ANTES de express.json(), o el body llega ya parseado y la firma no cuadra.
app.use('/api/stripe/webhook', express.raw({ type: 'application/json', limit: '2mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Secretos de firma de sesión: SIEMPRE desde el entorno en producción.
// El fallback solo existe para desarrollo local; con él, cualquiera que lea
// el repositorio puede firmar tokens de cualquier usuario.
const JWT_SECRET = process.env.JWT_SECRET || 'hera-secret-key-change-in-production';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'hera-admin-secret-key-prod';
if (!process.env.JWT_SECRET || !process.env.ADMIN_JWT_SECRET) {
  console.warn('⚠️ [Seguridad] JWT_SECRET / ADMIN_JWT_SECRET no definidos en .env: usando valores de desarrollo. NO usar así en producción.');
}
if (!process.env.ADMIN_PASSWORD) {
  console.warn('⚠️ [Seguridad] ADMIN_PASSWORD no definida en .env: el /panel acepta la contraseña de desarrollo. Defínela antes de exponer la app.');
}
if (process.env.OTP_DEBUG === '1') {
  console.warn('🚨 [Seguridad] OTP_DEBUG=1 ACTIVO: los códigos OTP viajan en la respuesta HTTP. SOLO desarrollo.');
}
const db = new Database('hera.db');
db.pragma('journal_mode = WAL');

const agentOrchestrator = new AgentOrchestrator(db);

const ZDSMS_API_KEY = process.env.ZDSMS_API_KEY || '9214|I5rtSK0YQ7gpe87KywFK77cti2sX7nmjbbEN01JC5ddb3577';
const ZDSMS_URL = process.env.ZDSMS_URL || 'https://zdsms.cu/api/v1/message/send';
// Whisper local: URL y timeout configurables. 3.5s no alcanzaba ni para un
// dictado corto en CPU y toda transcripción caía a los respaldos de pago.
const WHISPER_URL = process.env.WHISPER_URL || 'http://127.0.0.1:8080/inference';
const WHISPER_TIMEOUT_MS = Number(process.env.WHISPER_TIMEOUT_MS || 20000);
// Modelo Gemini configurable: gemini-1.5-flash fue retirado por Google (404).
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

// Límite de envío de OTP: cada SMS cuesta dinero. 3 por número y 10 por IP
// cada 10 minutos; por encima, 429.
const otpRateLog = new Map<string, number[]>();
function otpRateExceeded(key: string, max: number): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const hits = (otpRateLog.get(key) || []).filter(t => now - t < windowMs);
  if (hits.length >= max) { otpRateLog.set(key, hits); return true; }
  hits.push(now);
  otpRateLog.set(key, hits);
  return false;
}
// Limpieza periódica para que el mapa no crezca sin límite.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of otpRateLog) {
    const alive = v.filter(t => now - t < 10 * 60 * 1000);
    if (alive.length === 0) otpRateLog.delete(k); else otpRateLog.set(k, alive);
  }
}, 5 * 60 * 1000);

// --- Database Schema Initialization & Indexing ---

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT,
    displayName TEXT,
    phone TEXT UNIQUE,
    photoURL TEXT,
    birthDate TEXT,
    address TEXT,
    theme TEXT DEFAULT 'dark',
    currency TEXT DEFAULT 'EUR',
    role TEXT DEFAULT 'standard',
    createdAt TEXT
  );
`);
try { db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'standard'"); } catch { }
// Paso del onboarding: 0=perfil, 1=cuenta, 2=primer movimiento, 3=completado.
try { db.exec("ALTER TABLE users ADD COLUMN onboardingStep INTEGER DEFAULT 0"); } catch { }


db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    balance REAL DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    icon TEXT,
    color TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_accounts_userId ON accounts(userId);

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    accountId TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    receiptUrl TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_tx_userId_date ON transactions(userId, date);

  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    targetAmount REAL NOT NULL,
    currentAmount REAL DEFAULT 0,
    deadline TEXT NOT NULL,
    weeklyTarget REAL DEFAULT 0,
    planData TEXT,
    status TEXT DEFAULT 'active'
  );
  CREATE INDEX IF NOT EXISTS idx_goals_userId ON goals(userId);

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    data TEXT,
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_chat_userId ON chat_messages(userId);

  CREATE TABLE IF NOT EXISTS ai_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    model TEXT NOT NULL,
    apiKey TEXT NOT NULL,
    isActive INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    personOrEntity TEXT,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    paidAmount REAL DEFAULT 0,
    dueDate TEXT,
    status TEXT DEFAULT 'pending'
  );
  CREATE INDEX IF NOT EXISTS idx_debts_userId ON debts(userId);

  CREATE TABLE IF NOT EXISTS user_notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    actionData TEXT,
    isRead INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_notifications_userId ON user_notifications(userId);

  CREATE TABLE IF NOT EXISTS debt_payments (
    id TEXT PRIMARY KEY,
    debtId TEXT NOT NULL,
    userId TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    note TEXT,
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_debt_payments_debtId ON debt_payments(debtId);

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    userId TEXT,
    action TEXT NOT NULL,
    details TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    priceMonthly REAL DEFAULT 0,
    priceQuarterly REAL DEFAULT 0,
    priceAnnual REAL DEFAULT 0,
    tokensCount INTEGER DEFAULT 100000,
    renewIntervalHours INTEGER DEFAULT 720,
    isRecommended INTEGER DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_subscriptions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL UNIQUE,
    planId TEXT NOT NULL,
    billingFrequency TEXT DEFAULT 'monthly',
    status TEXT DEFAULT 'active',
    tokenBalance INTEGER DEFAULT 0,
    tokensTotalPlan INTEGER DEFAULT 0,
    lastRenewalAt TEXT,
    nextRenewalAt TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_user_sub_userId ON user_subscriptions(userId);

  CREATE TABLE IF NOT EXISTS token_transactions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    tokens INTEGER NOT NULL,
    amountUSD REAL DEFAULT 0,
    description TEXT,
    date TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_token_tx_userId ON token_transactions(userId);

  CREATE TABLE IF NOT EXISTS cuba_payment_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    cardNumber TEXT NOT NULL,
    cardHolder TEXT NOT NULL,
    phoneNumber TEXT NOT NULL,
    cupExchangeRate REAL NOT NULL DEFAULT 320.0,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS cuba_payment_requests (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    userDisplayName TEXT,
    userEmail TEXT,
    userPhone TEXT,
    planId TEXT NOT NULL,
    planName TEXT NOT NULL,
    billingFrequency TEXT DEFAULT 'monthly',
    isTopUp INTEGER DEFAULT 0,
    amountUSD REAL NOT NULL,
    amountCUP REAL NOT NULL,
    transactionId TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    createdAt TEXT,
    processedAt TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_cuba_req_user ON cuba_payment_requests(userId);
  CREATE INDEX IF NOT EXISTS idx_cuba_req_status ON cuba_payment_requests(status);
`);

// Try adding missing columns if tables already existed
try { db.exec(`ALTER TABLE accounts ADD COLUMN currency TEXT DEFAULT 'EUR';`); } catch { }
try { db.exec(`ALTER TABLE accounts ADD COLUMN icon TEXT;`); } catch { }
try { db.exec(`ALTER TABLE accounts ADD COLUMN color TEXT;`); } catch { }
try { db.exec(`ALTER TABLE transactions ADD COLUMN receiptUrl TEXT;`); } catch { }
try { db.exec(`ALTER TABLE goals ADD COLUMN status TEXT DEFAULT 'active';`); } catch { }
try { db.exec(`UPDATE ai_providers SET isActive = 1 WHERE apiKey IS NOT NULL AND apiKey != '';`); } catch { }

// Contabilidad real de tokens: desglose de entrada/salida y coste en USD.
// Antes solo se guardaba un total estimado, imposible de auditar.
try { db.exec(`ALTER TABLE token_transactions ADD COLUMN promptTokens INTEGER DEFAULT 0;`); } catch { }
try { db.exec(`ALTER TABLE token_transactions ADD COLUMN completionTokens INTEGER DEFAULT 0;`); } catch { }
try { db.exec(`ALTER TABLE token_transactions ADD COLUMN cachedTokens INTEGER DEFAULT 0;`); } catch { }
try { db.exec(`ALTER TABLE token_transactions ADD COLUMN costUSD REAL DEFAULT 0;`); } catch { }
try { db.exec(`ALTER TABLE token_transactions ADD COLUMN model TEXT;`); } catch { }
// Deuda: consumo que excedió el saldo disponible. Sin esto el descubierto
// se perdía silenciosamente al recortar el saldo a cero.
try { db.exec(`ALTER TABLE user_subscriptions ADD COLUMN tokenDebt INTEGER DEFAULT 0;`); } catch { }

// --- Telemetría de uso: sesiones, presencia y tráfico ---
db.exec(`
  CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    ip TEXT,
    userAgent TEXT,
    device TEXT,
    startedAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(userId, startedAt);

  CREATE TABLE IF NOT EXISTS traffic_hourly (
    hour TEXT PRIMARY KEY,
    requests INTEGER DEFAULT 0,
    users INTEGER DEFAULT 0
  );
`);
// Última actividad del usuario, para presencia en tiempo real.
try { db.exec('ALTER TABLE users ADD COLUMN lastSeenAt TEXT'); } catch { }

// Marca de hora real del registro (migración: la tabla ya existe aquí).
// Sin ella el timeline solo podía ordenar por `date` (YYYY-MM-DD) y desempatar
// por un id aleatorio: dentro del mismo día el orden salía arbitrario en vez
// de "lo más nuevo primero".
try { db.exec("ALTER TABLE transactions ADD COLUMN createdAt TEXT"); } catch { }
// Los movimientos anteriores a esta columna se ordenan por su fecha.
try { db.exec("UPDATE transactions SET createdAt = date || 'T12:00:00.000Z' WHERE createdAt IS NULL OR createdAt = ''"); } catch { }
try { db.exec("CREATE INDEX IF NOT EXISTS idx_tx_userId_created ON transactions(userId, createdAt)"); } catch { }

// Try adding default AI provider if empty
const providerCount = (db.prepare('SELECT COUNT(*) as count FROM ai_providers').get() as any).count;
if (providerCount === 0) {
  const geminiEnvKey = process.env.GEMINI_API_KEY || '';
  db.prepare(`
    INSERT INTO ai_providers (id, name, model, apiKey, isActive, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), 'Google Gemini', GEMINI_MODEL, geminiEnvKey, 1, new Date().toISOString());

  db.prepare(`
    INSERT INTO ai_providers (id, name, model, apiKey, isActive, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), 'DeepSeek', 'deepseek-chat', '', 0, new Date().toISOString());
}

// Plan Free: el plan de entrada de todo usuario nuevo. Se siembra SIEMPRE que
// falte (no solo con la tabla vacía) y sus tokens/intervalo son editables
// desde /panel como cualquier otro plan.
db.prepare(`
  INSERT OR IGNORE INTO subscription_plans (id, name, description, priceMonthly, priceQuarterly, priceAnnual, tokensCount, renewIntervalHours, isRecommended, isActive, createdAt)
  VALUES ('plan-free', 'Plan Gratuito', 'Empieza a controlar tus finanzas con IA sin coste. Tus tokens se renuevan automáticamente cada 30 días.', 0, 0, 0, 25000, 720, 0, 1, ?)
`).run(new Date().toISOString());

// Seed default subscription plans if empty
const planCount = (db.prepare('SELECT COUNT(*) as count FROM subscription_plans WHERE id != \'plan-free\'').get() as any).count;
if (planCount === 0) {
  db.prepare(`
    INSERT INTO subscription_plans (id, name, description, priceMonthly, priceQuarterly, priceAnnual, tokensCount, renewIntervalHours, isRecommended, isActive, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'plan-basic',
    'Plan Básico',
    'Ideal para usuarios ocasionales que buscan control financiero inteligente.',
    4.99,
    12.99,
    44.99,
    50000,
    720,
    0,
    1,
    new Date().toISOString()
  );

  db.prepare(`
    INSERT INTO subscription_plans (id, name, description, priceMonthly, priceQuarterly, priceAnnual, tokensCount, renewIntervalHours, isRecommended, isActive, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'plan-pro',
    'Plan Pro',
    'Recomendado para un control total diario con análisis de IA ilimitados y alertas activas.',
    14.99,
    39.99,
    129.99,
    250000,
    720,
    1,
    1,
    new Date().toISOString()
  );

  db.prepare(`
    INSERT INTO subscription_plans (id, name, description, priceMonthly, priceQuarterly, priceAnnual, tokensCount, renewIntervalHours, isRecommended, isActive, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'plan-enterprise',
    'Plan Empresarial',
    'Para empresas y emprendedores con múltiples cuentas, alto volumen de operaciones y firmas.',
    39.99,
    109.99,
    349.99,
    1000000,
    720,
    0,
    1,
    new Date().toISOString()
  );
}

// Log action helper
function logAudit(userId: string | null, action: string, details?: string) {
  try {
    db.prepare('INSERT INTO audit_logs (id, userId, action, details, createdAt) VALUES (?, ?, ?, ?, ?)').run(
      randomUUID(), userId, action, details || '', new Date().toISOString()
    );
  } catch { }
}

/* ============================================================
   CONTABILIDAD DE TOKENS
   Punto único de cobro. Los tokens que se descuentan al usuario
   son los que el proveedor reporta en `usage`, no una estimación.
   ============================================================ */

/**
 * Precio de DeepSeek en USD por millón de tokens.
 * Verificar contra https://api-docs.deepseek.com/quick_start/pricing
 * antes de fiarse de los importes: DeepSeek ha cambiado tarifas varias veces.
 * Se puede sobrescribir por entorno sin tocar el código.
 */
const DEEPSEEK_PRICING = {
  inputCacheMissPerM: Number(process.env.DEEPSEEK_PRICE_INPUT_MISS ?? 0.27),
  inputCacheHitPerM: Number(process.env.DEEPSEEK_PRICE_INPUT_HIT ?? 0.07),
  outputPerM: Number(process.env.DEEPSEEK_PRICE_OUTPUT ?? 1.10)
};

interface ProviderUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedPromptTokens: number;
}

/** Coste real en USD de un consumo, separando caché de entrada. */
function usageCostUSD(u: ProviderUsage): number {
  const cached = Math.min(u.cachedPromptTokens || 0, u.promptTokens || 0);
  const uncached = Math.max(0, (u.promptTokens || 0) - cached);
  return (
    (uncached * DEEPSEEK_PRICING.inputCacheMissPerM +
      cached * DEEPSEEK_PRICING.inputCacheHitPerM +
      (u.completionTokens || 0) * DEEPSEEK_PRICING.outputPerM) / 1_000_000
  );
}

/**
 * Whisper en la nube se factura por duración de audio, no por tokens.
 * Se estima la duración a partir del tamaño del buffer (los códecs de voz del
 * navegador rondan los 16 KB/s) y se convierte el coste a tokens equivalentes
 * usando el precio de salida de DeepSeek, para que el saldo del usuario siga
 * siendo una única unidad. Es una aproximación, y por eso queda registrada con
 * su propio tipo de transacción.
 */
const WHISPER_BYTES_PER_SECOND = Number(process.env.WHISPER_BYTES_PER_SECOND ?? 16000);
const WHISPER_USD_PER_MINUTE = Number(process.env.WHISPER_USD_PER_MINUTE ?? 0.006);

function whisperUsageEquivalent(audioBytes: number): ProviderUsage {
  const seconds = Math.max(1, audioBytes / WHISPER_BYTES_PER_SECOND);
  const costUSD = (seconds / 60) * WHISPER_USD_PER_MINUTE;
  const equivalentTokens = Math.ceil((costUSD * 1_000_000) / DEEPSEEK_PRICING.outputPerM);
  return {
    promptTokens: 0,
    completionTokens: equivalentTokens,
    totalTokens: equivalentTokens,
    cachedPromptTokens: 0
  };
}

/** Consumo reportado por Gemini, que usa otros nombres de campo. */
function geminiUsage(raw: any): ProviderUsage {
  const m = raw?.usageMetadata || {};
  const prompt = m.promptTokenCount ?? 0;
  const completion = m.candidatesTokenCount ?? 0;
  return {
    promptTokens: prompt,
    completionTokens: completion,
    totalTokens: m.totalTokenCount ?? prompt + completion,
    cachedPromptTokens: m.cachedContentTokenCount ?? 0
  };
}

/** Convierte una respuesta cruda del proveedor al formato interno. */
function readProviderUsage(raw: any): ProviderUsage {
  const usage = raw?.usage || {};
  const prompt = usage.prompt_tokens ?? 0;
  const completion = usage.completion_tokens ?? 0;
  return {
    promptTokens: prompt,
    completionTokens: completion,
    totalTokens: usage.total_tokens ?? prompt + completion,
    cachedPromptTokens: usage.prompt_cache_hit_tokens ?? 0
  };
}

const FOUNDER_BALANCE = 999999999;

/**
 * Devuelve la suscripción del usuario, creándola con el Plan Gratuito si no
 * existe. Nadie recibe un plan de pago sin pagar: los planes de pago solo se
 * asignan vía Stripe o transferencia verificada.
 */
function getOrCreateSubscription(userId: string): any {
  let sub = db.prepare('SELECT * FROM user_subscriptions WHERE userId = ?').get(userId) as any;
  if (sub) return sub;

  const defaultPlan = db.prepare("SELECT * FROM subscription_plans WHERE id = 'plan-free'").get() as any;
  const planId = defaultPlan?.id || 'plan-free';
  const totalTokens = defaultPlan?.tokensCount ?? 25000;
  const subId = randomUUID();
  const now = new Date();
  const nextRenewal = new Date(now.getTime() + (defaultPlan?.renewIntervalHours || 720) * 3600000);

  db.prepare(`
    INSERT INTO user_subscriptions (id, userId, planId, billingFrequency, status, tokenBalance, tokensTotalPlan, lastRenewalAt, nextRenewalAt)
    VALUES (?, ?, ?, 'monthly', 'active', ?, ?, ?, ?)
  `).run(subId, userId, planId, totalTokens, totalTokens, now.toISOString(), nextRenewal.toISOString());

  return db.prepare('SELECT * FROM user_subscriptions WHERE id = ?').get(subId) as any;
}

/** Los fundadores no consumen saldo. */
function isFounder(userId: string): boolean {
  const u = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
  return u?.role === 'founder';
}

/**
 * Comprueba que el usuario puede lanzar una operación de IA.
 * Exige un colchón mínimo en lugar de `saldo > 0`: con un solo token
 * restante se podía disparar una consulta de coste ilimitado.
 */
function canSpendTokens(userId: string, minimumRequired = 1500): { ok: boolean; sub: any; error?: string } {
  if (isFounder(userId)) return { ok: true, sub: getOrCreateSubscription(userId) };

  const sub = getOrCreateSubscription(userId);
  if ((sub.tokenBalance || 0) < minimumRequired) {
    return {
      ok: false,
      sub,
      error: 'Has agotado tus tokens disponibles. Por favor recarga más tokens o actualiza tu plan en Configuración para continuar consultando a Hera.'
    };
  }
  return { ok: true, sub };
}

/**
 * Descuenta consumo real y lo registra. Atómico: el UPDATE resuelve el saldo
 * en la propia base de datos, así dos peticiones simultáneas no pueden leer
 * el mismo valor y sobrescribirse.
 */
function chargeTokens(opts: {
  userId: string;
  usage: ProviderUsage;
  type: string;
  description: string;
  model?: string;
}): { charged: number; remaining: number; debt: number; costUSD: number } {
  const { userId, usage, type, description } = opts;
  const model = opts.model || 'deepseek-chat';
  const charged = Math.max(0, Math.round(usage.totalTokens || 0));
  const costUSD = usageCostUSD(usage);
  const nowISO = new Date().toISOString();

  const apply = db.transaction(() => {
    getOrCreateSubscription(userId);

    if (!isFounder(userId)) {
      const before = db.prepare('SELECT tokenBalance FROM user_subscriptions WHERE userId = ?').get(userId) as any;
      const balance = before?.tokenBalance || 0;
      const deducted = Math.min(balance, charged);
      // Lo que excede el saldo no desaparece: queda como deuda y se
      // descuenta de la próxima recarga o renovación.
      const overspend = charged - deducted;

      db.prepare(`
        UPDATE user_subscriptions
        SET tokenBalance = tokenBalance - ?, tokenDebt = COALESCE(tokenDebt, 0) + ?
        WHERE userId = ?
      `).run(deducted, overspend, userId);
    }

    db.prepare(`
      INSERT INTO token_transactions
        (id, userId, type, tokens, amountUSD, description, date, createdAt,
         promptTokens, completionTokens, cachedTokens, costUSD, model)
      VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(), userId, type, -charged, description,
      nowISO.split('T')[0], nowISO,
      usage.promptTokens || 0, usage.completionTokens || 0,
      usage.cachedPromptTokens || 0, costUSD, model
    );

    const after = db.prepare('SELECT tokenBalance, tokenDebt FROM user_subscriptions WHERE userId = ?').get(userId) as any;
    return { remaining: after?.tokenBalance || 0, debt: after?.tokenDebt || 0 };
  });

  const result = apply();
  return { charged, remaining: result.remaining, debt: result.debt, costUSD };
}

/** Meses que cubre cada frecuencia de facturación. */
const BILLING_CYCLES: Record<string, { months: number; label: string }> = {
  monthly: { months: 1, label: 'mensual' },
  quarterly: { months: 3, label: 'trimestral' },
  annual: { months: 12, label: 'anual' }
};

function normalizeFrequency(raw: any): string {
  const f = String(raw || 'monthly').toLowerCase();
  return BILLING_CYCLES[f] ? f : 'monthly';
}

/**
 * Acredita tokens al usuario. Salda primero la deuda acumulada por consumo
 * que excedió el saldo, y sube `tokensTotalPlan` para que la barra de
 * consumo del frontend siga siendo coherente.
 */
function creditTokens(userId: string, tokens: number): { credited: number; debtCleared: number } {
  const apply = db.transaction(() => {
    const sub = getOrCreateSubscription(userId);
    const debt = sub.tokenDebt || 0;
    const debtCleared = Math.min(debt, tokens);
    const credited = tokens - debtCleared;

    db.prepare(`
      UPDATE user_subscriptions
      SET tokenBalance = tokenBalance + ?,
          tokensTotalPlan = COALESCE(tokensTotalPlan, 0) + ?,
          tokenDebt = COALESCE(tokenDebt, 0) - ?
      WHERE userId = ?
    `).run(credited, tokens, debtCleared, userId);

    return { credited, debtCleared };
  });
  return apply();
}

/**
 * Renovación automática de suscripciones vencidas.
 * No existía: los planes daban tokens una sola vez, al pagar, mientras la
 * interfaz prometía "Tu plan renueva el {fecha}".
 */
function runSubscriptionRenewals(): void {
  const nowISO = new Date().toISOString();
  const due = db.prepare(`
    SELECT s.*, p.tokensCount, p.renewIntervalHours
    FROM user_subscriptions s
    LEFT JOIN subscription_plans p ON s.planId = p.id
    WHERE s.status = 'active' AND s.nextRenewalAt IS NOT NULL AND s.nextRenewalAt <= ?
  `).all(nowISO) as any[];

  for (const sub of due) {
    try {
      const frequency = normalizeFrequency(sub.billingFrequency);
      const months = BILLING_CYCLES[frequency].months;
      const tokens = (sub.tokensCount || 250000) * months;
      const next = new Date(Date.now() + (sub.renewIntervalHours || 720) * months * 3600000);

      // El saldo no se acumula entre ciclos: la renovación repone la cuota,
      // no la suma indefinidamente. La deuda pendiente sí se descuenta.
      const debt = sub.tokenDebt || 0;
      const newBalance = Math.max(0, tokens - debt);

      db.prepare(`
        UPDATE user_subscriptions
        SET tokenBalance = ?, tokensTotalPlan = ?, tokenDebt = ?, lastRenewalAt = ?, nextRenewalAt = ?
        WHERE userId = ?
      `).run(newBalance, tokens, Math.max(0, debt - tokens), nowISO, next.toISOString(), sub.userId);

      db.prepare(`
        INSERT INTO token_transactions (id, userId, type, tokens, amountUSD, description, date, createdAt)
        VALUES (?, ?, 'subscription_renewal', ?, 0, ?, ?, ?)
      `).run(
        randomUUID(), sub.userId, newBalance,
        `Renovación automática ${BILLING_CYCLES[frequency].label}`,
        nowISO.split('T')[0], nowISO
      );

      db.prepare(`
        INSERT INTO user_notifications (id, userId, title, message, type, actionData, isRead, createdAt)
        VALUES (?, ?, ?, ?, 'success', ?, 0, ?)
      `).run(
        randomUUID(), sub.userId, 'Plan renovado',
        `Tu plan se ha renovado con ${newBalance.toLocaleString()} tokens disponibles.`,
        JSON.stringify({ actionType: 'open_settings', label: 'Ver Suscripción' }), nowISO
      );

      logAudit(sub.userId, 'subscription_renewal', `Renovación ${frequency}: ${newBalance} tokens`);
    } catch (e: any) {
      console.error(`[Renewals] Error renovando la suscripción de ${sub.userId}:`, e.message);
    }
  }

  if (due.length > 0) {
    console.log(`[Renewals] ${due.length} suscripción(es) renovada(s).`);
  }
}

// Al arrancar y cada hora: cubre los ciclos vencidos mientras el proceso
// estuvo caído, cosa que un cron externo puro no garantiza.
runSubscriptionRenewals();
setInterval(runSubscriptionRenewals, 3600 * 1000);

// Seed default financial portfolio for user if no accounts exist
// --- Helpers ---

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// --- Envío del código por correo ---

/** Normaliza y valida una dirección de correo. */
function normalizeEmail(raw: string): string | null {
  const email = String(raw || '').trim().toLowerCase();
  // Validación deliberadamente simple: lo que importa es que exista un buzón
  // al otro lado, y eso solo lo demuestra el propio código de verificación.
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return null;
  return email;
}

let mailTransport: nodemailer.Transporter | null = null;
function getMailTransport(): nodemailer.Transporter | null {
  if (mailTransport) return mailTransport;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  mailTransport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    // 465 es SSL directo; el resto de puertos negocian TLS con STARTTLS.
    secure: Number(SMTP_PORT || 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return mailTransport;
}

/** Envía el código de verificación por correo. Devuelve si se entregó. */
async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  const transport = getMailTransport();
  if (!transport) {
    console.warn('⚠️ [Correo] SMTP no configurado (SMTP_HOST, SMTP_USER, SMTP_PASS). El código queda solo en consola.');
    return false;
  }

  const from = process.env.SMTP_FROM || `HeraWallet <${process.env.SMTP_USER}>`;

  try {
    await transport.sendMail({
      from,
      to,
      subject: `${code} es tu código de HeraWallet`,
      text: `Tu código de verificación para HeraWallet es: ${code}\n\nCaduca en 10 minutos. Si no has solicitado este código, ignora este mensaje.`,
      // Estilos en línea: los clientes de correo ignoran las hojas de estilo.
      html: `
        <div style="background:#20201F;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
          <div style="max-width:440px;margin:0 auto;background:#2C2C2A;border:1px solid #3A3A38;border-radius:20px;padding:36px;text-align:center">
            <p style="margin:0 0 6px;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#D97757;font-weight:700">HeraWallet</p>
            <h1 style="margin:0 0 22px;font-family:Georgia,serif;font-size:23px;font-weight:600;color:#ECE7E1">Tu código de acceso</h1>
            <div style="background:#20201F;border:1px solid #D97757;border-radius:14px;padding:20px;margin-bottom:22px">
              <span style="font-family:'SF Mono',monospace;font-size:38px;font-weight:700;letter-spacing:.22em;color:#D97757">${code}</span>
            </div>
            <p style="margin:0 0 8px;font-size:14px;color:#B4AEA8;line-height:1.6">Caduca en 10 minutos.</p>
            <p style="margin:0;font-size:12px;color:#8B857E;line-height:1.6">Si no has pedido este código, ignora este mensaje. Nadie puede entrar en tu cuenta sin él.</p>
          </div>
          <p style="max-width:440px;margin:18px auto 0;text-align:center;font-size:11px;color:#8B857E">Tus metas empiezan con un mejor control.</p>
        </div>`,
    });
    console.log(`✅ [Correo] Código enviado a ${to}`);
    return true;
  } catch (err: any) {
    console.error(`❌ [Correo] No se pudo enviar a ${to}:`, err.message);
    return false;
  }
}

function phoneToEmail(phone: string): string {
  return phone.replace(/[^0-9]/g, '') + '@hera.app';
}

/** IP real del cliente detrás de Nginx. */
function clientIpOf(req: any): string {
  return (req.headers['x-real-ip'] as string)
    || (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.ip
    || 'desconocida';
}

/** Familia de dispositivo a partir del User-Agent, sin librerías. */
function deviceOf(userAgent: string): string {
  const ua = (userAgent || '').toLowerCase();
  if (/iphone|ipod/.test(ua)) return 'iPhone';
  if (/ipad/.test(ua)) return 'iPad';
  if (/android/.test(ua)) return /mobile/.test(ua) ? 'Android' : 'Android Tablet';
  if (/windows/.test(ua)) return 'Windows';
  if (/macintosh|mac os/.test(ua)) return 'Mac';
  if (/linux/.test(ua)) return 'Linux';
  return 'Otro';
}

// Presencia y tráfico: se acumulan en memoria y se vuelcan cada 30s para no
// escribir en disco en cada petición.
const presenceBuffer = new Map<string, number>();
let trafficBuffer = 0;

function flushTelemetry() {
  try {
    if (presenceBuffer.size > 0) {
      const stmt = db.prepare('UPDATE users SET lastSeenAt = ? WHERE id = ?');
      const apply = db.transaction((entries: [string, number][]) => {
        for (const [userId, ts] of entries) stmt.run(new Date(ts).toISOString(), userId);
      });
      apply([...presenceBuffer.entries()]);
      presenceBuffer.clear();
    }
    if (trafficBuffer > 0) {
      const hour = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
      const activeUsers = (db.prepare(
        "SELECT COUNT(*) as c FROM users WHERE lastSeenAt >= datetime('now', '-1 hour')"
      ).get() as any)?.c || 0;
      db.prepare(`
        INSERT INTO traffic_hourly (hour, requests, users) VALUES (?, ?, ?)
        ON CONFLICT(hour) DO UPDATE SET requests = requests + excluded.requests, users = excluded.users
      `).run(hour, trafficBuffer, activeUsers);
      trafficBuffer = 0;
    }
  } catch (e: any) {
    console.error('[Telemetría] Error al volcar métricas:', e.message);
  }
}
setInterval(flushTelemetry, 30000);

function authMiddleware(req: any, res: any, next: any) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET) as any;
    req.userId = decoded.userId;
    presenceBuffer.set(decoded.userId, Date.now());
    trafficBuffer++;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function adminAuthMiddleware(req: any, res: any, next: any) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado como Administrador' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), ADMIN_JWT_SECRET) as any;
    if (decoded.role !== 'admin') throw new Error('Sin rol admin');
    req.adminId = decoded.adminId;
    next();
  } catch {
    return res.status(401).json({ error: 'Token de administrador inválido' });
  }
}

async function sendZDSMS(phone: string, message: string): Promise<boolean> {
  try {
    const res = await fetch(ZDSMS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZDSMS_API_KEY}`
      },
      body: JSON.stringify({ recipient: phone, mstext: message })
    });
    const text = await res.text();
    console.log(`[ZDSMS] SMS a ${phone}: ${res.status} ${text}`);
    return res.ok;
  } catch (err) {
    console.error(`[ZDSMS Error]:`, err);
    return false;
  }
}

async function sendTwilioSMS(toPhone: string, message: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!accountSid || !authToken || (!fromPhone && !messagingServiceSid)) {
    console.warn('⚠️ [Twilio] Credenciales no configuradas. Define TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_PHONE_NUMBER en .env');
    return false;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const params = new URLSearchParams();
    params.append('To', toPhone);
    if (messagingServiceSid) {
      params.append('MessagingServiceSid', messagingServiceSid);
    } else if (fromPhone) {
      params.append('From', fromPhone);
    }
    params.append('Body', message);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await res.json() as any;
    if (res.ok) {
      console.log(`✅ [Twilio SMS] Código enviado exitosamente a ${toPhone} (SID: ${data.sid})`);
      return true;
    } else {
      console.error(`❌ [Twilio SMS Error] ${data.status} - ${data.message} (Código: ${data.code})`);
      return false;
    }
  } catch (err) {
    console.error(`❌ [Twilio Exception] Error al contactar API de Twilio:`, err);
    return false;
  }
}

async function sendSMS(cleanPhone: string, message: string): Promise<boolean> {
  const isCuba = cleanPhone.startsWith('+53') || cleanPhone.startsWith('53');

  if (isCuba) {
    console.log(`📱 [SMS Routing] Detectado número de Cuba (${cleanPhone}). Utilizando ZDSMS...`);
    const recipient = cleanPhone.replace(/^\+/, '');
    const success = await sendZDSMS(recipient, message);
    if (success) return true;

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      console.log(`⚠️ [SMS Routing] Falló ZDSMS para Cuba. Intentando envío alternativo vía Twilio...`);
      return await sendTwilioSMS(cleanPhone, message);
    }
    return false;
  } else {
    console.log(`🌐 [SMS Routing] Detectado número internacional (${cleanPhone}). Utilizando Twilio...`);
    return await sendTwilioSMS(cleanPhone, message);
  }
}

// --- AI API Keys Management Endpoints ---

app.get('/api/settings/ai-keys', authMiddleware, (req: any, res) => {
  const providers = db.prepare('SELECT name, model, apiKey, isActive FROM ai_providers').all();
  res.json(providers);
});

app.post('/api/settings/ai-keys', authMiddleware, (req: any, res) => {
  const { provider, apiKey } = req.body;
  if (!provider) return res.status(400).json({ error: 'Proveedor requerido' });

  const cleanKey = (apiKey || '').trim();
  if (provider.toLowerCase().includes('deepseek')) {
    process.env.DEEPSEEK_API_KEY = cleanKey;
    db.prepare("UPDATE ai_providers SET apiKey = ?, isActive = ? WHERE name LIKE '%DeepSeek%'").run(cleanKey, cleanKey ? 1 : 0);
  } else if (provider.toLowerCase().includes('gemini')) {
    process.env.GEMINI_API_KEY = cleanKey;
    db.prepare("UPDATE ai_providers SET apiKey = ?, isActive = ? WHERE name LIKE '%Gemini%'").run(cleanKey, cleanKey ? 1 : 0);
  }

  logAudit(req.userId, 'update_ai_key', `Clave de ${provider} actualizada`);
  res.json({ success: true, message: `Clave API de ${provider} actualizada` });
});

// --- DB Function Calling Tools for AI (Strict Row-Level Isolation by userId) ---

function getDBUserSummary(userId: string) {
  const accounts = db.prepare('SELECT type, SUM(balance) as total FROM accounts WHERE userId = ? GROUP BY type').all(userId) as any[];
  const txs = db.prepare('SELECT type, SUM(amount) as total FROM transactions WHERE userId = ? GROUP BY type').all(userId) as any[];

  let totalBalance = 0;
  accounts.forEach(a => { totalBalance += a.total; });

  let totalIncome = 0;
  let totalExpense = 0;
  txs.forEach(t => {
    if (t.type === 'income') totalIncome += t.total;
    if (t.type === 'expense') totalExpense += t.total;
  });

  return { totalBalance, totalIncome, totalExpense, netWorth: totalBalance };
}

function getDBTransactions(userId: string, limit = 20) {
  return db.prepare(`
    SELECT t.*, a.name as accountName 
    FROM transactions t 
    LEFT JOIN accounts a ON t.accountId = a.id 
    WHERE t.userId = ?
    ORDER BY COALESCE(t.createdAt, t.date) DESC, t.rowid DESC
    LIMIT ?
  `).all(userId, limit);
}

function getDBAccounts(userId: string) {
  return db.prepare('SELECT * FROM accounts WHERE userId = ? ORDER BY balance DESC').all(userId);
}

function getDBGoals(userId: string) {
  return db.prepare('SELECT * FROM goals WHERE userId = ? ORDER BY deadline ASC').all(userId);
}

function getDBDebts(userId: string) {
  return db.prepare('SELECT * FROM debts WHERE userId = ? ORDER BY dueDate ASC').all(userId);
}

function calculateLostMoney(userId: string) {
  const duplicates = db.prepare(`
    SELECT description, category, amount, COUNT(*) as count 
    FROM transactions 
    WHERE userId = ? AND type = 'expense' 
    GROUP BY description, amount 
    HAVING COUNT(*) > 1
  `).all(userId) as any[];

  const subscriptions = db.prepare(`
    SELECT * FROM transactions 
    WHERE userId = ? AND (category LIKE '%Suscrip%' OR description LIKE '%Netflix%' OR description LIKE '%Spotify%' OR description LIKE '%Gimnasio%')
  `).all(userId) as any[];

  let potentialSavings = 0;
  duplicates.forEach(d => { potentialSavings += d.amount * (d.count - 1); });
  subscriptions.forEach(s => { potentialSavings += s.amount * 0.3; });

  return {
    duplicates,
    subscriptions,
    potentialSavings: Math.round(potentialSavings * 100) / 100
  };
}

// --- Auth Routes ---

/**
 * Envía el código de verificación por el canal que elija la persona.
 *
 * Acepta { phone } o { email }. El resto del flujo es idéntico: mismo código
 * de seis dígitos, mismo almacén, mismos límites y misma verificación. Solo
 * cambia por dónde viaja.
 */
app.post('/api/send-otp', async (req, res) => {
  const { phone, email } = req.body || {};

  // El canal se deduce de lo que llega, no de un campo aparte: menos formas
  // de que cliente y servidor se contradigan.
  let channel: 'phone' | 'email';
  let identifier: string;

  if (email) {
    const clean = normalizeEmail(email);
    if (!clean) return res.status(400).json({ error: 'Correo electrónico inválido' });
    channel = 'email';
    identifier = clean;
  } else if (phone) {
    if (typeof phone !== 'string') return res.status(400).json({ error: 'Número telefónico inválido' });
    let cleanPhone = phone.replace(/^\++/, '+').trim().replace(/\s+/g, '');
    if (!cleanPhone.startsWith('+')) cleanPhone = '+' + cleanPhone;
    if (!cleanPhone.match(/^\+[0-9]{7,15}$/)) {
      return res.status(400).json({ error: 'Número telefónico inválido' });
    }
    channel = 'phone';
    identifier = cleanPhone;
  } else {
    return res.status(400).json({ error: 'Indica un teléfono o un correo electrónico' });
  }

  const clientIp = clientIpOf(req);
  if (otpRateExceeded(`${channel}:${identifier}`, 3) || otpRateExceeded(`ip:${clientIp}`, 10)) {
    logAudit(null, 'otp_rate_limited', `Bloqueado envío de OTP: ${identifier} desde ${clientIp}`);
    return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos antes de pedir otro código.' });
  }

  const code = generateOTP();
  otpStore.set(identifier, { code, expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 });

  logAudit(null, 'send_otp', `OTP generado para ${identifier} (${channel})`);
  console.log(`🔑 [OTP GENERADO] Código: ${code} -> ${identifier} (${channel})`);

  const delivered = channel === 'email'
    ? await sendOtpEmail(identifier, code)
    : await sendSMS(identifier, `Tu codigo de verificacion para HeraWallet es: ${code}`);

  if (!delivered) {
    console.warn(`⚠️ [OTP WARN] No se pudo entregar a ${identifier}. El código sigue activo en consola.`);
  }

  // El código JAMÁS viaja en la respuesta en producción: eso permitiría
  // entrar con cualquier identidad sin recibir el mensaje. Solo se expone
  // con OTP_DEBUG=1 para desarrollo local.
  const payload: any = {
    success: true,
    channel,
    identifier,
    // Se mantiene `phone` por compatibilidad con clientes antiguos.
    phone: channel === 'phone' ? identifier : undefined,
    email: channel === 'email' ? identifier : undefined,
    message: channel === 'email'
      ? 'Código enviado a tu correo'
      : 'Código de verificación enviado exitosamente',
  };
  if (process.env.OTP_DEBUG === '1') payload.code = code;
  res.json(payload);
});

function getCurrencyFromPhone(phone: string): string {
  const clean = phone.replace(/[^0-9+]/g, '');
  if (clean.startsWith('+53') || clean.startsWith('53')) return 'USD';
  if (clean.startsWith('+34') || clean.startsWith('34')) return 'EUR';
  if (clean.startsWith('+1') || clean.startsWith('1')) return 'USD';
  if (clean.startsWith('+52') || clean.startsWith('52')) return 'MXN';
  if (clean.startsWith('+54') || clean.startsWith('54')) return 'ARS';
  if (clean.startsWith('+57') || clean.startsWith('57')) return 'COP';
  if (clean.startsWith('+56') || clean.startsWith('56')) return 'CLP';
  if (clean.startsWith('+44') || clean.startsWith('44')) return 'GBP';
  return 'USD';
}

/**
 * Fecha de hoy en la zona horaria del usuario.
 *
 * Racha y logros se cuentan por días, y un día tiene que ser el suyo: a las
 * 22:00 en La Habana, en UTC ya es mañana, y la racha se rompería sola.
 */
function hoyDe(userId: string): string {
  const prefs = notificaciones.preferencias(db, userId);
  return notificaciones.fechaLocal(prefs?.zonaHoraria || 'America/Havana');
}

/** Revisa los logros del usuario y anota en su campana los que sean nuevos. */
function revisarLogros(userId: string) {
  const nuevos = logros.revisar(db, userId, hoyDe(userId));

  for (const logro of nuevos) {
    db.prepare(`
      INSERT INTO user_notifications (id, userId, title, message, type, actionData, isRead, createdAt)
      VALUES (?, ?, ?, ?, 'success', ?, 0, ?)
    `).run(randomUUID(), userId, `Logro: ${logro.nombre}`, logro.descripcion,
           JSON.stringify({ actionType: 'open_achievements', label: 'Ver logros' }),
           new Date().toISOString());
  }

  return nuevos;
}

/**
 * Suma tokens a un usuario y lo deja anotado en su historial.
 *
 * Se añaden también al cupo del plan para que las barras de consumo sigan
 * teniendo sentido: sin eso, el saldo superaría al total y la barra aparecería
 * llena o vacía según el caso.
 */
function acreditarTokens(userId: string, tokens: number, descripcion: string) {
  if (!tokens || tokens <= 0) return;

  getOrCreateSubscription(userId);
  db.prepare(`
    UPDATE user_subscriptions
    SET tokenBalance = tokenBalance + ?, tokensTotalPlan = tokensTotalPlan + ?
    WHERE userId = ?
  `).run(tokens, tokens, userId);

  const ahora = new Date().toISOString();
  db.prepare(`
    INSERT INTO token_transactions (id, userId, type, tokens, amountUSD, description, date, createdAt)
    VALUES (?, ?, 'referral_bonus', ?, 0, ?, ?, ?)
  `).run(randomUUID(), userId, tokens, descripcion, ahora.split('T')[0], ahora);
}

app.post('/api/verify-otp', (req, res) => {
  const { phone, email: emailInput, code, codigoReferido } = req.body || {};

  // El identificador es el mismo con el que se pidió el código.
  const identifier = emailInput ? normalizeEmail(emailInput) : phone;
  const channel: 'phone' | 'email' = emailInput ? 'email' : 'phone';
  if (!identifier || !code) return res.status(400).json({ error: 'Datos requeridos' });

  const stored = otpStore.get(identifier);
  if (!stored) {
    return res.status(400).json({
      error: channel === 'email'
        ? 'Sin código pendiente para este correo. Solicita uno nuevo.'
        : 'Sin código pendiente para este número. Solicita uno nuevo.',
    });
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(identifier);
    return res.status(400).json({ error: 'Código expirado. Solicita uno nuevo.' });
  }

  if (stored.code !== code) {
    // 5 fallos invalidan el código: 6 dígitos sin tope de intentos serían adivinables.
    stored.attempts = (stored.attempts || 0) + 1;
    if (stored.attempts >= 5) {
      otpStore.delete(identifier);
      logAudit(null, 'otp_bruteforce_blocked', `Código invalidado por intentos fallidos: ${identifier}`);
      return res.status(429).json({ error: 'Demasiados intentos fallidos. Solicita un código nuevo.' });
    }
    return res.status(400).json({ error: 'Código de verificación incorrecto' });
  }

  otpStore.delete(identifier);

  // Se busca por el canal usado. Quien entra por correo y ya tenía cuenta con
  // ese mismo correo recupera la suya en vez de crear una duplicada.
  let user = channel === 'email'
    ? db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(identifier) as any
    : db.prepare('SELECT * FROM users WHERE phone = ?').get(identifier) as any;

  const email = channel === 'email' ? identifier : phoneToEmail(identifier);
  let isNewUser = false;

  if (!user) {
    const id = randomUUID();
    // Sin teléfono no hay prefijo del que deducir la moneda.
    const currency = channel === 'phone' ? getCurrencyFromPhone(identifier) : 'USD';
    db.prepare('INSERT INTO users (id, email, displayName, phone, theme, currency, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      id, email, identifier, channel === 'phone' ? identifier : null, 'dark', currency, new Date().toISOString()
    );
    user = {
      id,
      email,
      displayName: identifier,
      phone: channel === 'phone' ? identifier : null,
      theme: 'dark',
      currency,
      createdAt: new Date().toISOString(),
    };
    isNewUser = true;

    // Todo usuario nuevo arranca con el Plan Gratuito (renovación automática cada 720h).
    getOrCreateSubscription(id);

    // Notificación de bienvenida explicando qué es HeraWallet.
    db.prepare(`
      INSERT INTO user_notifications (id, userId, title, message, type, actionData, isRead, createdAt)
      VALUES (?, ?, ?, ?, 'info', ?, 0, ?)
    `).run(
      randomUUID(), id,
      '¡Bienvenido a HeraWallet! 👋',
      'HeraWallet es tu asistente de finanzas personales impulsado por IA. Registra gastos e ingresos hablando, con una foto de un recibo o chateando con la IA; crea cuentas y tarjetas, fija metas de ahorro y recibe análisis inteligentes de tu dinero. Empiezas con el Plan Gratuito: tus tokens de IA se renuevan automáticamente cada 30 días. Tus metas empiezan con un mejor control.',
      JSON.stringify({ actionType: 'open_settings', label: 'Ver mi plan' }),
      new Date().toISOString()
    );

    // El código solo se canjea al crear la cuenta. Aceptarlo más tarde
    // permitiría reclamar el premio después de llevar meses usando la app.
    if (codigoReferido) {
      try {
        const canje = referidos.canjear(db, {
          codigo: String(codigoReferido),
          referidoId: id,
          ip: clientIpOf(req),
          acreditar: acreditarTokens,
          notificar: (destinatario, titulo, mensaje) => {
            db.prepare(`
              INSERT INTO user_notifications (id, userId, title, message, type, actionData, isRead, createdAt)
              VALUES (?, ?, ?, ?, 'success', ?, 0, ?)
            `).run(randomUUID(), destinatario, titulo, mensaje,
                   JSON.stringify({ actionType: 'open_referrals', label: 'Ver mis invitados' }),
                   new Date().toISOString());
          },
        });

        if (canje.aplicado) {
          db.prepare(`
            INSERT INTO user_notifications (id, userId, title, message, type, actionData, isRead, createdAt)
            VALUES (?, ?, ?, ?, 'success', ?, 0, ?)
          `).run(
            randomUUID(), id, 'Tienes tokens de bienvenida',
            `Entraste con una invitación, así que empiezas con ${Number(canje.tokensReferido).toLocaleString('es')} tokens extra.`,
            JSON.stringify({ actionType: 'open_settings', label: 'Ver mi plan' }),
            new Date().toISOString()
          );
          logAudit(id, 'referral_redeemed', `Alta con código de referido de ${canje.referidorId}`);
        }
      } catch (err) {
        // Un fallo aquí no puede impedir el alta: la cuenta ya está creada y la
        // persona tiene que poder entrar.
        console.error('[referidos] fallo al canjear', err);
      }
    }
  }

  // Registro de conexión: alimenta "últimas conexiones" del panel.
  const ua = String(req.headers['user-agent'] || '');
  const nowIso = new Date().toISOString();
  db.prepare('INSERT INTO user_sessions (id, userId, ip, userAgent, device, startedAt) VALUES (?, ?, ?, ?, ?, ?)')
    .run(randomUUID(), user.id, clientIpOf(req), ua.slice(0, 300), deviceOf(ua), nowIso);
  db.prepare('UPDATE users SET lastSeenAt = ? WHERE id = ?').run(nowIso, user.id);

  logAudit(user.id, 'login', `Inicio de sesión verificado para ${identifier} (${channel})`);

  // 30 días de sesión: entrar es costoso (hay que recibir un código), así
  // que forzar el login a diario penalizaría el uso diario de la app.
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

  res.json({
    success: true,
    token,
    isNewUser,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      phone: user.phone,
      photoURL: user.photoURL,
      birthDate: user.birthDate,
      address: user.address,
      theme: user.theme,
      currency: user.currency,
      onboardingStep: user.onboardingStep ?? 0
    }
  });
});

// Avanza (nunca retrocede) el paso del onboarding del usuario.
app.put('/api/me/onboarding', authMiddleware, (req: any, res) => {
  const step = parseInt(req.body?.step, 10);
  if (!Number.isInteger(step) || step < 0 || step > 3) {
    return res.status(400).json({ error: 'Paso de onboarding inválido (0-3)' });
  }
  db.prepare('UPDATE users SET onboardingStep = MAX(COALESCE(onboardingStep, 0), ?) WHERE id = ?').run(step, req.userId);
  const u = db.prepare('SELECT onboardingStep FROM users WHERE id = ?').get(req.userId) as any;
  res.json({ success: true, onboardingStep: u?.onboardingStep ?? step });
});

app.get('/api/me', authMiddleware, (req: any, res) => {
  const user = db.prepare('SELECT id, email, displayName, phone, photoURL, birthDate, address, theme, currency, onboardingStep, createdAt FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

app.put('/api/me', authMiddleware, (req: any, res) => {
  const { displayName, theme, currency, birthDate, address, email, photoURL } = req.body;
  const updates: string[] = [];
  const vals: any[] = [];
  if (displayName !== undefined) { updates.push('displayName = ?'); vals.push(displayName); }
  if (theme !== undefined) { updates.push('theme = ?'); vals.push(theme); }
  if (currency !== undefined) { updates.push('currency = ?'); vals.push(currency); }
  if (birthDate !== undefined) { updates.push('birthDate = ?'); vals.push(birthDate); }
  if (address !== undefined) { updates.push('address = ?'); vals.push(address); }
  if (email !== undefined) { updates.push('email = ?'); vals.push(email); }
  if (photoURL !== undefined) { updates.push('photoURL = ?'); vals.push(photoURL); }
  if (updates.length === 0) return res.status(400).json({ error: 'Sin campos' });
  vals.push(req.userId);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
  logAudit(req.userId, 'update_profile', 'Perfil actualizado');
  res.json({ success: true });
});

// --- User Financial Data API Routes (Strictly Filtered by req.userId) ---

app.get('/api/finance/overview', authMiddleware, (req: any, res) => {
  const summary = getDBUserSummary(req.userId);
  const accounts = getDBAccounts(req.userId);
  const recentTxs = getDBTransactions(req.userId, 10);
  const goals = getDBGoals(req.userId);
  const debts = getDBDebts(req.userId);

  // --- Comprehensive Hera Financial Health Score (Score Hera 0 - 100) ---
  const pendingDebts = debts.filter((d: any) => (d.status || 'pending') === 'pending' && d.type === 'debt');
  const totalPendingDebtAmount: number = Number(pendingDebts.reduce((sum: number, d: any) => sum + (Number(d.amount) - Number(d.paidAmount || 0)), 0));

  // Pillar 1: Savings Ratio (Ingresos vs Gastos) - Max 25 pts
  const totalInc: number = Number(summary.totalIncome || 0);
  const totalExp: number = Number(summary.totalExpense || 0);
  const totalBal: number = Number(summary.totalBalance || 0);

  const savingsRate: number = totalInc > 0 ? (totalInc - totalExp) / totalInc : 0;
  const p1_savings: number = savingsRate >= 0.3 ? 25 : savingsRate >= 0.15 ? 20 : savingsRate > 0 ? 12 : 5;

  // Pillar 2: Debt Health (Nivel de Endeudamiento) - Max 25 pts
  const debtToBalanceRatio: number = totalBal > 0 ? totalPendingDebtAmount / totalBal : (totalPendingDebtAmount > 0 ? 2 : 0);
  const p2_debt: number = totalPendingDebtAmount === 0 ? 25 : debtToBalanceRatio < 0.2 ? 20 : debtToBalanceRatio < 0.5 ? 14 : debtToBalanceRatio < 1.0 ? 8 : 3;

  // Pillar 3: Liquidity & Net Worth (Cuentas y Saldo) - Max 20 pts
  const p3_liquidity: number = totalBal >= 5000 ? 20 : totalBal >= 1000 ? 15 : totalBal > 0 ? 10 : 3;

  // Pillar 4: Goals Progress (Metas de Ahorro) - Max 15 pts
  const avgGoalProgress: number = goals.length > 0 ? Number(goals.reduce((acc: number, g: any) => acc + (Number(g.currentAmount || 0) / Math.max(1, Number(g.targetAmount || 1))), 0)) / goals.length : 0;
  const p4_goals = avgGoalProgress >= 0.75 ? 15 : avgGoalProgress >= 0.4 ? 11 : avgGoalProgress > 0 ? 7 : 3;

  // Pillar 5: Consistency (Registros y Actividad) - Max 15 pts
  const txCount = recentTxs.length;
  const p5_consistency = txCount >= 8 ? 15 : txCount >= 3 ? 10 : (txCount > 0 ? 5 : 0);

  // El score solo tiene sentido con historial real: sin transacciones, los
  // pilares evalúan el vacío (0 gastos = "ahorro bajo", 0 deudas = "perfecto")
  // y castigan al usuario recién llegado con un número arbitrario.
  const scoreReady = recentTxs.length > 0;
  const healthScore = scoreReady ? Math.min(100, Math.max(0, p1_savings + (totalPendingDebtAmount > 0 ? p2_debt : 25) + p3_liquidity + p4_goals + p5_consistency)) : null;
  const scoreBreakdown = {
    savings: { pts: scoreReady ? p1_savings : 0, max: 25, label: 'Ahorro & Flujo de Caja' },
    debt: { pts: scoreReady ? p2_debt : 0, max: 25, label: 'Control de Deudas' },
    liquidity: { pts: scoreReady ? p3_liquidity : 0, max: 20, label: 'Liquidez & Cuentas' },
    goals: { pts: scoreReady ? p4_goals : 0, max: 15, label: 'Metas de Ahorro' },
    consistency: { pts: scoreReady ? p5_consistency : 0, max: 15, label: 'Consistencia de Registros' }
  };

  res.json({
    summary,
    accounts,
    recentTxs,
    goals,
    healthScore,
    scoreReady,
    scoreBreakdown
  });
});

app.get('/api/finance/accounts', authMiddleware, (req: any, res) => {
  const accounts = getDBAccounts(req.userId);
  res.json(accounts);
});

app.post('/api/finance/accounts', authMiddleware, (req: any, res) => {
  const { name, type, balance, currency, icon, color } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Nombre y tipo de cuenta requeridos' });

  const id = randomUUID();
  db.prepare('INSERT INTO accounts (id, userId, type, name, balance, currency, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, req.userId, type, name, balance || 0, currency || 'EUR', icon || 'Wallet', color || '#3B82F6'
  );
  logAudit(req.userId, 'create_account', `Nueva cuenta: ${name}`);
  res.json({ success: true, id });
});

app.put('/api/finance/accounts/:id', authMiddleware, (req: any, res) => {
  const { id } = req.params;
  const { name, balance, currency, icon, color } = req.body;
  const updates: string[] = [];
  const vals: any[] = [];
  if (name !== undefined) { updates.push('name = ?'); vals.push(name); }
  if (balance !== undefined) { updates.push('balance = ?'); vals.push(balance); }
  if (currency !== undefined) { updates.push('currency = ?'); vals.push(currency); }
  if (icon !== undefined) { updates.push('icon = ?'); vals.push(icon); }
  if (color !== undefined) { updates.push('color = ?'); vals.push(color); }

  if (updates.length > 0) {
    vals.push(id, req.userId);
    db.prepare(`UPDATE accounts SET ${updates.join(', ')} WHERE id = ? AND userId = ?`).run(...vals);
  }
  res.json({ success: true });
});

app.delete('/api/finance/accounts/:id', authMiddleware, (req: any, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM accounts WHERE id = ? AND userId = ?').run(id, req.userId);
  logAudit(req.userId, 'delete_account', `Cuenta eliminada: ${id}`);
  res.json({ success: true });
});

/**
 * Elimina un movimiento del usuario y revierte su efecto en el saldo de la
 * cuenta, todo en la misma transacción SQL para que no quede a medias.
 */
app.delete('/api/finance/transactions/:id', authMiddleware, (req: any, res) => {
  const { id } = req.params;
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ? AND userId = ?').get(id, req.userId) as any;
  if (!tx) return res.status(404).json({ error: 'Movimiento no encontrado' });

  const revert = db.transaction(() => {
    db.prepare('DELETE FROM transactions WHERE id = ? AND userId = ?').run(id, req.userId);
    // Borrar un gasto devuelve el dinero; borrar un ingreso lo retira.
    const delta = tx.type === 'income' ? -Number(tx.amount) : Number(tx.amount);
    db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND userId = ?').run(delta, tx.accountId, req.userId);
  });
  revert();

  logAudit(req.userId, 'delete_transaction', `Movimiento eliminado: ${tx.description || tx.category} - ${tx.amount}`);
  res.json({ success: true, message: 'Movimiento eliminado y saldo actualizado' });
});

// --- Debts & Loans API ---

app.get('/api/finance/debts', authMiddleware, (req: any, res) => {
  const debts = getDBDebts(req.userId);
  res.json(debts);
});

app.post('/api/finance/debts', authMiddleware, (req: any, res) => {
  const { name, personOrEntity, type, amount, dueDate } = req.body;
  if (!name || !amount) return res.status(400).json({ error: 'Nombre y monto requeridos' });

  const id = randomUUID();
  db.prepare('INSERT INTO debts (id, userId, name, personOrEntity, type, amount, paidAmount, dueDate, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, req.userId, name, personOrEntity || '', type || 'debt', amount, 0, dueDate || '', 'pending'
  );
  logAudit(req.userId, 'create_debt', `Nueva deuda/préstamo: ${name}`);
  res.json({ success: true, id });
});

app.put('/api/finance/debts/:id', (req: any, res) => {
  const { id } = req.params;
  const { status, paidAmount, name, personOrEntity, amount, dueDate } = req.body;

  let userId = req.userId;
  const header = req.headers.authorization;
  if (!userId && header && header.startsWith('Bearer ')) {
    try { userId = (jwt.verify(header.slice(7), JWT_SECRET) as any).userId; } catch { }
  }
  if (!userId) userId = 'demo_user';

  let debt = db.prepare('SELECT * FROM debts WHERE id = ?').get(id) as any;
  if (!debt) {
    const sampleNames: any = {
      'sample-1': { name: 'Cena de cumpleaños', person: 'Carlos Gómez', type: 'debt', amount: 150.00 },
      'sample-2': { name: 'Préstamo proyecto web', person: 'Laura Martínez', type: 'receivable', amount: 280.00 },
      'sample-3': { name: 'Cuota mensual equipo', person: 'Banco Santander', type: 'debt', amount: 450.00 },
      'sample-4': { name: 'Entrada de concierto', person: 'Pedro Sánchez', type: 'receivable', amount: 65.00 }
    };
    const s = sampleNames[id] || { name: 'Deuda / Cobro', person: 'Contacto', type: 'debt', amount: 100.00 };
    db.prepare('INSERT INTO debts (id, userId, name, personOrEntity, type, amount, paidAmount, dueDate, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      id, userId, s.name, s.person, s.type, s.amount, 0, '2026-08-30', 'pending'
    );
    debt = db.prepare('SELECT * FROM debts WHERE id = ?').get(id) as any;
  }

  const newStatus = status || debt.status;
  let newPaidAmount = paidAmount !== undefined ? paidAmount : debt.paidAmount;

  // If marking as paid and remaining balance exists, auto-record payment for remaining balance!
  if (status === 'paid') {
    const total = Number(amount !== undefined ? amount : debt.amount);
    const currentPaid = Number(debt.paidAmount || 0);
    const remaining = total - currentPaid;

    if (remaining > 0) {
      const paymentId = randomUUID();
      const todayStr = new Date().toISOString().split('T')[0];
      db.prepare('INSERT INTO debt_payments (id, debtId, userId, amount, date, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        paymentId, id, userId, remaining, todayStr, 'Liquidación final — Pago completo registrado', new Date().toISOString()
      );
      newPaidAmount = total;
    }
  }

  const newName = name || debt.name;
  const newPerson = personOrEntity !== undefined ? personOrEntity : debt.personOrEntity;
  const newAmount = amount !== undefined ? amount : debt.amount;
  const newDueDate = dueDate !== undefined ? dueDate : debt.dueDate;

  db.prepare('UPDATE debts SET status = ?, paidAmount = ?, name = ?, personOrEntity = ?, amount = ?, dueDate = ? WHERE id = ?').run(
    newStatus, newPaidAmount, newName, newPerson, newAmount, newDueDate, id
  );
  logAudit(userId, 'update_debt', `Deuda actualizada: ${newName} -> ${newStatus}`);
  res.json({ success: true, paidAmount: newPaidAmount, status: newStatus });
});

app.delete('/api/finance/debts/:id', authMiddleware, (req: any, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM debts WHERE id = ? AND userId = ?').run(id, req.userId);
  db.prepare('DELETE FROM debt_payments WHERE debtId = ? AND userId = ?').run(id, req.userId);
  logAudit(req.userId, 'delete_debt', `Deuda eliminada: ${id}`);
  res.json({ success: true });
});

// Get payment history for a debt
app.get('/api/finance/debts/:id/payments', (req: any, res) => {
  const { id } = req.params;
  let userId = req.userId;
  const header = req.headers.authorization;
  if (!userId && header && header.startsWith('Bearer ')) {
    try { userId = (jwt.verify(header.slice(7), JWT_SECRET) as any).userId; } catch { }
  }
  const payments = db.prepare('SELECT * FROM debt_payments WHERE debtId = ? ORDER BY date DESC, createdAt DESC').all(id);
  res.json(payments);
});

// Add partial payment (abono) to a debt
app.post('/api/finance/debts/:id/payments', (req: any, res) => {
  const { id } = req.params;
  const { amount, date, note } = req.body;
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Monto de pago válido requerido' });

  let userId = req.userId;
  const header = req.headers.authorization;
  if (!userId && header && header.startsWith('Bearer ')) {
    try { userId = (jwt.verify(header.slice(7), JWT_SECRET) as any).userId; } catch { }
  }
  if (!userId) userId = 'demo_user';

  let debt = db.prepare('SELECT * FROM debts WHERE id = ?').get(id) as any;
  if (!debt) {
    const sampleNames: any = {
      'sample-1': { name: 'Cena de cumpleaños', person: 'Carlos Gómez', type: 'debt', amount: 150.00 },
      'sample-2': { name: 'Préstamo proyecto web', person: 'Laura Martínez', type: 'receivable', amount: 280.00 },
      'sample-3': { name: 'Cuota mensual equipo', person: 'Banco Santander', type: 'debt', amount: 450.00 },
      'sample-4': { name: 'Entrada de concierto', person: 'Pedro Sánchez', type: 'receivable', amount: 65.00 }
    };
    const s = sampleNames[id] || { name: 'Deuda / Cobro', person: 'Contacto', type: 'debt', amount: Number(amount) * 2 };
    db.prepare('INSERT INTO debts (id, userId, name, personOrEntity, type, amount, paidAmount, dueDate, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      id, userId, s.name, s.person, s.type, s.amount, 0, '2026-08-30', 'pending'
    );
    debt = db.prepare('SELECT * FROM debts WHERE id = ?').get(id) as any;
  }

  const paymentId = randomUUID();
  const payDate = date || new Date().toISOString().split('T')[0];

  db.prepare('INSERT INTO debt_payments (id, debtId, userId, amount, date, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    paymentId, id, userId, Number(amount), payDate, note || '', new Date().toISOString()
  );

  // Recalculate total paid
  const totalPaidRes = db.prepare('SELECT SUM(amount) as total FROM debt_payments WHERE debtId = ?').get(id) as any;
  const totalPaid = Number(totalPaidRes?.total || 0);

  let newStatus = debt.status;
  if (totalPaid >= Number(debt.amount)) {
    newStatus = 'paid';
  } else if (totalPaid > 0 && debt.status !== 'cancelled') {
    newStatus = 'partial';
  }

  db.prepare('UPDATE debts SET paidAmount = ?, status = ? WHERE id = ?').run(
    totalPaid, newStatus, id
  );

  logAudit(userId, 'add_debt_payment', `Pago registrado a deuda ${debt.name}: ${amount}€`);
  res.json({ success: true, paymentId, totalPaid, status: newStatus });
});

app.get('/api/finance/transactions', authMiddleware, (req: any, res) => {
  const txs = getDBTransactions(req.userId, 100);
  res.json(txs);
});

app.post('/api/finance/transactions', authMiddleware, (req: any, res) => {
  const { accountId, type, amount, category, description, date, receiptUrl } = req.body;
  if (!type || !amount || !category) return res.status(400).json({ error: 'Tipo, monto y categoría requeridos' });

  let targetAccountId = accountId;
  if (!targetAccountId) {
    const acc = db.prepare('SELECT id FROM accounts WHERE userId = ? LIMIT 1').get(req.userId) as any;
    targetAccountId = acc ? acc.id : randomUUID();
  }

  const id = randomUUID();
  const txDate = date || new Date().toISOString().split('T')[0];

  db.prepare('INSERT INTO transactions (id, userId, accountId, type, amount, category, description, date, receiptUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, req.userId, targetAccountId, type, amount, category, description || '', txDate, receiptUrl || null, new Date().toISOString()
  );

  // Update account balance
  const delta = type === 'income' ? Number(amount) : -Number(amount);
  db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND userId = ?').run(delta, targetAccountId, req.userId);

  logAudit(req.userId, 'create_transaction', `Transacción registrada: ${category} - ${amount}`);

  // Los logros se revisan aquí porque es el momento en que cambian los datos
  // que los alimentan. Un fallo revisándolos no puede tumbar el registro.
  let logrosNuevos: any[] = [];
  try {
    logrosNuevos = revisarLogros(req.userId);
  } catch (err) {
    console.error('[logros] fallo al revisar', err);
  }

  res.json({ success: true, id, logros: logrosNuevos });
});

app.get('/api/finance/goals', authMiddleware, (req: any, res) => {
  const goals = getDBGoals(req.userId);
  res.json(goals);
});

app.post('/api/finance/goals', authMiddleware, (req: any, res) => {
  const { name, targetAmount, currentAmount, deadline } = req.body;
  if (!name || !targetAmount || !deadline) return res.status(400).json({ error: 'Nombre, meta y fecha límite requeridos' });

  const weeks = Math.max(1, Math.ceil((new Date(deadline).getTime() - Date.now()) / (7 * 86400000)));
  const weeklyTarget = Math.round(((targetAmount - (currentAmount || 0)) / weeks) * 100) / 100;

  const id = randomUUID();
  db.prepare('INSERT INTO goals (id, userId, name, targetAmount, currentAmount, deadline, weeklyTarget, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, req.userId, name, targetAmount, currentAmount || 0, deadline, weeklyTarget, 'active'
  );
  logAudit(req.userId, 'create_goal', `Nueva meta: ${name}`);
  res.json({ success: true, id });
});

app.get('/api/finance/timeline', authMiddleware, (req: any, res) => {
  const { startDate, endDate, category, type, minAmount, maxAmount } = req.query;

  let sql = `
    SELECT t.*, a.name as accountName 
    FROM transactions t 
    LEFT JOIN accounts a ON t.accountId = a.id 
    WHERE t.userId = ? 
  `;
  const params: any[] = [req.userId];

  if (startDate) {
    sql += ` AND t.date >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    sql += ` AND t.date <= ?`;
    params.push(endDate);
  }
  if (type && type !== 'all') {
    sql += ` AND t.type = ?`;
    params.push(type);
  }
  if (category && category !== 'all') {
    const cats = String(category).split(',').map(c => c.trim()).filter(Boolean);
    if (cats.length === 1) {
      sql += ` AND t.category = ?`;
      params.push(cats[0]);
    } else if (cats.length > 1) {
      const placeholders = cats.map(() => '?').join(',');
      sql += ` AND t.category IN (${placeholders})`;
      params.push(...cats);
    }
  }
  if (minAmount && Number(minAmount) > 0) {
    sql += ` AND t.amount >= ?`;
    params.push(Number(minAmount));
  }
  if (maxAmount && Number(maxAmount) > 0) {
    sql += ` AND t.amount <= ?`;
    params.push(Number(maxAmount));
  }

  // Lo más nuevo primero: por marca de hora real y, a igualdad, por orden de
  // inserción (rowid). El id es un UUID aleatorio y no sirve para desempatar.
  sql += ` ORDER BY t.date DESC, COALESCE(t.createdAt, t.date) DESC, t.rowid DESC LIMIT 200`;

  const txs = db.prepare(sql).all(...params) as any[];

  // Group transactions by date for Timeline view
  const timelineMap: Record<string, any[]> = {};
  txs.forEach(t => {
    if (!timelineMap[t.date]) timelineMap[t.date] = [];
    timelineMap[t.date].push(t);
  });

  const timeline = Object.keys(timelineMap).sort((a, b) => b.localeCompare(a)).map(date => ({
    date,
    items: timelineMap[date]
  }));

  res.json(timeline);
});

// --- Executive AI Report Endpoint ---

app.get('/api/finance/reports/ai-analysis', authMiddleware, async (req: any, res) => {
  try {
    // Este informe llama al modelo: exige saldo igual que el chat.
    const gate = canSpendTokens(req.userId);
    if (!gate.ok) return res.status(403).json({ error: gate.error });

    let reportUsage: ProviderUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0, cachedPromptTokens: 0 };
    let reportModel = 'deepseek-chat';

    const summary = getDBUserSummary(req.userId);
    const txs = getDBTransactions(req.userId, 20);
    const accounts = getDBAccounts(req.userId);
    const goals = getDBGoals(req.userId);
    const debts = getDBDebts(req.userId);
    const userObj = db.prepare('SELECT currency FROM users WHERE id = ?').get(req.userId) as any;
    const userCurrency = userObj?.currency || 'USD';

    const deepseekKey = process.env.DEEPSEEK_API_KEY || (db.prepare("SELECT apiKey FROM ai_providers WHERE name LIKE '%DeepSeek%' AND (isActive = 1 OR LENGTH(apiKey) > 3)").get() as any)?.apiKey;
    const geminiKey = process.env.GEMINI_API_KEY || (db.prepare("SELECT apiKey FROM ai_providers WHERE name LIKE '%Gemini%' AND (isActive = 1 OR LENGTH(apiKey) > 3)").get() as any)?.apiKey;

    const prompt = `Actúa como Hera, un analista financiero ejecutivo de alto nivel.
Genera un informe financiero ejecutivo detallado basándote en estos datos reales del usuario (expresados en la divisa ${userCurrency}):
- Patrimonio Neto Disponible: ${summary.totalBalance} ${userCurrency}
- Ingresos Totales: ${summary.totalIncome} ${userCurrency}
- Gastos Totales: ${summary.totalExpense} ${userCurrency}
- Cuentas: ${JSON.stringify(accounts)}
- Metas de ahorro: ${JSON.stringify(goals)}
- Deudas: ${JSON.stringify(debts)}
- Últimos movimientos: ${JSON.stringify(txs)}

Responde ÚNICAMENTE un JSON válido con este formato exacto, sin bloques markdown ni texto adicional:
{
  "executiveSummary": "Informe resumido de la salud financiera del usuario en un párrafo claro y profesional.",
  "healthScore": 88,
  "topInsights": [
    "Patrimonio estable con un margen de liquidez del 60%.",
    "Categoría principal de consumo identificada en alimentos y ocio.",
    "Cumplimiento positivo en las metas de fondo de emergencia."
  ],
  "recommendations": [
    "Establecer un tope mensual de gastos variables para acelerar la meta de ahorro.",
    "Automatizar transferencias del 15% de ingresos a la cuenta de reserva.",
    "Revisar suscripciones y pagos recurrentes sin uso frecuente."
  ],
  "projectedSavings30d": 280.0,
  "savingsRate": 32
}`;

    let resultJson: any = null;

    if (deepseekKey && deepseekKey.trim()) {
      try {
        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey.trim()}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2
          })
        });

        if (dsRes.ok) {
          const raw = await dsRes.json() as any;
          // Se acumula antes de parsear: el modelo ya facturó aunque el JSON venga mal.
          reportUsage = readProviderUsage(raw);
          const content = raw.choices?.[0]?.message?.content || '';
          const cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();
          resultJson = JSON.parse(cleaned);
        }
      } catch (err) {
        console.error('DeepSeek report error:', err);
      }
    }

    if (!resultJson && geminiKey && geminiKey.trim()) {
      try {
        const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey.trim()}`;
        const gRes = await fetch(gUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (gRes.ok) {
          const raw = await gRes.json() as any;
          reportUsage = geminiUsage(raw);
          reportModel = GEMINI_MODEL;
          const content = raw.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();
          resultJson = JSON.parse(cleaned);
        }
      } catch (err) {
        console.error('Gemini report error:', err);
      }
    }

    // High-quality structured fallback if LLM endpoint fails
    if (!resultJson) {
      const net = summary.totalBalance;
      const savingsRate = summary.totalIncome > 0 ? Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100) : 25;
      const score = Math.min(95, Math.max(40, 50 + Math.round(savingsRate * 0.5)));

      resultJson = {
        executiveSummary: `Tu estado financiero actual refleja una posición sólida con un patrimonio total disponible de **${net}€** y una tasa estimada de ahorro del **${savingsRate}%**.`,
        healthScore: score,
        topInsights: [
          `Patrimonio Neto activo de ${net}€ distribuido entre tus cuentas principales.`,
          `Relación positiva entre ingresos totales (${summary.totalIncome}€) y gastos (${summary.totalExpense}€).`,
          `Tus metas de ahorro activas muestran una trayectoria sostenible a mediano plazo.`
        ],
        recommendations: [
          `Destinar un 10% adicional del superávit mensual hacia tu meta principal de fondo de emergencia.`,
          `Fijar un presupuesto máximo para la categoría de gastos variables en el próximo periodo.`,
          `Consolidar los saldos en la cuenta con mejor rendimiento o tasa libre de mantenimiento.`
        ],
        projectedSavings30d: Math.round(summary.totalIncome * 0.2),
        savingsRate: Math.max(0, savingsRate)
      };
    }

    // Solo se cobra si alguna llamada al modelo llegó a facturarse.
    // El informe de respaldo se genera en local y es gratuito.
    if (reportUsage.totalTokens > 0) {
      chargeTokens({
        userId: req.userId,
        usage: reportUsage,
        type: 'ai_report_usage',
        description: 'Informe de Inteligencia Financiera',
        model: reportModel
      });
    }

    logAudit(req.userId, 'generate_report', `Informe de Inteligencia Financiera generado (-${reportUsage.totalTokens} tokens)`);
    res.json(resultJson);
  } catch (err: any) {
    console.error('Error generating AI report:', err);
    res.status(500).json({ error: 'Error generando informe financiero' });
  }
});

// --- Smart AI Voice/Text Transaction Parser ---

app.post('/api/finance/parse-voice-tx', authMiddleware, async (req: any, res) => {
  try {
    const { text, defaultType } = req.body;
    if (!text) return res.status(400).json({ error: 'Texto requerido' });

    // Interpretar el dictado consume modelo: exige saldo.
    const gate = canSpendTokens(req.userId, 500);
    if (!gate.ok) return res.status(403).json({ error: gate.error });

    let parseUsage: ProviderUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0, cachedPromptTokens: 0 };
    let parseModel = 'deepseek-chat';

    let type = defaultType || 'expense';
    let amount = 10;
    let category = 'General';
    let description = text;

    const deepseekKey = process.env.DEEPSEEK_API_KEY || (db.prepare("SELECT apiKey FROM ai_providers WHERE name LIKE '%DeepSeek%' AND (isActive = 1 OR LENGTH(apiKey) > 3)").get() as any)?.apiKey;
    const geminiKey = process.env.GEMINI_API_KEY || (db.prepare("SELECT apiKey FROM ai_providers WHERE name LIKE '%Gemini%' AND (isActive = 1 OR LENGTH(apiKey) > 3)").get() as any)?.apiKey;

    const prompt = `Analiza este dictado por voz y extrae la intención financiera.
Texto dictado: "${text}"

Responde ÚNICAMENTE con un JSON válido en este formato exacto, sin bloques markdown ni explicaciones adicionales:
{
  "type": "expense" o "income",
  "amount": número flotante total (sumando todos los precios o gastos individuales mencionados. Ej: si dice "250 libras de bonito y un pantalón de 150", el amount debe ser 400),
  "category": categoría adecuada en español (ej. "Ropa & Moda", "Supermercado", "Restaurantes", "Transporte", "Servicios", "Salario", etc.),
  "description": título limpio del registro (ej. "Compra de Bonito y Pantalón de mezclilla"). NUNCA repitas frases sueltas como "hay cuatro libras" o "créame un gasto".
}`;

    let parsedSuccess = false;

    if (deepseekKey && deepseekKey.trim()) {
      try {
        const deepseekRes = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey.trim()}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1
          })
        });

        if (deepseekRes.ok) {
          const json = await deepseekRes.json() as any;
          parseUsage = readProviderUsage(json);
          const content = json.choices?.[0]?.message?.content || '';
          const cleanedJson = content.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanedJson);
          if (parsed.amount) {
            type = parsed.type || type;
            amount = Number(parsed.amount);
            category = parsed.category || category;
            description = parsed.description || description;
            parsedSuccess = true;
          }
        }
      } catch (err) {
        console.error('LLM DeepSeek voice parse error:', err);
      }
    }

    if (!parsedSuccess && geminiKey && geminiKey.trim()) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey.trim()}`;
        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (geminiRes.ok) {
          const json = await geminiRes.json() as any;
          parseUsage = geminiUsage(json);
          parseModel = GEMINI_MODEL;
          const content = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleanedJson = content.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanedJson);
          if (parsed.amount) {
            type = parsed.type || type;
            amount = Number(parsed.amount);
            category = parsed.category || category;
            description = parsed.description || description;
            parsedSuccess = true;
          }
        }
      } catch (err) {
        console.error('LLM Gemini voice parse error:', err);
      }
    }

    // High-precision fallback if LLM is unreachable
    if (!parsedSuccess) {
      const lower = text.toLowerCase();
      const matches = Array.from(text.matchAll(/(\d+(?:[.,]\d+)?)/g));
      const rawNumbers = matches.map(m => parseFloat(m[0].replace(',', '.')));

      if (rawNumbers.length > 0) {
        const costNumbers: number[] = [];
        for (let i = 0; i < matches.length; i++) {
          const num = rawNumbers[i];
          const matchObj = matches[i] as any;
          const index = matchObj.index || 0;
          const afterText = text.slice(index + matchObj[0].length, index + 25).toLowerCase();
          if ((afterText.startsWith(' libra') || afterText.startsWith(' kilo') || afterText.startsWith(' pieza') || afterText.startsWith(' unidad')) && num < 20) {
            continue;
          }
          costNumbers.push(num);
        }
        amount = costNumbers.reduce((a, b) => a + b, 0);
        if (amount === 0) amount = rawNumbers[rawNumbers.length - 1];
      }

      if (lower.includes('pantal') || lower.includes('mezclilla')) category = 'Ropa & Moda';
      else if (lower.includes('bonito') || lower.includes('comida')) category = 'Restaurantes';

      const itemsFound: string[] = [];
      if (lower.includes('bonito')) itemsFound.push('Bonito');
      if (lower.includes('pantal')) itemsFound.push('Pantalón de mezclilla');

      description = itemsFound.length > 0
        ? `Compra de ${itemsFound.join(' y ')}`
        : `Gasto registrado por voz`;
    }

    const acc = db.prepare('SELECT id FROM accounts WHERE userId = ? LIMIT 1').get(req.userId) as any;
    const accountId = acc ? acc.id : randomUUID();
    const txDate = new Date().toISOString().split('T')[0];

    // El fallback por expresiones regulares es local y no se cobra.
    if (parseUsage.totalTokens > 0) {
      chargeTokens({
        userId: req.userId,
        usage: parseUsage,
        type: 'ai_voice_parse_usage',
        description: `Interpretación de dictado: "${String(text).slice(0, 30)}"`,
        model: parseModel
      });
    }

    logAudit(req.userId, 'parse_voice_tx', `IA interpretó ${type}: ${category} ${amount} (-${parseUsage.totalTokens} tokens)`);
    res.json({ success: true, transaction: { accountId, amount, type, category, description, date: txDate } });
  } catch (err: any) {
    console.error('Error in parse-voice-tx:', err);
    res.status(500).json({ error: 'Error procesando la transacción con IA' });
  }
});

// --- Voice Dictation Endpoint (Whisper.cpp Local Server http://127.0.0.1:8080/inference + Intelligent Fallbacks) ---

app.post('/api/transcribe', authMiddleware, async (req: any, res) => {
  try {
    const audioData = req.body.audio; // base64 string or file buffer
    if (!audioData) return res.status(400).json({ error: 'Sin datos de audio' });

    // Whisper local es gratuito, pero los respaldos en la nube no.
    const gate = canSpendTokens(req.userId, 500);
    if (!gate.ok) return res.status(403).json({ error: gate.error });

    let sttUsage: ProviderUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0, cachedPromptTokens: 0 };
    let sttModel = 'whisper-local';
    let sttPaidCloud = false;

    const base64Clean = audioData.replace(/^data:audio\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');
    let mimeType = 'audio/wav';
    const mimeMatch = audioData.match(/^data:(audio\/\w+);base64,/);
    if (mimeMatch) mimeType = mimeMatch[1];

    let transcribedText = '';

    // Whisper.cpp solo decodifica WAV PCM. Si llega otro formato (cliente
    // antiguo, app externa) se convierte con ffmpeg si está disponible; si no,
    // se sigue con los respaldos en la nube, que sí aceptan WebM/Opus.
    let whisperBuffer = buffer;
    const isWav = buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE';
    if (!isWav) {
      try {
        const { execFileSync } = await import('child_process');
        const inFile = path.join('/tmp', `hera-stt-${randomUUID()}`);
        const outFile = `${inFile}.wav`;
        fs.writeFileSync(inFile, buffer);
        execFileSync('ffmpeg', ['-y', '-i', inFile, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', outFile], { stdio: 'ignore', timeout: 20000 });
        whisperBuffer = fs.readFileSync(outFile);
        fs.unlink(inFile, () => { });
        fs.unlink(outFile, () => { });
        console.log('[transcribe] Audio convertido a WAV 16k con ffmpeg');
      } catch {
        console.warn('[transcribe] Audio no es WAV y ffmpeg no está disponible: Whisper local lo rechazará.');
      }
    }

    // 1. Intentar servidor Whisper.cpp local (WHISPER_URL) antes que cualquier nube.
    try {
      const formData = new FormData();
      const blob = new Blob([whisperBuffer], { type: 'audio/wav' });
      formData.append('file', blob, 'recording.wav');
      formData.append('language', req.body?.lang === 'en' ? 'en' : 'es');
      formData.append('response_format', 'json');
      formData.append('temperature', '0.0');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), WHISPER_TIMEOUT_MS);

      const whisperRes = await fetch(WHISPER_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      if (whisperRes.ok) {
        const json = await whisperRes.json() as any;
        transcribedText = (json.text || json.transcription || '').trim();
        console.log('[transcribe] Transcrito con Whisper local:', transcribedText);
      } else {
        console.warn(`[transcribe] Whisper local respondió ${whisperRes.status} en ${WHISPER_URL}`);
      }
    } catch (localErr: any) {
      console.warn(`[transcribe] Whisper local no disponible en ${WHISPER_URL} (timeout ${WHISPER_TIMEOUT_MS}ms): ${localErr.message}`);
    }

    // 2. Si falla Whisper local, usar Google Gemini Audio (gemini-2.5-flash) como respaldo principal
    if (!transcribedText) {
      const geminiKey = process.env.GEMINI_API_KEY || (db.prepare("SELECT apiKey FROM ai_providers WHERE name LIKE '%Gemini%' AND (isActive = 1 OR LENGTH(apiKey) > 3)").get() as any)?.apiKey;

      if (geminiKey) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
          const promptText = `Transcribe exactamente el siguiente audio dictado por el usuario en español. Devuelve ÚNICAMENTE la transcripción limpia en texto plano sin explicaciones ni marcas de formato markdown.`;

          const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: promptText },
                  { inline_data: { mime_type: mimeType, data: base64Clean } }
                ]
              }]
            })
          });

          if (geminiRes.ok) {
            const json = await geminiRes.json() as any;
            sttUsage = geminiUsage(json);
            sttModel = 'gemini-2.5-flash';
            transcribedText = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            console.log('[transcribe] Transcribed via Gemini Audio fallback:', transcribedText);
          }
        } catch (geminiErr: any) {
          console.error('[transcribe] Gemini audio fallback error:', geminiErr.message);
        }
      }
    }

    // 3. Si tampoco está disponible Gemini, probar Groq o OpenAI Whisper Cloud
    if (!transcribedText) {
      const openaiKey = process.env.OPENAI_API_KEY || (db.prepare("SELECT apiKey FROM ai_providers WHERE name LIKE '%OpenAI%' AND (isActive = 1 OR LENGTH(apiKey) > 3)").get() as any)?.apiKey;
      const groqKey = process.env.GROQ_API_KEY || (db.prepare("SELECT apiKey FROM ai_providers WHERE (name LIKE '%Groq%' OR name LIKE '%Whisper%') AND (isActive = 1 OR LENGTH(apiKey) > 3)").get() as any)?.apiKey;

      const cloudKey = groqKey || openaiKey;
      const cloudUrl = groqKey ? 'https://api.groq.com/openai/v1/audio/transcriptions' : 'https://api.openai.com/v1/audio/transcriptions';
      const modelName = groqKey ? 'whisper-large-v3-turbo' : 'whisper-1';

      if (cloudKey) {
        try {
          const formData = new FormData();
          const blob = new Blob([buffer], { type: mimeType });
          formData.append('file', blob, 'recording.wav');
          formData.append('model', modelName);
          formData.append('language', 'es');

          const cloudRes = await fetch(cloudUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${cloudKey}` },
            body: formData
          });

          if (cloudRes.ok) {
            const json = await cloudRes.json() as any;
            transcribedText = json.text || '';
            sttModel = modelName;
            sttPaidCloud = true;
            console.log('[transcribe] Transcribed via Cloud Whisper fallback:', transcribedText);
          }
        } catch (cloudErr: any) {
          console.error('[transcribe] Cloud Whisper fallback error:', cloudErr.message);
        }
      }
    }

    if (!transcribedText) {
      // El usuario final no debe leer instrucciones de servidor: el detalle
      // técnico va al log y al panel de diagnóstico del administrador.
      console.error(`❌ [transcribe] Ninguna vía de transcripción disponible (local: ${WHISPER_URL}). Revisa Whisper local o configura GROQ_API_KEY/OPENAI_API_KEY.`);
      return res.status(503).json({
        error: 'No pudimos escuchar tu audio en este momento. Inténtalo de nuevo o escribe tu mensaje.'
      });
    }

    // Whisper en la nube se factura por segundos de audio, no por tokens, así
    // que se convierte su coste real a tokens equivalentes para que el saldo
    // del usuario siga siendo una sola unidad. Whisper local no cuesta nada.
    if (sttPaidCloud) {
      sttUsage = whisperUsageEquivalent(buffer.length);
    }

    if (sttUsage.totalTokens > 0) {
      chargeTokens({
        userId: req.userId,
        usage: sttUsage,
        type: 'ai_transcription_usage',
        description: `Transcripción de voz (${sttModel})`,
        model: sttModel
      });
    }

    logAudit(req.userId, 'transcribe_audio', `Dictado por voz procesado: ${transcribedText.slice(0, 50)}`);
    res.json({ success: true, text: transcribedText.trim() });
  } catch (err: any) {
    console.error('Whisper transcription error:', err.message);
    res.status(500).json({ error: 'Error al transcribir audio. Por favor intenta dictar nuevamente.' });
  }
});

// --- OCR Receipt Scanner Endpoint (Gemini Vision API & Intelligent Parsing) ---

app.post('/api/scan-receipt', authMiddleware, async (req: any, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'Imagen requerida' });

  // La visión por IA es de lo más caro del sistema: exige saldo.
  const scanGate = canSpendTokens(req.userId, 1000);
  if (!scanGate.ok) return res.status(403).json({ error: scanGate.error });
  console.log('[scan-receipt] Received image, length:', image?.length, 'starts with:', image?.substring(0, 50));

  const geminiKey = process.env.GEMINI_API_KEY || (db.prepare("SELECT apiKey FROM ai_providers WHERE name LIKE '%Gemini%' AND (isActive = 1 OR LENGTH(apiKey) > 3)").get() as any)?.apiKey;

  if (!geminiKey) {
    return res.status(400).json({
      success: false,
      isValidRecord: false,
      error: 'No hay ninguna API Key de Google Gemini configurada en el sistema. Por favor ingresa una clave API activa en Administración > Modelos IA.'
    });
  }

  try {
    let mimeType = 'image/jpeg';
    const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }
    const base64Clean = image.replace(/^data:image\/\w+;base64,/, '');

    // Model updated to gemini-2.5-flash (Google Gemini Vision 2026)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    const promptText = `Examina minuciosamente la imagen adjunta y extrae los datos del comprobante financiero, recibo, ticket o factura.

Responde ÚNICAMENTE con un objeto JSON válido (sin marcas de markdown) con las siguientes claves:
- isValidRecord: booleano (true si la imagen es un recibo, ticket, factura o comprobante legítimo; false si la imagen es una persona, rostro, selfie, paisaje, pantalla en blanco u objeto casual no financiero).
- rejectionReason: cadena (explicación breve en español de por qué no es un comprobante si isValidRecord es false).
- merchant: cadena con el nombre EXACTO del comercio o establecimiento que aparece impreso en el recibo.
- amount: número con el importe TOTAL exacto a pagar que aparece en el recibo.
- category: una de las opciones: "Supermercado", "Restaurantes", "Gasolina", "Servicios", "Ropa", "Varios".
- type: "expense" para compras/gastos o "income" para cobros/ingresos.
- date: fecha del comprobante en formato YYYY-MM-DD (o la fecha de hoy si no figura).`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: promptText },
            { inline_data: { mime_type: mimeType, data: base64Clean } }
          ]
        }]
      })
    });

    if (!geminiRes.ok) {
      const errJson = await geminiRes.json().catch(() => ({}));
      const errMsg = errJson.error?.message || `Error HTTP ${geminiRes.status} de la API de Google Gemini`;
      return res.status(400).json({
        success: false,
        isValidRecord: false,
        error: `Fallo en Google Gemini Vision: ${errMsg}`
      });
    }

    const json = await geminiRes.json() as any;

    // Se cobra el análisis aunque el recibo se rechace después: la imagen ya
    // se procesó y Google ya facturó ese consumo.
    const scanUsage = geminiUsage(json);
    if (scanUsage.totalTokens > 0) {
      chargeTokens({
        userId: req.userId,
        usage: scanUsage,
        type: 'ai_receipt_scan_usage',
        description: 'Escaneo de comprobante con visión IA',
        model: 'gemini-2.5-flash'
      });
    }

    const textResp = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('[scan-receipt] Gemini raw response:', textResp.substring(0, 500));
    const matchJson = textResp.match(/\{[\s\S]*\}/);

    if (matchJson) {
      const parsed = JSON.parse(matchJson[0]);
      const isRecordValid = parsed.isValidRecord === true || String(parsed.isValidRecord).toLowerCase() === 'true';
      const parsedAmount = parseFloat(parsed.amount) || 0;

      if (!isRecordValid || parsedAmount <= 0 || !parsed.merchant || String(parsed.merchant).trim() === '') {
        return res.status(400).json({
          success: false,
          isValidRecord: false,
          error: parsed.rejectionReason || 'La foto adjunta es una persona, selfie o imagen casual y no contiene datos o comprobantes financieros.'
        });
      }

      logAudit(req.userId, 'scan_receipt', `Recibo escaneado con Gemini OCR: ${parsed.merchant} - $${parsedAmount}`);

      return res.json({
        success: true,
        isValidRecord: true,
        merchant: parsed.merchant,
        amount: parsedAmount,
        category: parsed.category || 'Varios',
        type: parsed.type || 'expense',
        date: parsed.date || new Date().toISOString().split('T')[0]
      });
    }

    return res.status(400).json({
      success: false,
      isValidRecord: false,
      error: 'Google Gemini no devolvió una estructura JSON válida de la imagen.'
    });
  } catch (e: any) {
    console.error('Gemini Vision OCR error:', e);
    return res.status(500).json({
      success: false,
      isValidRecord: false,
      error: `Error al procesar la imagen con la IA: ${e.message || e}`
    });
  }
});

// --- Hera Pre-Configured Document Export Engine (Excel, Word, PDF Templates) ---
app.post('/api/export-document', (req: any, res) => {
  const { format, title, columns, rows, summary } = req.body;
  const docTitle = title || 'Informe Financiero Ejecutivo - HeraWallet';
  const filename = `${docTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
  const dateStr = new Date().toLocaleString('es-ES');

  let userId = req.userId;
  const header = req.headers.authorization;
  if (!userId && header && header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.slice(7), JWT_SECRET) as any;
      userId = decoded.userId;
    } catch { }
  }
  const userSummary = summary || getDBUserSummary(userId);
  const userTxs = rows || (getDBTransactions(userId, 10) as any[]).map(t => [
    t.date || 'Hoy',
    t.category || 'General',
    t.description || 'Movimiento',
    t.type === 'income' ? 'Ingreso' : 'Gasto',
    `${t.amount} €`
  ]);

  const docCols = columns || ['Fecha', 'Categoría', 'Descripción', 'Tipo', 'Importe'];

  if (format === 'xlsx' || format === 'excel' || format === 'csv') {
    // 🟢 Styled Excel Spreadsheet (XML/HTML format supported natively by MS Excel & LibreOffice with full CSS colors and formatting)
    const excelXml = `
      <html xmlns:o="urn:schemas-microsoft-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Informe HeraWallet</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #2E2B28; }
          .title-header { background-color: #D97757; color: #FFFFFF; font-size: 18pt; font-weight: bold; padding: 14px; text-align: left; }
          .slogan-row { background-color: #FFF9F7; color: #6F6B66; font-size: 10pt; font-style: italic; padding: 8px; border-bottom: 2px solid #D97757; }
          .meta-row { color: #9A958E; font-size: 9pt; font-family: monospace; padding: 6px; }
          .section-banner { background-color: #2E2B28; color: #ECE7E1; font-size: 11pt; font-weight: bold; padding: 8px 12px; margin-top: 15px; }
          .kpi-table { margin-top: 10px; margin-bottom: 20px; border-collapse: collapse; width: 100%; }
          .kpi-table th { background-color: #F9F9F7; color: #9A958E; font-size: 9pt; border: 1px solid #E7E3DD; padding: 8px; text-transform: uppercase; font-family: monospace; }
          .kpi-table td { background-color: #FFFFFF; color: #2E2B28; font-size: 12pt; font-weight: bold; border: 1px solid #E7E3DD; padding: 10px; text-align: center; }
          .data-table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          .data-table th { background-color: #D97757; color: #FFFFFF; font-size: 10pt; font-weight: bold; border: 1px solid #C96A4D; padding: 10px; text-align: left; text-transform: uppercase; font-family: monospace; }
          .data-table td { border: 1px solid #E7E3DD; padding: 8px 10px; font-size: 10pt; }
          .even-row { background-color: #F9F9F7; }
          .odd-row { background-color: #FFFFFF; }
          .amount-cell { font-family: monospace; font-weight: bold; text-align: right; }
          .footer-note { color: #9A958E; font-size: 9pt; font-family: monospace; text-align: center; margin-top: 25px; padding-top: 10px; border-top: 1px solid #E7E3DD; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="${docCols.length}" class="title-header">HeraWallet — ${docTitle}</td></tr>
          <tr><td colspan="${docCols.length}" class="slogan-row">Tus metas empiezan con un mejor control.</td></tr>
          <tr><td colspan="${docCols.length}" class="meta-row">Fecha de emisión: ${dateStr} | ID Documento: ${filename} | Emisor: Hera AI Coach</td></tr>
          <tr><td colspan="${docCols.length}"></td></tr>
        </table>

        <div class="section-banner">RESUMEN DE PATRIMONIO Y SALDOS</div>
        <table class="kpi-table">
          <thead>
            <tr>
              <th>Patrimonio Neto</th>
              <th>Ingresos Mensuales</th>
              <th>Gastos Mensuales</th>
              <th>Score Financiero</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${userSummary.totalBalance || '0,00'} €</td>
              <td style="color: #3E8E68;">${userSummary.totalIncome || '0,00'} €</td>
              <td style="color: #C45454;">${userSummary.totalExpense || '0,00'} €</td>
              <td style="color: #D89A36;">48 / 100</td>
            </tr>
          </tbody>
        </table>

        <div class="section-banner">DESGLOSE DETALLADO DE MOVIMIENTOS</div>
        <table class="data-table">
          <thead>
            <tr>
              ${docCols.map((c: string) => `<th>${c}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${userTxs.map((r: any[], idx: number) => `
              <tr class="${idx % 2 === 0 ? 'even-row' : 'odd-row'}">
                ${r.map((cell: any, cIdx: number) => `
                  <td class="${cIdx === r.length - 1 ? 'amount-cell' : ''}">${cell}</td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer-note">
          Confidencial — HeraWallet Financial Technology. Todos los derechos reservados.
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xls"`);
    return res.send('\ufeff' + excelXml);

  } else if (format === 'docx' || format === 'word') {
    // 🟦 Styled Word Document
    const wordXml = `
      <html xmlns:o="urn:schemas-microsoft-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${docTitle}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #2E2B28; padding: 40px; }
          .header-box { border-bottom: 3px solid #D97757; padding-bottom: 12px; margin-bottom: 20px; }
          h1 { color: #D97757; font-size: 24px; margin: 0 0 4px 0; }
          .slogan { color: #6F6B66; font-size: 12px; font-style: italic; }
          .meta { font-family: monospace; font-size: 10px; color: #9A958E; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #D97757; color: #ffffff; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; font-family: monospace; }
          td { border-bottom: 1px solid #E7E3DD; padding: 10px; font-size: 11px; }
          tr:nth-child(even) { background-color: #F9F9F7; }
          .footer { margin-top: 40px; font-size: 10px; color: #9A958E; border-top: 1px solid #E7E3DD; padding-top: 12px; text-align: center; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <h1>HeraWallet — ${docTitle}</h1>
          <div class="slogan">Tus metas empiezan con un mejor control.</div>
          <div class="meta">Emisión: ${dateStr} | Documento: ${filename}</div>
        </div>
        <h3>Informe Financiero Ejecutivo</h3>
        <table>
          <thead><tr>${docCols.map((c: string) => `<th>${c}</th>`).join('')}</tr></thead>
          <tbody>${userTxs.map((r: any[]) => `<tr>${r.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
        <div class="footer">Confidencial — HeraWallet Financial Technology.</div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'application/msword; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.doc"`);
    return res.send('\ufeff' + wordXml);

  } else {
    // 📕 PDF / Printable Stream
    const pdfHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${docTitle}</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; color: #2E2B28; padding: 40px; }
          .header-box { border-bottom: 3px solid #D97757; padding-bottom: 12px; margin-bottom: 20px; }
          h1 { color: #D97757; font-size: 24px; margin: 0; }
          .slogan { color: #6F6B66; font-size: 12px; font-style: italic; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #D97757; color: #fff; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; }
          td { border-bottom: 1px solid #E7E3DD; padding: 10px; font-size: 11px; }
          tr:nth-child(even) { background: #F9F9F7; }
          .footer { margin-top: 40px; font-size: 10px; color: #9A958E; border-top: 1px solid #E7E3DD; padding-top: 12px; text-align: center; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <h1>HeraWallet — ${docTitle}</h1>
          <div class="slogan">Tus metas empiezan con un mejor control.</div>
        </div>
        <table>
          <thead><tr>${docCols.map((c: string) => `<th>${c}</th>`).join('')}</tr></thead>
          <tbody>${userTxs.map((r: any[]) => `<tr>${r.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
        <div class="footer">Confidencial — HeraWallet Financial Technology.</div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(pdfHtml);
  }
});

// --- Conversational AI Engine Endpoint with Real DeepSeek & Gemini Integration ---

app.get('/api/chat/history', authMiddleware, (req: any, res) => {
  const history = db.prepare('SELECT * FROM chat_messages WHERE userId = ? ORDER BY createdAt ASC LIMIT 100').all(req.userId);
  res.json(history);
});

app.post('/api/chat', authMiddleware, async (req: any, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Mensaje requerido' });

  const userId = req.userId;

  // 1 y 2. Suscripción y comprobación de saldo con colchón mínimo
  const gate = canSpendTokens(userId);
  if (!gate.ok) {
    return res.status(403).json({ error: gate.error });
  }
  const sub = gate.sub;

  // Save user message to DB
  db.prepare('INSERT INTO chat_messages (id, userId, role, content, createdAt) VALUES (?, ?, ?, ?, ?)').run(
    randomUUID(), userId, 'user', message, new Date().toISOString()
  );

  const userObj = db.prepare('SELECT displayName, email, currency FROM users WHERE id = ?').get(userId) as any;
  const userName = userObj?.displayName || (userObj?.email ? userObj.email.split('@')[0] : '') || 'Usuario';
  const userCurrency = userObj?.currency || 'USD';

  const summary = getDBUserSummary(userId);
  const txs = getDBTransactions(userId, 15);
  const accounts = getDBAccounts(userId);
  const goals = getDBGoals(userId);
  const debts = getDBDebts(userId);
  const lostMoney = calculateLostMoney(userId);
  const history = db.prepare('SELECT role, content FROM chat_messages WHERE userId = ? ORDER BY createdAt DESC LIMIT 10').all(userId).reverse() as any[];

  let aiReplyText = '';
  let widgetType: string | null = null;
  let widgetData: any = null;

  // Retrieve API Keys (Auto-detecting saved keys in DB)
  const deepseekKey = process.env.DEEPSEEK_API_KEY || (db.prepare("SELECT apiKey FROM ai_providers WHERE name LIKE '%DeepSeek%' AND (isActive = 1 OR LENGTH(apiKey) > 3)").get() as any)?.apiKey;
  const geminiKey = process.env.GEMINI_API_KEY || (db.prepare("SELECT apiKey FROM ai_providers WHERE name LIKE '%Gemini%' AND (isActive = 1 OR LENGTH(apiKey) > 3)").get() as any)?.apiKey;

  const toneProfile = MirrorToneEngine.analyzeTone(message);
  const toneInstruction = MirrorToneEngine.buildToneInstruction(toneProfile);

  let reasoningContent = '';
  // Consumo real devuelto por el proveedor. Si sigue a cero al final,
  // es que ninguna llamada llegó a facturarse y no se cobra nada.
  let chatUsage: ProviderUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0, cachedPromptTokens: 0 };
  let chatModel = 'deepseek-chat';

  const systemPrompt = `Eres Hera, un Coach Financiero Inteligente en tiempo real. 
Estás conversando directamente con el usuario: ${userName}. Dirígete a él/ella por su nombre (${userName}) de manera cercana, personalizada, empática y verdaderamente afable.

${toneInstruction}

DIVISA Y MONEDA DE OPERACIÓN DEL USUARIO (OBLIGATORIO):
- La moneda predeterminada configurada por ${userName} es: ${userCurrency}.
- DEBES responder, calcular, sugerir montos y expresarte SIEMPRE utilizando la moneda predeterminada del usuario (${userCurrency}).
- Si el usuario menciona montos sin especificar moneda (ej. "Gasté 50 en comida" o "Ingresé 200"), asume OBLIGATORIAMENTE que se refiere a ${userCurrency}.
- En cualquier widget visual (progreso, acciones, tablas o gráficos), asigna "${userCurrency}" como la divisa/unidad.

Patrimonio Neto: ${summary.totalBalance} ${userCurrency}. Ingresos: ${summary.totalIncome} ${userCurrency}. Gastos: ${summary.totalExpense} ${userCurrency}.
Cuentas Usuario: ${JSON.stringify(accounts)}.
Metas de Ahorro: ${JSON.stringify(goals)}.
Deudas Registradas: ${JSON.stringify(debts)}.
Transacciones Recientes: ${JSON.stringify(txs)}.

ESTILO Y TONO EJECUTIVO:
- Mantén una redacción limpia, sobria, elegante y ejecutiva.
- ESTÁ ABSOLUTAMENTE PROHIBIDO el uso de caracteres de bloques o cuadrículas ASCII como ▰▰▰▰▰▰▰▱▱▱ o █████░░░░ para simular barras de progreso. Solo proporciona porcentajes limpios (ej. 61.7%) y el sistema renderizará la barra visual de Hera.
- ESTÁ PROHIBIDO el uso excesivo de emojis (no uses emojis de números como 1️⃣, 2️⃣, 3️⃣, 4️⃣ ni satures el texto con 🔴, 🟢, 🟡, 🚀 en cada línea).
- Estructura las secciones usando títulos Markdown limpios (### o ####) indicando la puntuación de forma sobria como "(20/100)".

REGLA CRÍTICA DE INTERACTIVIDAD VISUAL Y WIDGETS:
1. SI EL USUARIO SOLICITA REGISTRAR O CREAR UN GASTO/INGRESO O META:
Incluye al final de la respuesta:
<<<ACTION_START>>>
{
  "actionType": "create_transaction",
  "type": "expense",
  "amount": 50.0,
  "category": "Restaurantes",
  "description": "Gasto en comida",
  "accountId": "${(accounts[0] as any)?.id || ''}",
  "accountName": "${(accounts[0] as any)?.name || 'Cuenta Principal'}"
}
<<<ACTION_END>>>

2. SI EL USUARIO CONSULTA EL PROGRESO DE SUS METAS O SCORE:
Incluye al final:
<<<PROGRESS_START>>>
{
  "title": "Avance de Meta de Ahorro",
  "current": ${(goals[0] as any)?.currentAmount || 450},
  "target": ${(goals[0] as any)?.targetAmount || 1000},
  "unit": "${userCurrency}",
  "subtitle": "${(goals[0] as any)?.name || 'Fondo de Reserva'}"
}
<<<PROGRESS_END>>>

3. SELECCIÓN INTELIGENTE DE GRÁFICOS (LINEAL, PIZZA / PIE O BARRAS):
- SI EL USUARIO PIDE PROYECCIÓN DE SALDO, LÍNEA DE TIEMPO O EVOLUCIÓN: Usa chartType: "line" o "projection" con puntos históricos y futuros.
- SI EL USUARIO PIDE DISTRIBUCIÓN, PORCENTAJES O TARTA/PIE: Usa chartType: "pie" con desglose por categorías.
- SI EL USUARIO PIDE COMPARATIVA GENERAL O RANKING DE GASTOS: Usa chartType: "bar" con barras horizontales/verticales.
Incluye al final:
<<<CHART_START>>>
{
  "chartType": "pie",
  "category": "DISTRIBUCIÓN DE GASTOS",
  "title": "Desglose por Categorías",
  "data": [
    { "label": "Alimentación", "value": ${summary.totalExpense > 0 ? Math.round(summary.totalExpense * 0.4) : 250} },
    { "label": "Servicios", "value": ${summary.totalExpense > 0 ? Math.round(summary.totalExpense * 0.3) : 180} },
    { "label": "Ocio & Varios", "value": ${summary.totalExpense > 0 ? Math.round(summary.totalExpense * 0.3) : 120} }
  ]
}
<<<CHART_END>>>

4. SI EL USUARIO PIDE LISTA DE MOVIMIENTOS, REGISTROS O TABLAS:
Incluye al final:
<<<TABLE_START>>>
{
  "title": "Resumen Ejecutivo de Movimientos",
  "columns": ["Fecha", "Categoría", "Tipo", "Importe"],
  "rows": ${JSON.stringify((txs as any[]).slice(0, 5).map(t => [t.date || 'Hoy', t.category || 'General', t.type === 'income' ? 'Ingreso' : 'Gasto', `${t.amount}€`]))}
}
<<<TABLE_END>>>

5. SI EL USUARIO PIDE GENERAR O DESCARGAR DOCUMENTOS (WORD, EXCEL, PDF, INFORME O REPORTE):
Incluye al final:
<<<DOC_START>>>
{
  "title": "Informe Financiero Ejecutivo - HeraWallet",
  "format": "DOCX/XLSX/PDF",
  "size": "340 KB",
  "date": "${new Date().toISOString().split('T')[0]}",
  "columns": ["Categoría / Concepto", "Presupuesto", "Ejecutado", "Estado"],
  "rows": [
    ["Alimentación & Supermercado", "500€", "420€", "En rango"],
    ["Servicios & Suministros", "350€", "340€", "Optimizado"],
    ["Ocio & Salidas", "200€", "410€", "Excedido (-210€)"],
    ["Ahorro & Inversión", "400€", "400€", "Completado 100%"]
  ]
}
<<<DOC_END>>>`;

  if (deepseekKey && deepseekKey.trim()) {
    try {
      const agentResult = await agentOrchestrator.processUserQuery(userId, message, deepseekKey, { voiceMode: req.body?.live === true });
      aiReplyText = agentResult.text;
      chatUsage = {
        promptTokens: agentResult.usage.promptTokens,
        completionTokens: agentResult.usage.completionTokens,
        totalTokens: agentResult.usage.totalTokens,
        cachedPromptTokens: agentResult.usage.cachedPromptTokens
      };
      reasoningContent = 'Razonamiento agéntico ejecutado con memoria jerárquica de 4 niveles, análisis de tono y guardrails de seguridad.';
    } catch (e: any) {
      console.error('DeepSeek Orchestrator Fetch error:', e);
      aiReplyText = 'Lo sentimos, tenemos un problema de conexión con el servidor. Por favor inténtalo de nuevo más tarde.';
    }
  } else if (geminiKey && geminiKey.trim()) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey.trim()}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nConsulta del usuario: ${message}` }] }]
        })
      });

      if (geminiRes.ok) {
        const json = await geminiRes.json() as any;
        aiReplyText = json.candidates?.[0]?.content?.parts?.[0]?.text || 'Lo sentimos, el servidor se encuentra ocupado en este momento.';
        // Gemini reporta el consumo con otros nombres que DeepSeek.
        chatUsage = geminiUsage(json);
        chatModel = GEMINI_MODEL;
        reasoningContent = 'Evaluando patrimonio, ingresos y liquidez disponible con modelo de análisis en tiempo real.';
      } else {
        aiReplyText = 'Lo sentimos, el servidor se encuentra ocupado en este momento. Por favor inténtalo de nuevo más tarde.';
      }
    } catch (e: any) {
      aiReplyText = 'Lo sentimos, tenemos un problema de conexión con el servidor. Por favor inténtalo de nuevo más tarde.';
    }
  } else {
    aiReplyText = 'Lo sentimos, el servicio de inteligencia artificial no se encuentra configurado en este momento. Por favor inténtalo más tarde.';
  }

  // Parse Action & Visual Widgets Blocks from AI Reply Text
  const actionMatch = aiReplyText.match(/<<<ACTION_START>>>([\s\S]*?)<<<ACTION_END>>>/);
  const progressMatch = aiReplyText.match(/<<<PROGRESS_START>>>([\s\S]*?)<<<PROGRESS_END>>>/);
  const projectionMatch = aiReplyText.match(/<<<PROJECTION_START>>>([\s\S]*?)<<<PROJECTION_END>>>/);
  const chartMatch = aiReplyText.match(/<<<CHART_START>>>([\s\S]*?)<<<CHART_END>>>/);
  const tableMatch = aiReplyText.match(/<<<TABLE_START>>>([\s\S]*?)<<<TABLE_END>>>/);
  const docMatch = aiReplyText.match(/<<<DOC_START>>>([\s\S]*?)<<<DOC_END>>>/);

  if (actionMatch) {
    try {
      widgetType = 'pending_action';
      widgetData = JSON.parse(actionMatch[1].trim());
      aiReplyText = aiReplyText.replace(/<<<ACTION_START>>>[\s\S]*?<<<ACTION_END>>>/, '').trim();
    } catch (e) { }
  } else if (progressMatch) {
    try {
      widgetType = 'progress';
      widgetData = JSON.parse(progressMatch[1].trim());
      aiReplyText = aiReplyText.replace(/<<<PROGRESS_START>>>[\s\S]*?<<<PROGRESS_END>>>/, '').trim();
    } catch (e) { }
  } else if (projectionMatch) {
    try {
      widgetType = 'projection_chart';
      widgetData = JSON.parse(projectionMatch[1].trim());
      aiReplyText = aiReplyText.replace(/<<<PROJECTION_START>>>[\s\S]*?<<<PROJECTION_END>>>/, '').trim();
    } catch (e) { }
  } else if (chartMatch) {
    try {
      widgetType = 'chart';
      widgetData = JSON.parse(chartMatch[1].trim());
      aiReplyText = aiReplyText.replace(/<<<CHART_START>>>[\s\S]*?<<<CHART_END>>>/, '').trim();
    } catch (e) { }
  } else if (tableMatch) {
    try {
      widgetType = 'table';
      widgetData = JSON.parse(tableMatch[1].trim());
      aiReplyText = aiReplyText.replace(/<<<TABLE_START>>>[\s\S]*?<<<TABLE_END>>>/, '').trim();
    } catch (e) { }
  } else if (docMatch) {
    try {
      widgetType = 'document';
      widgetData = JSON.parse(docMatch[1].trim());
      aiReplyText = aiReplyText.replace(/<<<DOC_START>>>[\s\S]*?<<<DOC_END>>>/, '').trim();
    } catch (e) { }
  }

  // Fallback Automatic Document Widget Detection
  if (!widgetType && (
    aiReplyText.toLowerCase().includes('excel') ||
    aiReplyText.toLowerCase().includes('word') ||
    aiReplyText.toLowerCase().includes('pdf') ||
    aiReplyText.toLowerCase().includes('descargar') ||
    aiReplyText.toLowerCase().includes('generar archivo') ||
    aiReplyText.toLowerCase().includes('cree el excel') ||
    aiReplyText.toLowerCase().includes('widget inferior') ||
    aiReplyText.toLowerCase().includes('informe financiero')
  )) {
    const isDoc = aiReplyText.toLowerCase().includes('word') || aiReplyText.toLowerCase().includes('doc');
    const isPdf = aiReplyText.toLowerCase().includes('pdf');
    const fmt = isDoc ? 'docx' : isPdf ? 'pdf' : 'xlsx';

    widgetType = 'document';
    widgetData = {
      title: 'Informe_Financiero_HeraWallet',
      format: fmt,
      size: '340 KB',
      columns: ['Fecha', 'Categoría', 'Descripción', 'Tipo', 'Importe'],
      rows: [
        ['2026-07-28', 'Ingresos', 'Nómina / Ventas', 'Ingreso', '4.509 €'],
        ['2026-07-28', 'General', 'Gastos Totales', 'Gasto', '7.356 €'],
        ['2026-07-28', 'Ahorro', 'Fondo de Emergencia', 'Ahorro', '1.850 €'],
        ['2026-07-28', 'Metas', 'Viaje a Japón', 'Ahorro', '920 €']
      ]
    };
  }

  // Fallback Automatic Pending Action Detection
  if (!widgetType && (aiReplyText.toLowerCase().includes('autorizas') || aiReplyText.toLowerCase().includes('ejecute la acción') || aiReplyText.toLowerCase().includes('acción pendiente'))) {
    const amountMatch = aiReplyText.match(/(\d+([.,]\d+)?)\s*€/);
    const amountVal = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 100;
    widgetType = 'pending_action';
    widgetData = {
      actionType: 'create_transaction',
      type: 'income',
      amount: amountVal,
      category: 'Ahorro / Fondo de Emergencia',
      description: 'Transferencia a Fondo de Ahorro',
      accountId: (accounts[0] as any)?.id || '',
      accountName: (accounts[0] as any)?.name || 'Cuenta Principal'
    };
  }

  // Fallback Automatic Chart Type Detection (Lineal/Proyección, Pie/Pizza, Barras)
  if (!widgetType && (
    message.toLowerCase().includes('gráfico') ||
    message.toLowerCase().includes('grafico') ||
    message.toLowerCase().includes('proyecci') ||
    message.toLowerCase().includes('saldo futuro') ||
    message.toLowerCase().includes('tendencia') ||
    message.toLowerCase().includes('pie') ||
    message.toLowerCase().includes('pizza') ||
    message.toLowerCase().includes('tarta') ||
    message.toLowerCase().includes('porcentaje') ||
    message.toLowerCase().includes('barras') ||
    message.toLowerCase().includes('desglose') ||
    aiReplyText.toLowerCase().includes('proyección de saldo') ||
    aiReplyText.toLowerCase().includes('desglose de gastos')
  )) {
    const isPie = message.toLowerCase().includes('pie') || message.toLowerCase().includes('pizza') || message.toLowerCase().includes('tarta') || message.toLowerCase().includes('porcentaje') || message.toLowerCase().includes('distribuci');
    const isBar = message.toLowerCase().includes('barras') || message.toLowerCase().includes('comparativa') || message.toLowerCase().includes('ranking');
    const isProj = message.toLowerCase().includes('proyecci') || message.toLowerCase().includes('linea') || message.toLowerCase().includes('futuro') || message.toLowerCase().includes('tendencia');

    const totalBal = summary.totalBalance || 480;

    if (isPie) {
      widgetType = 'chart';
      widgetData = {
        chartType: 'pie',
        category: 'DISTRIBUCIÓN DE GASTOS',
        title: 'Porcentaje por Categorías',
        data: [
          { label: 'Alimentación', value: summary.totalExpense > 0 ? Math.round(summary.totalExpense * 0.4) : 250 },
          { label: 'Servicios', value: summary.totalExpense > 0 ? Math.round(summary.totalExpense * 0.25) : 160 },
          { label: 'Ocio & Varios', value: summary.totalExpense > 0 ? Math.round(summary.totalExpense * 0.2) : 130 },
          { label: 'Transporte', value: summary.totalExpense > 0 ? Math.round(summary.totalExpense * 0.15) : 90 }
        ]
      };
    } else if (isBar) {
      widgetType = 'chart';
      widgetData = {
        chartType: 'bar',
        category: 'COMPARATIVA DE GASTOS',
        title: 'Desglose por Categorías',
        data: [
          { label: 'Alimentación', value: summary.totalExpense > 0 ? Math.round(summary.totalExpense * 0.4) : 250 },
          { label: 'Servicios', value: summary.totalExpense > 0 ? Math.round(summary.totalExpense * 0.25) : 160 },
          { label: 'Ocio & Varios', value: summary.totalExpense > 0 ? Math.round(summary.totalExpense * 0.2) : 130 },
          { label: 'Transporte', value: summary.totalExpense > 0 ? Math.round(summary.totalExpense * 0.15) : 90 }
        ]
      };
    } else {
      widgetType = 'projection_chart';
      widgetData = {
        chartType: 'projection',
        category: 'PROYECCIÓN DE SALDO',
        title: 'Próximos cuatro meses',
        limit: 200,
        footnote: 'BASADO EN 4 MESES DE TUS DATOS',
        insight: 'El 12 de marzo tu saldo baja de 200. Si mueves **40 hoy** al fondo de emergencia, llegas sin descubierto.',
        points: [
          { label: 'OCT', real: Math.round(totalBal * 0.95), projection: null },
          { label: 'NOV', real: Math.round(totalBal * 1.1), projection: null },
          { label: 'DIC', real: Math.round(totalBal * 0.7), projection: null },
          { label: 'ENE', real: Math.round(totalBal * 1.05), projection: null },
          { label: 'FEB', real: Math.round(totalBal), projection: Math.round(totalBal) },
          { label: '12 MAR', real: null, projection: 160, isCritical: true },
          { label: 'ABR', real: null, projection: Math.round(totalBal * 0.75) },
          { label: 'MAY', real: null, projection: Math.round(totalBal * 0.9) }
        ]
      };
    }
  }

  // Save AI response to DB
  db.prepare('INSERT INTO chat_messages (id, userId, role, content, type, data, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    randomUUID(), userId, 'assistant', aiReplyText, widgetType || 'text', widgetData ? JSON.stringify(widgetData) : null, new Date().toISOString()
  );

  // Cobro del consumo real reportado por el proveedor. Incluye el system
  // prompt, las definiciones de herramientas, el historial reenviado, los
  // resultados de las herramientas y todas las iteraciones del agente.
  const charge = chargeTokens({
    userId,
    usage: chatUsage,
    type: 'ai_chat_usage',
    description: `Consulta IA Hera: "${message.slice(0, 30)}${message.length > 30 ? '...' : ''}"`,
    model: chatModel
  });

  logAudit(
    userId,
    'ai_chat',
    `Consulta a la IA procesada (-${charge.charged} tokens reales, $${charge.costUSD.toFixed(6)}): "${message.slice(0, 40)}"`
  );

  res.json({
    success: true,
    reply: aiReplyText,
    reasoningContent,
    widgetType,
    widgetData,
    tokensConsumed: charge.charged,
    tokensRemaining: charge.remaining,
    tokenBreakdown: {
      promptTokens: chatUsage.promptTokens,
      completionTokens: chatUsage.completionTokens,
      cachedPromptTokens: chatUsage.cachedPromptTokens
    }
  });
});

// --- Confirm Action Execution Endpoint ---

app.post('/api/finance/confirm-action', authMiddleware, (req: any, res) => {
  try {
    const { actionType, type, amount, category, description, accountId, name, targetAmount, currentAmount, deadline } = req.body;

    if (actionType === 'create_transaction') {
      let targetAccountId = accountId;
      if (!targetAccountId) {
        const acc = db.prepare('SELECT id FROM accounts WHERE userId = ? LIMIT 1').get(req.userId) as any;
        targetAccountId = acc ? acc.id : randomUUID();
      }
      const id = randomUUID();
      const txDate = new Date().toISOString().split('T')[0];

      db.prepare('INSERT INTO transactions (id, userId, accountId, type, amount, category, description, date, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        id, req.userId, targetAccountId, type || 'expense', Number(amount) || 0, category || 'General', description || category || 'Transacción desde Chat', txDate, new Date().toISOString()
      );

      const delta = (type || 'expense') === 'income' ? Number(amount) : -Number(amount);
      db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND userId = ?').run(delta, targetAccountId, req.userId);

      logAudit(req.userId, 'confirm_chat_transaction', `Transacción confirmada desde chat: ${category} - ${amount}€`);
      return res.json({ success: true, message: 'Registro creado con éxito en tus transacciones' });
    }

    if (actionType === 'delete_transaction') {
      const tx = db.prepare('SELECT * FROM transactions WHERE id = ? AND userId = ?').get(req.body.transactionId, req.userId) as any;
      if (!tx) return res.status(404).json({ error: 'La transacción ya no existe' });
      const revert = db.transaction(() => {
        db.prepare('DELETE FROM transactions WHERE id = ? AND userId = ?').run(tx.id, req.userId);
        // Un gasto borrado devuelve el dinero a la cuenta; un ingreso borrado lo quita.
        const delta = tx.type === 'income' ? -Number(tx.amount) : Number(tx.amount);
        db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND userId = ?').run(delta, tx.accountId, req.userId);
      });
      revert();
      logAudit(req.userId, 'confirm_chat_delete_tx', `Transacción eliminada con confirmación: ${tx.description || tx.category} - ${tx.amount}`);
      return res.json({ success: true, message: 'Transacción eliminada y saldo revertido correctamente' });
    }

    if (actionType === 'delete_debt') {
      const debt = db.prepare('SELECT * FROM debts WHERE id = ? AND userId = ?').get(req.body.debtId, req.userId) as any;
      if (!debt) return res.status(404).json({ error: 'La deuda ya no existe' });
      db.prepare('DELETE FROM debts WHERE id = ? AND userId = ?').run(debt.id, req.userId);
      logAudit(req.userId, 'confirm_chat_delete_debt', `Deuda eliminada con confirmación: ${debt.personOrEntity} - ${debt.amount}`);
      return res.json({ success: true, message: 'Registro de deuda/préstamo eliminado correctamente' });
    }

    if (actionType === 'create_debt') {
      const id = randomUUID();
      const debtPerson = req.body.personOrEntity || name || 'Persona / Entidad';
      const debtName = description || name || 'Préstamo / Deuda';
      db.prepare('INSERT INTO debts (id, userId, name, personOrEntity, type, amount, paidAmount, dueDate, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        id, req.userId, debtName, debtPerson, type || 'debt', Number(amount) || 0, 0, deadline || '', 'pending'
      );
      logAudit(req.userId, 'confirm_chat_debt', `Deuda/Cobro confirmada desde chat: ${debtPerson} - ${amount}€`);
      return res.json({ success: true, message: 'Registro de deuda/cobro guardado con éxito' });
    }

    if (actionType === 'create_goal') {
      const id = randomUUID();
      const targetDeadline = deadline || '2026-12-31';
      const weeks = Math.max(1, Math.ceil((new Date(targetDeadline).getTime() - Date.now()) / (7 * 86400000)));
      const weeklyTarget = Math.round(((Number(targetAmount) - (Number(currentAmount) || 0)) / weeks) * 100) / 100;

      db.prepare('INSERT INTO goals (id, userId, name, targetAmount, currentAmount, weeklyTarget, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        id, req.userId, name || 'Nueva Meta', Number(targetAmount) || 100, Number(currentAmount) || 0, weeklyTarget, targetDeadline
      );

      logAudit(req.userId, 'confirm_chat_goal', `Meta confirmada desde chat: ${name}`);
      return res.json({ success: true, message: 'Meta de ahorro registrada exitosamente' });
    }

    res.status(400).json({ error: 'Tipo de acción no válido' });
  } catch (err: any) {
    console.error('Error confirming action:', err);
    res.status(500).json({ error: 'Error procesando confirmación de la operación' });
  }
});

// --- Goal Plan Generation & Update Endpoints ---
const generateGoalPlanHandler = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    let goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as any;

    if (!goal) return res.status(404).json({ error: 'Meta no encontrada' });

    const summary = getDBUserSummary(userId);
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    const percentage = Math.round((goal.currentAmount / Math.max(1, goal.targetAmount)) * 100);

    const generatedSteps = [
      {
        id: randomUUID(),
        text: `Automatizar ahorro semanal de ${goal.weeklyTarget || Math.round(remaining / 12)}€ hacia ${goal.name}`,
        completed: false
      },
      {
        id: randomUUID(),
        text: `Optimizar presupuesto de ocio/comidas para destinar ${Math.round(remaining * 0.15)}€ al fondo este mes`,
        completed: false
      },
      {
        id: randomUUID(),
        text: `Monitorear avance con Hera al llegar al ${Math.min(100, percentage + 20)}% de la meta`,
        completed: false
      },
      {
        id: randomUUID(),
        text: `Abonar directamente a ${goal.name} cualquier ingreso extra o saldo remanente de fin de mes`,
        completed: false
      }
    ];

    const planDataObj = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      suggestion: `Sugerencia de Hera: Si automatizas las aportaciones semanales de ${goal.weeklyTarget || Math.round(remaining / 12)}€ en los primeros días tras tus ingresos, aumentarás un 65% la probabilidad de alcanzar la meta "${goal.name}" antes del límite (${goal.deadline}).`,
      steps: generatedSteps
    };

    const planDataStr = JSON.stringify(planDataObj);
    db.prepare('UPDATE goals SET planData = ? WHERE id = ?').run(planDataStr, id);

    res.json({
      success: true,
      plan: planDataObj
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al generar el plan de ahorro con IA' });
  }
};

const updateGoalPlanHandler = (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { planData } = req.body;

    const planStr = typeof planData === 'string' ? planData : JSON.stringify(planData);
    db.prepare('UPDATE goals SET planData = ? WHERE id = ?').run(planStr, id);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar el plan de la meta' });
  }
};

app.post('/api/goals/:id/generate-plan', authMiddleware, generateGoalPlanHandler);
app.post('/api/finance/goals/:id/generate-plan', authMiddleware, generateGoalPlanHandler);

app.put('/api/goals/:id/plan', authMiddleware, updateGoalPlanHandler);
app.put('/api/finance/goals/:id/plan', authMiddleware, updateGoalPlanHandler);

// --- User Notifications Endpoints ---

app.get('/api/notifications', authMiddleware, (req: any, res) => {
  try {
    const userId = req.userId;

    // 1. Verificación automática de vencimiento de suscripción (7 días antes)
    const sub = db.prepare('SELECT * FROM user_subscriptions WHERE userId = ?').get(userId) as any;
    if (sub && sub.nextRenewalAt) {
      const nextRenewal = new Date(sub.nextRenewalAt).getTime();
      const daysRemaining = Math.ceil((nextRenewal - Date.now()) / (24 * 3600000));
      if (daysRemaining > 0 && daysRemaining <= 7) {
        const existingExpNotif = db.prepare(`
          SELECT id FROM user_notifications 
          WHERE userId = ? AND title LIKE '%Suscripción%' AND createdAt > date('now', '-3 days')
        `).get(userId);

        if (!existingExpNotif) {
          db.prepare(`
            INSERT INTO user_notifications (id, userId, title, message, type, actionData, isRead, createdAt)
            VALUES (?, ?, ?, ?, 'warning', ?, 0, ?)
          `).run(
            randomUUID(),
            userId,
            'Suscripción próxima a vencer',
            `Tu suscripción vencerá en ${daysRemaining} días. Puedes gestionar tu plan o recargar tokens en Configuración.`,
            JSON.stringify({ actionType: 'open_settings', label: 'Gestionar Suscripción' }),
            new Date().toISOString()
          );
        }
      }
    }

    // 2. Notificaciones proactivas del Coach Hera (Avance de metas >= 50%)
    const activeGoals = db.prepare('SELECT * FROM goals WHERE userId = ? AND status = \'active\'').all(userId) as any[];
    for (const goal of activeGoals) {
      const percentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
      if (percentage >= 50 && percentage < 100) {
        const existingHeraNotif = db.prepare(`
          SELECT id FROM user_notifications 
          WHERE userId = ? AND title LIKE ? AND createdAt > date('now', '-7 days')
        `).get(userId, `%${goal.name}%`);

        if (!existingHeraNotif) {
          db.prepare(`
            INSERT INTO user_notifications (id, userId, title, message, type, actionData, isRead, createdAt)
            VALUES (?, ?, ?, ?, 'hera', ?, 0, ?)
          `).run(
            randomUUID(),
            userId,
            `Hera: Avance de Meta ${goal.name}`,
            `Hace unos meses querías avanzar con tu meta "${goal.name}". Ya alcanzaste el ${percentage}%. ¿Quieres revisar si es buen momento?`,
            JSON.stringify({
              actionType: 'open_chat',
              prompt: `Hola Hera, quiero revisar el avance de mi meta "${goal.name}" que está al ${percentage}% y evaluar si es buen momento para acelerar.`,
              label: 'Revisar con Hera'
            }),
            new Date().toISOString()
          );
        }
      }
    }

    const notifications = db.prepare(`
      SELECT * FROM user_notifications 
      WHERE userId = ? OR userId = 'ALL' 
      ORDER BY createdAt DESC LIMIT 50
    `).all(userId) as any[];

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM user_notifications 
      WHERE (userId = ? OR userId = 'ALL') AND isRead = 0
    `).get(userId) as any;

    res.json({
      notifications,
      unreadCount: unreadCount?.count || 0
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al recuperar notificaciones' });
  }
});

app.put('/api/notifications/:id/read', authMiddleware, (req: any, res) => {
  try {
    const { id } = req.params;
    db.prepare("UPDATE user_notifications SET isRead = 1 WHERE id = ? AND (userId = ? OR userId = 'ALL')").run(id, req.userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar notificación' });
  }
});

app.put('/api/notifications/read-all', authMiddleware, (req: any, res) => {
  try {
    db.prepare("UPDATE user_notifications SET isRead = 1 WHERE userId = ? OR userId = 'ALL'").run(req.userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al marcar notificaciones como leídas' });
  }
});

app.delete('/api/notifications/:id', authMiddleware, (req: any, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM user_notifications WHERE id = ? AND (userId = ? OR userId = 'ALL')").run(id, req.userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al eliminar notificación' });
  }
});

// --- Admin Panel API Routes (Protected by ADMIN_JWT_SECRET credentials admin / admin) ---

app.post('/api/admin/notifications/broadcast', adminAuthMiddleware, (req: any, res) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'El título y el mensaje son requeridos' });
    }

    const users = db.prepare('SELECT id FROM users').all() as any[];
    const now = new Date().toISOString();
    const insertStmt = db.prepare(`
      INSERT INTO user_notifications (id, userId, title, message, type, isRead, createdAt)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `);

    let sentCount = 0;
    for (const u of users) {
      insertStmt.run(randomUUID(), u.id, title, message, type || 'broadcast', now);
      sentCount++;
    }

    logAudit('admin', 'admin_broadcast_notification', `Notificación masiva enviada a ${sentCount} usuarios: "${title}"`);

    res.json({
      success: true,
      message: `Notificación enviada con éxito a ${sentCount} usuarios`,
      sentCount,
      title,
      type: type || 'broadcast'
    });
  } catch (err: any) {
    console.error('Error broadcasting notification:', err);
    res.status(500).json({ error: 'Error al enviar la notificación masiva' });
  }
});

app.get('/api/admin/notifications/history', adminAuthMiddleware, (req: any, res) => {
  try {
    const history = db.prepare(`
      SELECT title, message, type, COUNT(DISTINCT userId) as recipientCount, MAX(createdAt) as sentAt
      FROM user_notifications
      GROUP BY title, message, type
      ORDER BY sentAt DESC LIMIT 20
    `).all();
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener historial de notificaciones' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const expectedAdminUser = process.env.ADMIN_USERNAME || 'admin';
  const expectedAdminPass = process.env.ADMIN_PASSWORD || 'fuKWDqqmXn';

  if (username === expectedAdminUser && password === expectedAdminPass) {
    const adminToken = jwt.sign({ adminId: 'admin_root', role: 'admin' }, ADMIN_JWT_SECRET, { expiresIn: '7d' });
    logAudit('admin_root', 'admin_login', 'Inicio de sesión de administrador exitoso');
    return res.json({ success: true, token: adminToken });
  }
  return res.status(401).json({ error: 'Credenciales de administrador incorrectas' });
});

/**
 * Monitorización en vivo para el panel: quién está conectado ahora, últimas
 * conexiones, tráfico por hora y embudo de onboarding.
 */
app.get('/api/admin/realtime', adminAuthMiddleware, (req, res) => {
  // Presencia: en línea = actividad en los últimos 5 minutos.
  flushTelemetry(); // vuelca lo pendiente para que el dato sea del momento

  const onlineNow = db.prepare(`
    SELECT id, displayName, phone, photoURL, lastSeenAt, onboardingStep, role
    FROM users
    WHERE lastSeenAt >= datetime('now', '-5 minutes')
    ORDER BY lastSeenAt DESC
  `).all() as any[];

  const counts = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE lastSeenAt >= datetime('now', '-5 minutes'))  AS online5m,
      (SELECT COUNT(*) FROM users WHERE lastSeenAt >= datetime('now', '-1 hour'))     AS activeHour,
      (SELECT COUNT(*) FROM users WHERE lastSeenAt >= datetime('now', '-1 day'))      AS activeDay,
      (SELECT COUNT(*) FROM users WHERE lastSeenAt >= datetime('now', '-7 days'))     AS activeWeek,
      (SELECT COUNT(*) FROM users WHERE createdAt  >= datetime('now', '-1 day'))      AS newToday
  `).get() as any;

  // Últimas conexiones con datos del usuario.
  const recentSessions = db.prepare(`
    SELECT s.id, s.userId, s.ip, s.device, s.startedAt,
           u.displayName, u.phone, u.photoURL
    FROM user_sessions s
    LEFT JOIN users u ON u.id = s.userId
    ORDER BY s.startedAt DESC
    LIMIT 25
  `).all();

  // Tráfico de las últimas 24 horas, hora a hora.
  const traffic = db.prepare(`
    SELECT hour, requests, users FROM traffic_hourly
    ORDER BY hour DESC LIMIT 24
  `).all() as any[];

  // Embudo de onboarding: cuántos usuarios se quedan en cada paso.
  const funnelRows = db.prepare(`
    SELECT COALESCE(onboardingStep, 0) AS step, COUNT(*) AS count
    FROM users GROUP BY COALESCE(onboardingStep, 0)
  `).all() as any[];
  const stepCount = (s: number) => funnelRows.find(r => r.step === s)?.count || 0;
  const totalUsers = funnelRows.reduce((a, r) => a + r.count, 0);
  const completed = stepCount(3);
  const onboarding = {
    totalUsers,
    steps: [
      { step: 0, label: 'Registrados (sin completar perfil)', count: stepCount(0) },
      { step: 1, label: 'Perfil completado', count: stepCount(1) },
      { step: 2, label: 'Primera cuenta creada', count: stepCount(2) },
      { step: 3, label: 'Onboarding completado', count: completed }
    ],
    completionRate: totalUsers > 0 ? Math.round((completed / totalUsers) * 1000) / 10 : 0,
    // Usuarios que completaron el onboarding y además registraron algo.
    withFirstTransaction: (db.prepare(
      'SELECT COUNT(DISTINCT userId) AS c FROM transactions'
    ).get() as any)?.c || 0
  };

  res.json({
    serverTime: new Date().toISOString(),
    counts,
    onlineNow: onlineNow.slice(0, 20),
    recentSessions,
    traffic: traffic.reverse(),
    onboarding
  });
});

app.get('/api/admin/stats', adminAuthMiddleware, (req, res) => {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any)?.count || 0;
  const activeSubscriptions = (db.prepare("SELECT COUNT(*) as count FROM user_subscriptions WHERE status = 'active'").get() as any)?.count || 0;
  const totalRevenueUSD = (db.prepare("SELECT SUM(amountUSD) as total FROM token_transactions WHERE amountUSD > 0").get() as any)?.total || 0;
  const totalRevenueCUP = (db.prepare("SELECT SUM(amountCUP) as total FROM cuba_payment_requests WHERE status = 'approved'").get() as any)?.total || 0;
  const totalTokensConsumed = Math.abs((db.prepare("SELECT SUM(tokens) as total FROM token_transactions WHERE tokens < 0").get() as any)?.total || 0);
  const totalLLMQueries = (db.prepare('SELECT COUNT(*) as count FROM chat_messages').get() as any)?.count || 0;
  const pendingCubaRequests = (db.prepare("SELECT COUNT(*) as count FROM cuba_payment_requests WHERE status = 'pending'").get() as any)?.count || 0;
  const approvedCubaRequests = (db.prepare("SELECT COUNT(*) as count FROM cuba_payment_requests WHERE status = 'approved'").get() as any)?.count || 0;
  const totalFounders = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'founder'").get() as any)?.count || 0;
  const totalStandard = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role != 'founder' OR role IS NULL").get() as any)?.count || 0;
  const avgTokensPerQuery = totalLLMQueries > 0 ? Math.round(totalTokensConsumed / totalLLMQueries) : 0;
  const activeAiProviders = (db.prepare('SELECT COUNT(*) as count FROM ai_providers WHERE isActive = 1').get() as any)?.count || 0;
  const totalDebtsLogged = (db.prepare('SELECT COUNT(*) as count FROM debts').get() as any)?.count || 0;
  const totalAccounts = (db.prepare('SELECT COUNT(*) as count FROM accounts').get() as any)?.count || 0;
  const cubaConfig = db.prepare('SELECT * FROM cuba_payment_config WHERE id = 1').get() as any;
  const cupExchangeRate = cubaConfig?.cupExchangeRate || 320;
  const activePlansCount = (db.prepare('SELECT COUNT(*) as count FROM subscription_plans WHERE isActive = 1').get() as any)?.count || 0;
  const txCount = (db.prepare('SELECT COUNT(*) as count FROM transactions').get() as any)?.count || 0;
  // Activos de verdad en las últimas 24h (antes contaba a todo usuario que
  // hubiera tenido alguna transacción de tokens en toda su vida).
  const dailyActiveUsers = (db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE lastSeenAt >= datetime('now', '-1 day')"
  ).get() as any)?.count || 0;
  // Porcentaje real de suscripciones que siguen activas (antes: 98.4 fijo).
  const totalSubs = (db.prepare('SELECT COUNT(*) as count FROM user_subscriptions').get() as any)?.count || 0;
  const tokenRenewalRate = totalSubs > 0 ? Math.round((activeSubscriptions / totalSubs) * 1000) / 10 : 0;
  const providers = db.prepare('SELECT * FROM ai_providers ORDER BY createdAt ASC').all();

  res.json({
    userCount,
    activeSubscriptions,
    totalRevenueUSD,
    totalRevenueCUP,
    totalTokensConsumed,
    totalLLMQueries,
    pendingCubaRequests,
    approvedCubaRequests,
    totalFounders,
    totalStandard,
    avgTokensPerQuery,
    activeAiProviders,
    totalDebtsLogged,
    totalAccounts,
    cupExchangeRate,
    activePlansCount,
    txCount,
    dailyActiveUsers,
    tokenRenewalRate,
    providers,
    whisperStatus: 'online'
  });
});

app.get('/api/admin/providers', adminAuthMiddleware, (req, res) => {
  try {
    db.prepare("UPDATE ai_providers SET isActive = 1 WHERE apiKey IS NOT NULL AND TRIM(apiKey) != '' AND apiKey NOT LIKE '%invalid%'").run();
  } catch { }
  const providers = db.prepare('SELECT * FROM ai_providers ORDER BY createdAt ASC').all();
  res.json(providers);
});

app.post('/api/admin/providers', adminAuthMiddleware, (req, res) => {
  const { name, model, apiKey } = req.body;
  if (!name || !model) return res.status(400).json({ error: 'Nombre y modelo requeridos' });

  const id = randomUUID();
  const keyTrimmed = (apiKey || '').trim();
  const isActive = keyTrimmed.length > 0 && !keyTrimmed.toLowerCase().includes('invalid') ? 1 : 0;

  db.prepare('INSERT INTO ai_providers (id, name, model, apiKey, isActive, createdAt) VALUES (?, ?, ?, ?, ?, ?)').run(
    id, name, model, apiKey || '', isActive, new Date().toISOString()
  );
  logAudit('admin_root', 'create_provider', `Proveedor creado: ${name}`);
  res.json({ success: true, id });
});

app.put('/api/admin/providers/:id', adminAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const { apiKey, model, isActive } = req.body;

  const updates: string[] = [];
  const vals: any[] = [];
  if (apiKey !== undefined) {
    updates.push('apiKey = ?');
    vals.push(apiKey);
    const keyTrimmed = (apiKey || '').trim();
    if (keyTrimmed.length > 0 && !keyTrimmed.toLowerCase().includes('invalid')) {
      updates.push('isActive = 1');
    } else {
      updates.push('isActive = 0');
    }
  }
  if (model !== undefined) { updates.push('model = ?'); vals.push(model); }
  if (isActive !== undefined && apiKey === undefined) { updates.push('isActive = ?'); vals.push(isActive); }

  if (updates.length > 0) {
    vals.push(id);
    db.prepare(`UPDATE ai_providers SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
  }

  logAudit('admin_root', 'update_provider', `Proveedor actualizado: ${id}`);
  res.json({ success: true });
});

// Admin Users List with Role, Tokens Spent, Subscription & Telemetry summary
app.get('/api/admin/users', adminAuthMiddleware, (req, res) => {
  const rawUsers = db.prepare('SELECT * FROM users ORDER BY createdAt DESC').all();
  const users = rawUsers.map((u: any) => {
    const tokensSpent = Math.abs((db.prepare("SELECT SUM(tokens) as total FROM token_transactions WHERE userId = ? AND tokens < 0").get(u.id) as any)?.total || 0);
    const sub = db.prepare("SELECT s.*, p.name as planName FROM user_subscriptions s LEFT JOIN subscription_plans p ON s.planId = p.id WHERE s.userId = ?").get(u.id) as any;
    const totalQueries = (db.prepare("SELECT COUNT(*) as count FROM chat_messages WHERE userId = ?").get(u.id) as any)?.count || 0;
    const lastTx = db.prepare("SELECT createdAt FROM token_transactions WHERE userId = ? ORDER BY createdAt DESC LIMIT 1").get(u.id) as any;

    return {
      ...u,
      role: u.role || 'standard',
      tokensSpent,
      tokenBalance: u.role === 'founder' ? FOUNDER_BALANCE : (sub?.tokenBalance ?? 0),
      planName: u.role === 'founder' ? 'Founder VIP (Ilimitado)' : (sub?.planName || 'Sin plan'),
      planStatus: sub?.status || 'active',
      lastActiveAt: lastTx?.createdAt || u.createdAt,
      totalQueries
    };
  });
  res.json(users);
});

// Update User Role (founder | standard)
app.put('/api/admin/users/:id/role', adminAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (role !== 'standard' && role !== 'founder') {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  if (role === 'founder') {
    db.prepare("UPDATE user_subscriptions SET tokenBalance = ?, planId = 'plan-founder' WHERE userId = ?").run(FOUNDER_BALANCE, id);
  } else {
    // Al volver a standard baja al Plan Gratuito con la cuota vigente de ese plan.
    const freePlan = db.prepare("SELECT * FROM subscription_plans WHERE id = 'plan-free'").get() as any;
    db.prepare("UPDATE user_subscriptions SET tokenBalance = ?, tokensTotalPlan = ?, planId = 'plan-free' WHERE userId = ?")
      .run(freePlan?.tokensCount ?? 25000, freePlan?.tokensCount ?? 25000, id);
  }

  logAudit('admin_root', 'change_user_role', `Rol de usuario ${id} actualizado a ${role}`);
  res.json({ success: true, message: `Usuario actualizado a rol ${role}` });
});

// Get User Telemetry & Deep Profiling for Sidebar Drawer
app.get('/api/admin/users/:id/telemetry', adminAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const sub = db.prepare("SELECT s.*, p.name as planName FROM user_subscriptions s LEFT JOIN subscription_plans p ON s.planId = p.id WHERE s.userId = ?").get(id) as any;
  const transactions = db.prepare("SELECT * FROM token_transactions WHERE userId = ? ORDER BY createdAt DESC LIMIT 20").all(id);
  const tokensSpent = Math.abs((db.prepare("SELECT SUM(tokens) as total FROM token_transactions WHERE userId = ? AND tokens < 0").get(id) as any)?.total || 0);
  const totalQueries = (db.prepare("SELECT COUNT(*) as count FROM chat_messages WHERE userId = ?").get(id) as any)?.count || 0;
  const accountsCount = (db.prepare("SELECT COUNT(*) as count FROM accounts WHERE userId = ?").get(id) as any)?.count || 0;
  const debtsCount = (db.prepare("SELECT COUNT(*) as count FROM debts WHERE userId = ?").get(id) as any)?.count || 0;

  res.json({
    user: {
      ...user,
      role: user.role || 'standard'
    },
    subscription: sub || { planName: 'Sin plan', tokenBalance: 0, status: 'none' },
    metrics: {
      tokensSpent,
      totalQueries,
      accountsCount,
      debtsCount
    },
    recentTransactions: transactions
  });
});

// Get Unified Payment Transactions Across Platform (Stripe + Transfermóvil Cuba)
app.post('/api/admin/cuba-requests/:id/approve', adminAuthMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const cubaReq = db.prepare('SELECT * FROM cuba_payment_requests WHERE id = ?').get(id) as any;
    if (!cubaReq) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (cubaReq.status !== 'pending') return res.status(400).json({ error: 'La solicitud ya ha sido procesada anteriormente' });

    const now = new Date();
    const userId = cubaReq.userId;

    if (cubaReq.isTopUp === 1 || cubaReq.isTopUp === true) {
      const tokenMap: Record<number, number> = { 2: 20000, 5: 55000, 15: 180000, 25: 320000, 50: 700000, 100: 1500000 };
      const tokensToAdd = tokenMap[cubaReq.amountUSD] || Math.round((cubaReq.amountUSD || 5) * 10000);

      const sub = db.prepare('SELECT * FROM user_subscriptions WHERE userId = ?').get(userId) as any;
      if (sub) {
        // tokensTotalPlan también sube: es el denominador de la barra de
        // consumo, y si no crece con las recargas la barra queda rota.
        creditTokens(userId, tokensToAdd);
      } else {
        db.prepare(`
          INSERT INTO user_subscriptions (id, userId, planId, billingFrequency, status, tokenBalance, tokensTotalPlan, lastRenewalAt, nextRenewalAt)
          VALUES (?, ?, 'plan-basic', 'monthly', 'active', ?, ?, ?, ?)
        `).run(randomUUID(), userId, tokensToAdd, tokensToAdd, now.toISOString(), new Date(now.getTime() + 720 * 3600000).toISOString());
      }

      db.prepare(`
        INSERT INTO token_transactions (id, userId, type, tokens, amountUSD, description, date, createdAt)
        VALUES (?, ?, 'top_up', ?, ?, ?, ?, ?)
      `).run(randomUUID(), userId, tokensToAdd, cubaReq.amountUSD, `Recarga Top Up Transfermóvil (${cubaReq.transactionId})`, now.toISOString().split('T')[0], now.toISOString());

      db.prepare(`
        INSERT INTO user_notifications (id, userId, title, message, type, actionData, isRead, createdAt)
        VALUES (?, ?, ?, ?, 'success', ?, 0, ?)
      `).run(
        randomUUID(),
        userId,
        '¡Recarga Procesada con Éxito!',
        `Se han acreditado ${tokensToAdd.toLocaleString()} tokens a tu cuenta tras verificar la transferencia.`,
        JSON.stringify({ actionType: 'open_settings', label: 'Ver Balance de Tokens' }),
        now.toISOString()
      );

    } else {
      let plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(cubaReq.planId) as any;
      if (!plan) {
        const defaultPlansMap: Record<string, any> = {
          'plan-basic': { id: 'plan-basic', name: 'Plan Básico', tokensCount: 50000, renewIntervalHours: 720 },
          'plan-pro': { id: 'plan-pro', name: 'Plan Pro', tokensCount: 250000, renewIntervalHours: 720 },
          'plan-enterprise': { id: 'plan-enterprise', name: 'Plan Empresarial', tokensCount: 1000000, renewIntervalHours: 720 }
        };
        plan = defaultPlansMap[cubaReq.planId] || defaultPlansMap['plan-pro'] || { id: 'plan-pro', name: 'Plan Pro', tokensCount: 250000, renewIntervalHours: 720 };
      }

      const frequency = normalizeFrequency(cubaReq.billingFrequency);
      const cycle = BILLING_CYCLES[frequency];
      // Antes se ignoraba la frecuencia: quien pagaba el plan anual recibía
      // los mismos tokens que el mensual y le caducaba a los 30 días.
      const planTokens = (plan?.tokensCount || 250000) * cycle.months;
      const planIdToSave = plan?.id || 'plan-pro';
      const nextRenewal = new Date(
        now.getTime() + (plan?.renewIntervalHours || 720) * cycle.months * 3600000
      );
      const existingSub = db.prepare('SELECT * FROM user_subscriptions WHERE userId = ?').get(userId) as any;

      if (existingSub) {
        db.prepare(`
          UPDATE user_subscriptions
          SET planId = ?, billingFrequency = ?, status = 'active', lastRenewalAt = ?, nextRenewalAt = ?
          WHERE userId = ?
        `).run(planIdToSave, frequency, now.toISOString(), nextRenewal.toISOString(), userId);
        creditTokens(userId, planTokens);
      } else {
        db.prepare(`
          INSERT INTO user_subscriptions (id, userId, planId, billingFrequency, status, tokenBalance, tokensTotalPlan, lastRenewalAt, nextRenewalAt)
          VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)
        `).run(randomUUID(), userId, planIdToSave, frequency, planTokens, planTokens, now.toISOString(), nextRenewal.toISOString());
      }

      db.prepare(`
        INSERT INTO token_transactions (id, userId, type, tokens, amountUSD, description, date, createdAt)
        VALUES (?, ?, 'subscription_renewal', ?, ?, ?, ?, ?)
      `).run(randomUUID(), userId, planTokens, cubaReq.amountUSD, `Suscripción Transfermóvil a ${cubaReq.planName || plan?.name || 'Plan Pro'}`, now.toISOString().split('T')[0], now.toISOString());
    }

    db.prepare("UPDATE cuba_payment_requests SET status = 'approved', processedAt = ? WHERE id = ?").run(now.toISOString(), id);
    logAudit('admin_root', 'approve_cuba_payment', `Pago Cuba aprobado: ID ${cubaReq.transactionId} para usuario ${userId}`);

    res.json({ success: true, message: 'Pago aprobado y plan/recarga activado correctamente' });
  } catch (err: any) {
    console.error('Error aprobando pago Cuba:', err);
    res.status(500).json({ error: err.message || 'Error interno del servidor al aprobar el pago' });
  }
});

app.post('/api/admin/cuba-requests/:id/reject', adminAuthMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const cubaReq = db.prepare('SELECT * FROM cuba_payment_requests WHERE id = ?').get(id) as any;
    if (!cubaReq) return res.status(404).json({ error: 'Solicitud no encontrada' });

    const now = new Date().toISOString();
    db.prepare("UPDATE cuba_payment_requests SET status = 'rejected', processedAt = ? WHERE id = ?").run(now, id);
    logAudit('admin_root', 'reject_cuba_payment', `Pago Cuba rechazado: ID ${id}`);

    res.json({ success: true, message: 'Solicitud rechazada' });
  } catch (err: any) {
    console.error('Error rechazando pago Cuba:', err);
    res.status(500).json({ error: err.message || 'Error interno del servidor al rechazar el pago' });
  }
});

app.get('/api/admin/all-transactions', adminAuthMiddleware, (req, res) => {
  const stripeTxs = db.prepare(`
    SELECT 
      t.id, 
      t.userId, 
      t.type, 
      t.tokens, 
      t.amountUSD, 
      NULL as amountCUP, 
      t.description as planName, 
      'Stripe' as method, 
      'approved' as status, 
      t.id as transactionId, 
      t.createdAt, 
      u.displayName as userDisplayName, 
      u.email as userEmail, 
      u.phone as userPhone
    FROM token_transactions t 
    LEFT JOIN users u ON t.userId = u.id 
    WHERE t.type = 'subscription_renewal' OR t.type = 'top_up' OR t.type = 'plan_purchase' OR (t.amountUSD IS NOT NULL AND t.amountUSD > 0)
  `).all();

  const cubaTxs = db.prepare(`
    SELECT 
      c.id, 
      c.userId, 
      CASE WHEN c.isTopUp = 1 THEN 'top_up' ELSE 'subscription_renewal' END as type, 
      0 as tokens, 
      c.amountUSD, 
      c.amountCUP, 
      c.planName, 
      'Transfermóvil' as method, 
      c.status, 
      c.transactionId, 
      c.createdAt, 
      c.userDisplayName, 
      c.userEmail, 
      c.userPhone
    FROM cuba_payment_requests c
  `).all();

  const allTxs = [...stripeTxs, ...cubaTxs].sort((a: any, b: any) => {
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  res.json(allTxs);
});



app.get('/api/admin/logs', adminAuthMiddleware, (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT 100').all();
  res.json(logs);
});

// --- Subscription Plans & Tokens API Endpoints ---

// Get active public subscription plans
app.get('/api/plans', (req, res) => {
  const plans = db.prepare('SELECT * FROM subscription_plans WHERE isActive = 1 ORDER BY priceMonthly ASC').all();
  res.json(plans);
});

// Get user current subscription, token balance & usage report
app.get('/api/user/subscription', authMiddleware, (req: any, res) => {
  const userId = req.userId;
  let sub = db.prepare('SELECT s.*, p.name as planName, p.description as planDescription, p.isRecommended FROM user_subscriptions s LEFT JOIN subscription_plans p ON s.planId = p.id WHERE s.userId = ?').get(userId) as any;

  // Daily usage grouped by date (up to 365 days for timeframe selector)
  const usageGrouped = db.prepare(`
    SELECT date, ABS(SUM(tokens)) as tokensUsed 
    FROM token_transactions 
    WHERE userId = ? AND (type = 'usage' OR type = 'ai_chat_usage' OR tokens < 0)
    GROUP BY date 
    ORDER BY date ASC 
    LIMIT 365
  `).all(userId);

  res.json({
    subscription: sub || null,
    dailyUsage: usageGrouped
  });
});

// --- Real Stripe Payment REST API Integration ---

/**
 * Registro de pagos ya aplicados. La clave primaria es el id de la sesión de
 * Checkout, así que da igual que el pago llegue por webhook y por la vuelta del
 * usuario a `success_url`: solo se acreditan tokens una vez.
 */
db.exec(`
  CREATE TABLE IF NOT EXISTS stripe_payments (
    sessionId TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    kind TEXT NOT NULL,
    planId TEXT,
    frequency TEXT,
    amountUSD REAL,
    tokensGranted INTEGER,
    source TEXT,
    createdAt TEXT
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS stripe_events (
    id TEXT PRIMARY KEY,
    type TEXT,
    createdAt TEXT
  );
`);

const STRIPE_API_VERSION = process.env.STRIPE_API_VERSION || '2026-02-25.clover';

/** Tokens que otorga cada importe de recarga directa. */
const TOP_UP_TOKENS: Record<number, number> = {
  2: 20000,
  5: 55000,
  15: 180000,
  25: 320000,
  50: 700000,
  100: 1500000
};

function topUpTokensFor(amountUSD: number): number {
  return TOP_UP_TOKENS[amountUSD] || Math.round(amountUSD * 10000);
}

const DEFAULT_PLANS: Record<string, any> = {
  'plan-basic': { id: 'plan-basic', name: 'Plan Básico', description: 'Ideal para usuarios ocasionales que buscan control financiero inteligente.', priceMonthly: 4.99, priceQuarterly: 12.99, priceAnnual: 44.99, tokensCount: 50000, renewIntervalHours: 720, isRecommended: 0 },
  'plan-pro': { id: 'plan-pro', name: 'Plan Pro', description: 'Recomendado para un control total diario con análisis de IA ilimitados y alertas activas.', priceMonthly: 14.99, priceQuarterly: 39.99, priceAnnual: 129.99, tokensCount: 250000, renewIntervalHours: 720, isRecommended: 1 },
  'plan-enterprise': { id: 'plan-enterprise', name: 'Plan Empresarial', description: 'Para empresas y emprendedores con múltiples cuentas, alto volumen de operaciones y firmas.', priceMonthly: 39.99, priceQuarterly: 109.99, priceAnnual: 349.99, tokensCount: 1000000, renewIntervalHours: 720, isRecommended: 0 }
};

function resolvePlan(planId: string): any {
  const existing = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(planId) as any;
  if (existing) return existing;

  const plan = DEFAULT_PLANS[planId] || DEFAULT_PLANS['plan-pro'];
  try {
    db.prepare(`
      INSERT OR IGNORE INTO subscription_plans (id, name, description, priceMonthly, priceQuarterly, priceAnnual, tokensCount, renewIntervalHours, isRecommended, isActive, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(plan.id, plan.name, plan.description, plan.priceMonthly, plan.priceQuarterly, plan.priceAnnual, plan.tokensCount, plan.renewIntervalHours, plan.isRecommended, new Date().toISOString());
  } catch { }
  return plan;
}

function planAmountUSD(plan: any, freq: string): number {
  if (freq === 'quarterly') return plan.priceQuarterly;
  if (freq === 'annual') return plan.priceAnnual;
  return plan.priceMonthly;
}

/** ¿Este usuario paga desde Cuba? Entonces no va por Stripe, sino por transferencia manual. */
function isCubaPayer(userId: string, paymentCountry: any): boolean {
  if (paymentCountry && typeof paymentCountry === 'string' && paymentCountry.trim() !== '') {
    const cleanCountry = paymentCountry.trim().toLowerCase();
    return cleanCountry === 'cuba' || cleanCountry === 'cu';
  }
  const user = db.prepare('SELECT phone FROM users WHERE id = ?').get(userId) as any;
  const cleanPhone = (user?.phone || '').replace(/[^0-9+]/g, '');
  return cleanPhone.startsWith('+53') || cleanPhone.startsWith('53');
}

async function stripeAPI(path: string, init?: { method?: string; body?: URLSearchParams }): Promise<any> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY no configurada');

  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: init?.method || 'GET',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': STRIPE_API_VERSION
    },
    body: init?.body ? init.body.toString() : undefined
  });

  const data = await res.json() as any;
  if (!res.ok) {
    console.error(`❌ [Stripe API Error] ${init?.method || 'GET'} ${path}:`, data?.error?.message || data);
    throw new Error(data?.error?.message || 'Error al comunicarse con la API de Stripe');
  }
  return data;
}

async function createStripeCheckoutSession(params: {
  userId: string;
  amountUSD: number;
  productName: string;
  kind: 'subscription' | 'topup';
  planId: string;
  frequency: string;
  tokens: number;
  appUrl: string;
  customerEmail?: string;
}): Promise<{ id: string; url: string }> {
  const appUrl = params.appUrl || 'http://localhost:3000';
  const bodyParams = new URLSearchParams();

  bodyParams.append('payment_method_types[0]', 'card');
  bodyParams.append('mode', 'payment');
  bodyParams.append('line_items[0][price_data][currency]', 'usd');
  bodyParams.append('line_items[0][price_data][product_data][name]', params.productName);
  bodyParams.append('line_items[0][price_data][unit_amount]', Math.round(params.amountUSD * 100).toString());
  bodyParams.append('line_items[0][quantity]', '1');
  bodyParams.append('success_url', `${appUrl}/?stripe_success=true&session_id={CHECKOUT_SESSION_ID}`);
  bodyParams.append('cancel_url', `${appUrl}/?stripe_cancel=true`);
  bodyParams.append('client_reference_id', params.userId);
  bodyParams.append('metadata[userId]', params.userId);
  bodyParams.append('metadata[kind]', params.kind);
  bodyParams.append('metadata[planId]', params.planId);
  bodyParams.append('metadata[frequency]', params.frequency);
  bodyParams.append('metadata[tokens]', String(params.tokens));
  if (params.customerEmail) bodyParams.append('customer_email', params.customerEmail);

  const data = await stripeAPI('/checkout/sessions', { method: 'POST', body: bodyParams });
  return { id: data.id, url: data.url };
}

/**
 * Aplica un pago de Stripe ya cobrado. Es idempotente: la primera escritura en
 * `stripe_payments` gana y las siguientes no acreditan nada.
 * El importe y los tokens salen SIEMPRE de la sesión de Stripe, nunca del cliente.
 */
function applyStripePayment(session: any, source: 'webhook' | 'confirm'): { applied: boolean; tokensGranted: number; message: string } {
  const sessionId = session.id;
  const userId = session.metadata?.userId || session.client_reference_id;
  const kind = session.metadata?.kind === 'topup' ? 'topup' : 'subscription';
  const amountUSD = (session.amount_total || 0) / 100;
  const now = new Date();

  if (!userId) throw new Error('Sesión de Stripe sin userId en metadata');

  const alreadyDone = db.prepare('SELECT 1 FROM stripe_payments WHERE sessionId = ?').get(sessionId);
  if (alreadyDone) {
    return { applied: false, tokensGranted: 0, message: 'Este pago ya había sido acreditado.' };
  }

  let tokensGranted = 0;
  let planIdApplied: string | null = null;
  let freqApplied: string | null = null;
  let message = '';

  if (kind === 'topup') {
    tokensGranted = parseInt(session.metadata?.tokens || '0', 10) || topUpTokensFor(amountUSD);

    const sub = db.prepare('SELECT * FROM user_subscriptions WHERE userId = ?').get(userId) as any;
    if (!sub) {
      const defaultPlan = db.prepare('SELECT * FROM subscription_plans WHERE isRecommended = 1 LIMIT 1') .get() as any;
      db.prepare(`
        INSERT INTO user_subscriptions (id, userId, planId, billingFrequency, status, tokenBalance, tokensTotalPlan, lastRenewalAt, nextRenewalAt)
        VALUES (?, ?, ?, 'monthly', 'active', ?, ?, ?, ?)
      `).run(randomUUID(), userId, defaultPlan ? defaultPlan.id : 'plan-pro', tokensGranted, tokensGranted, now.toISOString(), new Date(now.getTime() + 720 * 3600000).toISOString());
    } else {
      creditTokens(userId, tokensGranted);
    }

    db.prepare(`
      INSERT INTO token_transactions (id, userId, type, tokens, amountUSD, description, date, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), userId, 'top_up', tokensGranted, amountUSD, `Recarga Top Up de $${amountUSD} USD (Stripe)`, now.toISOString().split('T')[0], now.toISOString());

    logAudit(userId, 'token_top_up', `Recarga Stripe de $${amountUSD} USD (+${tokensGranted} tokens) [${source}]`);
    message = `¡Recarga de +${tokensGranted.toLocaleString()} tokens realizada!`;
  } else {
    const plan = resolvePlan(session.metadata?.planId || 'plan-pro');
    const freq = normalizeFrequency(session.metadata?.frequency);
    const cycle = BILLING_CYCLES[freq];
    tokensGranted = (plan.tokensCount || 250000) * cycle.months;
    planIdApplied = plan.id;
    freqApplied = freq;
    const nextRenewal = new Date(now.getTime() + (plan.renewIntervalHours || 720) * cycle.months * 3600000);

    const existingSub = db.prepare('SELECT * FROM user_subscriptions WHERE userId = ?').get(userId) as any;
    if (existingSub) {
      db.prepare(`
        UPDATE user_subscriptions
        SET planId = ?, billingFrequency = ?, status = 'active', lastRenewalAt = ?, nextRenewalAt = ?
        WHERE userId = ?
      `).run(plan.id, freq, now.toISOString(), nextRenewal.toISOString(), userId);
      creditTokens(userId, tokensGranted);
    } else {
      db.prepare(`
        INSERT INTO user_subscriptions (id, userId, planId, billingFrequency, status, tokenBalance, tokensTotalPlan, lastRenewalAt, nextRenewalAt)
        VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)
      `).run(randomUUID(), userId, plan.id, freq, tokensGranted, tokensGranted, now.toISOString(), nextRenewal.toISOString());
    }

    db.prepare(`
      INSERT INTO token_transactions (id, userId, type, tokens, amountUSD, description, date, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), userId, 'subscription_renewal', tokensGranted, amountUSD, `Pago Stripe: Suscripción ${plan.name} (${cycle.label})`, now.toISOString().split('T')[0], now.toISOString());

    logAudit(userId, 'subscribe_plan', `Plan Stripe activado: ${plan.name} ($${amountUSD}) [${source}]`);
    message = `¡Plan ${plan.name} activado con éxito!`;
  }

  db.prepare(`
    INSERT INTO stripe_payments (sessionId, userId, kind, planId, frequency, amountUSD, tokensGranted, source, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(sessionId, userId, kind, planIdApplied, freqApplied, amountUSD, tokensGranted, source, now.toISOString());

  return { applied: true, tokensGranted, message };
}

/**
 * Crea la sesión de Checkout para un plan o para una recarga.
 * Devuelve `checkoutUrl`: el frontend DEBE redirigir ahí. Ningún token se
 * acredita en este punto — solo cuando Stripe confirma el cobro.
 */
async function handleCreateCheckout(req: any, res: any) {
  try {
    const { planId, frequency, paymentCountry, amountUSD: rawAmount } = req.body || {};
    const userId = req.userId;
    const isTopUp = String(planId || '').startsWith('top-up-') || String(frequency || '') === 'top-up' || (!planId && rawAmount);

    let amountUSD: number;
    let productName: string;
    let tokens = 0;
    let resolvedPlanId = planId || '';
    let freq = 'monthly';

    if (isTopUp) {
      const parsed = Number(rawAmount ?? String(planId || '').replace('top-up-', ''));
      if (!parsed || parsed <= 0) return res.status(400).json({ error: 'Monto inválido' });
      amountUSD = parsed;
      tokens = topUpTokensFor(parsed);
      productName = `Recarga Top Up ($${parsed} USD)`;
      resolvedPlanId = `top-up-${parsed}`;
      freq = 'top-up';
    } else {
      const plan = resolvePlan(planId);
      freq = normalizeFrequency(frequency);
      amountUSD = planAmountUSD(plan, freq);
      productName = `${plan.name} (${BILLING_CYCLES[freq].label})`;
      resolvedPlanId = plan.id;
      tokens = (plan.tokensCount || 250000) * BILLING_CYCLES[freq].months;
    }

    // Cuba no pasa por Stripe: se resuelve por transferencia manual verificada por un admin.
    if (isCubaPayer(userId, paymentCountry)) {
      return res.json({
        isCuba: true,
        amountUSD,
        planName: productName,
        checkoutUrl: null
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Pasarela de pago no configurada. Contacta con soporte.' });
    }

    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as any;

    try {
      const session = await createStripeCheckoutSession({
        userId,
        amountUSD,
        productName,
        kind: isTopUp ? 'topup' : 'subscription',
        planId: resolvedPlanId,
        frequency: freq,
        tokens,
        appUrl: process.env.APP_URL || 'http://localhost:3000',
        customerEmail: user?.email || undefined
      });

      return res.json({
        isCuba: false,
        sessionId: session.id,
        amountUSD,
        planName: productName,
        checkoutUrl: session.url
      });
    } catch (stripeErr: any) {
      console.error('⚠️ [Stripe Session Error]:', stripeErr.message);
      // Sin URL real de Stripe no hay cobro posible: fallar en claro, nunca simular.
      return res.status(502).json({ error: `No se pudo iniciar el pago con Stripe: ${stripeErr.message}` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error procesando solicitud de pago en Stripe' });
  }
}

app.post('/api/stripe/create-checkout-session', authMiddleware, handleCreateCheckout);

// Compatibilidad: la recarga rápida también crea una sesión de Checkout real.
app.post('/api/user/top-up', authMiddleware, (req: any, res) => {
  req.body = { ...(req.body || {}), frequency: 'top-up' };
  return handleCreateCheckout(req, res);
});

/**
 * Confirma el pago cuando el usuario vuelve de Stripe a `success_url`.
 * Verifica contra la API de Stripe que la sesión existe, está pagada y
 * pertenece a este usuario. Nunca confía en lo que manda el cliente.
 */
app.post('/api/stripe/confirm-payment', authMiddleware, async (req: any, res) => {
  try {
    const sessionId = req.body?.sessionId;
    if (!sessionId || typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
      return res.status(400).json({ error: 'sessionId de Stripe requerido' });
    }

    const session = await stripeAPI(`/checkout/sessions/${encodeURIComponent(sessionId)}`);

    const sessionUserId = session.metadata?.userId || session.client_reference_id;
    if (sessionUserId !== req.userId) {
      logAudit(req.userId, 'stripe_confirm_denied', `Intento de confirmar sesión ajena: ${sessionId}`);
      return res.status(403).json({ error: 'Esta sesión de pago no te pertenece' });
    }

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: `El pago no está completado (estado: ${session.payment_status})` });
    }

    const result = applyStripePayment(session, 'confirm');
    res.json({ success: true, alreadyProcessed: !result.applied, tokensGranted: result.tokensGranted, message: result.message });
  } catch (err: any) {
    console.error('❌ [Stripe Confirm Error]:', err.message);
    res.status(500).json({ error: err.message || 'Error confirmando el pago' });
  }
});

/**
 * Valida la firma `Stripe-Signature` (HMAC-SHA256 sobre `${t}.${payload}`).
 * Sin esto cualquiera podría acreditarse tokens con un POST falso.
 */
function verifyStripeSignature(rawBody: Buffer, signatureHeader: string, secret: string, toleranceSec = 300): boolean {
  if (!signatureHeader) return false;

  let timestamp = '';
  const signatures: string[] = [];
  for (const part of signatureHeader.split(',')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key === 't') timestamp = value;
    else if (key === 'v1') signatures.push(value);
  }
  if (!timestamp || signatures.length === 0) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSec) {
    console.warn(`⚠️ [Stripe Webhook] Timestamp fuera de tolerancia (${age}s)`);
    return false;
  }

  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody.toString('utf8')}`).digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');
  return signatures.some(sig => {
    const sigBuf = Buffer.from(sig, 'utf8');
    return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
  });
}

// Stripe Webhook Endpoint (body crudo montado arriba con express.raw)
app.post('/api/stripe/webhook', (req: any, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('❌ [Stripe Webhook] STRIPE_WEBHOOK_SECRET no configurada: se rechazan todos los eventos.');
    return res.status(503).send('Webhook secret no configurado');
  }

  const raw: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));
  const signature = req.headers['stripe-signature'] as string;

  if (!verifyStripeSignature(raw, signature, secret)) {
    console.error('❌ [Stripe Webhook] Firma inválida. Evento descartado.');
    return res.status(400).send('Webhook Error: firma inválida');
  }

  let event: any;
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch {
    return res.status(400).send('Webhook Error: JSON inválido');
  }

  try {
    // Idempotencia a nivel de evento: Stripe reintenta hasta recibir un 2xx.
    const inserted = db.prepare('INSERT OR IGNORE INTO stripe_events (id, type, createdAt) VALUES (?, ?, ?)')
      .run(event.id, event.type, new Date().toISOString());
    if (inserted.changes === 0) {
      return res.json({ received: true, duplicate: true });
    }

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      if (session.payment_status === 'paid') {
        const result = applyStripePayment(session, 'webhook');
        console.log(`💳 [Stripe Webhook] ${event.type} sesión ${session.id} — ${result.applied ? `acreditado (+${result.tokensGranted} tokens)` : 'ya estaba acreditado'}`);
      } else {
        console.log(`ℹ️ [Stripe Webhook] Sesión ${session.id} aún sin pagar (${session.payment_status}). Se ignora.`);
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('❌ [Stripe Webhook Error]:', err);
    // Devolver 500 hace que Stripe reintente; el registro de evento se borra
    // para que el reintento pueda procesarse de nuevo.
    try { db.prepare('DELETE FROM stripe_events WHERE id = ?').run(event?.id); } catch { }
    res.status(500).send(`Webhook Error: ${err.message}`);
  }
});

// Get Card Payment Transactions History (Plans & Token Purchases)
app.get('/api/user/token-history', authMiddleware, (req: any, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 10;
  const offset = (page - 1) * limit;

  // Filter ONLY card payment transactions (purchases for plans or token top ups)
  const totalRes = db.prepare(`
    SELECT COUNT(*) as count FROM token_transactions 
    WHERE userId = ? AND (amountUSD > 0 OR type IN ('subscription_renewal', 'top_up', 'payment'))
  `).get(req.userId) as any;
  const total = totalRes?.count || 0;

  const transactions = db.prepare(`
    SELECT * FROM token_transactions 
    WHERE userId = ? AND (amountUSD > 0 OR type IN ('subscription_renewal', 'top_up', 'payment'))
    ORDER BY createdAt DESC 
    LIMIT ? OFFSET ?
  `).all(req.userId, limit, offset);

  res.json({
    transactions,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit))
  });
});

// Cancel Active Subscription Endpoint
app.post('/api/user/subscription/cancel', authMiddleware, (req: any, res) => {
  const userId = req.userId;
  const sub = db.prepare('SELECT * FROM user_subscriptions WHERE userId = ?').get(userId) as any;
  if (!sub) return res.status(404).json({ error: 'No tienes una suscripción activa' });

  db.prepare("UPDATE user_subscriptions SET status = 'cancelled' WHERE userId = ?").run(userId);
  logAudit(userId, 'cancel_subscription', `Suscripción cancelada: ${sub.planId}`);

  res.json({
    success: true,
    message: 'Tu suscripción ha sido cancelada correctamente. Conservarás tus tokens acumulados.'
  });
});

// Admin Subscription Plans Management Routes
app.get('/api/admin/plans', adminAuthMiddleware, (req, res) => {
  const plans = db.prepare('SELECT * FROM subscription_plans ORDER BY createdAt ASC').all();
  res.json(plans);
});

app.post('/api/admin/plans', adminAuthMiddleware, (req, res) => {
  const { name, description, priceMonthly, priceQuarterly, priceAnnual, tokensCount, renewIntervalHours, isRecommended } = req.body;
  if (!name || priceMonthly === undefined) return res.status(400).json({ error: 'Nombre y precio requeridos' });

  if (isRecommended === 1) {
    db.prepare('UPDATE subscription_plans SET isRecommended = 0').run();
  }

  const id = randomUUID();
  db.prepare(`
    INSERT INTO subscription_plans (id, name, description, priceMonthly, priceQuarterly, priceAnnual, tokensCount, renewIntervalHours, isRecommended, isActive, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    id, name, description || '', Number(priceMonthly), Number(priceQuarterly || priceMonthly * 2.7), Number(priceAnnual || priceMonthly * 9), Number(tokensCount || 100000), Number(renewIntervalHours || 720), isRecommended ? 1 : 0, new Date().toISOString()
  );

  logAudit('admin_root', 'create_plan', `Plan creado: ${name}`);
  res.json({ success: true, id });
});

app.put('/api/admin/plans/:id', adminAuthMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, description, priceMonthly, priceQuarterly, priceAnnual, tokensCount, renewIntervalHours, isRecommended, isActive } = req.body;

  if (isRecommended === 1) {
    db.prepare('UPDATE subscription_plans SET isRecommended = 0').run();
  }

  const updates: string[] = [];
  const vals: any[] = [];
  if (name !== undefined) { updates.push('name = ?'); vals.push(name); }
  if (description !== undefined) { updates.push('description = ?'); vals.push(description); }
  if (priceMonthly !== undefined) { updates.push('priceMonthly = ?'); vals.push(priceMonthly); }
  if (priceQuarterly !== undefined) { updates.push('priceQuarterly = ?'); vals.push(priceQuarterly); }
  if (priceAnnual !== undefined) { updates.push('priceAnnual = ?'); vals.push(priceAnnual); }
  if (tokensCount !== undefined) { updates.push('tokensCount = ?'); vals.push(tokensCount); }
  if (renewIntervalHours !== undefined) { updates.push('renewIntervalHours = ?'); vals.push(renewIntervalHours); }
  if (isRecommended !== undefined) { updates.push('isRecommended = ?'); vals.push(isRecommended); }
  if (isActive !== undefined) { updates.push('isActive = ?'); vals.push(isActive); }

  if (updates.length > 0) {
    vals.push(id);
    db.prepare(`UPDATE subscription_plans SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
  }

  logAudit('admin_root', 'update_plan', `Plan actualizado: ${id}`);
  res.json({ success: true });
});

app.delete('/api/admin/plans/:id', adminAuthMiddleware, (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE subscription_plans SET isActive = 0 WHERE id = ?').run(id);
  logAudit('admin_root', 'delete_plan', `Plan desactivado: ${id}`);
  res.json({ success: true });
});

// --- Cuba Manual Payment API Endpoints ---

// Get Cuba Bank Card & CUP Exchange Rate Config (User & Admin)
app.get('/api/user/cuba-config', (req, res) => {
  let config = db.prepare('SELECT * FROM cuba_payment_config WHERE id = 1').get() as any;
  if (!config) {
    config = { cardNumber: '9225 1234 5678 9012', cardHolder: 'Carlos Manuel Pérez', phoneNumber: '+53 59079144', cupExchangeRate: 320.0 };
    try {
      db.prepare(`
        INSERT OR IGNORE INTO cuba_payment_config (id, cardNumber, cardHolder, phoneNumber, cupExchangeRate, updatedAt)
        VALUES (1, ?, ?, ?, ?, ?)
      `).run(config.cardNumber, config.cardHolder, config.phoneNumber, config.cupExchangeRate, new Date().toISOString());
    } catch { }
  }
  res.json(config);
});

// User submits manual transfer payment request with Transaction ID
app.post('/api/user/cuba-payment-request', authMiddleware, (req: any, res) => {
  const { planId, planName, billingFrequency, isTopUp, amountUSD, transactionId } = req.body;
  if (!transactionId || typeof transactionId !== 'string' || !transactionId.trim()) {
    return res.status(400).json({ error: 'Debes proporcionar un ID de transacción válido' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId) as any;
  let config = db.prepare('SELECT * FROM cuba_payment_config WHERE id = 1').get() as any;
  const rate = config?.cupExchangeRate || 320.0;
  const amountCUP = Math.round(Number(amountUSD || 0) * rate * 100) / 100;

  const requestId = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO cuba_payment_requests (
      id, userId, userDisplayName, userEmail, userPhone, 
      planId, planName, billingFrequency, isTopUp, 
      amountUSD, amountCUP, transactionId, status, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    requestId,
    req.userId,
    user?.displayName || 'Usuario',
    user?.email || '',
    user?.phone || '',
    planId || 'plan-pro',
    planName || 'Plan Pro',
    billingFrequency || 'monthly',
    isTopUp ? 1 : 0,
    amountUSD || 0,
    amountCUP,
    transactionId.trim(),
    now
  );

  logAudit(req.userId, 'cuba_payment_request', `Solicitud de pago en CUP enviada: TxID ${transactionId.trim()} (${amountCUP} CUP)`);

  res.json({
    success: true,
    message: `Recibimos tu comprobante de pago. Estamos revisando tu transferencia de ${amountCUP.toLocaleString('es-ES', { minimumFractionDigits: 2 })} CUP. Una vez verificada por nuestro equipo, activaremos tu plan automáticamente y te avisaremos por notificación.`
  });
});

// Admin: Get all Cuba payment requests
app.get('/api/admin/cuba-requests', adminAuthMiddleware, (req, res) => {
  const requests = db.prepare('SELECT * FROM cuba_payment_requests ORDER BY createdAt DESC').all();
  res.json(requests);
});

// Admin: Update Cuba Config (Card, Holder, Phone, Exchange Rate)
app.put('/api/admin/cuba-config', adminAuthMiddleware, (req, res) => {
  const { cardNumber, cardHolder, phoneNumber, cupExchangeRate } = req.body;
  const rate = Number(cupExchangeRate);
  if (!rate || rate <= 0) return res.status(400).json({ error: 'Tasa de cambio inválida' });

  db.prepare(`
    INSERT INTO cuba_payment_config (id, cardNumber, cardHolder, phoneNumber, cupExchangeRate, updatedAt)
    VALUES (1, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      cardNumber = excluded.cardNumber,
      cardHolder = excluded.cardHolder,
      phoneNumber = excluded.phoneNumber,
      cupExchangeRate = excluded.cupExchangeRate,
      updatedAt = excluded.updatedAt
  `).run(cardNumber, cardHolder, phoneNumber, rate, new Date().toISOString());

  res.json({ success: true, message: 'Configuración de pago para Cuba actualizada correctamente' });
});

// Servir el Frontend compilado (dist/) directamente desde Express para soporte Single-Port / Proxy Nginx Simple
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');

// --- Descarga de la app Android -----------------------------------------
//
// El APK vive fuera de dist/ a propósito: pesa varios megas y no tiene por
// qué recompilarse ni copiarse en cada build del cliente. `scripts/publicar-app.sh`
// lo deja aquí después de compilarlo.
const apkPath = path.join(__dirname, 'apk', 'HeraWallet.apk');

/** Datos del APK publicado, o null si todavía no se ha compilado ninguno. */
function leerApkPublicado() {
  try {
    const info = fs.statSync(apkPath);
    let version = '';
    let versionCode = 0;
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(__dirname, 'apk', 'version.json'), 'utf8'));
      version = meta.version || '';
      // La app compara su propio versionCode con este para saber si hay algo
      // nuevo que instalar.
      versionCode = Number(meta.versionCode || 0);
    } catch {
      // Sin version.json solo se informa del tamaño y la fecha.
    }
    return {
      disponible: true,
      version,
      versionCode,
      bytes: info.size,
      mb: Math.round((info.size / 1024 / 1024) * 10) / 10,
      actualizado: info.mtime.toISOString(),
      url: '/descargar/HeraWallet.apk',
    };
  } catch {
    return { disponible: false };
  }
}

// La web consulta esto para mostrar peso y fecha reales en vez de un texto fijo
// que envejece mal.
app.get('/api/app/latest', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json(leerApkPublicado());
});

app.get('/descargar/HeraWallet.apk', (_req, res) => {
  if (!leerApkPublicado().disponible) {
    return res.status(404).json({ error: 'Todavía no hay una versión publicada de la app.' });
  }
  // Sin cache: quien pulsa descargar quiere la versión de ahora, no la que
  // guardó el navegador la semana pasada.
  res.set('Cache-Control', 'no-store');
  res.download(apkPath, 'HeraWallet.apk');
});

app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// --- Modo Live: síntesis de voz (TTS) con Piper local ---
// Whisper transcribe (voz -> texto); Piper hace el camino inverso con voces
// neuronales locales. Se configura con PIPER_BIN, PIPER_VOICE_ES y
// PIPER_VOICE_EN en el .env. Sin Piper instalado responde 501 y el frontend
// cae a la voz del navegador (speechSynthesis).

/** Idioma hablado según el prefijo telefónico del usuario. */
function langFromPhone(phone: string): 'es' | 'en' {
  const p = (phone || '').replace(/[^0-9+]/g, '');
  // Prefijos hispanohablantes más comunes de la base de usuarios.
  const spanish = ['+53', '+34', '+52', '+54', '+57', '+56', '+58', '+51', '+593', '+591', '+595', '+598', '+506', '+507', '+503', '+502', '+504', '+505', '+809', '+829'];
  if (spanish.some(pre => p.startsWith(pre))) return 'es';
  if (p.startsWith('+1') || p.startsWith('+44')) return 'en';
  return 'es';
}

app.post('/api/tts', authMiddleware, async (req: any, res) => {
  try {
    const text = String(req.body?.text || '').slice(0, 1200);
    if (!text.trim()) return res.status(400).json({ error: 'Texto requerido' });

    const user = db.prepare('SELECT phone FROM users WHERE id = ?').get(req.userId) as any;
    const lang: 'es' | 'en' = (req.body?.lang === 'en' || req.body?.lang === 'es') ? req.body.lang : langFromPhone(user?.phone || '');

    const piperBin = process.env.PIPER_BIN;
    const voice = lang === 'en' ? process.env.PIPER_VOICE_EN : process.env.PIPER_VOICE_ES;
    if (!piperBin || !voice || !fs.existsSync(piperBin) || !fs.existsSync(voice)) {
      return res.status(501).json({ error: 'TTS no configurado en el servidor', lang });
    }

    // El texto va por stdin; el WAV sale a un archivo temporal por petición.
    const outFile = path.join('/tmp', `hera-tts-${randomUUID()}.wav`);
    const { spawn } = await import('child_process');
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(piperBin, ['--model', voice, '--output_file', outFile], { stdio: ['pipe', 'ignore', 'pipe'] });
      let stderr = '';
      proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
      proc.on('error', reject);
      proc.on('close', (code: number) => code === 0 ? resolve() : reject(new Error(`Piper exit ${code}: ${stderr.slice(-200)}`)));
      proc.stdin.write(text);
      proc.stdin.end();
    });

    const audio = fs.readFileSync(outFile);
    fs.unlink(outFile, () => { });
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('X-TTS-Lang', lang);
    res.send(audio);
  } catch (err: any) {
    console.error('❌ [TTS Error]:', err.message);
    res.status(500).json({ error: 'Error generando la voz' });
  }
});

// Versión desplegada: commit y hora de arranque del proceso. Permite saber al
// instante si el VPS corre el código nuevo o un proceso sin reiniciar.
const BOOT_TIME = new Date().toISOString();
let GIT_COMMIT = 'desconocido';
try {
  GIT_COMMIT = execSync('git rev-parse --short HEAD', { cwd: path.dirname(new URL(import.meta.url).pathname) }).toString().trim();
} catch { }
app.get('/api/version', (req, res) => {
  res.json({ commit: GIT_COMMIT, startedAt: BOOT_TIME });
});

/**
 * Diagnóstico de servicios para el administrador: dice de un vistazo qué
 * pieza está caída (voz, IA, pagos, SMS) sin tener que leer logs.
 */
app.get('/api/admin/health', adminAuthMiddleware, async (req, res) => {
  const checks: Record<string, any> = {};

  // Whisper local (STT)
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 4000);
    const r = await fetch(WHISPER_URL.replace('/inference', '/'), { signal: c.signal }).finally(() => clearTimeout(t));
    checks.whisperLocal = { ok: r.status < 500, status: r.status, url: WHISPER_URL };
  } catch (e: any) {
    checks.whisperLocal = { ok: false, error: e.message, url: WHISPER_URL };
  }

  // Piper (TTS)
  const piperBin = process.env.PIPER_BIN;
  checks.piperTTS = {
    ok: !!(piperBin && fs.existsSync(piperBin) && process.env.PIPER_VOICE_ES && fs.existsSync(process.env.PIPER_VOICE_ES)),
    bin: piperBin || null,
    voiceEs: process.env.PIPER_VOICE_ES || null,
    voiceEn: process.env.PIPER_VOICE_EN || null
  };

  // DeepSeek (cerebro del agente) con saldo restante
  const dsKey = process.env.DEEPSEEK_API_KEY;
  if (dsKey) {
    try {
      const r = await fetch('https://api.deepseek.com/user/balance', { headers: { Authorization: `Bearer ${dsKey}` } });
      const d = await r.json() as any;
      checks.deepseek = { ok: r.ok, balanceUSD: d?.balance_infos?.[0]?.total_balance ?? null };
    } catch (e: any) { checks.deepseek = { ok: false, error: e.message }; }
  } else checks.deepseek = { ok: false, error: 'DEEPSEEK_API_KEY no configurada' };

  // Respaldos de transcripción en la nube
  checks.sttCloudFallback = {
    ok: !!(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY),
    groq: !!process.env.GROQ_API_KEY,
    openai: !!process.env.OPENAI_API_KEY
  };

  // Twilio (SMS de login)
  const sid = process.env.TWILIO_ACCOUNT_SID, tok = process.env.TWILIO_AUTH_TOKEN;
  if (sid && tok) {
    try {
      const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Balance.json`, {
        headers: { Authorization: 'Basic ' + Buffer.from(`${sid}:${tok}`).toString('base64') }
      });
      const d = await r.json() as any;
      checks.twilio = { ok: r.ok, balance: d?.balance ?? null, currency: d?.currency ?? null };
    } catch (e: any) { checks.twilio = { ok: false, error: e.message }; }
  } else checks.twilio = { ok: false, error: 'Credenciales Twilio no configuradas' };

  // Stripe: modo y webhook
  const sk = process.env.STRIPE_SECRET_KEY;
  checks.stripe = {
    ok: !!sk,
    mode: sk?.startsWith('sk_live') ? 'LIVE' : sk?.startsWith('sk_test') ? 'TEST' : 'sin configurar',
    webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    appUrl: process.env.APP_URL || null
  };

  // Avisos de configuración insegura
  checks.security = {
    jwtFromEnv: !!process.env.JWT_SECRET,
    adminPasswordFromEnv: !!process.env.ADMIN_PASSWORD,
    otpDebugActive: process.env.OTP_DEBUG === '1'
  };

  const allOk = Object.values(checks).every((c: any) => c.ok !== false);
  res.json({ commit: GIT_COMMIT, startedAt: BOOT_TIME, allOk, checks });
});

// --- Notificaciones -------------------------------------------------------
//
// El planificador solo arranca si hay claves VAPID: sin ellas no hay a quién
// enviar, y una pasada cada media hora que no puede entregar nada solo gasta.
notificaciones.crearTablas(db);
notificaciones.montarEndpoints(app, db, authMiddleware);

// --- Referidos ------------------------------------------------------------
referidos.crearTablas(db);
referidos.montarEndpoints(app, db, authMiddleware, adminAuthMiddleware);

// --- Apertura de la conversación ------------------------------------------
//
// Hera dice algo al abrir el chat en vez de esperar. Una pantalla en blanco es
// el mayor freno que hay: la gente no sabe qué preguntar y se va.
app.get('/api/hera/apertura', authMiddleware, (req: any, res) => {
  try {
    res.json(apertura.componer(db, req.userId, hoyDe(req.userId)));
  } catch (err) {
    console.error('[apertura] fallo al componer', err);
    // Que falle esto no puede dejar el chat sin nada que decir.
    res.json({
      texto: '¿Qué quieres saber de tus cuentas hoy?',
      sugerencias: ['¿Cómo voy este mes?', 'Registrar un gasto'],
      motivo: 'general',
    });
  }
});

// --- Dictado desde el widget ----------------------------------------------
//
// El widget graba y manda el audio aquí; este endpoint transcribe y deja que la
// IA lo registre, y devuelve una frase corta para el aviso emergente. Se hace
// en un solo viaje porque desde la pantalla de inicio no hay interfaz donde
// enseñar pasos intermedios: o se registra, o se dice por qué no.
app.post('/api/widget/dictado', authMiddleware, async (req: any, res) => {
  const { audio } = req.body || {};
  if (!audio) return res.status(400).json({ error: 'Sin audio' });

  const puerto = process.env.PORT || 4000;
  const base = `http://127.0.0.1:${puerto}`;
  const autorizacion = String(req.headers.authorization || '');

  try {
    const transcripcion = await fetch(`${base}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: autorizacion },
      body: JSON.stringify({ audio }),
    });

    const datos = await transcripcion.json() as any;
    if (!transcripcion.ok) {
      return res.status(transcripcion.status).json({
        error: datos?.error || 'No pudimos escuchar tu audio.',
      });
    }

    const texto = String(datos?.text || datos?.transcription || '').trim();
    if (!texto) return res.status(422).json({ error: 'No entendimos lo que dijiste.' });

    // Se extrae la estructura pero **no se registra**: lo dictado se confirma
    // en la app, donde se puede corregir el tipo, el importe o la categoría.
    // Registrar a ciegas lo que entendió un micrófono en la calle acaba
    // metiendo un ingreso donde iba un gasto, y eso cuesta más de arreglar que
    // de confirmar.
    const analisis = extraerMovimiento(texto);

    res.json({
      transcripcion: texto,
      movimiento: analisis,
      mensaje: analisis
        ? `${analisis.type === 'income' ? 'Ingreso' : 'Gasto'} de ${analisis.amount}: confirma en la app`
        : 'Ábrelo en la app para completarlo',
    });
  } catch (err: any) {
    console.error('[widget] fallo en el dictado', err);
    res.status(500).json({ error: 'No pudimos procesarlo. Inténtalo desde la app.' });
  }
});

/**
 * Saca importe, tipo y categoría de una frase dictada.
 *
 * Se hace con reglas y no con la IA a propósito: es instantáneo, no gasta
 * tokens y acierta en la forma en que la gente dicta de verdad ("gasté 20 en
 * comida"). Lo que no logre deducir se deja vacío para que se complete en la
 * app, que es donde hay teclado.
 */
function extraerMovimiento(texto: string): {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
} | null {
  const limpio = texto.toLowerCase();

  // Se admiten "20", "20,50" y "20.50"; el separador decimal varía según quién
  // dicte y qué transcriba.
  const numero = limpio.match(/(\d+(?:[.,]\d{1,2})?)/);
  if (!numero) return null;

  const amount = Number(numero[1].replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const esIngreso = /\b(cobr|ingres|recib|me pagaron|me dieron|entr[oó]|gan[eé])/.test(limpio);

  const categorias: [RegExp, string][] = [
    [/\b(comida|comí|almuerzo|cena|desayuno|restaurante|pizza|café)\b/, 'Restaurantes'],
    [/\b(super|mercado|compra|tienda|víveres|viveres)\b/, 'Supermercado'],
    [/\b(gasolina|combustible|nafta|gasoil|taxi|bus|guagua|transporte|uber)\b/, 'Transporte'],
    [/\b(luz|agua|internet|teléfono|telefono|móvil|movil|recarga|factura|alquiler|renta)\b/, 'Servicios'],
    [/\b(ropa|zapatos|camisa|pantal[oó]n)\b/, 'Ropa'],
    [/\b(salario|sueldo|n[oó]mina|paga)\b/, 'Salario'],
    [/\b(medicina|farmacia|m[eé]dico|doctor|consulta)\b/, 'Salud'],
  ];

  const categoria = categorias.find(([patron]) => patron.test(limpio))?.[1]
    || (esIngreso ? 'Ingresos' : 'Varios');

  return {
    type: esIngreso ? 'income' : 'expense',
    amount,
    category: categoria,
    // La frase entera como descripción: es lo que la persona dijo, y le va a
    // sonar más que cualquier resumen que hiciéramos por ella.
    description: texto.charAt(0).toUpperCase() + texto.slice(1),
  };
}

// --- Resumen para el widget -----------------------------------------------
//
// Lo que cabe en una pantalla de inicio: saldo, lo gastado hoy y la racha. Se
// devuelve ya formateado porque el widget de Android no tiene ni la moneda del
// usuario ni forma cómoda de aplicar un formato local.
app.get('/api/widget/resumen', authMiddleware, (req: any, res) => {
  const usuario = db.prepare('SELECT currency FROM users WHERE id = ?').get(req.userId) as any;
  const moneda = String(usuario?.currency || 'EUR').toUpperCase();
  const simbolos: Record<string, string> = {
    EUR: '€', USD: '$', CUP: 'CUP', MXN: '$', COP: '$', ARS: '$', CLP: '$', PEN: 'S/', DOP: 'RD$',
  };
  const simbolo = simbolos[moneda] || '€';

  const hoy = hoyDe(req.userId);

  const saldo = (db.prepare(
    'SELECT COALESCE(SUM(balance), 0) AS total FROM accounts WHERE userId = ?'
  ).get(req.userId) as any)?.total || 0;

  const dia = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS gastos,
      COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS ingresos,
      COUNT(*) AS movimientos
    FROM transactions WHERE userId = ? AND date = ?
  `).get(req.userId, hoy) as any;

  // Las tres categorías donde más se va el dinero este mes. El widget las pinta
  // como barras: en un vistazo se ve dónde está el grueso, que es la pregunta
  // que uno se hace al mirar el móvil.
  const top = db.prepare(`
    SELECT category, SUM(amount) AS total
    FROM transactions
    WHERE userId = ? AND type = 'expense' AND date >= ?
    GROUP BY category ORDER BY total DESC LIMIT 3
  `).all(req.userId, `${hoy.slice(0, 7)}-01`) as any[];

  const { racha, registroHoy } = reglasNotificaciones.calcularRacha(db, req.userId, hoy);

  /**
   * Cifras cortas: en un widget no cabe "1.284.500,00". El formato es el mismo
   * que usa la app (ver src/formato.ts), para que no se lea distinto según
   * dónde se mire.
   */
  const corto = (n: number): string => {
    const abs = Math.abs(Number(n) || 0);
    const signo = n < 0 ? '-' : '';
    const unidades: [number, string][] = [[1e9, 'MM'], [1e6, 'M'], [1e3, 'k']];

    for (const [limite, sufijo] of unidades) {
      if (abs < limite) continue;
      const v = abs / limite;
      return signo + v.toLocaleString('es', {
        maximumFractionDigits: v >= 10 ? 0 : 1,
      }) + sufijo;
    }

    return signo + abs.toLocaleString('es', {
      maximumFractionDigits: Math.round(abs * 100) % 100 === 0 ? 0 : 2,
    });
  };

  const mayor = Math.max(...top.map((c) => Number(c.total)), 1);

  res.json({
    saldo: `${corto(saldo)}${simbolo}`,
    gastoHoy: `${corto(dia?.gastos || 0)}${simbolo}`,
    ingresoHoy: `${corto(dia?.ingresos || 0)}${simbolo}`,
    movimientos: dia?.movimientos || 0,
    racha,
    registroHoy,
    // Cada categoría lleva su proporción respecto a la mayor, para que el
    // widget dibuje las barras sin tener que calcular nada.
    categorias: top.map((c) => ({
      nombre: c.category,
      importe: `${corto(c.total)}${simbolo}`,
      proporcion: Math.round((Number(c.total) / mayor) * 100),
    })),
    actualizado: new Date().toISOString(),
  });
});

// --- Racha y logros -------------------------------------------------------
logros.crearTablas(db);
logros.montarEndpoints(app, db, authMiddleware, hoyDe);

if (notificaciones.configurarWebPush()) {
  reglasNotificaciones.arrancarPlanificador(db);

  // Aviso de versión nueva. Se hace al arrancar porque es cuando el APK recién
  // publicado ya está en su sitio: el flujo de despliegue lo sube y reinicia.
  // Un margen corto evita competir con la carga inicial.
  setTimeout(async () => {
    try {
      const apk = leerApkPublicado();
      if (!apk.disponible || !apk.versionCode) return;

      const avisadas = await notificaciones.avisarDeVersion(db, apk.versionCode, apk.version || '');
      if (avisadas > 0) {
        console.log(`[notificaciones] aviso de la versión ${apk.version} a ${avisadas} usuarios`);
      }
    } catch (err) {
      console.error('[notificaciones] fallo avisando de la versión', err);
    }
  }, 20 * 1000);
}

const PORT = process.env.PORT || 4000;
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Hera API Server running on port ${PORT}`);
});
