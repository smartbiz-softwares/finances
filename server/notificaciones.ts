/**
 * Notificaciones: envío push, preferencias y fontanería del planificador.
 *
 * El objetivo es que la gente vuelva a la app, y para eso una notificación
 * tiene que llegar cuando hay algo que hacer. Un recordatorio cada dos horas
 * consigue lo contrario: se revoca el permiso, y el permiso se concede una vez
 * en la vida. Por eso el planificador *evalúa* con frecuencia pero *envía* poco:
 *
 *   - techo diario por persona (3 de serie)
 *   - solo dentro de una ventana horaria razonable, en su hora local
 *   - nunca dos veces el mismo tipo el mismo día
 *   - si no hay nada que contar, no se manda nada
 *
 * Qué se cuenta vive en `reglas.ts`; aquí está solo el mecanismo.
 */
import webpush from 'web-push';
import type { Express } from 'express';
import crypto from 'crypto';

/** Ventana en hora local del usuario. Fuera de esto no se envía nada. */
export const HORA_INICIO = 9;
export const HORA_FIN = 21;

let listoParaEnviar = false;

export function configurarWebPush(): boolean {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[notificaciones] Sin claves VAPID: el push queda desactivado.');
    return false;
  }

  webpush.setVapidDetails(
    VAPID_SUBJECT || 'mailto:soporte@herawallet.app',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  listoParaEnviar = true;
  return true;
}

export const pushActivo = () => listoParaEnviar;

export function crearTablas(db: any) {
  db.exec(`
    -- Un mismo usuario puede tener varios navegadores o dispositivos.
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      userAgent TEXT,
      createdAt TEXT NOT NULL,
      lastOkAt TEXT,
      fallos INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_push_userId ON push_subscriptions(userId);

    CREATE TABLE IF NOT EXISTS notification_prefs (
      userId TEXT PRIMARY KEY,
      activadas INTEGER DEFAULT 1,
      resumenDiario INTEGER DEFAULT 1,
      resumenSemanal INTEGER DEFAULT 1,
      resumenMensual INTEGER DEFAULT 1,
      resumenAnual INTEGER DEFAULT 1,
      avisos INTEGER DEFAULT 1,
      racha INTEGER DEFAULT 1,
      maxPorDia INTEGER DEFAULT 3,
      zonaHoraria TEXT DEFAULT 'America/Havana',
      actualizadoEn TEXT
    );

    -- Registro de lo enviado. Sirve para tres cosas: respetar el techo diario,
    -- no repetir contenido, y medir qué se abre de verdad.
    CREATE TABLE IF NOT EXISTS notification_sent (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      tipo TEXT NOT NULL,
      titulo TEXT NOT NULL,
      cuerpo TEXT NOT NULL,
      huella TEXT,
      enviadoEn TEXT NOT NULL,
      abiertoEn TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_notif_sent_user ON notification_sent(userId, enviadoEn);
    CREATE INDEX IF NOT EXISTS idx_notif_sent_huella ON notification_sent(userId, huella);
  `);
}

/** Preferencias del usuario, creándolas con los valores de serie si no existen. */
export function preferencias(db: any, userId: string): any {
  let p = db.prepare('SELECT * FROM notification_prefs WHERE userId = ?').get(userId);
  if (!p) {
    db.prepare('INSERT INTO notification_prefs (userId, actualizadoEn) VALUES (?, ?)')
      .run(userId, new Date().toISOString());
    p = db.prepare('SELECT * FROM notification_prefs WHERE userId = ?').get(userId);
  }
  return p;
}

/** Hora local del usuario según su zona horaria. */
export function horaLocal(zona: string, cuando = new Date()): number {
  try {
    return Number(new Intl.DateTimeFormat('es', {
      timeZone: zona, hour: 'numeric', hour12: false,
    }).format(cuando));
  } catch {
    return cuando.getHours();
  }
}

/** Fecha YYYY-MM-DD en la zona del usuario, para contar "hoy" donde vive él. */
export function fechaLocal(zona: string, cuando = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(cuando);
  } catch {
    return cuando.toISOString().slice(0, 10);
  }
}

/**
 * ¿Se le puede enviar algo ahora a esta persona?
 *
 * `tipo` permite que un aviso puntual no compita con el resumen: cada tipo se
 * manda como mucho una vez al día.
 */
export function puedeRecibir(db: any, userId: string, tipo: string, ahora = new Date()): boolean {
  const p = preferencias(db, userId);
  if (!p.activadas) return false;

  const hora = horaLocal(p.zonaHoraria, ahora);
  if (hora < HORA_INICIO || hora >= HORA_FIN) return false;

  const hoy = fechaLocal(p.zonaHoraria, ahora);
  const enviadasHoy = db.prepare(`
    SELECT tipo FROM notification_sent
    WHERE userId = ? AND substr(enviadoEn, 1, 10) = ?
  `).all(userId, hoy) as any[];

  if (enviadasHoy.length >= (p.maxPorDia || 3)) return false;
  if (enviadasHoy.some((n) => n.tipo === tipo)) return false;

  return true;
}

export interface Aviso {
  tipo: string;
  titulo: string;
  cuerpo: string;
  url?: string;
  /** Identifica el contenido para no repetirlo. */
  huella?: string;
  /** Botones de la propia notificación. */
  acciones?: { action: string; title: string }[];
}

/**
 * Envía a todos los dispositivos del usuario y lo anota.
 *
 * No comprueba el techo diario: eso lo decide quien llama, porque un aviso
 * lanzado a mano desde el panel debe poder saltárselo.
 */
