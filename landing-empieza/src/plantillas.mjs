// Plantillas HTML. Todo el contenido sale en el HTML (sin depender de
// JavaScript) para que buscadores y asistentes de IA lo lean completo; el JS
// solo añade el formulario interactivo y la impresión del ticket.
//
// El hilo visual es el ticket de caja: Hera "imprime" las fugas del negocio.
// Sin barra de navegación: el logo vive dentro del hero.

import { config, whatsappUrl } from './config.mjs';
import { sectores } from './datos/sectores.mjs';
import { problemas } from './datos/problemas.mjs';
import { paises } from './datos/paises.mjs';
import { preguntas } from './datos/preguntas.mjs';
import { icono, iconoWhatsapp } from './iconos.mjs';

export const esc = s =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const mayus = s => s.charAt(0).toUpperCase() + s.slice(1);
const url = ruta => `${config.dominio}${ruta}`;
// Google muestra unos 155–160 caracteres de la descripción: se corta en una
// palabra entera para que nunca quede a medias.
const recortar = (t, max = 158) => (t.length <= max ? t : `${t.slice(0, t.lastIndexOf(' ', max - 1)).replace(/[,;:.]$/, '')}…`);

export const rutas = {
  inicio: '/',
  sector: s => `/sectores/${s.slug}/`,
  problema: p => `/problemas/${p.slug}/`,
  combo: (s, p) => `/sectores/${s.slug}/${p.slug}/`,
  pais: c => `/paises/${c.slug}/`,
};

export const funciones = [
  { titulo: 'Ventas y caja', texto: 'Vende desde el celular o la computadora, abre y cierra la caja y separa efectivo de transferencias.' },
  { titulo: 'Inventario al día', texto: 'Cada venta descuenta el stock. Sabes qué tienes, qué se acaba y cuánto dinero hay en mercancía.' },
  { titulo: 'Fiados bajo control', texto: 'Cada deuda con nombre, monto y fecha. Pagos parciales y total por cliente en una pantalla.' },
  { titulo: 'Ganancia real', texto: 'El costo y la ganancia de cada producto, y lo que ganaste hoy, sin hacer cuentas.' },
  { titulo: 'Varias monedas', texto: 'Cobra en moneda nacional, dólares o euros y ve el saldo de cada una por separado.' },
  { titulo: 'Una o varias sucursales', texto: 'Mira cada punto de venta por separado o todo tu negocio junto.' },
  { titulo: 'Tu equipo', texto: 'Tus vendedores registran las ventas y tú sigues viendo todo desde donde estés.' },
  { titulo: 'Hera, tu asistente con IA', texto: 'Detecta lo que no cuadra y te responde en lenguaje sencillo: "¿cuánto gané esta semana?".' },
];

// Hoy (cuaderno, Excel, memoria) frente a lo que cambia con SmartBusiness.
const comparacion = [
  ['Los fiados viven en un cuaderno y nadie sabe el total.', 'Cada deuda tiene nombre, monto y fecha, y ves cuánto te deben en una pantalla.'],
  ['El inventario se cuenta a ojo cuando hay tiempo.', 'Cada venta descuenta el stock y sabes qué se está acabando.'],
  ['La caja se cierra de noche y casi nunca da exacto.', 'Abres, vendes y cierras: el sistema ya sabe cuánto debería haber.'],
  ['Sabes cuánto vendiste, pero no cuánto ganaste.', 'Ves la ganancia de cada producto y la del día.'],
  ['Pesos, dólares y euros se mezclan en la misma cuenta.', 'Cada moneda tiene su propio saldo.'],
  ['Cada sucursal es un mundo aparte.', 'Ves cada punto de venta por separado o todos juntos.'],
  ['Si no estás, nadie sabe cómo va el negocio.', 'Tu equipo vende y tú lo ves desde el celular.'],
  ['Los domingos se van sumando papeles.', 'Le preguntas a Hera: "¿cuánto gané esta semana?".'],
];

// Montos del ticket de ejemplo: una tienda de barrio en un mes.
const montosEjemplo = { fiado: '$412', stock: '$230', caja: '$95', margen: '$140', merma: '$186', monedas: '$60', tiempo: '12 h' };
const totalEjemplo = '$1.123';

const heras = {
  laptop: 'Hera revisando los números de un negocio en su computadora',
  explica: 'Hera explicando lo que encontró',
  piensa: 'Hera pensando',
  neutra: 'Hera, la asistente con inteligencia artificial de SmartBusiness',
};
const archivoHera = { laptop: 'hera-laptop', explica: 'hera-explica', piensa: 'hera-piensa', neutra: 'hera' };
export const imgHera = (pose, clase, { carga = 'lazy', decorativa = false } = {}) =>
  `<img class="${clase}" src="/assets/img/${archivoHera[pose]}.webp" width="240" height="330" alt="${decorativa ? '' : esc(heras[pose])}" loading="${carga}" decoding="async">`;
const imgLogo = (clase = 'logo') => `<img class="${clase}" src="/assets/img/logo.webp" width="40" height="40" alt="">`;

// --- Piezas -------------------------------------------------------------------

