/**
 * Alta y edición de movimientos.
 *
 * Antes cada ruta (formulario, chat) insertaba a su manera y ajustaba el saldo
 * aparte. Eso dejaba huecos: un movimiento podía apuntar a una cuenta de otra
 * persona (se guardaba, pero el saldo no se movía), aceptar importes negativos
 * o un tipo inventado, o quedar colgado de una cuenta que no existía. Aquí se
 * valida una vez, y el movimiento y el saldo cambian juntos o no cambia nada.
 */
import { randomUUID } from 'crypto';
import { resolverMoneda } from './monedas.ts';
import { guardarTasa } from './cambios.ts';

export const TIPOS = ['income', 'expense'] as const;

const fechaValida = (f: any) => typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f)
  && !Number.isNaN(Date.parse(`${f}T12:00:00Z`));

const efecto = (tipo: string, importe: number) => (tipo === 'income' ? importe : -importe);

/**
 * La cuenta a la que va un movimiento.
 *
 * Con `accountId` tiene que ser del usuario. Sin él, la primera que tenga; y si
 * no tiene ninguna, se le crea una de efectivo en su moneda en vez de colgar el
 * movimiento de una cuenta inexistente que ningún saldo refleja.
 */
export function cuentaDestino(db: any, userId: string, accountId?: any): { cuenta: any } | { error: string; codigo: number } {
  if (accountId) {
    const cuenta = db.prepare('SELECT * FROM accounts WHERE id = ? AND userId = ?').get(String(accountId), userId);
    return cuenta ? { cuenta } : { error: 'Cuenta no encontrada', codigo: 404 };
  }

  const primera = db.prepare('SELECT * FROM accounts WHERE userId = ? ORDER BY rowid LIMIT 1').get(userId);
  if (primera) return { cuenta: primera };

  const usuario = db.prepare('SELECT currency FROM users WHERE id = ?').get(userId) as any;
  const id = randomUUID();
  db.prepare(`INSERT INTO accounts (id, userId, type, name, balance, currency, icon, color)
              VALUES (?, ?, 'cash', 'Efectivo', 0, ?, 'Wallet', '#3B82F6')`)
    .run(id, userId, usuario?.currency || 'EUR');
  return { cuenta: db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) };
}

export interface EntradaMovimiento {
  accountId?: any; type?: any; amount?: any; category?: any; description?: any;
  date?: any; receiptUrl?: any; currency?: any; exchangeRate?: any;
}

export type Resultado = { ok: true; id: string; amount: number } | { error: string; codigo: number };

export function crear(db: any, userId: string, e: EntradaMovimiento, hoy: string): Resultado {
  const tipo = String(e.type || '');
  if (!(TIPOS as readonly string[]).includes(tipo)) return { error: 'El tipo debe ser ingreso o gasto', codigo: 400 };

  const categoria = String(e.category || '').trim();
  if (!categoria) return { error: 'La categoría es obligatoria', codigo: 400 };

  const fecha = e.date ? String(e.date) : hoy;
  if (!fechaValida(fecha)) return { error: 'Fecha no válida', codigo: 400 };

  const destino = cuentaDestino(db, userId, e.accountId);
  if ('error' in destino) return destino;
  const { cuenta } = destino;

  const moneda = resolverMoneda(cuenta.currency, { amount: e.amount, currency: e.currency, exchangeRate: e.exchangeRate });
  if ('error' in moneda) return { error: moneda.error, codigo: 400 };

  const id = randomUUID();
  db.transaction(() => {
    db.prepare(`
      INSERT INTO transactions (id, userId, accountId, type, amount, category, description, date, receiptUrl, createdAt, currency, originalAmount, exchangeRate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, cuenta.id, tipo, moneda.amount, categoria, String(e.description || ''), fecha,
           e.receiptUrl || null, new Date().toISOString(), moneda.currency, moneda.originalAmount, moneda.exchangeRate);

    db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND userId = ?')
      .run(efecto(tipo, moneda.amount), cuenta.id, userId);

    // La persona acaba de decir cuánto vale esa moneda: se recuerda para los totales.
    if (moneda.exchangeRate) guardarTasa(db, userId, moneda.currency, cuenta.currency, moneda.exchangeRate);
  })();

  return { ok: true, id, amount: moneda.amount };
}

/**
 * Edita un movimiento y corrige el saldo: se deshace el efecto anterior y se
 * aplica el nuevo, aunque cambie de cuenta o pase de gasto a ingreso.
 *
 * El importe se entiende en la moneda en que se registró. Si fue en otra
 * moneda, se reconvierte con el mismo tipo de cambio salvo que llegue otro.
 */
export function editar(db: any, userId: string, id: string, e: EntradaMovimiento): Resultado {
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ? AND userId = ?').get(id, userId) as any;
  if (!tx) return { error: 'Movimiento no encontrado', codigo: 404 };

  const tipo = e.type !== undefined ? String(e.type) : tx.type;
  if (!(TIPOS as readonly string[]).includes(tipo)) return { error: 'El tipo debe ser ingreso o gasto', codigo: 400 };

  const categoria = e.category !== undefined ? String(e.category).trim() : tx.category;
  if (!categoria) return { error: 'La categoría es obligatoria', codigo: 400 };

  const fecha = e.date !== undefined ? String(e.date) : tx.date;
  if (!fechaValida(fecha)) return { error: 'Fecha no válida', codigo: 400 };

  const destino = e.accountId !== undefined && e.accountId !== tx.accountId
    ? cuentaDestino(db, userId, e.accountId)
    : { cuenta: db.prepare('SELECT * FROM accounts WHERE id = ? AND userId = ?').get(tx.accountId, userId) };
  if ('error' in destino) return destino;
  const cuenta = destino.cuenta;
  if (!cuenta) return { error: 'La cuenta de este movimiento ya no existe', codigo: 409 };

  const monedaAntes = tx.currency || cuenta.currency;
  const moneda = resolverMoneda(cuenta.currency, {
    amount: e.amount !== undefined ? e.amount : (tx.originalAmount ?? tx.amount),
    currency: e.currency !== undefined ? e.currency : monedaAntes,
    exchangeRate: e.exchangeRate !== undefined ? e.exchangeRate : tx.exchangeRate,
  });
  if ('error' in moneda) return { error: moneda.error, codigo: 400 };

  db.transaction(() => {
    // Deshacer lo anterior en su cuenta (si sigue existiendo).
    db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ? AND userId = ?')
      .run(efecto(tx.type, Number(tx.amount)), tx.accountId, userId);

    db.prepare(`
      UPDATE transactions SET accountId = ?, type = ?, amount = ?, category = ?, description = ?, date = ?,
        currency = ?, originalAmount = ?, exchangeRate = ?
      WHERE id = ? AND userId = ?
    `).run(cuenta.id, tipo, moneda.amount, categoria,
           e.description !== undefined ? String(e.description) : tx.description, fecha,
           moneda.currency, moneda.originalAmount, moneda.exchangeRate, id, userId);

    db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND userId = ?')
      .run(efecto(tipo, moneda.amount), cuenta.id, userId);

    if (moneda.exchangeRate && e.exchangeRate !== undefined) {
      guardarTasa(db, userId, moneda.currency, cuenta.currency, moneda.exchangeRate);
    }
  })();

  return { ok: true, id, amount: moneda.amount };
}
