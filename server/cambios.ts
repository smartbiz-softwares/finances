/**
 * Tipos de cambio por usuario y totales en una sola moneda.
 *
 * Con cuentas en varias monedas, sumar saldos tal cual da un número sin
 * sentido: 100 USD + 30.000 CUP no son 30.100 de nada. Aquí cada importe se
 * pasa a la moneda principal del usuario con el último tipo de cambio que él
 * mismo usó o escribió. Lo que no se puede convertir no se suma a ciegas: se
 * devuelve aparte para que la app pida el tipo que falta.
 *
 * Los tipos se aprenden solos al registrar un movimiento en otra moneda (la
 * persona ya dijo cuánto vale) y se pueden fijar a mano.
 */

export function crearTablas(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS exchange_rates (
      userId TEXT NOT NULL,
      de TEXT NOT NULL,
      a TEXT NOT NULL,
      tasa REAL NOT NULL,            -- 1 'de' = tasa 'a'
      actualizadoEn TEXT NOT NULL,
      PRIMARY KEY (userId, de, a)
    );
  `);
}

const norm = (m: any) => String(m || '').trim().toUpperCase();

/** Guarda 1 `de` = `tasa` `a`. Se guarda en un solo sentido; el inverso se deduce. */
export function guardarTasa(db: any, userId: string, de: string, a: string, tasa: number) {
  const x = norm(de), y = norm(a);
  if (!x || !y || x === y || !(Number(tasa) > 0)) return false;
  db.prepare('DELETE FROM exchange_rates WHERE userId = ? AND de = ? AND a = ?').run(userId, y, x);
  db.prepare(`
    INSERT INTO exchange_rates (userId, de, a, tasa, actualizadoEn) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (userId, de, a) DO UPDATE SET tasa = excluded.tasa, actualizadoEn = excluded.actualizadoEn
  `).run(userId, x, y, Number(tasa), new Date().toISOString());
  return true;
}

/** Cuánto vale 1 `de` en `a`, o null si no se sabe. */
export function tasa(db: any, userId: string, de: string, a: string): number | null {
  const x = norm(de), y = norm(a);
  if (x === y) return 1;
  const directa = db.prepare('SELECT tasa FROM exchange_rates WHERE userId = ? AND de = ? AND a = ?').get(userId, x, y) as any;
  if (directa) return directa.tasa;
  const inversa = db.prepare('SELECT tasa FROM exchange_rates WHERE userId = ? AND de = ? AND a = ?').get(userId, y, x) as any;
  return inversa ? 1 / inversa.tasa : null;
}

export function listar(db: any, userId: string) {
  return db.prepare('SELECT de, a, tasa, actualizadoEn FROM exchange_rates WHERE userId = ? ORDER BY de, a').all(userId);
}

export function monedaPrincipal(db: any, userId: string): string {
  const u = db.prepare('SELECT currency FROM users WHERE id = ?').get(userId) as any;
  return norm(u?.currency) || 'EUR';
}

const redondear = (n: number) => Math.round(n * 100) / 100;

/**
 * Convertidor a la moneda principal con caché por moneda, para pasar listas
 * largas (la línea de tiempo) sin una consulta por fila. Devuelve null si no
 * hay tipo de cambio: quien llama decide cómo enseñarlo.
 */
export function convertidor(db: any, userId: string): { moneda: string; convertir: (monto: number, de: string | null | undefined) => number | null } {
  const moneda = monedaPrincipal(db, userId);
  const cache = new Map<string, number | null>();
  return {
    moneda,
    convertir(monto, de) {
      const m = norm(de) || moneda;
      if (!cache.has(m)) cache.set(m, tasa(db, userId, m, moneda));
      const t = cache.get(m);
      return t === null || t === undefined ? null : redondear(Number(monto) * t);
    },
  };
}

export interface Resumen {
  moneda: string;
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netWorth: number;
  /** Cuentas que no entran en el total porque falta su tipo de cambio. */
  sinConvertir: { accountId: string; name: string; currency: string; balance: number }[];
  /** Monedas que quedaron fuera de algún total por no tener tipo de cambio. */
  monedasSinTasa: string[];
}

/**
 * Saldos, ingresos y gastos en la moneda principal.
 *
 * Los movimientos están en la moneda de su cuenta (ver server/monedas.ts). Si la
 * cuenta ya no existe, se usa la moneda guardada en el movimiento, y si tampoco
 * hay, se asume la principal: es lo que pasaba antes con todos.
 */
export function resumen(db: any, userId: string): Resumen {
  const moneda = monedaPrincipal(db, userId);
  const sinConvertir: Resumen['sinConvertir'] = [];
  const monedasSinTasa = new Set<string>();

  let totalBalance = 0;
  for (const c of db.prepare('SELECT id, name, currency, balance FROM accounts WHERE userId = ?').all(userId) as any[]) {
    const m = norm(c.currency) || moneda;
    const t = tasa(db, userId, m, moneda);
    if (t === null) {
      sinConvertir.push({ accountId: c.id, name: c.name, currency: m, balance: Number(c.balance) || 0 });
      monedasSinTasa.add(m);
    } else {
      totalBalance += (Number(c.balance) || 0) * t;
    }
  }

  let totalIncome = 0;
  let totalExpense = 0;
  const filas = db.prepare(`
    SELECT t.type, COALESCE(a.currency, CASE WHEN t.originalAmount IS NULL THEN t.currency END) AS moneda, SUM(t.amount) AS total
    FROM transactions t LEFT JOIN accounts a ON a.id = t.accountId AND a.userId = t.userId
    WHERE t.userId = ?
    GROUP BY t.type, 2
  `).all(userId) as any[];
  for (const f of filas) {
    const m = norm(f.moneda) || moneda;
    const t = tasa(db, userId, m, moneda);
    if (t === null) { monedasSinTasa.add(m); continue; }
    if (f.type === 'income') totalIncome += Number(f.total) * t;
    if (f.type === 'expense') totalExpense += Number(f.total) * t;
  }

  return {
    moneda,
    totalBalance: redondear(totalBalance),
    totalIncome: redondear(totalIncome),
    totalExpense: redondear(totalExpense),
    netWorth: redondear(totalBalance),
    sinConvertir,
    monedasSinTasa: [...monedasSinTasa],
  };
}