const mensajeEmpezar = (extra = '') =>
  `Hola, quiero empezar con ${config.marca}${extra ? ` para ${extra}` : ''}. ¿Me ayudan?`;

export function botonEmpezar({ texto = 'Empezar', clase = 'btn btn-primario', extra = '' } = {}) {
  return `<a class="${clase}" href="${esc(whatsappUrl(mensajeEmpezar(extra)))}" data-empezar><span class="btn-texto">${esc(texto)}${icono('flecha', 'ico ico-flecha')}</span><span class="btn-spinner" aria-hidden="true"></span></a>`;
}

export function botonWhatsapp({ texto = 'Escribir por WhatsApp', clase = 'btn btn-secundario', extra = '' } = {}) {
  return `<a class="${clase}" href="${esc(whatsappUrl(mensajeEmpezar(extra)))}" target="_blank" rel="noopener" data-whatsapp><span class="btn-texto">${iconoWhatsapp('ico ico-wa')}${esc(texto)}</span><span class="btn-spinner" aria-hidden="true"></span></a>`;
}

function marca(migasItems) {
  const todos = migasItems?.length ? [{ nombre: 'Inicio', ruta: '/' }, ...migasItems] : [];
  const migas = todos.length
    ? `<nav class="migas" aria-label="Estás aquí"><ol>${todos
        .map((m, i) => (i === todos.length - 1 ? `<li aria-current="page">${esc(m.nombre)}</li>` : `<li><a href="${m.ruta}">${esc(m.nombre)}</a></li>`))
        .join('')}</ol></nav>`
    : '';
  return `<div class="hero-marca"><a class="marca" href="/">${imgLogo()}<span>${config.marca}</span></a>${migas}</div>`;
}

// El ticket: filas de fugas con su monto. "destacar" resalta la fuga de la página.
function ticket({ negocio = 'Minimarket La Esquina', destacar, carga = 'eager' } = {}) {
  const filas = problemas
    .map(p => {
      const es = p.clave === destacar;
      return `<li class="${es ? 'destacada' : ''}"${es ? ' aria-current="true"' : ''}><span>${esc(p.nombre)}</span><span class="ticket-monto">${montosEjemplo[p.clave]}</span></li>`;
    })
    .join('');
  return `<figure class="ticket" data-ticket aria-label="Ejemplo de ticket con las fugas que Hera detectó en un negocio">
    <div class="ticket-ranura" aria-hidden="true"></div>
    <div class="ticket-salida"><div class="ticket-papel">
      <p class="ticket-cabeza">${imgLogo('ticket-logo')}<span>SmartBusiness · Hera</span></p>
      <p class="ticket-meta">${esc(negocio)}<br>Revisión del mes · ejemplo</p>
      <p class="ticket-titulo">Fugas detectadas</p>
      <ul class="ticket-filas">${filas}</ul>
      <p class="ticket-total"><span>Se escapa al mes</span><span>${totalEjemplo}</span></p>
      <p class="ticket-pie">*** Cada fuga tiene arreglo ***</p>
    </div></div>
    <figcaption class="sr">Ejemplo: ${problemas.map(p => `${p.nombre} ${montosEjemplo[p.clave]}`).join(', ')}. Total ${totalEjemplo} al mes.</figcaption>
    ${imgHera('laptop', 'ticket-hera', { carga, decorativa: true })}
  </figure>`;
}

function hero({ titulo, texto, extra = '', migasItems, destacar, negocio }) {
  return `<header class="hero" data-hero>
  <div class="contenedor">
    ${marca(migasItems)}
    <div class="hero-in">
      <div class="hero-texto">
        <h1>${titulo}</h1>
        <p class="hero-bajada">${esc(texto)}</p>
        <div class="acciones">${botonEmpezar({ clase: 'btn btn-blanco', extra })}${botonWhatsapp({ clase: 'btn btn-contorno', extra })}</div>
        <p class="hero-nota">Unas preguntas sobre tu negocio · unos 3 minutos · sin compromiso</p>
      </div>
      ${ticket({ destacar, negocio })}
    </div>
  </div>
</header>`;
}

function encabezado(titulo, bajada) {
  return `<div class="encabezado"><h2>${titulo}</h2>${bajada ? `<p>${esc(bajada)}</p>` : ''}</div>`;
}

function seccionFugas({ titulo = 'Siete fugas por donde se va el dinero de un negocio', bajada = 'Ninguna parece grave sola. Juntas, se comen la ganancia del mes. Toca la que te suena.', sector, excluir } = {}) {
  const lista = problemas.filter(p => p.slug !== excluir);
  return `<section class="seccion" id="fugas" aria-labelledby="fugas-t">
  <div class="contenedor dos-columnas">
    <div class="encabezado encabezado-lateral"><h2 id="fugas-t">${esc(titulo)}</h2><p>${esc(bajada)}</p></div>
    <ul class="libro">
      ${lista
        .map(
          p => `<li><a href="${sector ? rutas.combo(sector, p) : rutas.problema(p)}">
        <span class="libro-nombre">${esc(p.nombre)}</span>
        <span class="libro-villano">${esc(p.villano)}</span>
        <span class="libro-texto">${esc(sector ? p.escena(sector).split('. ')[0] + '.' : p.hook)}</span>
        <span class="libro-ir">${icono('flecha', 'ico')}</span>
      </a></li>`,
        )
        .join('')}
    </ul>
  </div>
</section>`;
}

