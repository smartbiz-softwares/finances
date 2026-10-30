// Reservas y solicitudes con su estado actual (lo guardado + los cambios del
// panel), y los avisos por correo antes de cada cita.

import { inicioCita, hora12 } from './zona.mjs';

export const ESTADOS_SOLICITUD = ['nueva', 'contactada', 'cliente', 'descartada'];
export const ESTADOS_RESERVA = ['pendiente', 'confirmada', 'realizada', 'cancelada', 'no_asistio'];
const TERMINADAS = new Set(['realizada', 'cancelada', 'no_asistio']);

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Una solicitud tal como la ve el panel: datos originales + estado y notas. */
export function vistaSolicitud(s, estado) {
  const e = estado[s.id] || {};
  const v = { ...s, estado: e.estado || 'nueva', notas: e.notas || '' };
  if (s.tipo === 'reserva') {
    const dia = e.dia || s.reservaDia;
    const hora = e.hora || s.reservaHora;
    Object.assign(v, {
      estadoReserva: e.estadoReserva || 'pendiente',
      dia,
      hora,
      avisoEnviado: e.avisoEnviado || null,
    });
  }
  return v;
}

/** Reservas con fecha y hora, con su instante de inicio calculado en la zona del negocio. */
export function listarReservas(solicitudes, estado, zona) {
  return solicitudes
    .filter(s => s.tipo === 'reserva')
    .map(s => vistaSolicitud(s, estado))
    .filter(r => /^\d{4}-\d{2}-\d{2}$/.test(r.dia || '') && /^\d{2}:\d{2}$/.test(r.hora || ''))
    .map(r => ({ ...r, inicio: inicioCita(r.dia, r.hora, zona).toISOString(), hora12: hora12(r.hora) }))
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
}

/** Citas que entran en la ventana de aviso y todavía no se avisaron. */
export function citasPorAvisar(reservas, ahora, horasAntes) {
  const t = ahora.getTime();
  return reservas.filter(r => {
    const inicio = Date.parse(r.inicio);
    return !r.avisoEnviado && !TERMINADAS.has(r.estadoReserva) && inicio > t && inicio - horasAntes * 3600e3 <= t;
  });
}

export function correoRecordatorio(r, horasAntes, panelUrl) {
  const asunto = `Recordatorio: sesión con ${r.nombre}${r.negocio ? ` (${r.negocio})` : ''} a las ${r.hora12}`;
  const filas = [
    ['Cliente', r.nombre],
    ['Negocio', r.negocio],
    ['WhatsApp', r.telefono],
    ['Cuándo', `${r.dia} · ${r.hora12}`],
    ['Estado', r.estadoReserva],
    ...(r.respuestas || []).filter(x => ['Sector', 'País', 'Puntos de venta', 'Personas en el negocio', 'Conexión a internet', 'Lo que más le preocupa'].includes(x.pregunta)).map(x => [x.pregunta, x.respuesta]),
    ['Notas', r.notas],
  ].filter(([, v]) => v);
  const wa = `https://wa.me/${r.whatsapp}`;
  const plano = [`Faltan unas ${horasAntes} horas para tu sesión.`, '', ...filas.map(([k, v]) => `${k}: ${v}`), '', `WhatsApp: ${wa}`, `Panel: ${panelUrl}`].join('\n');
  const html = `<div style="background:#FBFBFD;padding:28px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1D1D1F">
  <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:18px;border:1px solid #E5E6E6;overflow:hidden">
    <div style="padding:20px 24px;border-bottom:1px solid #EEF0EF"><p style="margin:0;font-size:13px;color:#00795F">Faltan unas ${horasAntes} horas</p><h1 style="margin:6px 0 0;font-size:20px;font-weight:600">Sesión con ${esc(r.nombre)} · ${esc(r.hora12)}</h1></div>
    <table style="width:100%;border-collapse:collapse;font-size:15px">${filas.map(([k, v]) => `<tr><td style="padding:9px 24px;border-top:1px solid #EEF0EF;color:#6F7379;width:40%">${esc(k)}</td><td style="padding:9px 24px 9px 0;border-top:1px solid #EEF0EF">${esc(v)}</td></tr>`).join('')}</table>
    <div style="padding:18px 24px 24px"><a href="${wa}" style="display:inline-block;background:#00795F;color:#fff;text-decoration:none;padding:11px 20px;border-radius:999px;font-weight:500">Escribirle por WhatsApp</a> <a href="${esc(panelUrl)}" style="display:inline-block;margin-left:8px;color:#00795F;text-decoration:none;padding:11px 8px">Abrir el panel</a></div>
  </div></div>`;
  return { asunto, plano, html };
}
