/**
 * Gastos que se repiten, detectados solos.
 *
 * El alquiler, el móvil, el gimnasio, las suscripciones. Nadie los da de alta a
 * mano —por eso siguen cobrándose años después de dejar de usarlos—, así que se
 * deducen del histórico: mismo concepto, importe parecido y una cadencia
 * reconocible.
 *
 * Se detecta pero no se registra nada por su cuenta. Un cobro que se anota solo
 * y no ocurrió es peor que uno que falta: el saldo miente y nadie sabe por qué.
 * Lo que se hace es avisar cuando toca y dejar que la persona confirme.
 */

/** Mínimo de repeticiones para creerse que algo es recurrente. */
const REPETICIONES_MINIMAS = 3;

/** Cuánto puede variar el importe y seguir siendo el mismo recibo. */
const VARIACION_MAXIMA = 0.25;

/** Cadencias que se reconocen, con el margen de días que se les tolera. */
const CADENCIAS: { nombre: string; dias: number; margen: number }[] = [
  { nombre: 'semanal', dias: 7, margen: 2 },
  { nombre: 'quincenal', dias: 15, margen: 3 },
  { nombre: 'mensual', dias: 30, margen: 5 },
  { nombre: 'bimestral', dias: 61, margen: 7 },
  { nombre: 'trimestral', dias: 91, margen: 9 },
  { nombre: 'anual', dias: 365, margen: 15 },
];

export function crearTablas(db: any) {
  db.exec(`
    -- Lo que la persona ya decidió sobre un recurrente detectado. Sin esto, uno
    -- descartado volvería a proponerse cada vez, que es la forma más rápida de
    -- que deje de mirar los avisos.
    CREATE TABLE IF NOT EXISTS recurring_decisions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      clave TEXT NOT NULL,
      decision TEXT NOT NULL,        -- 'confirmado' | 'descartado'
      decididoEn TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS recurring_usuario_clave
      ON recurring_decisions (userId, clave);
  `);
}

export interface Recurrente {
  /** Identifica el patrón entre ejecuciones: concepto normalizado + categoría. */
  clave: string;
  descripcion: string;
  category: string;
  /** Importe típico: la mediana, que un recibo raro no desplaza. */
  importe: number;
  cadencia: string;
  diasEntre: number;
  veces: number;
  ultima: string;
  /** Cuándo tocaría el siguiente. */
  proxima: string;
  /** Días de retraso respecto a lo previsto; negativo si aún no toca. */
  retraso: number;
  decision: 'confirmado' | 'descartado' | null;
}

/**
 * Reduce un concepto a lo que lo identifica.
 *
 * "Pago Netflix marzo", "netflix 12/03" y "NETFLIX" son el mismo recibo. Se
 * quitan cifras, fechas y palabras de relleno para que caigan en la misma cesta.
 */
export function normalizar(texto: string): string {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[0-9]+/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((p) => p.length > 2 && !RELLENO.has(p))
    .slice(0, 4)
    .join(' ')
    .trim();
}

const RELLENO = new Set([
  'pago', 'pagos', 'pague', 'gasto', 'gastos', 'compra', 'del', 'los', 'las',
  'por', 'para', 'con', 'mes', 'mensual', 'cuota', 'recibo', 'factura',
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre',
]);

const diasEntre = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);