// Guion de la demo animada: el episodio piloto "El fiado fantasma".
export const guionDemo = [
  { texto: 'Este negocio vendió todo el mes. Y la caja está vacía.' },
  { texto: 'Treinta y siete ventas quedaron "para después" en un cuaderno.' },
  { texto: 'No es robo. Es el fiado fantasma: nadie sabe quién debe, cuánto ni desde cuándo.' },
  { texto: 'Con SmartBusiness, cada fiado queda registrado: quién debe, cuánto y cuándo paga.' },
  { texto: 'Esa semana cobró el 80% de lo que le debían. Esa es la fuga que Hera encontró.' },
];

function demo() {
  const v = config.video;
  const filasCuaderno = [['Juan (vecino)', '350'], ['María G.', '120'], ['Don Pedro', '480'], ['Carlos – obra', '240'], ['Lucía', '95']];
  const filasApp = [['Don Pedro', '480', 'Vence hoy', 'alerta'], ['Juan Pérez', '350', 'Vie 6 nov', ''], ['Carlos Ruiz', '240', 'Lun 9 nov', ''], ['María González', '120', 'Pagó 60', 'ok']];
  const reproductor = v.youtubeId
    ? `<div class="video-fachada" data-youtube="${esc(v.youtubeId)}">
        <img src="https://i.ytimg.com/vi/${esc(v.youtubeId)}/maxresdefault.jpg" alt="${esc(v.titulo)}" loading="lazy" width="1280" height="720">
        <button class="demo-play" type="button" aria-label="Reproducir el video">${icono('play')}</button>
      </div>`
    : `<div class="demo" data-demo aria-label="Demostración animada: Hera encuentra el fiado fantasma" role="region">
        <div class="demo-barras" aria-hidden="true">${guionDemo.map(() => '<span><i></i></span>').join('')}</div>
        <div class="demo-escenario" aria-hidden="true">
          <div class="escena escena-cuaderno" data-escena="0 1 2">
            <div class="cuaderno">
              <p class="cuaderno-titulo">Fiados · octubre</p>
              ${filasCuaderno.map(([n, m]) => `<p class="cuaderno-fila"><span>${n}</span><span>$${m}</span></p>`).join('')}
              <p class="cuaderno-fila cuaderno-mas"><span>+ 32 más…</span><span>¿?</span></p>
            </div>
            <div class="caja-vacia"><span>Caja</span><b>$0</b></div>
            <div class="fantasma" data-escena="2"><svg viewBox="0 0 80 90"><path d="M40 4C20 4 8 20 8 40v42l10-8 11 8 11-8 11 8 11-8 10 8V40C72 20 60 4 40 4z" fill="#fff" stroke="#1D1D1F" stroke-width="3"/><circle cx="29" cy="38" r="5" fill="#1D1D1F"/><circle cx="51" cy="38" r="5" fill="#1D1D1F"/><path d="M30 54q10 8 20 0" fill="none" stroke="#1D1D1F" stroke-width="3" stroke-linecap="round"/></svg></div>
          </div>
          <div class="escena escena-app" data-escena="3 4">
            <div class="app-telefono">
              <p class="app-titulo">Cuentas por cobrar</p>
              <p class="app-total"><span>Te deben</span><b>$1.190</b></p>
              ${filasApp.map(([n, m, f, e]) => `<p class="app-fila ${e}"><span class="app-avatar">${n[0]}</span><span class="app-nombre">${n}<small>${f}</small></span><b>$${m}</b></p>`).join('')}
              <div class="app-cobrado" data-escena="4"><span>Cobrado esta semana</span><div class="barra-cobro"><i></i></div><b>80%</b></div>
            </div>
          </div>
          <p class="demo-ejemplo">Ejemplo</p>
        </div>
        <p class="demo-subtitulo" data-demo-subtitulo>${esc(guionDemo[0].texto)}</p>
        <button class="demo-play" type="button" data-demo-play aria-label="Reproducir la demostración">${icono('play')}</button>
      </div>`;
  return `<section class="seccion seccion-menta" id="demo" aria-labelledby="demo-t">
  <div class="contenedor demo-grilla">
    <div class="demo-lado">
      ${encabezado('<span id="demo-t">Mira a Hera encontrar el fiado fantasma</span>', 'Un negocio que vendía bien, un cuaderno de fiados y el dinero que nadie estaba cobrando. Menos de un minuto.')}
      <div class="demo-hera">${imgHera('explica', 'demo-hera-img')}<p>“Mira lo que encontré en este cuaderno.”</p></div>
    </div>
    <div class="demo-marco">${reproductor}
      <details class="transcripcion">
        <summary>Leer lo que dice la demostración</summary>
        <ol>${guionDemo.map(g => `<li>${esc(g.texto)}</li>`).join('')}</ol>
        <p>Las cifras son de un ejemplo narrado, no una promesa de resultado.</p>
      </details>
    </div>
  </div>
</section>`;
}

