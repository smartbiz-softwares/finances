/**
 * Racha y logros.
 *
 * La racha ya se calcula en `reglas.ts` a partir de las transacciones, así que
 * aquí no se guarda: se deriva. Un contador guardado se desincroniza en cuanto
 * alguien borra un movimiento, y entonces la app enseña una racha que no es
 * cierta.
 *
 * Los logros sí se guardan, porque hay que saber cuáles ya se anunciaron para
 * no felicitar dos veces por lo mismo.
 *
 * Todos los logros se comprueban contra datos reales. Ninguno se puede
 * conseguir sin usar la app de verdad.
 */
import crypto from 'crypto';
import type { Express } from 'express';
import { calcularRacha } from './reglas.ts';

export interface Logro {
  id: string;
  nombre: string;
  descripcion: string;
  /** Cómo se mide; se usa para pintar el progreso. */
  meta: number;
  /** Familia, para agrupar en la interfaz. */
  grupo: 'racha' | 'registro' | 'metas' | 'orden';
}

export const LOGROS: Logro[] = [
  { id: 'primer-registro', nombre: 'El primero', descripcion: 'Registraste tu primer movimiento', meta: 1, grupo: 'registro' },
  { id: 'registros-10', nombre: 'Cogiendo el ritmo', descripcion: '10 movimientos registrados', meta: 10, grupo: 'registro' },
  { id: 'registros-50', nombre: 'Constancia', descripcion: '50 movimientos registrados', meta: 50, grupo: 'registro' },
  { id: 'registros-200', nombre: 'Tus cuentas al día', descripcion: '200 movimientos registrados', meta: 200, grupo: 'registro' },

  { id: 'racha-3', nombre: 'Tres días', descripcion: '3 días seguidos registrando', meta: 3, grupo: 'racha' },
  { id: 'racha-7', nombre: 'Una semana', descripcion: '7 días seguidos registrando', meta: 7, grupo: 'racha' },
  { id: 'racha-30', nombre: 'Un mes entero', descripcion: '30 días seguidos registrando', meta: 30, grupo: 'racha' },
  { id: 'racha-100', nombre: 'Cien días', descripcion: '100 días seguidos registrando', meta: 100, grupo: 'racha' },

  { id: 'primera-meta', nombre: 'Con un objetivo', descripcion: 'Creaste tu primera meta de ahorro', meta: 1, grupo: 'metas' },
  { id: 'meta-cumplida', nombre: 'Objetivo cumplido', descripcion: 'Alcanzaste una meta de ahorro', meta: 1, grupo: 'metas' },

  { id: 'primera-cuenta', nombre: 'Todo en su sitio', descripcion: 'Añadiste tu primera cuenta o tarjeta', meta: 1, grupo: 'orden' },
  { id: 'mes-completo', nombre: 'Mes cerrado', descripcion: 'Registraste algo en 20 días del mismo mes', meta: 20, grupo: 'orden' },
];

