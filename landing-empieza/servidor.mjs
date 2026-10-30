// Servidor de empieza.smartbiz.com.uy:
//   - sirve dist/ (la landing compilada) y el panel en /panel
//   - POST /api/solicitud  recibe el formulario y las reservas (y avisa por correo)
//   - POST /api/t          recibe la telemetría anónima de la página
//   - /api/v1/*            API del panel y del masterpanel (ver servidor/panel.mjs)
//   - cada minuto revisa las citas y avisa por correo unas horas antes
//
//   node landing-empieza/servidor.mjs          (puerto 4100 por defecto)
//
// Usa el mismo SMTP que HeraWallet (SMTP_HOST, SMTP_PORT, SMTP_USER,
// SMTP_PASS, SMTP_FROM). Todo se guarda en solicitudes/ (fuera de git), así
// ninguna solicitud se pierde aunque falle el correo.

import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { randomBytes } from 'node:crypto';
import { dirname, join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarSolicitud, construirCorreo } from './solicitud.mjs';
import { crearAlmacen } from './servidor/almacen.mjs';
import { validarEventos } from './servidor/telemetria.mjs';
import { crearPanel } from './servidor/panel.mjs';
import { listarReservas, citasPorAvisar, correoRecordatorio } from './servidor/reservas.mjs';
import { config } from './src/config.mjs';

const raiz = dirname(fileURLToPath(import.meta.url));
const dist = join(raiz, 'dist');


// .env: primero el de la landing (si existe), luego el de la raíz del repo.
try {
  const dotenv = await import('dotenv');
  for (const f of [join(raiz, '.env'), join(raiz, '..', '.env')]) if (existsSync(f)) dotenv.config({ path: f });
} catch { /* sin dotenv: se usan las variables del entorno */ }

// Carpeta de datos (por defecto solicitudes/, fuera de git).
const datos = process.env.EMPIEZA_DATOS || join(raiz, 'solicitudes');
const PUERTO = Number(process.env.EMPIEZA_PUERTO || 4100);
const DESTINO = process.env.EMPIEZA_CORREO_DESTINO || 'jcksparrow0209@gmail.com';
const HORAS_AVISO = Number(process.env.EMPIEZA_AVISO_HORAS || 5);
const ZONA = config.agenda.zonaHoraria;

const almacen = await crearAlmacen(datos);

// Secreto que firma la sesión del panel: del .env, o uno aleatorio guardado.
async function secretoPanel() {
  if (process.env.EMPIEZA_PANEL_SECRETO) return process.env.EMPIEZA_PANEL_SECRETO;
  const f = join(datos, '.secreto-panel');
  try { return (await readFile(f, 'utf8')).trim(); } catch { /* se crea */ }
  const s = randomBytes(32).toString('hex');
  await writeFile(f, s, { mode: 0o600 });
  return s;
}

let transporte = null;
async function correo() {
  if (transporte) return transporte;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const { default: nodemailer } = await import('nodemailer');
  transporte = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT || 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporte;
}

const ipDe = req => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
const remitente = () => (process.env.SMTP_FROM ? process.env.SMTP_FROM.replace(/^[^<]*</, 'SmartBusiness Empieza <') : `SmartBusiness Empieza <${process.env.SMTP_USER}>`);

// Límite por IP: 8 envíos cada 10 minutos alcanzan para una persona que
// rellena el formulario y reserva; frenan a quien lo use para mandar spam.
const VENTANA = 10 * 60e3, MAXIMO = 8;
const envios = new Map();
function permitido(ip) {
  const ahora = Date.now();
  const lista = (envios.get(ip) || []).filter(t => ahora - t < VENTANA);
  if (lista.length >= MAXIMO) return false;
  lista.push(ahora);
  envios.set(ip, lista);
  return true;
}
setInterval(() => {
  const ahora = Date.now();
  for (const [ip, lista] of envios) if (!lista.some(t => ahora - t < VENTANA)) envios.delete(ip);
}, VENTANA).unref();

