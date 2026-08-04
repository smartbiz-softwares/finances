/**
 * Presupuestos por categoría.
 *
 * Un tope mensual por categoría y un aviso cuando se lleva gastado el 80 %.
 * Ese momento es el que importa: al 100 % ya no hay nada que decidir, y al 50 %
 * todavía no hay nada que hacer. Al 80 % quedan días de mes y margen para
 * cambiar algo.
 *
 * El gasto no se guarda: se suma de las transacciones cada vez. Guardarlo
 * obligaría a mantenerlo al día en cada alta, baja y edición, y bastaría un
 * fallo para que el aviso saltara con cifras que no son.
 */

/** A partir de aquí se avisa. */
export const UMBRAL_AVISO = 0.8;

export function crearTablas(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      creadoEn TEXT NOT NULL,
      actualizadoEn TEXT
    );

    -- Una categoría, un presupuesto: dos topes para lo mismo no significan nada.
    CREATE UNIQUE INDEX IF NOT EXISTS budgets_usuario_categoria
      ON budgets (userId, category);
  `);
}

export interface Estado {
  id: string;
  category: string;
  amount: number;
  gastado: number;
  /** Parte consumida, de 0 a 1 y sin techo: pasarse se ve. */
  proporcion: number;
  restante: number;
  /** 'bien' | 'cerca' (≥80 %) | 'pasado' (>100 %) */
  situacion: 'bien' | 'cerca' | 'pasado';
}

/** Primer día del mes al que pertenece una fecha. */
const inicioDeMes = (fecha: string) => `${fecha.slice(0, 7)}-01`;

/**
 * Presupuestos del usuario con lo que lleva gastado este mes.
 *
 * @param hoy Fecha local del usuario; el mes se saca de ahí y no del reloj del
 *            servidor, que puede estar en otro día.
 */
export function estado(db: any, userId: string, hoy: string): Estado[] {
  const presupuestos = db.prepare(
    'SELECT * FROM budgets WHERE userId = ? ORDER BY category'
  ).all(userId) as any[];

  if (presupuestos.length === 0) return [];

  const gastos = db.prepare(`
    SELECT category, SUM(amount) AS total
    FROM transactions
    WHERE userId = ? AND type = 'expense' AND date >= ? AND date <= ?
    GROUP BY category
  `).all(userId, inicioDeMes(hoy), hoy) as any[];

  const porCategoria = new Map<string, number>();
  for (const g of gastos) porCategoria.set(g.category, Number(g.total) || 0);

  return presupuestos.map((p) => {
    const gastado = porCategoria.get(p.category) || 0;
    const tope = Number(p.amount) || 0;
    const proporcion = tope > 0 ? gastado / tope : 0;

    return {
      id: p.id,
      category: p.category,
      amount: tope,
      gastado,
      proporcion,
      restante: tope - gastado,
      situacion: proporcion > 1 ? 'pasado' : proporcion >= UMBRAL_AVISO ? 'cerca' : 'bien',
    };
  });
}

/**
 * Los que merecen aviso ahora mismo.
 *
 * Se avisa dos veces como mucho: al cruzar el 80 % y al pasarse. La huella
 * incluye el mes y el escalón, así que cada uno se manda una sola vez aunque se
 * siga gastando en esa categoría todos los días.
 */
export function paraAvisar(db: any, userId: string, hoy: string) {
  return estado(db, userId, hoy)
    .filter((p) => p.situacion !== 'bien')
    .map((p) => ({
      ...p,
      escalon: p.situacion === 'pasado' ? 'pasado' : '80',
      huella: `presupuesto:${p.category}:${hoy.slice(0, 7)}:${p.situacion === 'pasado' ? 'pasado' : '80'}`,
    }));
}
