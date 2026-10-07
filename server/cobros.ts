/**
 * Cobros recurrentes: dinero que otras personas te tienen que pagar cada cierto
 * tiempo (la cuota de Netflix que revendes, un alquiler, una mensualidad).
 *
 * Nada se anota solo. Cuando toca, se avisa; al cobrar, la persona elige en qué
 * cuenta entra el dinero y es entonces cuando se crea el ingreso. Un ingreso que
 * se registra sin haber ocurrido deja el saldo mintiendo sin que nadie sepa por
 * qué.
 */
import { randomUUID } from 'crypto';

export const FRECUENCIAS = ['semanal', 'mensual', 'trimestral', 'anual', 'manual'] as const;
export type Frecuencia = typeof FRECUENCIAS[number];

const MESES_POR_FRECUENCIA: Record<string, number> = { mensual: 1, trimestral: 3, anual: 12 };

/** Categoría con la que se anotan los ingresos que vienen de un cobro. */
export const CATEGORIA_COBRO = 'Cobros';

export function crearTablas(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS charges (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      cliente TEXT NOT NULL,
      telefono TEXT,
      motivo TEXT NOT NULL,
      monto REAL NOT NULL,
      frecuencia TEXT NOT NULL,
      proximoCobro TEXT,            -- null cuando es manual y ya no hay fecha
      estado TEXT DEFAULT 'activo', -- 'activo' | 'pausado' | 'finalizado'
      notas TEXT,
      diaAncla INTEGER,             -- día del mes original, para que el 31 vuelva a ser 31
      creadoEn TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_charges_user ON charges(userId);

    CREATE TABLE IF NOT EXISTS charge_payments (
      id TEXT PRIMARY KEY,
      chargeId TEXT NOT NULL,
      userId TEXT NOT NULL,
      monto REAL NOT NULL,
      cuentaId TEXT,
      transaccionId TEXT,
      fechaCobro TEXT NOT NULL,     -- cuándo se cobró de verdad
      fechaPrevista TEXT,           -- la fecha que tocaba
      creadoEn TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_charge_payments_charge ON charge_payments(chargeId);
  `);
}

/**
 * Suma meses sin salirse del mes: el 31 de enero más un mes es el 28 (o 29) de
 * febrero, no el 3 de marzo. Se ancla al día original para que febrero no
 * arrastre el cobro al 28 para siempre: se pasa `diaOriginal`.
 */
export function sumarMeses(fecha: string, meses: number, diaOriginal?: number): string {
  const [a, m, d] = fecha.split('-').map(Number);
  const dia = diaOriginal ?? d;
  const total = (m - 1) + meses;
  const anio = a + Math.floor(total / 12);
  const mes = ((total % 12) + 12) % 12;
  const ultimo = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  const real = Math.min(dia, ultimo);
  return `${anio}-${String(mes + 1).padStart(2, '0')}-${String(real).padStart(2, '0')}`;
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Fecha del cobro siguiente a `fecha`; null si la frecuencia es manual. */
export function siguienteFecha(fecha: string, frecuencia: string, diaOriginal?: number): string | null {
  if (frecuencia === 'semanal') return sumarDias(fecha, 7);
  const meses = MESES_POR_FRECUENCIA[frecuencia];
  return meses ? sumarMeses(fecha, meses, diaOriginal) : null;
}

const fechaValida = (f: any) => typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f)
  && !Number.isNaN(Date.parse(`${f}T12:00:00Z`));

/** Deja solo dígitos y el + inicial, que es lo que necesita wa.me. */
export function limpiarTelefono(t: any): string {
  const s = String(t || '').trim();
  const digitos = s.replace(/\D/g, '');
  return digitos ? digitos : '';
}

export interface Cobro {
  id: string;
  cliente: string;
  telefono: string;
  motivo: string;
  monto: number;
  frecuencia: Frecuencia;
  proximoCobro: string | null;
  estado: 'activo' | 'pausado' | 'finalizado';
  notas: string;
  /** Días de retraso respecto a la fecha prevista; negativo si aún no toca. */
  retraso: number | null;
  totalCobrado: number;
  vecesCobrado: number;
}

const diasEntre = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);

export function listar(db: any, userId: string, hoy: string): Cobro[] {
  const filas = db.prepare(`
    SELECT c.*,
      COALESCE((SELECT SUM(monto) FROM charge_payments WHERE chargeId = c.id), 0) AS totalCobrado,
      (SELECT COUNT(*) FROM charge_payments WHERE chargeId = c.id) AS vecesCobrado
    FROM charges c
    WHERE c.userId = ?
    ORDER BY (c.estado = 'finalizado'), (c.proximoCobro IS NULL), c.proximoCobro ASC, c.creadoEn DESC
  `).all(userId) as any[];

  return filas.map((f) => ({
    id: f.id,
    cliente: f.cliente,
    telefono: f.telefono || '',
    motivo: f.motivo,
    monto: f.monto,
    frecuencia: f.frecuencia,
    proximoCobro: f.proximoCobro,
    estado: f.estado,
    notas: f.notas || '',
    retraso: f.proximoCobro ? diasEntre(f.proximoCobro, hoy) : null,
    totalCobrado: f.totalCobrado,
    vecesCobrado: f.vecesCobrado,
  }));
}

export interface Entrada {
  cliente?: any; telefono?: any; motivo?: any; monto?: any;
  frecuencia?: any; proximoCobro?: any; notas?: any;
}

/** Valida y normaliza lo que llega del formulario; devuelve el error o los datos. */
export function validar(e: Entrada): { error: string } | { datos: any } {
  const cliente = String(e.cliente || '').trim();
  const motivo = String(e.motivo || '').trim();
  const monto = Number(e.monto);
  const frecuencia = String(e.frecuencia || '');
  const proximoCobro = e.proximoCobro ? String(e.proximoCobro) : null;

  if (!cliente) return { error: 'Falta el nombre del cliente' };
  if (!motivo) return { error: 'Falta el motivo del cobro' };
  if (!Number.isFinite(monto) || monto <= 0) return { error: 'El monto debe ser mayor que cero' };
  if (!(FRECUENCIAS as readonly string[]).includes(frecuencia)) return { error: 'Frecuencia no válida' };
  if (!proximoCobro || !fechaValida(proximoCobro)) return { error: 'Falta la fecha del próximo cobro' };

  return {
    datos: {
      cliente, motivo, monto, frecuencia, proximoCobro,
      telefono: limpiarTelefono(e.telefono),
      notas: String(e.notas || '').trim(),
    },
  };
}

export function crear(db: any, userId: string, datos: any): string {
  const id = randomUUID();
  db.prepare(`
    INSERT INTO charges (id, userId, cliente, telefono, motivo, monto, frecuencia, proximoCobro, notas, diaAncla, creadoEn)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, datos.cliente, datos.telefono, datos.motivo, datos.monto,
         datos.frecuencia, datos.proximoCobro, datos.notas,
         Number(datos.proximoCobro.slice(8, 10)), new Date().toISOString());
  return id;
}

export function actualizar(db: any, userId: string, id: string, datos: any): boolean {
  const r = db.prepare(`
    UPDATE charges SET cliente = ?, telefono = ?, motivo = ?, monto = ?,
      frecuencia = ?, proximoCobro = ?, notas = ?, diaAncla = ?
    WHERE id = ? AND userId = ?
  `).run(datos.cliente, datos.telefono, datos.motivo, datos.monto,
         datos.frecuencia, datos.proximoCobro, datos.notas,
         Number(datos.proximoCobro.slice(8, 10)), id, userId);
  return r.changes > 0;
}

export function cambiarEstado(db: any, userId: string, id: string, estado: string): boolean {
  if (!['activo', 'pausado', 'finalizado'].includes(estado)) return false;
  return db.prepare('UPDATE charges SET estado = ? WHERE id = ? AND userId = ?')
    .run(estado, id, userId).changes > 0;
}

export function borrar(db: any, userId: string, id: string): boolean {
  const r = db.prepare('DELETE FROM charges WHERE id = ? AND userId = ?').run(id, userId);
  if (r.changes > 0) db.prepare('DELETE FROM charge_payments WHERE chargeId = ?').run(id);
  return r.changes > 0;
}

export type ResultadoCobro =
  | { error: string; codigo: number }
  | { ok: true; proximoCobro: string | null; transaccionId: string };

/**
 * Registra un cobro: crea el ingreso en la cuenta elegida, suma al saldo y mueve
 * el próximo cobro al siguiente período.
 *
 * El siguiente período se cuenta desde la fecha que *tocaba*, no desde hoy: si
 * José paga con tres días de retraso, el mensual de después sigue siendo el 20.
 * Si aun así quedaría en el pasado (llevaba meses sin pagar), se salta hasta la
 * primera fecha futura para no dejar cobros fantasma.
 */
export function cobrar(
  db: any, userId: string, id: string,
  opciones: { cuentaId: string; hoy: string; monto?: number; fechaCobro?: string; proximaManual?: string | null }
): ResultadoCobro {
  const c = db.prepare('SELECT * FROM charges WHERE id = ? AND userId = ?').get(id, userId) as any;
  if (!c) return { error: 'No existe ese cobro', codigo: 404 };
  if (c.estado === 'finalizado') return { error: 'Ese cobro ya está finalizado', codigo: 400 };

  const cuenta = db.prepare('SELECT id FROM accounts WHERE id = ? AND userId = ?')
    .get(opciones.cuentaId, userId) as any;
  if (!cuenta) return { error: 'Elige la cuenta donde entra el dinero', codigo: 400 };

  const monto = opciones.monto === undefined ? c.monto : Number(opciones.monto);
  if (!Number.isFinite(monto) || monto <= 0) return { error: 'El monto debe ser mayor que cero', codigo: 400 };

  const fechaCobro = opciones.fechaCobro && fechaValida(opciones.fechaCobro) ? opciones.fechaCobro : opciones.hoy;
  const ahora = new Date().toISOString();

  // Próxima fecha, contada desde la prevista y con el día original como ancla.
  let proximo: string | null = null;
  if (c.frecuencia === 'manual') {
    if (opciones.proximaManual) {
      if (!fechaValida(opciones.proximaManual)) return { error: 'Fecha no válida', codigo: 400 };
      proximo = opciones.proximaManual;
    }
  } else if (c.proximoCobro) {
    const dia = c.diaAncla || Number(c.proximoCobro.slice(8, 10));
    let base: string = c.proximoCobro;
    let pasos = 0;
    do {
      base = siguienteFecha(base, c.frecuencia, dia) as string;
      pasos++;
    } while (base <= opciones.hoy && pasos < 1000);
    proximo = base;
  }

  const txId = randomUUID();
  const registrar = db.transaction(() => {
    db.prepare(`
      INSERT INTO transactions (id, userId, accountId, type, amount, category, description, date, createdAt)
      VALUES (?, ?, ?, 'income', ?, ?, ?, ?, ?)
    `).run(txId, userId, cuenta.id, monto, CATEGORIA_COBRO, `${c.motivo} · ${c.cliente}`, fechaCobro, ahora);

    db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ? AND userId = ?')
      .run(monto, cuenta.id, userId);

    db.prepare(`
      INSERT INTO charge_payments (id, chargeId, userId, monto, cuentaId, transaccionId, fechaCobro, fechaPrevista, creadoEn)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), c.id, userId, monto, cuenta.id, txId, fechaCobro, c.proximoCobro, ahora);

    db.prepare('UPDATE charges SET proximoCobro = ? WHERE id = ?').run(proximo, c.id);
  });
  registrar();

  return { ok: true, proximoCobro: proximo, transaccionId: txId };
}

export function historial(db: any, userId: string, id: string) {
  return db.prepare(`
    SELECT id, monto, fechaCobro, fechaPrevista, cuentaId
    FROM charge_payments WHERE chargeId = ? AND userId = ?
    ORDER BY fechaCobro DESC, creadoEn DESC LIMIT 50
  `).all(id, userId);
}

export interface PorAvisar {
  userId: string;
  cobros: { cliente: string; motivo: string; monto: number; proximoCobro: string; retraso: number }[];
}

/**
 * Cobros activos que tocan hoy o están vencidos, agrupados por usuario.
 * Un solo aviso por persona al día: cinco notificaciones seguidas se ignoran.
 */
export function pendientesDeAvisar(
  db: any, hoyDeUsuario: (userId: string) => string
): PorAvisar[] {
  const filas = db.prepare(`
    SELECT userId, cliente, motivo, monto, proximoCobro
    FROM charges
    WHERE estado = 'activo' AND proximoCobro IS NOT NULL
    ORDER BY userId, proximoCobro
  `).all() as any[];

  const porUsuario = new Map<string, PorAvisar>();
  const hoyCache = new Map<string, string>();

  for (const f of filas) {
    let hoy = hoyCache.get(f.userId);
    if (!hoy) { hoy = hoyDeUsuario(f.userId); hoyCache.set(f.userId, hoy); }
    if (f.proximoCobro > hoy) continue;

    const entrada = porUsuario.get(f.userId) || { userId: f.userId, cobros: [] };
    entrada.cobros.push({
      cliente: f.cliente, motivo: f.motivo, monto: f.monto,
      proximoCobro: f.proximoCobro, retraso: diasEntre(f.proximoCobro, hoy),
    });
    porUsuario.set(f.userId, entrada);
  }
  return [...porUsuario.values()];
}

/** Texto del aviso diario. */
export function textoAviso(cobros: PorAvisar['cobros']): { titulo: string; cuerpo: string } {
  const [primero] = cobros;
  if (cobros.length === 1) {
    const vencido = primero.retraso > 0;
    return {
      titulo: vencido ? 'Cobro vencido' : 'Hoy te toca cobrar',
      cuerpo: `${primero.cliente} · ${primero.motivo} · ${primero.monto}`
        + (vencido ? ` (${primero.retraso} ${primero.retraso === 1 ? 'día' : 'días'} de retraso)` : ''),
    };
  }
  const nombres = cobros.slice(0, 3).map((c) => c.cliente).join(', ');
  return {
    titulo: `Tienes ${cobros.length} cobros pendientes`,
    cuerpo: nombres + (cobros.length > 3 ? ' y más' : ''),
  };
}