export function crearTablas(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      userId TEXT NOT NULL,
      logroId TEXT NOT NULL,
      conseguidoEn TEXT NOT NULL,
      anunciado INTEGER DEFAULT 0,
      PRIMARY KEY (userId, logroId)
    );
    CREATE INDEX IF NOT EXISTS idx_logros_user ON user_achievements(userId);
  `);
}

/** Progreso real de cada logro, leído de los datos del usuario. */
export function progreso(db: any, userId: string, hoy: string) {
  const movimientos = (db.prepare(
    'SELECT COUNT(*) AS n FROM transactions WHERE userId = ?'
  ).get(userId) as any)?.n || 0;

  const { racha } = calcularRacha(db, userId, hoy);

  const metas = (db.prepare(
    'SELECT COUNT(*) AS n FROM goals WHERE userId = ?'
  ).get(userId) as any)?.n || 0;

  const metasCumplidas = (db.prepare(
    'SELECT COUNT(*) AS n FROM goals WHERE userId = ? AND currentAmount >= targetAmount AND targetAmount > 0'
  ).get(userId) as any)?.n || 0;

  const cuentas = (db.prepare(
    'SELECT COUNT(*) AS n FROM accounts WHERE userId = ?'
  ).get(userId) as any)?.n || 0;

  // Días distintos con registro dentro del mes en curso.
  const diasDelMes = (db.prepare(`
    SELECT COUNT(DISTINCT date) AS n FROM transactions
    WHERE userId = ? AND substr(date, 1, 7) = ?
  `).get(userId, hoy.slice(0, 7)) as any)?.n || 0;

  return {
    'primer-registro': movimientos,
    'registros-10': movimientos,
    'registros-50': movimientos,
    'registros-200': movimientos,
    'racha-3': racha,
    'racha-7': racha,
    'racha-30': racha,
    'racha-100': racha,
    'primera-meta': metas,
    'meta-cumplida': metasCumplidas,
    'primera-cuenta': cuentas,
    'mes-completo': diasDelMes,
  } as Record<string, number>;
}

/**
 * Comprueba los logros y devuelve los recién conseguidos.
 *
 * Se llama tras cada registro. Los ya conseguidos no se vuelven a evaluar, así
 * que bajar de racha no quita una insignia ganada: retirar algo concedido
 * sienta mal y no aporta nada.
 */
export function revisar(db: any, userId: string, hoy: string): Logro[] {
  const avance = progreso(db, userId, hoy);

  const conseguidos = new Set(
    (db.prepare('SELECT logroId FROM user_achievements WHERE userId = ?').all(userId) as any[])
      .map((f) => f.logroId)
  );

  const nuevos: Logro[] = [];
  const ahora = new Date().toISOString();

  for (const logro of LOGROS) {
    if (conseguidos.has(logro.id)) continue;
    if ((avance[logro.id] || 0) < logro.meta) continue;

    db.prepare(`
      INSERT OR IGNORE INTO user_achievements (userId, logroId, conseguidoEn, anunciado)
      VALUES (?, ?, ?, 0)
    `).run(userId, logro.id, ahora);

    nuevos.push(logro);
  }

  return nuevos;
}

/**
 * Estado completo para pintar la pantalla de logros.
 *
 * Revisa antes de leer, y esto no es un detalle: si solo se concedieran al
 * registrar un movimiento, quien ya tenía cincuenta de antes vería cero, y los
 * logros de metas o cuentas no se darían nunca, porque crear una meta no pasa
 * por ahí. Revisando aquí, abrir la pantalla pone al día lo que corresponda sea
 * cual sea el motivo.
 */
export function estado(db: any, userId: string, hoy: string) {
  revisar(db, userId, hoy);

  const avance = progreso(db, userId, hoy);
  const conseguidos = new Map(
    (db.prepare('SELECT logroId, conseguidoEn FROM user_achievements WHERE userId = ?')
      .all(userId) as any[]).map((f) => [f.logroId, f.conseguidoEn])
  );

  const { racha, registroHoy } = calcularRacha(db, userId, hoy);

  const lista = LOGROS.map((l) => ({
    ...l,
    progreso: Math.min(avance[l.id] || 0, l.meta),
    conseguido: conseguidos.has(l.id),
    conseguidoEn: conseguidos.get(l.id) || null,
  }));

  // El siguiente hito de racha sirve para dar una meta cercana en la interfaz.
  const hitos = [3, 7, 30, 100];
  const siguienteHito = hitos.find((h) => h > racha) || null;

  return {
    racha,
    registroHoy,
    siguienteHito,
    conseguidos: lista.filter((l) => l.conseguido).length,
    total: LOGROS.length,
    logros: lista,
  };
}

export function montarEndpoints(app: Express, db: any, authMiddleware: any, fechaLocalDe: (userId: string) => string) {
  app.get('/api/logros', authMiddleware, (req: any, res: any) => {
    res.json(estado(db, req.userId, fechaLocalDe(req.userId)));
  });

  // Los logros nuevos se marcan como anunciados al recogerlos, para que la
  // celebración salga una sola vez aunque se recargue la página.
  app.get('/api/logros/nuevos', authMiddleware, (req: any, res: any) => {
    const pendientes = db.prepare(`
      SELECT logroId FROM user_achievements
      WHERE userId = ? AND anunciado = 0
    `).all(req.userId) as any[];

    if (pendientes.length > 0) {
      db.prepare('UPDATE user_achievements SET anunciado = 1 WHERE userId = ? AND anunciado = 0')
        .run(req.userId);
    }

    const ids = new Set(pendientes.map((p) => p.logroId));
    res.json({ logros: LOGROS.filter((l) => ids.has(l.id)) });
  });
}

/** Registra los logros nuevos como notificación dentro de la app. */
export function anotarEnCampana(
  db: any,
  userId: string,
  nuevos: Logro[],
  crearNotificacion: (userId: string, titulo: string, mensaje: string) => void
) {
  for (const logro of nuevos) {
    crearNotificacion(userId, `Logro: ${logro.nombre}`, logro.descripcion);
  }
}