function seccionComparacion(titulo = 'Lo mismo que haces hoy, sin que se escape nada') {
  return `<section class="seccion" id="que-cambia" aria-labelledby="comparacion-t">
  <div class="contenedor">
    ${encabezado(`<span id="comparacion-t">${esc(titulo)}</span>`, `${config.marca} no cambia cómo vendes. Cambia lo que sabes cuando cierras el día.`)}
    <table class="comparacion">
      <thead><tr><th scope="col">Hoy, con el cuaderno o el Excel</th><th scope="col">Con ${config.marca}</th></tr></thead>
      <tbody>${comparacion.map(([antes, ahora]) => `<tr><td>${esc(antes)}</td><td>${esc(ahora)}</td></tr>`).join('')}</tbody>
    </table>
  </div>
</section>`;
}

function seccionPasos() {
  const pasos = [
    ['Cuéntanos tu negocio', 'Sector, sucursales, equipo, productos y cómo es tu internet. Te toma unos 3 minutos.'],
    ['Lo armamos contigo', 'Eliges el día. En una sesión de una hora cargamos lo esencial de tu negocio, paso a paso.'],
    ['Vendes con control', 'Desde ese día sabes cuánto vendes, cuánto ganas, quién te debe y qué se está acabando.'],
  ];
  return `<section class="seccion seccion-pasos" id="como-empezar" aria-labelledby="pasos-t">
  <div class="contenedor">
    ${encabezado('<span id="pasos-t">Empezar toma tres pasos</span>')}
    <ol class="pasos">${pasos.map(([t, p]) => `<li><h3>${t}</h3><p>${p}</p></li>`).join('')}</ol>
    <div class="acciones">${botonEmpezar({ texto: 'Dar el primer paso' })}</div>
  </div>
</section>`;
}

function seccionCasos(filtroSector) {
  let casos = config.casos;
  if (filtroSector) casos = [...casos.filter(c => c.sector === filtroSector), ...casos.filter(c => c.sector !== filtroSector)];
  // Huecos sin caso real: el esqueleto del diseño, hasta tener tres historias.
  const huecos = Math.max(0, 3 - casos.length);
  const esqueleto = `<figure class="caso caso-esqueleto" aria-hidden="true">
        <div class="caso-esq-cita"><span class="esqueleto"></span><span class="esqueleto"></span><span class="esqueleto"></span></div>
        <div class="caso-esq-pie"><span class="esqueleto"></span><span class="esqueleto"></span><span class="esqueleto"></span></div>
      </figure>`;
  return `<section class="seccion" id="casos" aria-labelledby="casos-t">
  <div class="contenedor">
    ${encabezado('<span id="casos-t">Lo que cambia cuando ves tus números</span>', casos.length ? '' : 'Muy pronto, las historias de los negocios que ya trabajan con nosotros.')}
    <div class="casos">
      ${casos
        .map(
          c => `<figure class="caso">
        <blockquote><p>“${esc(c.cita)}”</p></blockquote>
        <figcaption>
          <p class="caso-quien">${esc(c.persona)} · ${esc(c.negocio)} · ${esc(c.ciudad)}</p>
          <p class="caso-cambio"><b>${esc(c.cifra)}</b> ${esc(c.cifraTexto)}. ${esc(c.despues)}</p>
        </figcaption>
      </figure>`,
        )
        .join('')}
      ${esqueleto.repeat(huecos)}
    </div>
  </div>
</section>`;
}

function seccionSectores(pais) {
  return `<section class="seccion seccion-indice" id="sectores" aria-labelledby="sectores-t">
  <div class="contenedor">
    ${encabezado(`<span id="sectores-t">Hecho para el negocio que tienes${pais ? ` ${esc(pais.en)}` : ''}</span>`)}
    <ul class="indice">${sectores.map(s => `<li><a href="${rutas.sector(s)}">${esc(s.nombre)}</a></li>`).join('')}</ul>
    ${pais ? '' : `<p class="indice-paises">También por país: ${paises.map(c => `<a href="${rutas.pais(c)}">${esc(c.nombre)}</a>`).join(', ')}.</p>`}
  </div>
</section>`;
}

function seccionPreguntas(lista, titulo = 'Preguntas que nos hacen siempre') {
  return `<section class="seccion" id="preguntas" aria-labelledby="preguntas-t">
  <div class="contenedor dos-columnas">
    <div class="encabezado encabezado-lateral">
      <h2 id="preguntas-t">${esc(titulo)}</h2>
      <p>¿No está la tuya? ${botonWhatsapp({ texto: 'Pregúntanos por WhatsApp', clase: 'enlace' })}</p>
      ${imgHera('piensa', 'preguntas-hera', { decorativa: true })}
    </div>
    <div class="preguntas">
      ${lista
        .map(
          q => `<details class="pregunta">
        <summary><h3>${esc(q.p)}</h3><span class="pregunta-signo" aria-hidden="true"></span></summary>
        <div class="pregunta-respuesta"><p>${esc(q.r)}</p></div>
      </details>`,
        )
        .join('')}
    </div>
  </div>
</section>`;
}

