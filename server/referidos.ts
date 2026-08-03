/**
 * Programa de referidos.
 *
 * Quien invita gana tokens cuando la persona invitada entra por primera vez, y
 * la invitada también gana algo por venir recomendada. Los importes se
 * configuran desde el panel; los de serie son 10.000 y 5.000.
 *
 * Los tokens se suman al saldo y al cupo del plan, así que caducan en la
 * siguiente renovación igual que el resto. Es lo coherente con cómo funciona
 * todo lo demás, y evita que un cupo mensual crezca para siempre.
 *
 * Protecciones contra el abuso evidente: no se puede uno referir a sí mismo, un
 * usuario solo puede canjear un código y solo al crear su cuenta, y se guarda
 * la IP para poder detectar granjas de cuentas desde el panel.
 */
import crypto from 'crypto';
import type { Express } from 'express';

export const TOKENS_REFERIDOR_DEFECTO = 10000;
export const TOKENS_REFERIDO_DEFECTO = 5000;

// Sin vocales (para no formar palabras por accidente) ni caracteres que se
// confundan al dictarlos por teléfono: 0/O, 1/I/L.
const ALFABETO = '23456789BCDFGHJKMNPQRSTVWXYZ';
const LARGO_CODIGO = 6;

export function crearTablas(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      codigo TEXT NOT NULL,
      referidorId TEXT NOT NULL,
      referidoId TEXT NOT NULL UNIQUE,
      tokensReferidor INTEGER NOT NULL,
      tokensReferido INTEGER NOT NULL,
      ip TEXT,
      creadoEn TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ref_referidor ON referrals(referidorId);
    CREATE INDEX IF NOT EXISTS idx_ref_codigo ON referrals(codigo);

    -- Una sola fila: los valores que el panel puede cambiar.
    CREATE TABLE IF NOT EXISTS referral_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      tokensReferidor INTEGER NOT NULL,
      tokensReferido INTEGER NOT NULL,
      activo INTEGER DEFAULT 1,
      maxPorUsuario INTEGER DEFAULT 0,
      actualizadoEn TEXT
    );
  `);

  try { db.exec('ALTER TABLE users ADD COLUMN referralCode TEXT'); } catch { /* ya existe */ }
  try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_refcode ON users(referralCode)'); } catch { }

  db.prepare(`
    INSERT OR IGNORE INTO referral_config (id, tokensReferidor, tokensReferido, activo, actualizadoEn)
    VALUES (1, ?, ?, 1, ?)
  `).run(TOKENS_REFERIDOR_DEFECTO, TOKENS_REFERIDO_DEFECTO, new Date().toISOString());
}

export function configuracion(db: any): any {
  return db.prepare('SELECT * FROM referral_config WHERE id = 1').get() || {
    tokensReferidor: TOKENS_REFERIDOR_DEFECTO,
    tokensReferido: TOKENS_REFERIDO_DEFECTO,
    activo: 1,
    maxPorUsuario: 0,
  };
}

/** Código del usuario, generándolo la primera vez que hace falta. */
export function codigoDe(db: any, userId: string): string {
  const fila = db.prepare('SELECT referralCode FROM users WHERE id = ?').get(userId) as any;
  if (fila?.referralCode) return fila.referralCode;

  // Con 28 símbolos y 6 posiciones hay 481 millones de combinaciones; aun así
  // se reintenta, porque el índice único es quien manda.
  for (let intento = 0; intento < 20; intento++) {
    const bytes = crypto.randomBytes(LARGO_CODIGO);
    let codigo = '';
    for (let i = 0; i < LARGO_CODIGO; i++) codigo += ALFABETO[bytes[i] % ALFABETO.length];

    try {
      db.prepare('UPDATE users SET referralCode = ? WHERE id = ?').run(codigo, userId);
      return codigo;
    } catch {
      // Colisión con otro código; se prueba de nuevo.
    }
  }

  throw new Error('No se pudo generar un código de referido');
}

export interface ResultadoCanje {
  aplicado: boolean;
  motivo?: string;
  tokensReferido?: number;
  referidorId?: string;
}

/**
 * Canjea un código para un usuario recién creado.
 *
 * Se llama dentro del alta: un código canjeado más tarde permitiría a cualquiera
 * reclamar el premio después de haber usado la app, que no es la idea.
 */
export function canjear(
  db: any,
  opciones: {
    codigo: string;
    referidoId: string;
    ip?: string;
    acreditar: (userId: string, tokens: number, descripcion: string) => void;
    notificar?: (userId: string, titulo: string, mensaje: string) => void;
  }
): ResultadoCanje {
  const { codigo, referidoId, ip, acreditar, notificar } = opciones;

  const cfg = configuracion(db);
  if (!cfg.activo) return { aplicado: false, motivo: 'programa-inactivo' };

  const limpio = String(codigo || '').trim().toUpperCase();
  if (!limpio) return { aplicado: false, motivo: 'sin-codigo' };

  const referidor = db.prepare('SELECT id, displayName FROM users WHERE referralCode = ?')
    .get(limpio) as any;

  if (!referidor) return { aplicado: false, motivo: 'codigo-desconocido' };
  if (referidor.id === referidoId) return { aplicado: false, motivo: 'auto-referido' };

  const yaCanjeo = db.prepare('SELECT 1 FROM referrals WHERE referidoId = ?').get(referidoId);
  if (yaCanjeo) return { aplicado: false, motivo: 'ya-canjeado' };

  // Un tope de cero significa sin límite.
  if (cfg.maxPorUsuario > 0) {
    const cuantos = db.prepare('SELECT COUNT(*) AS n FROM referrals WHERE referidorId = ?')
      .get(referidor.id) as any;
    if (cuantos.n >= cfg.maxPorUsuario) return { aplicado: false, motivo: 'tope-alcanzado' };
  }

  db.prepare(`
    INSERT INTO referrals
      (id, codigo, referidorId, referidoId, tokensReferidor, tokensReferido, ip, creadoEn)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(crypto.randomUUID(), limpio, referidor.id, referidoId,
         cfg.tokensReferidor, cfg.tokensReferido, ip || null, new Date().toISOString());

  acreditar(referidor.id, cfg.tokensReferidor, 'Recompensa por invitar a alguien');
  acreditar(referidoId, cfg.tokensReferido, 'Bienvenida por venir invitado');

  notificar?.(
    referidor.id,
    'Alguien entró con tu invitación',
    `Se han sumado ${cfg.tokensReferidor.toLocaleString('es')} tokens a tu cuenta. Sigue compartiendo tu código.`
  );

  return {
    aplicado: true,
    tokensReferido: cfg.tokensReferido,
    referidorId: referidor.id,
  };
}

