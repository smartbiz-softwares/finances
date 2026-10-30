// Telemetría anónima de la landing: qué eventos se aceptan y cómo se resumen.
//
// Privacidad: nada de cookies de seguimiento ni datos personales. El navegador
// manda un id de visitante y otro de sesión, aleatorios y sin relación con la
// persona; las respuestas viajan como claves de opción (nunca el nombre, el
// teléfono ni lo que se escribe a mano). La IP no se guarda en los eventos.

import { diaEn, partesEn } from './zona.mjs';

const txt = (v, max = 120) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : undefined);
const num = v => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) / 100 : undefined);
const clave = v => (typeof v === 'string' && /^[\w\-+<.,áéíóúñ ]{1,60}$/i.test(v) ? v : undefined);

// Cada evento y las propiedades que puede llevar.
const ESQUEMA = {
  vista: { ruta: txt, ref: txt, fuente: txt, medio: txt, campana: txt, disp: clave, ancho: num },
  empezar: { origen: clave },
  paso: { paso: clave, n: num },
  respuesta: { paso: clave, valor: v => (Array.isArray(v) ? v.slice(0, 12).map(clave).filter(Boolean) : clave(v)) },
  resultado: { tamano: clave },
  camino: { camino: clave },
  reserva: {},
  whatsapp: { origen: clave },
  calculadora: { total: num },
  faq: { q: v => txt(v, 60) },
  demo: { accion: clave },
  scroll: { pct: num },
  cerrar: { paso: clave },
};
export const NOMBRES_EVENTOS = Object.keys(ESQUEMA);
// Pasos con texto libre: nunca se registra lo que se escribió.
const PASOS_LIBRES = new Set(['nombre', 'sistemaActual', 'contacto']);
const ID = /^[a-z0-9]{8,32}$/;

/** Limpia un lote del navegador. Devuelve solo los eventos válidos, con la hora del servidor. */
export function validarEventos(cuerpo, ahora = new Date()) {
  const lista = Array.isArray(cuerpo?.eventos) ? cuerpo.eventos.slice(0, 50) : [];
  const limpios = [];
  for (const e of lista) {
    const esquema = ESQUEMA[e?.e];
    if (!esquema || !ID.test(e.s || '') || !ID.test(e.v || '')) continue;
    const d = {};
    for (const [k, f] of Object.entries(esquema)) {
      const v = f(e.d?.[k]);
      if (v !== undefined && !(Array.isArray(v) && !v.length)) d[k] = v;
    }
    if (e.e === 'respuesta' && PASOS_LIBRES.has(d.paso)) continue;
    limpios.push({ f: ahora.toISOString(), e: e.e, s: e.s, v: e.v, r: txt(e.r, 200) || '/', d });
  }
  return limpios;
}

// --- Resúmenes ----------------------------------------------------------------------

const contar = (lista, f) => {
  const m = new Map();
  for (const x of lista) for (const k of [].concat(f(x) ?? [])) if (k != null && k !== '') m.set(k, (m.get(k) || 0) + 1);
  return [...m].map(([nombre, n]) => ({ nombre, n })).sort((a, b) => b.n - a.n);
};
const mediana = xs => {
  if (!xs.length) return 0;
  const o = [...xs].sort((a, b) => a - b);
  const m = o.length >> 1;
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
};
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const enRango = (iso, desde, hasta) => iso >= desde && iso < hasta;

// Etapas del embudo, en el orden en que las vive una persona.
const ETAPAS = [
  ['visito', 'Visitó la página', e => e.e === 'vista'],
  ['empezo', 'Tocó Empezar', e => e.e === 'empezar'],
  ['respondio', 'Respondió la primera pregunta', e => e.e === 'respuesta'],
  ['reviso', 'Llegó a la revisión', e => e.e === 'paso' && e.d.paso === 'revisar'],
  ['envio', 'Dejó su WhatsApp', e => e.e === 'resultado'],
  ['eligio', 'Eligió cómo seguir', e => e.e === 'camino'],
  ['reservo', 'Reservó una sesión', e => e.e === 'reserva'],
];

function totales(eventos, solicitudes) {
  const vistas = eventos.filter(e => e.e === 'vista');
  const sesiones = new Set(eventos.map(e => e.s));
  const visitantes = new Set(eventos.map(e => e.v));
  const formularios = solicitudes.filter(s => s.tipo === 'formulario');
  const reservas = solicitudes.filter(s => s.tipo === 'reserva');
  const empezaron = new Set(eventos.filter(e => e.e === 'empezar').map(e => e.s)).size;
  return {
    visitas: vistas.length,
    visitantes: visitantes.size,
    sesiones: sesiones.size,
    empezaron,
    solicitudes: formularios.length,
    reservas: reservas.length,
    whatsapp: eventos.filter(e => e.e === 'whatsapp').length,
    conversion: pct(formularios.length, visitantes.size),
    conversionFormulario: pct(new Set(eventos.filter(e => e.e === 'resultado').map(e => e.s)).size, empezaron),
  };
}

/**
 * Todo el análisis de un período. desde/hasta: ISO (hasta excluido).
 * Incluye el período anterior de igual duración para comparar.
 */
