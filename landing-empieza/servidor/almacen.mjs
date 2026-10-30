// Almacén en SQLite (better-sqlite3, el mismo motor que usa HeraWallet).
//
//   solicitudes   una fila por solicitud; las columnas que se filtran a menudo
//                 van aparte y el resto (respuestas, etc.) en "datos" (JSON)
//   eventos       telemetría anónima, indexada por fecha y por nombre
//   seguimiento   lo que cambia desde el panel: estado, notas, cambios de cita,
//                 aviso enviado
//
// Modo WAL: las lecturas del panel no bloquean las escrituras de la página.
// La primera vez importa los archivos .jsonl de la versión anterior.

import { mkdir, readFile, rename, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS solicitudes (
  id TEXT PRIMARY KEY,
  fecha TEXT NOT NULL,
  tipo TEXT NOT NULL,
  nombre TEXT,
  telefono TEXT,
  whatsapp TEXT,
  negocio TEXT,
  ciudad TEXT,
  tamano TEXT,
  reserva_dia TEXT,
  reserva_hora TEXT,
  sesion TEXT,
  datos TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS solicitudes_fecha ON solicitudes (fecha);
CREATE INDEX IF NOT EXISTS solicitudes_tipo ON solicitudes (tipo, fecha);

CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY,
  fecha TEXT NOT NULL,
  nombre TEXT NOT NULL,
  sesion TEXT NOT NULL,
  visitante TEXT NOT NULL,
  ruta TEXT,
  datos TEXT
);
CREATE INDEX IF NOT EXISTS eventos_fecha ON eventos (fecha);
CREATE INDEX IF NOT EXISTS eventos_nombre ON eventos (nombre, fecha);

CREATE TABLE IF NOT EXISTS seguimiento (
  id TEXT PRIMARY KEY REFERENCES solicitudes (id),
  estado TEXT,
  estado_reserva TEXT,
  dia TEXT,
  hora TEXT,
  notas TEXT,
  aviso_enviado TEXT,
  actualizado TEXT
);
`;

// Nombre en el código <-> columna de seguimiento.
const CAMPOS = { estado: 'estado', estadoReserva: 'estado_reserva', dia: 'dia', hora: 'hora', notas: 'notas', avisoEnviado: 'aviso_enviado' };

const aSolicitud = f => ({ ...JSON.parse(f.datos), id: f.id, fecha: f.fecha, tipo: f.tipo });
const aEvento = f => ({ f: f.fecha, e: f.nombre, s: f.sesion, v: f.visitante, r: f.ruta, d: f.datos ? JSON.parse(f.datos) : {} });
const aSeguimiento = f => {
  const o = {};
  for (const [k, col] of Object.entries(CAMPOS)) if (f[col] != null) o[k] = f[col];
  if (f.actualizado) o.actualizado = f.actualizado;
  return o;
};

async function leerJsonl(archivo) {
  try {
    return (await readFile(archivo, 'utf8')).split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch {
    return [];
  }
}

export async function crearAlmacen(dir) {
  await mkdir(dir, { recursive: true });
  const { default: Database } = await import('better-sqlite3');
  const ruta = join(dir, 'empieza.db');
  const db = new Database(ruta);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');
  db.exec(ESQUEMA);

  const sql = {
    insSolicitud: db.prepare(`INSERT OR IGNORE INTO solicitudes (id, fecha, tipo, nombre, telefono, whatsapp, negocio, ciudad, tamano, reserva_dia, reserva_hora, sesion, datos)
      VALUES (@id, @fecha, @tipo, @nombre, @telefono, @whatsapp, @negocio, @ciudad, @tamano, @reservaDia, @reservaHora, @sesion, @datos)`),
    insEvento: db.prepare('INSERT INTO eventos (fecha, nombre, sesion, visitante, ruta, datos) VALUES (?, ?, ?, ?, ?, ?)'),
    todas: db.prepare('SELECT * FROM solicitudes ORDER BY fecha'),
    una: db.prepare('SELECT * FROM solicitudes WHERE id = ?'),
    entre: db.prepare('SELECT * FROM solicitudes WHERE fecha >= ? AND fecha < ? ORDER BY fecha'),
    reservas: db.prepare("SELECT * FROM solicitudes WHERE tipo = 'reserva' ORDER BY fecha"),
    eventosEntre: db.prepare('SELECT * FROM eventos WHERE fecha >= ? AND fecha < ? ORDER BY fecha, id'),
    pagina: db.prepare('SELECT * FROM eventos WHERE fecha >= @desde AND fecha < @hasta AND (@nombre IS NULL OR nombre = @nombre) ORDER BY fecha DESC, id DESC LIMIT @limite OFFSET @desplazamiento'),
    contar: db.prepare('SELECT COUNT(*) AS n FROM eventos WHERE fecha >= @desde AND fecha < @hasta AND (@nombre IS NULL OR nombre = @nombre)'),
    seguimiento: db.prepare('SELECT * FROM seguimiento'),
    seguimientoDe: db.prepare('SELECT * FROM seguimiento WHERE id = ?'),
    vacia: db.prepare('SELECT (SELECT COUNT(*) FROM solicitudes) + (SELECT COUNT(*) FROM eventos) AS n'),
  };

  const filaSolicitud = s => ({
    id: s.id,
    fecha: s.fecha,
    tipo: s.tipo,
    nombre: s.nombre ?? null,
    telefono: s.telefono ?? null,
    whatsapp: s.whatsapp ?? null,
    negocio: s.negocio ?? null,
    ciudad: s.ciudad ?? null,
    tamano: s.tamano ?? null,
    reservaDia: s.reservaDia ?? null,
    reservaHora: s.reservaHora ?? null,
    sesion: s.sesion ?? null,
    datos: JSON.stringify(s),
  });
  const insertarEventos = db.transaction(lista => {
    for (const e of lista) sql.insEvento.run(e.f, e.e, e.s, e.v, e.r ?? null, JSON.stringify(e.d ?? {}));
  });

  function actualizarSync(id, cambios) {
    const cols = Object.entries(cambios).filter(([k]) => CAMPOS[k]);
    const ahora = new Date().toISOString();
    const nombres = cols.map(([k]) => CAMPOS[k]);
    db.prepare(
      `INSERT INTO seguimiento (id, ${[...nombres, 'actualizado'].join(', ')}) VALUES (?, ${[...nombres, 'actualizado'].map(() => '?').join(', ')})
       ON CONFLICT (id) DO UPDATE SET ${[...nombres, 'actualizado'].map(c => `${c} = excluded.${c}`).join(', ')}`,
    ).run(id, ...cols.map(([, v]) => v), ahora);
    return aSeguimiento(sql.seguimientoDe.get(id));
  }

  // Migración desde la versión con archivos: una sola vez, si la base está vacía.
  const archivos = { solicitudes: join(dir, 'solicitudes.jsonl'), eventos: join(dir, 'eventos.jsonl'), estado: join(dir, 'estado.json') };
  if (sql.vacia.get().n === 0 && Object.values(archivos).some(f => existsSync(f))) {
    const viejas = await leerJsonl(archivos.solicitudes);
    for (const s of viejas) if (!s.id) s.id = createHash('sha1').update(`${s.fecha}|${s.whatsapp}|${s.tipo}`).digest('hex').slice(0, 16);
    const eventos = await leerJsonl(archivos.eventos);
    let estado = {};
    try { estado = JSON.parse(await readFile(archivos.estado, 'utf8')); } catch { /* no había */ }
    db.transaction(() => {
      for (const s of viejas) sql.insSolicitud.run(filaSolicitud(s));
      insertarEventos(eventos);
      for (const [id, cambios] of Object.entries(estado)) if (sql.una.get(id)) actualizarSync(id, cambios);
    })();
    for (const f of Object.values(archivos)) if (existsSync(f)) await rename(f, `${f}.migrado`);
    console.log(`[empieza] Migrado a SQLite: ${viejas.length} solicitudes y ${eventos.length} eventos`);
  }

  return {
    ruta,
    /** Todas las solicitudes (son pocas: una por persona que deja su WhatsApp). */
    solicitudes: () => sql.todas.all().map(aSolicitud),
    solicitud: id => {
      const f = sql.una.get(id);
      return f ? aSolicitud(f) : null;
    },
    solicitudesEntre: (desde, hasta) => sql.entre.all(desde, hasta).map(aSolicitud),
    reservas: () => sql.reservas.all().map(aSolicitud),
    /** Mapa id -> seguimiento (estado, notas, cambios de cita, aviso). */
    estado: () => Object.fromEntries(sql.seguimiento.all().map(f => [f.id, aSeguimiento(f)])),
    eventosEntre: (desde, hasta) => sql.eventosEntre.all(desde, hasta).map(aEvento),
    eventosPagina: ({ desde, hasta, nombre = null, limite, pagina }) => ({
      total: sql.contar.get({ desde, hasta, nombre }).n,
      items: sql.pagina.all({ desde, hasta, nombre, limite, desplazamiento: (pagina - 1) * limite }).map(aEvento),
    }),
    async agregarSolicitud(datos) {
      const s = { id: randomUUID(), ...datos };
      sql.insSolicitud.run(filaSolicitud(s));
      return s;
    },
    async agregarEventos(lista) {
      if (lista.length) insertarEventos(lista);
    },
    async actualizar(id, cambios) {
      return actualizarSync(id, cambios);
    },
    /** Copia consistente de la base (sin parar el servidor) en respaldos/, guarda las últimas "dias". */
    async respaldar(dias = 14) {
      const carpeta = join(dir, 'respaldos');
      await mkdir(carpeta, { recursive: true });
      const nombre = `empieza-${new Date().toISOString().slice(0, 10)}.db`;
      await db.backup(join(carpeta, nombre));
      const viejos = (await readdir(carpeta)).filter(f => /^empieza-\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort().slice(0, -dias);
      for (const f of viejos) await unlink(join(carpeta, f));
      return nombre;
    },
    cerrar: () => db.close(),
  };
}