/** Los referidos de un usuario, con lo que ganó por cada uno. */
export function referidosDe(db: any, userId: string) {
  const lista = db.prepare(`
    SELECT r.id, r.referidoId, r.tokensReferidor, r.creadoEn,
           u.displayName, u.email, u.phone, u.createdAt AS altaEn, u.lastSeenAt
    FROM referrals r
    LEFT JOIN users u ON u.id = r.referidoId
    WHERE r.referidorId = ?
    ORDER BY r.creadoEn DESC
  `).all(userId) as any[];

  return {
    total: lista.length,
    tokensGanados: lista.reduce((suma, r) => suma + Number(r.tokensReferidor || 0), 0),
    lista,
  };
}

/**
 * `adminMiddleware` valida el token de administrador, que es independiente del
 * de usuario: las rutas del panel no llevan además `authMiddleware`.
 */
export function montarEndpoints(
  app: Express,
  db: any,
  authMiddleware: any,
  adminMiddleware: any
) {
  // Lo que ve el usuario: su código, el enlace listo para compartir y a quién
  // ha traído ya.
  app.get('/api/referidos', authMiddleware, (req: any, res: any) => {
    const cfg = configuracion(db);
    const codigo = codigoDe(db, req.userId);
    const base = process.env.PUBLIC_URL || 'https://herawallet.app';

    res.json({
      codigo,
      enlace: `${base}/?ref=${codigo}`,
      activo: !!cfg.activo,
      tokensPorInvitado: cfg.tokensReferidor,
      tokensParaInvitado: cfg.tokensReferido,
      ...referidosDe(db, req.userId),
    });
  });

  // Permite que la pantalla de acceso diga "te esperan 5.000 tokens" con el
  // valor real antes de registrarse. No expone quién es el dueño del código.
  app.get('/api/referidos/validar/:codigo', (req, res) => {
    const cfg = configuracion(db);
    const codigo = String(req.params.codigo || '').trim().toUpperCase();
    const existe = db.prepare('SELECT displayName FROM users WHERE referralCode = ?').get(codigo) as any;

    res.json({
      valido: !!existe && !!cfg.activo,
      tokens: cfg.tokensReferido,
      invitadoPor: existe?.displayName ? String(existe.displayName).split(' ')[0] : null,
    });
  });

  app.get('/api/admin/referidos/config', adminMiddleware, (_req: any, res: any) => {
    const cfg = configuracion(db);
    const totales = db.prepare(`
      SELECT COUNT(*) AS canjes,
             COALESCE(SUM(tokensReferidor + tokensReferido), 0) AS tokensRepartidos
      FROM referrals
    `).get() as any;

    res.json({ ...cfg, ...totales });
  });

  app.put('/api/admin/referidos/config', adminMiddleware, (req: any, res: any) => {
    const actual = configuracion(db);

    // Un valor negativo restaría tokens a quien invita; el tope alto evita que
    // un cero de más regale un plan entero por error.
    const aRango = (valor: any, porDefecto: number) => {
      const n = Number(valor);
      return Number.isFinite(n) ? Math.max(0, Math.min(1000000, Math.round(n))) : porDefecto;
    };

    db.prepare(`
      UPDATE referral_config SET
        tokensReferidor = ?, tokensReferido = ?, activo = ?, maxPorUsuario = ?, actualizadoEn = ?
      WHERE id = 1
    `).run(
      aRango(req.body?.tokensReferidor, actual.tokensReferidor),
      aRango(req.body?.tokensReferido, actual.tokensReferido),
      req.body?.activo === undefined ? actual.activo : (req.body.activo ? 1 : 0),
      aRango(req.body?.maxPorUsuario, actual.maxPorUsuario || 0),
      new Date().toISOString()
    );

    res.json(configuracion(db));
  });

  // Para el detalle de un usuario en el panel: a quién trajo, y quién lo trajo a él.
  app.get('/api/admin/usuarios/:id/referidos', adminMiddleware, (req: any, res: any) => {
    const datos = referidosDe(db, req.params.id);

    const invitadoPor = db.prepare(`
      SELECT r.codigo, r.tokensReferido, r.creadoEn, u.id, u.displayName, u.email
      FROM referrals r LEFT JOIN users u ON u.id = r.referidorId
      WHERE r.referidoId = ?
    `).get(req.params.id) as any;

    res.json({
      ...datos,
      codigo: (db.prepare('SELECT referralCode FROM users WHERE id = ?').get(req.params.id) as any)?.referralCode || null,
      invitadoPor: invitadoPor || null,
    });
  });
}