function ctaFinal({ titulo = 'Tu negocio ya vende. Ahora vas a saber cuánto gana.', extra = '' } = {}) {
  return `<section class="cta" aria-labelledby="cta-t">
  <div class="contenedor cta-in">
    ${imgHera('neutra', 'cta-hera')}
    <div>
      <h2 id="cta-t">${esc(titulo)}</h2>
      <p>Responde unas preguntas y elige: reservar un día para armar tu negocio con nosotros o escribirnos ahora mismo.</p>
      <div class="acciones">${botonEmpezar({ texto: 'Empezar ahora', clase: 'btn btn-blanco', extra })}${botonWhatsapp({ clase: 'btn btn-contorno', extra })}</div>
    </div>
  </div>
</section>`;
}

function bloqueTexto({ id, titulo, parrafos = [], lista, listaOrdenada, clase = '' }) {
  const items = lista || listaOrdenada;
  const tag = listaOrdenada ? 'ol' : 'ul';
  return `<section class="seccion ${clase}" id="${id}" aria-labelledby="${id}-t">
  <div class="contenedor texto-largo">
    <h2 id="${id}-t">${esc(titulo)}</h2>
    ${parrafos.map(p => `<p>${esc(p)}</p>`).join('')}
    ${items ? `<${tag} class="${listaOrdenada ? 'lista-pasos' : 'lista-senales'}">${items.map(t => `<li>${esc(t)}</li>`).join('')}</${tag}>` : ''}
  </div>
</section>`;
}

function pie() {
  const col = (titulo, enlaces) =>
    `<div><h2 class="pie-titulo">${titulo}</h2><ul>${enlaces.map(([texto, ruta]) => `<li><a href="${ruta}">${esc(texto)}</a></li>`).join('')}</ul></div>`;
  return `<footer class="pie">
  <div class="contenedor">
    <div class="pie-marca">
      <a class="marca marca-oscura" href="/">${imgLogo()}<span>${config.marca}</span></a>
      <p>Sistema de gestión para negocios de América: ventas, caja, inventario, fiados y ganancia real, con Hera, tu asistente con inteligencia artificial.</p>
      ${botonWhatsapp({ texto: config.whatsappVisible, clase: 'enlace' })}
    </div>
    <div class="pie-cols">
      ${col('Sectores', sectores.map(s => [s.nombre, rutas.sector(s)]))}
      ${col('Problemas que resolvemos', problemas.map(p => [p.nombre, rutas.problema(p)]))}
      ${col('Países', paises.map(c => [c.nombre, rutas.pais(c)]))}
    </div>
    <p class="pie-legal">© ${new Date().getFullYear()} ${config.marca} · <a href="${config.sitioPrincipal}">smartbiz.com.uy</a> · <a href="/llms.txt">Información para asistentes de IA</a></p>
  </div>
</footer>`;
}

function hojaYModales() {
  // El contenido del formulario lo dibuja app.js; sin JS el botón Empezar
  // abre WhatsApp, así que nadie queda sin camino.
  return `<dialog class="hoja" id="hoja-empezar" aria-labelledby="hoja-titulo">
  <div class="hoja-panel" data-hoja-panel>
    <div class="hoja-cabecera">
      <button class="icono-btn" type="button" data-hoja-atras aria-label="Volver a la pregunta anterior" hidden>${icono('atras')}</button>
      <div class="progreso" role="progressbar" aria-label="Avance del formulario" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span data-progreso></span></div>
      <button class="icono-btn" type="button" data-hoja-cerrar aria-label="Cerrar">${icono('cerrar')}</button>
    </div>
    <div class="hoja-cuerpo" data-hoja-cuerpo aria-live="polite"></div>
  </div>
</dialog>
<dialog class="modal" id="modal-confirmar" aria-labelledby="modal-titulo" aria-describedby="modal-texto">
  <div class="modal-panel">
    <div class="modal-icono" data-modal-icono></div>
    <h2 class="modal-titulo" id="modal-titulo" data-modal-titulo></h2>
    <p class="modal-texto" id="modal-texto" data-modal-texto></p>
    <div class="modal-acciones">
      <button class="btn btn-secundario" type="button" data-modal-cancelar></button>
      <button class="btn btn-primario" type="button" data-modal-aceptar><span class="btn-texto"></span><span class="btn-spinner" aria-hidden="true"></span></button>
    </div>
  </div>
</dialog>
<a class="wa-flotante" href="${esc(whatsappUrl(mensajeEmpezar()))}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp al ${config.whatsappVisible}" data-whatsapp>${iconoWhatsapp('ico')}</a>`;
}

export function layout({ titulo, descripcion, ruta, jsonld = [], contenido, pagina = {}, migasItems, imagen = '/assets/og.png' }) {
  const canonical = url(ruta);
  const grafo = { '@context': 'https://schema.org', '@graph': [organizacion(), sitioWeb(), ...jsonld] };
  if (migasItems?.length) grafo['@graph'].push(migasLd(migasItems));
  const attrs = Object.entries(pagina)
    .filter(([, v]) => v)
    .map(([k, v]) => ` data-${k}="${esc(v)}"`)
    .join('');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(recortar(descripcion))}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta name="theme-color" content="#00795F">