export async function enviar(db: any, userId: string, aviso: Aviso): Promise<number> {
  const subs = db.prepare('SELECT * FROM push_subscriptions WHERE userId = ?').all(userId) as any[];

  const carga = JSON.stringify({
    titulo: aviso.titulo,
    cuerpo: aviso.cuerpo,
    url: aviso.url || '/',
    tipo: aviso.tipo,
    acciones: aviso.acciones || [],
  });

  let entregadas = 0;

  if (listoParaEnviar) {
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          carga
        );
        entregadas++;
        db.prepare('UPDATE push_subscriptions SET lastOkAt = ?, fallos = 0 WHERE id = ?')
          .run(new Date().toISOString(), s.id);
      } catch (err: any) {
        // 404 y 410 significan que esa suscripción ya no existe: el navegador la
        // revocó o se desinstaló la app. Reintentar solo gasta cuota.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(s.id);
        } else {
          db.prepare('UPDATE push_subscriptions SET fallos = fallos + 1 WHERE id = ?').run(s.id);
        }
      }
    }));
  }

  db.prepare(`
    INSERT INTO notification_sent (id, userId, tipo, titulo, cuerpo, huella, enviadoEn)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(crypto.randomUUID(), userId, aviso.tipo, aviso.titulo, aviso.cuerpo,
         aviso.huella || null, new Date().toISOString());

  // Copia dentro de la app: quien tenga el push desactivado, o lo vea tarde,
  // encuentra el mismo mensaje en su campana.
  db.prepare(`
    INSERT INTO user_notifications (id, userId, title, message, type, actionData, isRead, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(crypto.randomUUID(), userId, aviso.titulo, aviso.cuerpo, aviso.tipo,
         JSON.stringify({ url: aviso.url || '/' }), new Date().toISOString());

  return entregadas;
}

/** Envía respetando el techo diario. Devuelve si llegó a mandarse. */
export async function enviarSiProcede(
  db: any, userId: string, aviso: Aviso, ahora = new Date()
): Promise<boolean> {
  if (!puedeRecibir(db, userId, aviso.tipo, ahora)) return false;
  await enviar(db, userId, aviso);
  return true;
}

export function montarEndpoints(app: Express, db: any, authMiddleware: any) {
  // La clave pública no es secreta: el navegador la necesita para suscribirse.
  app.get('/api/push/clave', (_req, res) => {
    res.json({ clave: process.env.VAPID_PUBLIC_KEY || null, activo: listoParaEnviar });
  });

  app.post('/api/push/suscribir', authMiddleware, (req: any, res: any) => {
    const { endpoint, keys } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Suscripción incompleta' });
    }

    // El endpoint identifica al dispositivo: si vuelve a suscribirse, se
    // actualiza en vez de duplicarse.
    db.prepare(`
      INSERT INTO push_subscriptions (id, userId, endpoint, p256dh, auth, userAgent, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        userId = excluded.userId,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        fallos = 0
    `).run(crypto.randomUUID(), req.userId, endpoint, keys.p256dh, keys.auth,
           String(req.headers['user-agent'] || '').slice(0, 200), new Date().toISOString());

    preferencias(db, req.userId);
    res.json({ ok: true });
  });

  app.post('/api/push/cancelar', authMiddleware, (req: any, res: any) => {
    const { endpoint } = req.body || {};
    if (endpoint) {
      db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ? AND userId = ?')
        .run(endpoint, req.userId);
    }
    res.json({ ok: true });
  });

  app.get('/api/notificaciones/preferencias', authMiddleware, (req: any, res: any) => {
    const p = preferencias(db, req.userId);
    const disp = db.prepare('SELECT COUNT(*) as n FROM push_subscriptions WHERE userId = ?')
      .get(req.userId) as any;
    res.json({ ...p, dispositivos: disp?.n || 0 });
  });

  app.put('/api/notificaciones/preferencias', authMiddleware, (req: any, res: any) => {
    const campos = ['activadas', 'resumenDiario', 'resumenSemanal', 'resumenMensual',
                    'resumenAnual', 'avisos', 'racha', 'maxPorDia', 'zonaHoraria'];

    preferencias(db, req.userId);

    for (const campo of campos) {
      if (req.body?.[campo] === undefined) continue;
      const valor = campo === 'zonaHoraria'
        ? String(req.body[campo]).slice(0, 64)
        : campo === 'maxPorDia'
          // Un techo por encima de 6 deja de ser un techo.
          ? Math.max(1, Math.min(6, Number(req.body[campo]) || 3))
          : (req.body[campo] ? 1 : 0);

      db.prepare(`UPDATE notification_prefs SET ${campo} = ?, actualizadoEn = ? WHERE userId = ?`)
        .run(valor, new Date().toISOString(), req.userId);
    }

    res.json(preferencias(db, req.userId));
  });

  // Marca la última notificación de ese tipo como abierta. Sin esto no se puede
  // saber qué tipos funcionan y cuáles solo molestan.
  app.post('/api/notificaciones/abierta', authMiddleware, (req: any, res: any) => {
    const { tipo } = req.body || {};
    if (tipo) {
      const ultima = db.prepare(`
        SELECT id FROM notification_sent
        WHERE userId = ? AND tipo = ? AND abiertoEn IS NULL
        ORDER BY enviadoEn DESC LIMIT 1
      `).get(req.userId, String(tipo)) as any;

      if (ultima) {
        db.prepare('UPDATE notification_sent SET abiertoEn = ? WHERE id = ?')
          .run(new Date().toISOString(), ultima.id);
      }
    }
    res.json({ ok: true });
  });
}