export function analizar({ eventos, solicitudes, desde, hasta, zona }) {
  const ev = eventos.filter(e => enRango(e.f, desde, hasta));
  const so = solicitudes.filter(s => enRango(s.fecha, desde, hasta));
  const dur = Date.parse(hasta) - Date.parse(desde);
  const antesDesde = new Date(Date.parse(desde) - dur).toISOString();
  const anterior = totales(
    eventos.filter(e => enRango(e.f, antesDesde, desde)),
    solicitudes.filter(s => enRango(s.fecha, antesDesde, desde)),
  );

  // Serie diaria (días del negocio, sin huecos).
  const dias = [];
  for (let t = Date.parse(desde); t < Date.parse(hasta) && dias.length < 400; t += 864e5) {
    const d = diaEn(new Date(t), zona);
    if (dias[dias.length - 1] !== d) dias.push(d);
  }
  const porDia = Object.fromEntries(dias.map(d => [d, { dia: d, visitas: 0, visitantes: new Set(), solicitudes: 0, reservas: 0 }]));
  for (const e of ev) {
    const x = porDia[diaEn(new Date(e.f), zona)];
    if (!x) continue;
    if (e.e === 'vista') x.visitas++;
    x.visitantes.add(e.v);
  }
  for (const s of so) {
    const x = porDia[diaEn(new Date(s.fecha), zona)];
    if (x) x[s.tipo === 'reserva' ? 'reservas' : 'solicitudes']++;
  }
  const serie = Object.values(porDia).map(x => ({ ...x, visitantes: x.visitantes.size }));

  // Embudo por sesión.
  const porSesion = new Map();
  for (const e of ev) {
    if (!porSesion.has(e.s)) porSesion.set(e.s, []);
    porSesion.get(e.s).push(e);
  }
  const embudo = ETAPAS.map(([id, nombre, f]) => {
    let n = 0;
    for (const lista of porSesion.values()) if (lista.some(f)) n++;
    return { id, nombre, sesiones: n };
  });
  embudo.forEach((x, i) => { x.dePrimera = pct(x.sesiones, embudo[0].sesiones); x.deAnterior = i ? pct(x.sesiones, embudo[i - 1].sesiones) : 100; });

  // Dónde se fue quien empezó y no terminó: la última pregunta que vio.
  const abandonos = [];
  for (const lista of porSesion.values()) {
    if (!lista.some(e => e.e === 'empezar') || lista.some(e => e.e === 'resultado')) continue;
    const pasos = lista.filter(e => e.e === 'paso');
    abandonos.push(pasos.length ? pasos[pasos.length - 1].d.paso : 'antes de la primera pregunta');
  }

  // De dónde llegan y con qué.
  const vistas = ev.filter(e => e.e === 'vista');
  const primeraVista = [...porSesion.values()].map(l => l.find(e => e.e === 'vista')).filter(Boolean);
  const fuente = e => e.d.fuente || (e.d.ref ? e.d.ref.replace(/^www\./, '') : 'Directo');

  // Actividad por hora y día de la semana (hora del negocio).
  const horas = Array.from({ length: 24 }, (_, h) => ({ hora: h, n: 0 }));
  const semana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(nombre => ({ nombre, n: 0 }));
  for (const e of vistas) {
    const p = partesEn(new Date(e.f), zona);
    horas[p.h].n++;
    semana[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()].n++;
  }

  // Respuestas del formulario (de las solicitudes: textos tal cual los vio la persona).
  const formularios = so.filter(s => s.tipo === 'formulario');
  const preguntas = new Map();
  for (const s of formularios) {
    for (const r of s.respuestas || []) {
      if (r.pregunta === 'Nombre' || r.pregunta === 'Sistema actual') continue;
      if (!preguntas.has(r.pregunta)) preguntas.set(r.pregunta, []);
      preguntas.get(r.pregunta).push(...(r.valores?.length ? r.valores : [r.respuesta]));
    }
  }
  const formulario = [...preguntas].map(([pregunta, valores]) => ({ pregunta, respuestas: contar(valores, v => v) }));

  const calc = ev.filter(e => e.e === 'calculadora' && e.d.total != null).map(e => e.d.total);
  const demo = contar(ev.filter(e => e.e === 'demo'), e => e.d.accion);

  return {
    periodo: { desde, hasta, zona },
    totales: totales(ev, so),
    anterior,
    serie,
    embudo,
    abandono: contar(abandonos, x => x),
    fuentes: contar(primeraVista, fuente).slice(0, 15),
    campanas: contar(primeraVista.filter(e => e.d.campana), e => e.d.campana).slice(0, 15),
    dispositivos: contar(primeraVista, e => e.d.disp || 'desconocido'),
    paginas: contar(vistas, e => e.d.ruta || e.r).slice(0, 25),
    entradas: contar(primeraVista, e => e.d.ruta || e.r).slice(0, 15),
    origenEmpezar: contar(ev.filter(e => e.e === 'empezar'), e => e.d.origen || 'otro'),
    origenWhatsapp: contar(ev.filter(e => e.e === 'whatsapp'), e => e.d.origen || 'otro'),
    caminos: contar(ev.filter(e => e.e === 'camino'), e => e.d.camino),
    tamanos: contar(formularios, s => s.tamano || 'Sin dato'),
    sectores: contar(formularios, s => s.respuestas?.find(r => r.pregunta === 'Sector')?.respuesta || 'Sin dato'),
    paises: contar(formularios, s => s.respuestas?.find(r => r.pregunta === 'País')?.respuesta || 'Sin dato'),
    formulario,
    horas,
    semana,
    calculadora: { usos: calc.length, promedio: calc.length ? Math.round(calc.reduce((a, b) => a + b, 0) / calc.length) : 0, mediana: Math.round(mediana(calc)) },
    busquedas: contar(ev.filter(e => e.e === 'faq' && e.d.q), e => e.d.q.toLowerCase()).slice(0, 20),
    demo: { reproducciones: demo.find(x => x.nombre === 'play')?.n || 0, completas: demo.find(x => x.nombre === 'fin')?.n || 0 },
    scroll: contar(ev.filter(e => e.e === 'scroll'), e => `${e.d.pct}%`),
  };
}