<meta name="color-scheme" content="light">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_419">
<meta property="og:site_name" content="${config.marca}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(recortar(descripcion, 200))}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${url(imagen)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/img/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="alternate" type="text/plain" href="/llms.txt" title="Resumen para asistentes de IA">
<link rel="preload" href="/assets/fuentes/montserrat-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/estilos.css">
<script type="application/ld+json">${JSON.stringify(grafo).replace(/</g, '\\u003c')}</script>
<script src="/assets/datos.js" defer></script>
<script src="/assets/app.js" defer></script>
</head>
<body${attrs}>
<a class="saltar" href="#contenido">Saltar al contenido</a>
<main id="contenido">
${contenido}
</main>
${pie()}
${hojaYModales()}
</body>
</html>
`;
}

// --- Datos estructurados ----------------------------------------------------

function organizacion() {
  return {
    '@type': 'Organization',
    '@id': `${config.sitioPrincipal}/#organizacion`,
    name: config.marca,
    url: config.sitioPrincipal,
    logo: url('/assets/img/logo-192.png'),
    sameAs: [config.instagram],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      telephone: `+${config.whatsapp}`,
      url: whatsappUrl(),
      availableLanguage: ['es'],
      areaServed: paises.map(p => p.nombre),
    },
  };
}

function sitioWeb() {
  return {
    '@type': 'WebSite',
    '@id': `${config.dominio}/#sitio`,
    url: config.dominio,
    name: `${config.marca} · Empieza`,
    inLanguage: 'es',
    publisher: { '@id': `${config.sitioPrincipal}/#organizacion` },
  };
}

function migasLd(items) {
  const todos = [{ nombre: 'Inicio', ruta: '/' }, ...items];
  return {
    '@type': 'BreadcrumbList',
    itemListElement: todos.map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: m.nombre, item: url(m.ruta) })),
  };
}

const faqLd = lista => ({
  '@type': 'FAQPage',
  mainEntity: lista.map(q => ({ '@type': 'Question', name: q.p, acceptedAnswer: { '@type': 'Answer', text: q.r } })),
});

const softwareLd = () => ({
  '@type': 'SoftwareApplication',
  '@id': `${config.dominio}/#software`,
  name: config.marca,
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Sistema de gestión, punto de venta e inventario para pymes',
  operatingSystem: 'Web, Android, iOS (navegador)',
  inLanguage: 'es',
  description:
    'Sistema de gestión para pequeños y medianos negocios: ventas y caja, inventario, fiados y cuentas por cobrar, ganancia por producto, varias monedas y sucursales, con Hera, asistente con inteligencia artificial.',
  featureList: funciones.map(f => f.titulo),
  image: url('/assets/img/hera.webp'),
  publisher: { '@id': `${config.sitioPrincipal}/#organizacion` },
});

const paginaLd = (ruta, nombre, descripcion, extra = {}) => ({
  '@type': 'WebPage',
  '@id': `${url(ruta)}#pagina`,
  url: url(ruta),
  name: nombre,
  description: descripcion,
  inLanguage: 'es',
  isPartOf: { '@id': `${config.dominio}/#sitio` },
  about: { '@id': `${config.dominio}/#software` },
  ...extra,
});

// --- Páginas ------------------------------------------------------------------

export function paginaInicio() {
  const titulo = 'SmartBusiness: deja de perder dinero en tu negocio | Empieza hoy';
  const descripcion =
    'Sistema de gestión para tiendas, restaurantes y pymes de América: fiados, inventario, caja y ganancia real desde el celular, con Hera, tu asistente con IA.';
  const pasosHowTo = {
    '@type': 'HowTo',
    name: 'Cómo empezar con SmartBusiness',
    totalTime: 'PT3M',
    step: [
      { '@type': 'HowToStep', position: 1, name: 'Cuéntanos tu negocio', text: 'Responde preguntas sobre sector, sucursales, equipo, productos y conexión a internet.' },
      { '@type': 'HowToStep', position: 2, name: 'Elige cómo seguir', text: 'Reserva un día para armar tu negocio con el equipo o escribe ahora por WhatsApp.' },
      { '@type': 'HowToStep', position: 3, name: 'Vende con control', text: 'Desde la sesión vendes con caja, inventario y fiados registrados.' },
    ],
  };
  const ld = [paginaLd('/', titulo, descripcion), softwareLd(), faqLd(preguntas), pasosHowTo];
  if (config.video.youtubeId) {
    ld.push({
      '@type': 'VideoObject',
      name: config.video.titulo,
      description: config.video.descripcion,
      thumbnailUrl: `https://i.ytimg.com/vi/${config.video.youtubeId}/maxresdefault.jpg`,
      uploadDate: config.video.publicado,
      duration: config.video.duracionISO,
      embedUrl: `https://www.youtube-nocookie.com/embed/${config.video.youtubeId}`,
      transcript: guionDemo.map(g => g.texto).join(' '),
    });
  }
  const contenido = `
${hero({
  titulo: 'Tu negocio vende. <em>¿Sabes por dónde se escapa el dinero?</em>',
  texto: 'Fiados que nadie cobra, inventario que no cuadra, una caja que no cierra. Hera, la asistente con inteligencia artificial de SmartBusiness, encuentra cada fuga y te ayuda a cerrarla. Lo armamos contigo, paso a paso.',
})}
${seccionFugas()}
${demo()}
${seccionComparacion()}
${seccionPasos()}
${seccionCasos()}
${seccionSectores()}
${seccionPreguntas(preguntas)}
${ctaFinal()}`;
  return layout({ titulo, descripcion, ruta: '/', jsonld: ld, contenido });
}