// Telemetría: hasta 120 lotes por minuto e IP (una persona navegando manda pocos).
const lotes = new Map();
function permitidoLote(ip) {
  const ahora = Date.now();
  const l = (lotes.get(ip) || []).filter(t => ahora - t < 60e3);
  if (l.length >= 120) return false;
  l.push(ahora);
  lotes.set(ip, l);
  return true;
}
setInterval(() => lotes.clear(), 10 * 60e3).unref();

const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};
const comprimibles = new Set(['.html', '.css', '.js', '.json', '.svg', '.txt', '.xml', '.md']);

const cabecerasSeguras = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://i.ytimg.com; frame-src https://www.youtube-nocookie.com; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
};

function responder(res, estado, cuerpo, cabeceras = {}) {
  res.writeHead(estado, { ...cabecerasSeguras, ...cabeceras });
  res.end(cuerpo);
}

async function servirArchivo(req, res) {
  const url = new URL(req.url, 'http://x');
  let ruta = decodeURIComponent(url.pathname);
  const seguro = normalize(ruta).replace(/^(\.\.[/\\])+/, '');
  let archivo = join(dist, seguro);
  if (!archivo.startsWith(dist)) return responder(res, 403, 'Prohibido');

  let info = await stat(archivo).catch(() => null);
  if (info?.isDirectory()) {
    if (!ruta.endsWith('/')) return responder(res, 301, '', { Location: `${ruta}/${url.search}` });
    archivo = join(archivo, 'index.html');
    info = await stat(archivo).catch(() => null);
  }
  let estado = 200;
  if (!info) {
    estado = 404;
    archivo = join(dist, '404.html');
  }
  const ext = extname(archivo);
  let cuerpo = await readFile(archivo);
  const cabeceras = {
    'Content-Type': tipos[ext] || 'application/octet-stream',
    // Los archivos versionados (?v=hash) no cambian nunca: se guardan un año.
    'Cache-Control': ext === '.html' || ext === '.md' ? 'no-cache' : url.searchParams.has('v') ? 'public, max-age=31536000, immutable' : 'public, max-age=86400',
  };
  if (ruta.startsWith('/panel')) {
    cabeceras['X-Robots-Tag'] = 'noindex, nofollow';
    cabeceras['Cache-Control'] = 'no-cache';
  }
  if (comprimibles.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    cuerpo = gzipSync(cuerpo);
    cabeceras['Content-Encoding'] = 'gzip';
    cabeceras.Vary = 'Accept-Encoding';
  }
  responder(res, estado, req.method === 'HEAD' ? '' : cuerpo, cabeceras);
}

async function leerJson(req, limite = 32 * 1024) {
  let total = 0;
  const partes = [];
  for await (const parte of req) {
    total += parte.length;
    if (total > limite) throw new Error('Demasiado grande');
    partes.push(parte);
  }
  return JSON.parse(Buffer.concat(partes).toString('utf8'));
}

const json = (res, estado, obj) => responder(res, estado, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });

async function enviarCorreo({ asunto, plano, html }) {
  const t = await correo().catch(err => (console.error('[empieza] SMTP:', err.message), null));
  if (!t) return false;
  try {
    await t.sendMail({ from: remitente(), to: DESTINO, subject: asunto, text: plano, html });
    return true;
  } catch (err) {
    console.error('[empieza] Falló el envío del correo:', err.message);
    return false;
  }
}

