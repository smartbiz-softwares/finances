// Validación y formato del correo de cada solicitud del formulario.
// Separado del servidor para poder probarlo sin red (solicitud.prueba.mjs).

const TIPOS = { formulario: 'Nueva solicitud', reserva: 'Nueva reserva de sesión' };
const TAMANOS = { pequeno: 'Pequeño', mediano: 'Mediano', grande: 'Grande' };

const texto = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Devuelve { ok, datos } con todo recortado y limpio, o { ok: false, error }. */
export function validarSolicitud(cuerpo) {
  if (!cuerpo || typeof cuerpo !== 'object') return { ok: false, error: 'Cuerpo vacío' };
  const tipo = TIPOS[cuerpo.tipo] ? cuerpo.tipo : null;
  if (!tipo) return { ok: false, error: 'Tipo desconocido' };
  const telefono = texto(cuerpo.telefono, 24);
  const digitos = telefono.replace(/\D/g, '');
  if (digitos.length < 7 || digitos.length > 18) return { ok: false, error: 'Teléfono inválido' };
  const nombre = texto(cuerpo.nombre, 80);
  if (nombre.length < 2) return { ok: false, error: 'Falta el nombre' };
  const respuestas = Array.isArray(cuerpo.respuestas)
    ? cuerpo.respuestas
        .slice(0, 40)
        .map(r => {
          const x = { pregunta: texto(r?.pregunta, 60), respuesta: texto(r?.respuesta, 400) };
          // Cada opción elegida por separado: las métricas cuentan opciones, no frases.
          if (Array.isArray(r?.valores)) x.valores = r.valores.slice(0, 12).map(v => texto(v, 80)).filter(Boolean);
          return x;
        })
        .filter(r => r.pregunta && r.respuesta)
    : [];
  return {
    ok: true,
    // El campo "sitio" es una trampa invisible: una persona nunca lo rellena.
    bot: texto(cuerpo.sitio, 200) !== '',
    datos: {
      tipo,
      nombre,
      telefono,
      whatsapp: digitos,
      negocio: texto(cuerpo.negocio, 80),
      ciudad: texto(cuerpo.ciudad, 60),
      reserva: tipo === 'reserva' ? texto(cuerpo.reserva, 120) : '',
      ...(tipo === 'reserva' && /^\d{4}-\d{2}-\d{2}$/.test(cuerpo.reservaDia) && /^([01]\d|2[0-3]):[0-5]\d$/.test(cuerpo.reservaHora)
        ? { reservaDia: cuerpo.reservaDia, reservaHora: cuerpo.reservaHora }
        : {}),
      // Une la solicitud con la telemetría anónima de esa visita.
      sesion: /^[a-z0-9]{8,32}$/.test(cuerpo.sesion || '') ? cuerpo.sesion : '',
      tamano: TAMANOS[cuerpo.tamano] || '',
      pagina: texto(cuerpo.pagina, 200),
      respuestas,
    },
  };
}

/** Asunto, texto plano y HTML del correo para el dueño. */
export function construirCorreo(d, fecha = new Date()) {
  const quien = d.negocio ? `${d.nombre} (${d.negocio})` : d.nombre;
  const asunto = `${TIPOS[d.tipo]}: ${quien}${d.reserva ? ` · ${d.reserva}` : ''}`;
  const wa = `https://wa.me/${d.whatsapp}`;
  const filas = [
    ['Nombre', d.nombre],
    ['WhatsApp', d.telefono],
    ['Negocio', d.negocio],
    ['Ciudad', d.ciudad],
    ['Tamaño estimado', d.tamano],
    ['Sesión reservada', d.reserva],
    ...d.respuestas.filter(r => r.pregunta !== 'Nombre').map(r => [r.pregunta, r.respuesta]),
    ['Página de origen', d.pagina],
  ].filter(([, v]) => v);
  const cuando = fecha.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

  const plano = [`${TIPOS[d.tipo]} desde empieza.smartbiz.com.uy (${cuando})`, '', ...filas.map(([k, v]) => `${k}: ${v}`), '', `Escribirle por WhatsApp: ${wa}`].join('\n');

  const html = `<div style="background:#FBFBFD;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1D1D1F">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;border:1px solid #E5E6E6;overflow:hidden">
    <div style="background:#00795F;color:#fff;padding:22px 24px">
      <p style="margin:0;font-size:13px;opacity:.85">SmartBusiness · Empieza</p>
      <h1 style="margin:6px 0 0;font-size:21px;line-height:1.25">${esc(TIPOS[d.tipo])}: ${esc(quien)}</h1>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:15px">
      ${filas
        .map(
          ([k, v]) =>
            `<tr><td style="padding:10px 24px;border-top:1px solid #EEF0EF;color:#6F7379;width:42%;vertical-align:top">${esc(k)}</td><td style="padding:10px 24px 10px 0;border-top:1px solid #EEF0EF;font-weight:600">${esc(v)}</td></tr>`,
        )
        .join('')}
    </table>
    <div style="padding:20px 24px 26px">
      <a href="${wa}" style="display:inline-block;background:#00795F;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">Escribirle por WhatsApp</a>
      <p style="margin:14px 0 0;font-size:12px;color:#6F7379">Recibido el ${esc(cuando)}.</p>
    </div>
  </div>
</div>`;
  return { asunto, plano, html };
}