export function paginaSector(s) {
  const ruta = rutas.sector(s);
  const titulo = `Sistema de gestión para ${s.plural}: inventario, caja y fiados | ${config.marca}`;
  const descripcion = `Programa para ${s.plural}: inventario, caja, fiados y ganancia real desde el celular. Te ayudamos a armar ${s.su} paso a paso.`;
  const faq = [
    { p: `¿SmartBusiness sirve para ${s.su}?`, r: `Sí. Está pensado para negocios como ${s.su}: ventas, caja, inventario de ${s.productos}, fiados de ${s.clientes} y la ganancia real de cada día.` },
    { p: `¿Qué problemas resuelve en ${s.plural}?`, r: `Los más comunes son ${problemas.slice(0, 4).map(p => p.nombre.toLowerCase()).join(', ')}. En la sesión empezamos por el que más te cuesta hoy.` },
    { p: `¿Tengo que cargar todos mis ${s.unidad === 'platos' ? 'platos e ingredientes' : s.unidad} el primer día?`, r: 'No. Empezamos por lo esencial para que puedas vender con el sistema desde el primer día y completamos el resto después.' },
    ...problemas.slice(0, 3).flatMap(p => p.faq(s).slice(0, 1)),
  ];
  const migasItems = [{ nombre: 'Sectores', ruta: '/#sectores' }, { nombre: s.nombre, ruta }];
  const contenido = `
${hero({
  titulo: `Sistema de gestión para ${esc(s.plural)}. <em>Deja de perder dinero sin saber dónde.</em>`,
  texto: s.contexto,
  extra: s.su,
  migasItems,
  negocio: `${s.nombre} · ejemplo`,
})}
${seccionFugas({ titulo: `Las fugas más comunes en ${s.plural}`, bajada: `Cada una tiene arreglo. Toca la que más se parece a lo que pasa en ${s.su}.`, sector: s })}
${bloqueTexto({
  id: 'como-ayuda',
  titulo: `Cómo te ayuda ${config.marca} en ${s.su}`,
  parrafos: [
    `${mayus(s.su)} tiene su propio ritmo: ${s.productos}, ${s.clientes} y ${s.lugar}. Por eso no empezamos con una configuración genérica: antes de la sesión te preguntamos cuántas sucursales tienes, cuántas personas trabajan contigo, cuántos ${s.unidad === 'platos' ? 'platos tiene tu carta' : `${s.unidad} vendes`} y cómo es tu conexión a internet.`,
  ],
})}
${seccionComparacion(`Así cambia el día a día en ${s.su}`)}
${demo()}
${seccionCasos(s.slug)}
${seccionPreguntas(faq, `Preguntas sobre ${s.plural}`)}
${ctaFinal({ titulo: `Arma ${s.su} con nosotros`, extra: s.su })}`;
  return layout({ titulo, descripcion, ruta, jsonld: [paginaLd(ruta, titulo, descripcion), softwareLd(), faqLd(faq)], contenido, pagina: { sector: s.slug }, migasItems });
}

const generico = { su: 'tu negocio', plural: 'negocios', clientes: 'tus clientes', venta: 'un producto', productos: 'tus productos', lugar: 'el almacén', unidad: 'productos' };

export function paginaProblema(p) {
  const ruta = rutas.problema(p);
  const titulo = `${p.titulo}: ${p.hook} | ${config.marca}`;
  const descripcion = `${p.hook} ${p.resumen.split('. ')[0]}. Resuélvelo con ${config.marca}: ${p.funcion.toLowerCase()}.`;
  const faq = p.faq(generico);
  const migasItems = [{ nombre: 'Problemas', ruta: '/#fugas' }, { nombre: p.nombre, ruta }];
  const contenido = `
${hero({ titulo: `${esc(p.titulo)}. <em>${esc(p.hook)}</em>`, texto: p.resumen, migasItems, destacar: p.clave })}
${bloqueTexto({ id: 'escena', titulo: '¿Te suena esta escena?', parrafos: [p.escena(generico)] })}
${bloqueTexto({ id: 'sintomas', titulo: 'Señales de que te está pasando', lista: p.sintomas(generico), clase: 'seccion-menta' })}
${bloqueTexto({ id: 'causa', titulo: 'La causa real (y no es la que parece)', parrafos: [p.causa()] })}
${bloqueTexto({ id: 'solucion', titulo: `Cómo lo resuelve ${config.marca}`, listaOrdenada: p.pasos(generico), clase: 'seccion-menta' })}
<section class="seccion seccion-indice" aria-labelledby="por-sector-t">
  <div class="contenedor">
    ${encabezado(`<span id="por-sector-t">${esc(p.nombre)} en tu tipo de negocio</span>`)}
    <ul class="indice">${sectores.map(s => `<li><a href="${rutas.combo(s, p)}">${esc(s.nombre)}</a></li>`).join('')}</ul>
  </div>
</section>
${seccionPreguntas(faq, `Preguntas sobre ${p.nombre.toLowerCase()}`)}
${ctaFinal({ titulo: `Cierra la fuga: ${p.nombre.toLowerCase()}` })}`;
  return layout({ titulo, descripcion, ruta, jsonld: [paginaLd(ruta, titulo, descripcion), faqLd(faq)], contenido, pagina: { problema: p.clave }, migasItems });
}