const sumarDias = (fecha: string, dias: number) => {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

const mediana = (valores: number[]) => {
  const orden = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[medio] : (orden[medio - 1] + orden[medio]) / 2;
};

/**
 * Encuentra los gastos que se repiten en el histórico.
 *
 * @param hoy Fecha local del usuario, para saber qué está pendiente.
 */
export function detectar(db: any, userId: string, hoy: string): Recurrente[] {
  // Año y medio: suficiente para ver un anual dos veces, y evita arrastrar
  // suscripciones que se cancelaron hace mucho.
  const desde = sumarDias(hoy, -550);

  const movimientos = db.prepare(`
    SELECT description, category, amount, date
    FROM transactions
    WHERE userId = ? AND type = 'expense' AND date >= ?
    ORDER BY date ASC
  `).all(userId, desde) as any[];

  // Agrupar por concepto normalizado y categoría.
  const grupos = new Map<string, any[]>();
  for (const m of movimientos) {
    const concepto = normalizar(m.description);
    if (!concepto) continue;   // Sin descripción útil no hay nada que agrupar.

    const clave = `${concepto}|${m.category}`;
    const grupo = grupos.get(clave);
    if (grupo) grupo.push(m);
    else grupos.set(clave, [m]);
  }

  const decisiones = new Map<string, string>();
  for (const d of db.prepare(
    'SELECT clave, decision FROM recurring_decisions WHERE userId = ?'
  ).all(userId) as any[]) {
    decisiones.set(d.clave, d.decision);
  }

  const encontrados: Recurrente[] = [];

  for (const [clave, grupo] of grupos) {
    if (grupo.length < REPETICIONES_MINIMAS) continue;

    // Varias compras el mismo día son una sola vez: comprar dos cafés seguidos
    // no es una suscripción.
    const porFecha = new Map<string, any>();
    for (const m of grupo) if (!porFecha.has(m.date)) porFecha.set(m.date, m);
    const unicos = [...porFecha.values()];
    if (unicos.length < REPETICIONES_MINIMAS) continue;

    const importes = unicos.map((m) => Number(m.amount));
    const tipico = mediana(importes);
    if (tipico <= 0) continue;

    // Importes dispares: es una categoría frecuente, no un recibo fijo.
    const dispersion = importes.filter(
      (v) => Math.abs(v - tipico) / tipico > VARIACION_MAXIMA
    ).length;
    if (dispersion > importes.length / 3) continue;

    const huecos: number[] = [];
    for (let i = 1; i < unicos.length; i++) {
      huecos.push(diasEntre(unicos[i - 1].date, unicos[i].date));
    }

    const hueco = mediana(huecos);
    const cadencia = CADENCIAS.find((c) => Math.abs(hueco - c.dias) <= c.margen);
    if (!cadencia) continue;

    // Los huecos tienen que ser parecidos entre sí, no solo de media: tres
    // compras sueltas pueden promediar 30 días sin repetirse nada.
    const irregulares = huecos.filter(
      (h) => Math.abs(h - cadencia.dias) > cadencia.margen * 2
    ).length;
    if (irregulares > huecos.length / 3) continue;

    const ultima = unicos[unicos.length - 1].date;
    const proxima = sumarDias(ultima, cadencia.dias);

    encontrados.push({
      clave,
      // El texto original del más reciente: es el que la persona reconoce.
      descripcion: unicos[unicos.length - 1].description || clave.split('|')[0],
      category: unicos[0].category,
      importe: Math.round(tipico * 100) / 100,
      cadencia: cadencia.nombre,
      diasEntre: cadencia.dias,
      veces: unicos.length,
      ultima,
      proxima,
      retraso: diasEntre(proxima, hoy),
      decision: (decisiones.get(clave) as any) || null,
    });
  }

  // Los más caros primero: son los que compensa revisar.
  return encontrados
    .filter((r) => r.decision !== 'descartado')
    .sort((a, b) => b.importe * (365 / b.diasEntre) - a.importe * (365 / a.diasEntre));
}

/**
 * Los que ya deberían haberse cobrado y no aparecen.
 *
 * Se espera un margen antes de preguntar: un recibo que llega dos días tarde no
 * es una anomalía, y avisar por eso convierte la alerta en ruido.
 */
export function pendientes(db: any, userId: string, hoy: string) {
  return detectar(db, userId, hoy).filter((r) => {
    const cadencia = CADENCIAS.find((c) => c.dias === r.diasEntre);
    const margen = cadencia?.margen ?? 5;
    // Ni recién vencido ni olvidado hace un mes: pasado el doble del margen
    // deja de tener sentido preguntar.
    return r.retraso > margen && r.retraso <= r.diasEntre;
  });
}

/** Guarda lo que la persona decidió sobre un patrón detectado. */
export function decidir(
  db: any, userId: string, clave: string, decision: 'confirmado' | 'descartado'
) {
  db.prepare(`
    INSERT INTO recurring_decisions (id, userId, clave, decision, decididoEn)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (userId, clave)
    DO UPDATE SET decision = excluded.decision, decididoEn = excluded.decididoEn
  `).run(
    `${userId}:${clave}`.slice(0, 120), userId, clave, decision, new Date().toISOString()
  );
}