async function recibirSolicitud(req, res) {
  const ip = ipDe(req);
  if (!permitido(ip)) return json(res, 429, { ok: false, error: 'Demasiados envíos. Prueba en unos minutos.' });
  let cuerpo;
  try {
    cuerpo = await leerJson(req);
  } catch {
    return json(res, 400, { ok: false, error: 'Formato inválido' });
  }
  const v = validarSolicitud(cuerpo);
  if (!v.ok) return json(res, 400, { ok: false, error: v.error });
  // A un bot se le responde igual que a una persona, pero no se guarda nada.
  if (v.bot) return json(res, 200, { ok: true });

  const fecha = new Date();
  let guardada;
  try {
    guardada = await almacen.agregarSolicitud({ fecha: fecha.toISOString(), ...v.datos });
  } catch (err) {
    console.error('[empieza] No se pudo guardar la solicitud:', err.message);
  }
  const enviado = await enviarCorreo(construirCorreo(v.datos, fecha));
  if (enviado) console.log(`[empieza] ${v.datos.tipo} de ${v.datos.nombre} enviada a ${DESTINO}`);
  else console.warn('[empieza] Sin correo: la solicitud quedó guardada en solicitudes/');
  return json(res, 200, { ok: true, correo: enviado, id: guardada?.id });
}

async function recibirTelemetria(req, res) {
  if (!permitidoLote(ipDe(req))) return responder(res, 204, '');
  let cuerpo;
  try { cuerpo = await leerJson(req, 16 * 1024); } catch { return responder(res, 204, ''); }
  await almacen.agregarEventos(validarEventos(cuerpo)).catch(err => console.error('[empieza] Telemetría:', err.message));
  responder(res, 204, '');
}

// Avisos de cita: cada minuto, las que entran en la ventana de HORAS_AVISO.
const PANEL_URL = `${config.dominio}/panel/#calendario`;
let revisando = false;
async function revisarCitas() {
  if (revisando) return;
  revisando = true;
  try {
    const reservas = listarReservas(almacen.solicitudes, almacen.estado, ZONA);
    for (const r of citasPorAvisar(reservas, new Date(), HORAS_AVISO)) {
      if (await enviarCorreo(correoRecordatorio(r, HORAS_AVISO, PANEL_URL))) {
        await almacen.actualizar(r.id, { avisoEnviado: new Date().toISOString() });
        console.log(`[empieza] Aviso enviado: cita con ${r.nombre} el ${r.dia} ${r.hora}`);
      }
    }
  } finally {
    revisando = false;
  }
}
setInterval(revisarCitas, 60e3).unref();
setTimeout(revisarCitas, 5e3).unref();

const panel = crearPanel({
  almacen,
  zona: ZONA,
  clave: process.env.EMPIEZA_PANEL_CLAVE || '',
  apiKey: process.env.EMPIEZA_API_KEY || '',
  secreto: await secretoPanel(),
  horasAviso: HORAS_AVISO,
  origenes: String(process.env.EMPIEZA_API_ORIGENES || '').split(',').map(o => o.trim()).filter(Boolean),
  json,
  leerJson,
  ip: ipDe,
});

const servidor = createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://x');
    if (pathname === '/api/solicitud') {
      if (req.method !== 'POST') return responder(res, 405, '', { Allow: 'POST' });
      return await recibirSolicitud(req, res);
    }
    if (pathname === '/api/t') {
      if (req.method !== 'POST') return responder(res, 405, '', { Allow: 'POST' });
      return await recibirTelemetria(req, res);
    }
    if (await panel(req, res, new URL(req.url, 'http://x'))) return;
    if (req.method !== 'GET' && req.method !== 'HEAD') return responder(res, 405, '', { Allow: 'GET, HEAD' });
    await servirArchivo(req, res);
  } catch (err) {
    console.error('[empieza]', err);
    if (!res.headersSent) responder(res, 500, 'Error interno');
  }
});

if (!existsSync(join(dist, 'index.html'))) console.warn('[empieza] Falta dist/: ejecuta antes node landing-empieza/build.mjs');
servidor.listen(PUERTO, () => {
  console.log(`[empieza] Escuchando en http://localhost:${PUERTO} · solicitudes a ${DESTINO}`);
  console.log(`[empieza] Panel: http://localhost:${PUERTO}/panel/ ${process.env.EMPIEZA_PANEL_CLAVE ? '' : '(desactivado: falta EMPIEZA_PANEL_CLAVE)'}`);
});