export function paginaCombo(s, p) {
  const ruta = rutas.combo(s, p);
  const h1 = p.tituloPara(s);
  const titulo = `${h1} | ${config.marca}`;
  const descripcion = `${p.hook} ${config.marca} lo resuelve en ${s.plural} con ${p.funcion.toLowerCase()}. Empieza en 3 minutos.`;
  const faq = p.faq(s);
  const migasItems = [
    { nombre: 'Sectores', ruta: '/#sectores' },
    { nombre: s.nombre, ruta: rutas.sector(s) },
    { nombre: p.nombre, ruta },
  ];
  const contenido = `
${hero({ titulo: `${esc(h1)}. <em>${esc(p.hook)}</em>`, texto: p.escena(s), extra: s.su, migasItems, destacar: p.clave, negocio: `${s.nombre} · ejemplo` })}
${bloqueTexto({ id: 'sintomas', titulo: `Señales de ${p.nombre.toLowerCase()} en ${s.su}`, lista: p.sintomas(s), clase: 'seccion-menta' })}
${bloqueTexto({ id: 'causa', titulo: `Por qué pasa en ${s.plural}`, parrafos: [p.causa(s), s.contexto] })}
${bloqueTexto({ id: 'solucion', titulo: `Cómo lo resuelve ${config.marca} en ${s.su}`, listaOrdenada: p.pasos(s), clase: 'seccion-menta' })}
${seccionCasos(s.slug)}
${seccionPreguntas(faq, `Preguntas sobre ${p.nombre.toLowerCase()} en ${s.plural}`)}
${seccionFugas({ titulo: `Otras fugas comunes en ${s.plural}`, bajada: 'Cuando una fuga aparece, casi nunca viene sola.', sector: s, excluir: p.slug })}
${ctaFinal({ titulo: `Cierra esta fuga en ${s.su}`, extra: s.su })}`;
  return layout({ titulo, descripcion, ruta, jsonld: [paginaLd(ruta, h1, descripcion), faqLd(faq)], contenido, pagina: { sector: s.slug, problema: p.clave }, migasItems });
}

export function paginaPais(c) {
  const ruta = rutas.pais(c);
  const titulo = `Sistema de gestión para negocios ${c.en}: inventario, caja y fiados | ${config.marca}`;
  const descripcion = `Sistema para tiendas, ferreterías, restaurantes y pymes ${c.en}: ventas en ${c.monedas.join(' y ')}, inventario, caja y fiados desde el celular.`;
  const faq = [
    { p: `¿SmartBusiness funciona ${c.en}?`, r: `Sí. Trabajamos con negocios ${c.en}. ${c.nota}` },
    { p: `¿Puedo cobrar en ${c.monedas.join(' y ')}?`, r: c.monedas.length > 1 ? `Sí. Cada cobro guarda su moneda y ves el saldo de ${c.monedas.join(', ')} por separado.` : 'Sí. Además, si algún cliente paga en otra moneda, el cobro guarda la moneda en que lo recibiste.' },
    { p: '¿La atención es en español?', r: `Sí. Te atiende una persona del equipo por WhatsApp (${config.whatsappVisible}) y la sesión para armar tu negocio es en español.` },
    { p: `¿Sirve para la facturación o los impuestos ${c.en}?`, r: `${config.marca} te da el control del día a día: ventas, caja, inventario y ganancia. Las obligaciones fiscales ${c.en} las sigue llevando tu contador; si tienes una necesidad específica, pregúntanos en la sesión.` },
  ];
  const migasItems = [{ nombre: 'Países', ruta: '/#sectores' }, { nombre: c.nombre, ruta }];
  const contenido = `
${hero({
  titulo: `Sistema de gestión para negocios ${esc(c.en)}. <em>Ventas, caja, inventario y fiados en un solo lugar.</em>`,
  texto: `${c.nota} Controla lo que vendes en ${c.monedas.join(' y ')}, sabe cuánto ganas y quién te debe, desde el celular.`,
  extra: `mi negocio ${c.en}`,
  migasItems,
})}
${seccionFugas()}
${seccionComparacion(`Así cambia el día a día de un negocio ${c.en}`)}
${seccionSectores(c)}
${seccionCasos()}
${seccionPreguntas(faq, `Preguntas de negocios ${c.en}`)}
${ctaFinal({ extra: `mi negocio ${c.en}` })}`;
  return layout({ titulo, descripcion, ruta, jsonld: [paginaLd(ruta, titulo, descripcion), softwareLd(), faqLd(faq)], contenido, pagina: { pais: c.slug }, migasItems });
}
