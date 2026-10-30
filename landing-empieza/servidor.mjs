// Servidor de empieza.smartbiz.com.uy: sirve dist/ y recibe las solicitudes
// del formulario en POST /api/solicitud, que llegan por correo al dueño.
//
//   node landing-empieza/servidor.mjs          (puerto 4100 por defecto)
//
// Usa el mismo SMTP que HeraWallet (SMTP_HOST, SMTP_PORT, SMTP_USER,
// SMTP_PASS, SMTP_FROM del .env de la raíz del repo). Cada solicitud se guarda
// además en solicitudes/solicitudes.jsonl, así ninguna se pierde si el correo
// falla.

import { createServer } from 'node:http';
import { readFile, stat, mkdir, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarSolicitud, construirCorreo } from './solicitud.mjs';

const raiz = dirname(fileURLToPath(import.meta.url));
const dist = join(raiz, 'dist');

// .env: primero el de la landing (si existe), luego el de la raíz del repo.
try {
  const dotenv = await import('dotenv');
  for (const f of [join(raiz, '.env'), join(raiz, '..', '.env')]) if (existsSync(f)) dotenv.config({ path: f });
} catch { /* sin dotenv: se usan las variables del entorno */ }

const PUERTO = Number(process.env.EMPIEZA_PUERTO || 4100);
const DESTINO = process.env.EMPIEZA_CORREO_DESTINO || 'jcksparrow0209@gmail.com';
const RESPALDO = join(raiz, 'solicitudes', 'solicitudes.jsonl');

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
};
const comprimibles = new Set(['.html', '.css', '.js', '.json', '.svg', '.txt', '.xml']);

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
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
  };
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

async function recibirSolicitud(req, res) {
  const json = (estado, obj) => responder(res, estado, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (!permitido(ip)) return json(429, { ok: false, error: 'Demasiados envíos. Prueba en unos minutos.' });

  let cuerpo;
  try {
    cuerpo = await leerJson(req);
  } catch {
    return json(400, { ok: false, error: 'Formato inválido' });
  }
  const v = validarSolicitud(cuerpo);
  if (!v.ok) return json(400, { ok: false, error: v.error });
  // A un bot se le responde igual que a una persona, pero no se envía nada.
  if (v.bot) return json(200, { ok: true });

  const fecha = new Date();
  try {
    await mkdir(dirname(RESPALDO), { recursive: true });
    await appendFile(RESPALDO, JSON.stringify({ fecha: fecha.toISOString(), ip, ...v.datos }) + '\n');
  } catch (err) {
    console.error('[empieza] No se pudo guardar el respaldo:', err.message);
  }

  const t = await correo().catch(err => (console.error('[empieza] SMTP:', err.message), null));
  if (!t) {
    console.warn('[empieza] SMTP sin configurar: la solicitud quedó solo en', RESPALDO);
    return json(200, { ok: true, correo: false });
  }
  const { asunto, plano, html } = construirCorreo(v.datos, fecha);
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM ? process.env.SMTP_FROM.replace(/^[^<]*</, 'SmartBusiness Empieza <') : `SmartBusiness Empieza <${process.env.SMTP_USER}>`,
      to: DESTINO,
      subject: asunto,
      text: plano,
      html,
    });
    console.log(`[empieza] ${v.datos.tipo} de ${v.datos.nombre} enviada a ${DESTINO}`);
    return json(200, { ok: true, correo: true });
  } catch (err) {
    console.error('[empieza] Falló el envío del correo:', err.message);
    return json(200, { ok: true, correo: false });
  }
}

const servidor = createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://x');
    if (pathname === '/api/solicitud') {
      if (req.method !== 'POST') return responder(res, 405, '', { Allow: 'POST' });
      return await recibirSolicitud(req, res);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return responder(res, 405, '', { Allow: 'GET, HEAD' });
    await servirArchivo(req, res);
  } catch (err) {
    console.error('[empieza]', err);
    if (!res.headersSent) responder(res, 500, 'Error interno');
  }
});

if (!existsSync(join(dist, 'index.html'))) console.warn('[empieza] Falta dist/: ejecuta antes node landing-empieza/build.mjs');
servidor.listen(PUERTO, () => console.log(`[empieza] Escuchando en http://localhost:${PUERTO} · solicitudes a ${DESTINO}`));
