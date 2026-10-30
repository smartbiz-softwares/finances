// Panel de métricas y API para el masterpanel.
//
//   POST /api/panel/entrar   { clave }  -> cookie de sesión (12 h)
//   POST /api/panel/salir
//   /api/v1/*                datos, con la cookie del panel o con
//                            "Authorization: Bearer <EMPIEZA_API_KEY>"
//   GET  /api/v1/openapi.json  la especificación (pública, sin datos)
//
// La cookie es HttpOnly y SameSite=Strict, y los cambios hechos con ella
// exigen además la cabecera X-Panel (protección contra CSRF).

import { createHmac, timingSafeEqual } from 'node:crypto';
import { analizar, NOMBRES_EVENTOS } from './telemetria.mjs';
import { vistaSolicitud, listarReservas, ESTADOS_SOLICITUD, ESTADOS_RESERVA } from './reservas.mjs';
import { diaEn, aUtc } from './zona.mjs';

const COOKIE = 'sb_panel';
const DURACION = 12 * 3600e3;

function igual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

const cookies = req => Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(([k]) => k).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));

export function crearPanel({ almacen, zona, clave, apiKey, secreto, origenes = [], horasAviso = 5, json, leerJson, ip }) {
  const firmar = exp => createHmac('sha256', secreto).update(`panel.${exp}`).digest('base64url');
  const sesionValida = req => {
    const v = cookies(req)[COOKIE];
    if (!v) return false;
    const [exp, firma] = v.split('.');
    return Number(exp) > Date.now() && igual(firma, firmar(exp));
  };
  const porApiKey = req => {
    const m = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '');
    return Boolean(apiKey && m && igual(m[1].trim(), apiKey));
  };

  // Límite de intentos de contraseña: 10 cada 15 minutos por IP.
  const intentos = new Map();
  const puedeIntentar = dir => {
    const ahora = Date.now();
    const l = (intentos.get(dir) || []).filter(t => ahora - t < 15 * 60e3);
    intentos.set(dir, l);
    return l.length < 10;
  };

  // --- Utilidades de consulta ---------------------------------------------------------
  const rango = q => {
    const hoy = diaEn(new Date(), zona);
    const aInstante = (dia, fin) => {
      const [y, m, d] = dia.split('-').map(Number);
      return aUtc(y, m, d + (fin ? 1 : 0), 0, 0, zona).toISOString();
    };
    const valido = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '');
    const hasta = valido(q.get('hasta')) ? q.get('hasta') : hoy;
    let desde = q.get('desde');
    if (!valido(desde)) {
      const dias = Math.min(Math.max(Number(q.get('dias')) || 30, 1), 730);
      const [y, m, d] = hasta.split('-').map(Number);
      desde = new Date(Date.UTC(y, m - 1, d - dias + 1)).toISOString().slice(0, 10);
    }
    return { desde: aInstante(desde, false), hasta: aInstante(hasta, true), desdeDia: desde, hastaDia: hasta };
  };
  const paginar = (lista, q) => {
    const limite = Math.min(Math.max(Number(q.get('limite')) || 50, 1), 500);
    const pagina = Math.max(Number(q.get('pagina')) || 1, 1);
    return { total: lista.length, pagina, limite, items: lista.slice((pagina - 1) * limite, pagina * limite) };
  };
  const solicitudesVistas = (desde, hasta) => {
    const estado = almacen.estado();
    return almacen.solicitudesEntre(desde, hasta).map(s => vistaSolicitud(s, estado));
  };
  const filtrarSolicitudes = q => {
    const { desde, hasta } = rango(q);
    const tipo = q.get('tipo');
    const estado = q.get('estado');
    const texto = (q.get('q') || '').toLowerCase();
    return solicitudesVistas(desde, hasta)
      .filter(s => !tipo || s.tipo === tipo)
      .filter(s => !estado || s.estado === estado || s.estadoReserva === estado)
      .filter(s => !texto || JSON.stringify([s.nombre, s.negocio, s.telefono, s.ciudad, s.respuestas, s.notas]).toLowerCase().includes(texto))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  };

  const csv = lista => {
    const preguntas = [...new Set(lista.flatMap(s => (s.respuestas || []).map(r => r.pregunta)))];
    const cols = ['fecha', 'tipo', 'estado', 'nombre', 'telefono', 'negocio', 'ciudad', 'tamano', 'dia', 'hora', 'estadoReserva', 'notas', ...preguntas];
    const celda = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const filas = lista.map(s => {
      const r = Object.fromEntries((s.respuestas || []).map(x => [x.pregunta, x.respuesta]));
      return cols.map(c => celda(c in r ? r[c] : s[c])).join(',');
    });
    return '﻿' + [cols.map(celda).join(','), ...filas].join('\n');
  };

  // --- CORS para el masterpanel ---------------------------------------------------------
  const cors = (req, res) => {
    const origen = req.headers.origin;
    if (origen && origenes.includes(origen)) {
      res.setHeader('Access-Control-Allow-Origin', origen);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
      res.setHeader('Access-Control-Max-Age', '600');
    }
  };

  // --- Rutas ---------------------------------------------------------------------------
  return async function manejar(req, res, url) {
    const ruta = url.pathname;
    if (!ruta.startsWith('/api/panel/') && !ruta.startsWith('/api/v1/')) return false;
    cors(req, res);
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return true; }

    if (ruta === '/api/v1/openapi.json') return json(res, 200, openapi()), true;
    if (!clave && !apiKey) return json(res, 503, { error: 'Panel desactivado: configura EMPIEZA_PANEL_CLAVE en el .env' }), true;

    if (ruta === '/api/panel/entrar' && req.method === 'POST') {
      const dir = ip(req);
      if (!puedeIntentar(dir)) return json(res, 429, { error: 'Demasiados intentos. Prueba en 15 minutos.' }), true;
      let cuerpo;
      try { cuerpo = await leerJson(req, 2048); } catch { return json(res, 400, { error: 'Formato inválido' }), true; }
      if (!clave || !igual(cuerpo?.clave || '', clave)) {
        intentos.get(dir).push(Date.now());
        return json(res, 401, { error: 'Contraseña incorrecta' }), true;
      }
      const exp = Date.now() + DURACION;
      const seguro = req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted ? '; Secure' : '';
      res.setHeader('Set-Cookie', `${COOKIE}=${exp}.${firmar(exp)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${DURACION / 1000}${seguro}`);
      return json(res, 200, { ok: true }), true;
    }
    if (ruta === '/api/panel/salir' && req.method === 'POST') {
      res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
      return json(res, 200, { ok: true }), true;
    }

    const conCookie = sesionValida(req);
    const conClave = porApiKey(req);
    if (!conCookie && !conClave) return json(res, 401, { error: 'No autorizado' }), true;
    if (req.method === 'PATCH' && conCookie && !conClave && req.headers['x-panel'] !== '1') return json(res, 403, { error: 'Falta la cabecera X-Panel' }), true;

    const q = url.searchParams;
    const m = ruta.match(/^\/api\/v1\/(solicitudes|reservas)\/([\w-]{8,64})$/);

    if (ruta === '/api/v1/sesion') return json(res, 200, { ok: true, zona, horasAviso, estadosSolicitud: ESTADOS_SOLICITUD, estadosReserva: ESTADOS_RESERVA }), true;

    if (ruta === '/api/v1/resumen' && req.method === 'GET') {
      const r = rango(q);
      // Se lee también el período anterior, para la comparación.
      const antes = new Date(2 * Date.parse(r.desde) - Date.parse(r.hasta)).toISOString();
      return json(res, 200, analizar({ eventos: almacen.eventosEntre(antes, r.hasta), solicitudes: almacen.solicitudesEntre(antes, r.hasta), desde: r.desde, hasta: r.hasta, zona })), true;
    }

    if (ruta === '/api/v1/solicitudes' && req.method === 'GET') return json(res, 200, paginar(filtrarSolicitudes(q), q)), true;

    if (ruta === '/api/v1/reservas' && req.method === 'GET') {
      // Sin fechas: todas las reservas. Con fechas: las que caen en ese rango.
      const todas = listarReservas(almacen.reservas(), almacen.estado(), zona);
      const r = q.has('desde') || q.has('dias') || q.has('hasta') ? rango(q) : null;
      const lista = r ? todas.filter(x => x.inicio >= r.desde && x.inicio < r.hasta) : todas;
      return json(res, 200, { total: lista.length, items: lista }), true;
    }

    if (m && req.method === 'GET') {
      const s = almacen.solicitud(m[2]);
      if (!s) return json(res, 404, { error: 'No existe' }), true;
      const estado = almacen.estado();
      const v = m[1] === 'reservas' ? listarReservas([s], estado, zona)[0] : vistaSolicitud(s, estado);
      return json(res, 200, v || vistaSolicitud(s, estado)), true;
    }

    if (m && req.method === 'PATCH') {
      const s = almacen.solicitud(m[2]);
      if (!s) return json(res, 404, { error: 'No existe' }), true;
      let cuerpo;
      try { cuerpo = await leerJson(req, 8192); } catch { return json(res, 400, { error: 'Formato inválido' }), true; }
      const cambios = {};
      if (typeof cuerpo.notas === 'string') cambios.notas = cuerpo.notas.slice(0, 2000);
      if (m[1] === 'solicitudes' && cuerpo.estado !== undefined) {
        if (!ESTADOS_SOLICITUD.includes(cuerpo.estado)) return json(res, 400, { error: `estado: ${ESTADOS_SOLICITUD.join(', ')}` }), true;
        cambios.estado = cuerpo.estado;
      }
      if (m[1] === 'reservas') {
        if (s.tipo !== 'reserva') return json(res, 400, { error: 'No es una reserva' }), true;
        if (cuerpo.estado !== undefined) {
          if (!ESTADOS_RESERVA.includes(cuerpo.estado)) return json(res, 400, { error: `estado: ${ESTADOS_RESERVA.join(', ')}` }), true;
          cambios.estadoReserva = cuerpo.estado;
        }
        const nuevoDia = cuerpo.dia !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(cuerpo.dia);
        const nuevaHora = cuerpo.hora !== undefined && /^([01]\d|2[0-3]):[0-5]\d$/.test(cuerpo.hora);
        if ((cuerpo.dia !== undefined && !nuevoDia) || (cuerpo.hora !== undefined && !nuevaHora)) return json(res, 400, { error: 'dia AAAA-MM-DD y hora HH:MM' }), true;
        if (nuevoDia) cambios.dia = cuerpo.dia;
        if (nuevaHora) cambios.hora = cuerpo.hora;
        // Si cambia la cita, el aviso se vuelve a programar para la nueva hora.
        if (nuevoDia || nuevaHora) cambios.avisoEnviado = null;
      }
      await almacen.actualizar(s.id, cambios);
      const estado = almacen.estado();
      const v = m[1] === 'reservas' ? listarReservas([s], estado, zona)[0] : vistaSolicitud(s, estado);
      return json(res, 200, v), true;
    }

    if (ruta === '/api/v1/eventos' && req.method === 'GET') {
      const r = rango(q);
      const limite = Math.min(Math.max(Number(q.get('limite')) || 50, 1), 500);
      const pagina = Math.max(Number(q.get('pagina')) || 1, 1);
      const { total, items } = almacen.eventosPagina({ desde: r.desde, hasta: r.hasta, nombre: q.get('nombre') || null, limite, pagina });
      return json(res, 200, { total, pagina, limite, items }), true;
    }

    if (ruta === '/api/v1/exportar/solicitudes.csv' && req.method === 'GET') {
      const r = rango(q);
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="solicitudes-${r.desdeDia}-a-${r.hastaDia}.csv"`, 'Cache-Control': 'no-store' });
      res.end(csv(filtrarSolicitudes(q)));
      return true;
    }

    return json(res, 404, { error: 'Ruta desconocida. Ver /api/v1/openapi.json' }), true;
  };
}

// --- Especificación OpenAPI -------------------------------------------------------------

function openapi() {
  const rangoParams = [
    { name: 'desde', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Día inicial (AAAA-MM-DD, hora del negocio).' },
    { name: 'hasta', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Día final, incluido. Por defecto, hoy.' },
    { name: 'dias', in: 'query', schema: { type: 'integer', default: 30 }, description: 'Si no hay "desde": cuántos días hacia atrás.' },
  ];
  const pag = [
    { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
    { name: 'limite', in: 'query', schema: { type: 'integer', default: 50, maximum: 500 } },
  ];
  const id = { name: 'id', in: 'path', required: true, schema: { type: 'string' } };
  return {
    openapi: '3.1.0',
    info: { title: 'SmartBusiness · Empieza · API', version: '1.0.0', description: 'Métricas, solicitudes, reservas y telemetría de empieza.smartbiz.com.uy. Autenticación: cabecera Authorization: Bearer <EMPIEZA_API_KEY>.' },
    servers: [{ url: '/' }],
    components: { securitySchemes: { clave: { type: 'http', scheme: 'bearer' } } },
    security: [{ clave: [] }],
    paths: {
      '/api/v1/resumen': { get: { summary: 'Métricas del período: totales, comparación con el período anterior, serie diaria, embudo, abandono por pregunta, fuentes, dispositivos, páginas, respuestas del formulario, horas de actividad, calculadora, búsquedas y demo.', parameters: rangoParams } },
      '/api/v1/solicitudes': { get: { summary: 'Solicitudes (formulario y reservas) con su estado y notas.', parameters: [...rangoParams, ...pag, { name: 'tipo', in: 'query', schema: { enum: ['formulario', 'reserva'] } }, { name: 'estado', in: 'query', schema: { type: 'string' } }, { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Busca en nombre, negocio, teléfono, respuestas y notas.' }] } },
      '/api/v1/solicitudes/{id}': {
        get: { summary: 'Una solicitud.', parameters: [id] },
        patch: { summary: 'Cambia estado o notas.', parameters: [id], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { estado: { enum: ESTADOS_SOLICITUD }, notas: { type: 'string' } } } } } } },
      },
      '/api/v1/reservas': { get: { summary: 'Reservas con su inicio (UTC), día y hora del negocio y estado. Sin parámetros: todas.', parameters: rangoParams } },
      '/api/v1/reservas/{id}': {
        get: { summary: 'Una reserva.', parameters: [id] },
        patch: { summary: 'Cambia estado, día, hora o notas. Cambiar la cita reprograma el aviso por correo.', parameters: [id], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { estado: { enum: ESTADOS_RESERVA }, dia: { type: 'string', format: 'date' }, hora: { type: 'string', pattern: '^\\d{2}:\\d{2}$' }, notas: { type: 'string' } } } } } } },
      },
      '/api/v1/eventos': { get: { summary: 'Eventos de telemetría crudos, del más nuevo al más viejo.', parameters: [...rangoParams, ...pag, { name: 'nombre', in: 'query', schema: { enum: NOMBRES_EVENTOS } }] } },
      '/api/v1/exportar/solicitudes.csv': { get: { summary: 'Solicitudes del período en CSV (una columna por pregunta).', parameters: [...rangoParams, { name: 'tipo', in: 'query', schema: { enum: ['formulario', 'reserva'] } }] } },
    },
  };
}
