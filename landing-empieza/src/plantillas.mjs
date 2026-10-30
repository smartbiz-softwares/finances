// Plantillas HTML. Todo el contenido sale en el HTML (sin depender de
// JavaScript) para que buscadores y asistentes de IA lo lean completo; el JS
// solo añade el formulario interactivo y las animaciones.

import { config, whatsappUrl } from './config.mjs';
import { sectores } from './datos/sectores.mjs';
import { problemas } from './datos/problemas.mjs';
import { paises } from './datos/paises.mjs';
import { preguntas } from './datos/preguntas.mjs';
import { icono, iconoWhatsapp, hera, logo } from './iconos.mjs';

export const esc = s =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const mayus = s => s.charAt(0).toUpperCase() + s.slice(1);
// Google muestra unos 155–160 caracteres de la descripción: se corta en una
// palabra entera para que nunca quede a medias.
const recortar = (t, max = 158) => (t.length <= max ? t : `${t.slice(0, t.lastIndexOf(' ', max - 1)).replace(/[,;:.]$/, '')}…`);
const url = ruta => `${config.dominio}${ruta}`;

export const rutas = {
  inicio: '/',
  sector: s => `/sectores/${s.slug}/`,
  problema: p => `/problemas/${p.slug}/`,
  combo: (s, p) => `/sectores/${s.slug}/${p.slug}/`,
  pais: c => `/paises/${c.slug}/`,
};

const iconoProblema = { fiado: 'fiado', stock: 'stock', caja: 'caja', margen: 'margen', merma: 'merma', monedas: 'monedas', tiempo: 'tiempo' };

export const funciones = [
  { icono: 'caja', titulo: 'Ventas y caja', texto: 'Vende desde el celular o la computadora, abre y cierra la caja y separa efectivo de transferencias.' },
  { icono: 'stock', titulo: 'Inventario al día', texto: 'Cada venta descuenta el stock. Sabes qué tienes, qué se acaba y cuánto dinero hay en mercancía.' },
  { icono: 'fiado', titulo: 'Fiados bajo control', texto: 'Cada deuda con nombre, monto y fecha. Pagos parciales y total por cliente en una pantalla.' },
  { icono: 'margen', titulo: 'Ganancia real', texto: 'El costo y la ganancia de cada producto, y lo que ganaste hoy, sin hacer cuentas.' },
  { icono: 'monedas', titulo: 'Varias monedas', texto: 'Cobra en moneda nacional, dólares o euros y ve el saldo de cada una por separado.' },
  { icono: 'sucursal', titulo: 'Una o varias sucursales', texto: 'Mira cada punto de venta por separado o todo tu negocio junto.' },
  { icono: 'usuarios', titulo: 'Tu equipo', texto: 'Tus vendedores registran las ventas y tú sigues viendo todo desde donde estés.' },
  { icono: 'chispa', titulo: 'Hera, tu asistente con IA', texto: 'Detecta lo que no cuadra y te responde en lenguaje sencillo: "¿cuánto gané esta semana?".' },
];

// --- Piezas -----------------------------------------------------------------

const mensajeEmpezar = (extra = '') =>
  `Hola, quiero empezar con ${config.marca}${extra ? ` para ${extra}` : ''}. ¿Me ayudan?`;

export function botonEmpezar({ texto = 'Empezar', clase = 'btn btn-primario', extra = '' } = {}) {
  return `<a class="${clase}" href="${esc(whatsappUrl(mensajeEmpezar(extra)))}" data-empezar><span class="btn-texto">${esc(texto)}${icono('flecha', 'ico ico-flecha')}</span><span class="btn-spinner" aria-hidden="true"></span></a>`;
}

export function botonWhatsapp({ texto = 'Escribir por WhatsApp', clase = 'btn btn-secundario', extra = '' } = {}) {
  return `<a class="${clase}" href="${esc(whatsappUrl(mensajeEmpezar(extra)))}" target="_blank" rel="noopener" data-whatsapp><span class="btn-texto">${iconoWhatsapp('ico ico-wa')}${esc(texto)}</span><span class="btn-spinner" aria-hidden="true"></span></a>`;
}

function encabezado() {
  return `<header class="barra" data-barra>
  <div class="contenedor barra-in">
    <a class="marca" href="/" aria-label="${config.marca}, inicio">${logo}<span>${config.marca}</span></a>
    <nav class="barra-nav" aria-label="Secciones">
      <a href="/#fugas">Problemas</a>
      <a href="/#demo">Demo</a>
      <a href="/#casos">Casos</a>
      <a href="/#sectores">Sectores</a>
      <a href="/#preguntas">Preguntas</a>
    </nav>
    ${botonEmpezar({ clase: 'btn btn-primario btn-chico' })}
  </div>
</header>`;
}

function migas(items) {
  if (!items?.length) return '';
  const todos = [{ nombre: 'Inicio', ruta: '/' }, ...items];
  return `<nav class="migas contenedor" aria-label="Estás aquí"><ol>${todos
    .map((m, i) =>
      i === todos.length - 1
        ? `<li aria-current="page">${esc(m.nombre)}</li>`
        : `<li><a href="${m.ruta}">${esc(m.nombre)}</a></li>`,
    )
    .join('')}</ol></nav>`;
}

function pie() {
  const col = (titulo, enlaces) =>
    `<div class="pie-col"><h2 class="pie-titulo">${titulo}</h2><ul>${enlaces
      .map(([texto, ruta]) => `<li><a href="${ruta}">${esc(texto)}</a></li>`)
      .join('')}</ul></div>`;
  return `<footer class="pie">
  <div class="contenedor">
    <div class="pie-marca">
      <a class="marca" href="/">${logo}<span>${config.marca}</span></a>
      <p>Sistema de gestión para negocios de América: ventas, caja, inventario, fiados y ganancia real, con Hera, tu asistente con inteligencia artificial.</p>
      ${botonWhatsapp({ texto: config.whatsappVisible, clase: 'enlace-wa' })}
    </div>
    <div class="pie-cols">
      ${col('Sectores', sectores.map(s => [s.nombre, rutas.sector(s)]))}
      ${col('Problemas que resolvemos', problemas.map(p => [p.nombre, rutas.problema(p)]))}
      ${col('Países', paises.map(c => [c.nombre, rutas.pais(c)]))}
    </div>
    <p class="pie-legal">© ${new Date().getFullYear()} ${config.marca}. <a href="${config.sitioPrincipal}">smartbiz.com.uy</a> · <a href="/llms.txt">Información para asistentes de IA</a></p>
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
<meta name="theme-color" content="#FBFBFD">
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
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="text/plain" href="/llms.txt" title="Resumen para asistentes de IA">
<link rel="stylesheet" href="/assets/estilos.css">
<script type="application/ld+json">${JSON.stringify(grafo).replace(/</g, '\\u003c')}</script>
<script src="/assets/datos.js" defer></script>
<script src="/assets/app.js" defer></script>
</head>
<body${attrs}>
<a class="saltar" href="#contenido">Saltar al contenido</a>
${encabezado()}
${migas(migasItems)}
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
    logo: url('/assets/favicon.svg'),
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

// --- Secciones reutilizables -------------------------------------------------

function seccionFugas({ titulo = '¿Te pasa alguna de estas?', subtitulo = 'Son las 7 fugas por las que se escapa el dinero de un negocio. Toca la tuya y te mostramos cómo se resuelve.', sector } = {}) {
  return `<section class="seccion" id="fugas" aria-labelledby="fugas-titulo">
  <div class="contenedor">
    <div class="seccion-cabecera" data-revelar>
      <p class="antetitulo">Las 7 fugas de un negocio</p>
      <h2 id="fugas-titulo">${esc(titulo)}</h2>
      <p>${esc(subtitulo)}</p>
    </div>
    <div class="rejilla rejilla-fugas">
      ${problemas
        .map(
          (p, i) => `<a class="tarjeta tarjeta-fuga" href="${sector ? rutas.combo(sector, p) : rutas.problema(p)}" data-revelar style="--i:${i}">
        <span class="tarjeta-icono">${icono(iconoProblema[p.clave])}</span>
        <span class="tarjeta-villano">${esc(p.villano)}</span>
        <h3>${esc(p.nombre)}</h3>
        <p>${esc(sector ? p.escena(sector).split('. ')[0] + '.' : p.resumen)}</p>
        <span class="tarjeta-enlace">Ver cómo se resuelve ${icono('flecha', 'ico ico-flecha')}</span>
      </a>`,
        )
        .join('')}
    </div>
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
  const filasCuaderno = [
    ['Juan (vecino)', '350'],
    ['María G.', '120'],
    ['Don Pedro', '480'],
    ['Carlos – obra', '240'],
    ['Lucía', '95'],
  ];
  const filasApp = [
    ['Don Pedro', '480', 'Vence hoy', 'alerta'],
    ['Juan Pérez', '350', 'Vie 6 nov', ''],
    ['Carlos Ruiz', '240', 'Lun 9 nov', ''],
    ['María González', '120', 'Pagó 60', 'ok'],
  ];
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
              ${filasApp
                .map(
                  ([n, m, f, e]) =>
                    `<p class="app-fila ${e}"><span class="app-avatar">${n[0]}</span><span class="app-nombre">${n}<small>${f}</small></span><b>$${m}</b></p>`,
                )
                .join('')}
              <div class="app-cobrado" data-escena="4"><span>Cobrado esta semana</span><div class="barra-cobro"><i></i></div><b>80%</b></div>
            </div>
          </div>
          <div class="demo-hera">${hera('hera hera-demo')}</div>
          <p class="demo-ejemplo">Ejemplo</p>
        </div>
        <p class="demo-subtitulo" data-demo-subtitulo>${esc(guionDemo[0].texto)}</p>
        <button class="demo-play" type="button" data-demo-play aria-label="Reproducir la demostración">${icono('play')}</button>
      </div>`;
  return `<section class="seccion seccion-demo" id="demo" aria-labelledby="demo-titulo">
  <div class="contenedor">
    <div class="seccion-cabecera" data-revelar>
      <p class="antetitulo">Demostración</p>
      <h2 id="demo-titulo">Mira cómo Hera encuentra una fuga</h2>
      <p>En menos de un minuto: un negocio que vendía bien, un cuaderno de fiados y el dinero que nadie estaba cobrando.</p>
    </div>
    <div class="demo-marco" data-revelar>${reproductor}</div>
    <details class="transcripcion" data-revelar>
      <summary>Leer lo que dice la demostración</summary>
      <ol>${guionDemo.map(g => `<li>${esc(g.texto)}</li>`).join('')}</ol>
      <p class="nota">Las cifras son de un ejemplo narrado, no una promesa de resultado.</p>
    </details>
  </div>
</section>`;
}

function seccionPasos() {
  const pasos = [
    { icono: 'lapiz', titulo: 'Cuéntanos tu negocio', texto: 'Responde unas preguntas sencillas: sector, sucursales, equipo, productos y tu conexión a internet. Te toma unos 3 minutos.' },
    { icono: 'calendario', titulo: 'Lo armamos contigo', texto: 'Elige el día que te quede mejor. En la sesión cargamos lo esencial de tu negocio contigo, paso a paso.' },
    { icono: 'celularCheck', titulo: 'Vendes con control', texto: 'Desde ese día sabes cuánto vendes, cuánto ganas, quién te debe y qué se está acabando.' },
  ];
  return `<section class="seccion" id="como-funciona" aria-labelledby="pasos-titulo">
  <div class="contenedor">
    <div class="seccion-cabecera" data-revelar>
      <p class="antetitulo">Cómo funciona</p>
      <h2 id="pasos-titulo">Empezar es más fácil de lo que crees</h2>
    </div>
    <ol class="pasos">
      ${pasos
        .map(
          (p, i) => `<li class="paso" data-revelar style="--i:${i}">
        <span class="paso-numero">${i + 1}</span>
        <span class="tarjeta-icono">${icono(p.icono)}</span>
        <h3>${p.titulo}</h3>
        <p>${p.texto}</p>
      </li>`,
        )
        .join('')}
    </ol>
  </div>
</section>`;
}

function seccionFunciones(titulo = 'Todo tu negocio en un solo lugar') {
  return `<section class="seccion seccion-suave" id="funciones" aria-labelledby="funciones-titulo">
  <div class="contenedor">
    <div class="seccion-cabecera" data-revelar>
      <p class="antetitulo">Qué hace ${config.marca}</p>
      <h2 id="funciones-titulo">${esc(titulo)}</h2>
    </div>
    <div class="rejilla rejilla-funciones">
      ${funciones
        .map(
          (f, i) => `<article class="funcion" data-revelar style="--i:${i}">
        <span class="tarjeta-icono">${icono(f.icono)}</span>
        <h3>${f.titulo}</h3>
        <p>${f.texto}</p>
      </article>`,
        )
        .join('')}
    </div>
  </div>
</section>`;
}

function seccionCasos(filtroSector) {
  let casos = config.casos;
  if (filtroSector) {
    const propios = casos.filter(c => c.sector === filtroSector);
    casos = [...propios, ...casos.filter(c => c.sector !== filtroSector)];
  }
  const hayEjemplos = casos.some(c => !c.real);
  return `<section class="seccion" id="casos" aria-labelledby="casos-titulo">
  <div class="contenedor">
    <div class="seccion-cabecera" data-revelar>
      <p class="antetitulo">Casos de éxito</p>
      <h2 id="casos-titulo">Negocios como el tuyo que dejaron de perder dinero</h2>
      ${hayEjemplos ? '<p>Mientras publicamos los casos de nuestros clientes, estos ejemplos muestran el tipo de cambio que buscamos contigo.</p>' : ''}
    </div>
    <div class="rejilla rejilla-casos">
      ${casos
        .map(
          (c, i) => `<article class="caso" data-revelar style="--i:${i}">
        ${c.real ? '' : '<span class="etiqueta">Ejemplo ilustrativo</span>'}
        <p class="caso-cifra"><b>${esc(c.cifra)}</b> ${esc(c.cifraTexto)}</p>
        <blockquote><p>“${esc(c.cita)}”</p></blockquote>
        <dl class="caso-detalle">
          <div><dt>Antes</dt><dd>${esc(c.antes)}</dd></div>
          <div><dt>Ahora</dt><dd>${esc(c.despues)}</dd></div>
        </dl>
        <p class="caso-quien">${esc(c.persona)} · ${esc(c.negocio)} · ${esc(c.ciudad)}</p>
      </article>`,
        )
        .join('')}
    </div>
  </div>
</section>`;
}

function seccionSectores(pais) {
  return `<section class="seccion seccion-suave" id="sectores" aria-labelledby="sectores-titulo">
  <div class="contenedor">
    <div class="seccion-cabecera" data-revelar>
      <p class="antetitulo">Por sector</p>
      <h2 id="sectores-titulo">Hecho para el tipo de negocio que tienes${pais ? ` ${esc(pais.en)}` : ''}</h2>
    </div>
    <ul class="rejilla rejilla-sectores">
      ${sectores
        .map(
          (s, i) => `<li data-revelar style="--i:${i}"><a class="sector" href="${rutas.sector(s)}">${icono(s.icono)}<span>${esc(s.nombre)}</span></a></li>`,
        )
        .join('')}
    </ul>
    ${pais ? '' : `<h3 class="subtitulo-chico">Por país</h3>
    <ul class="chips">${paises.map(c => `<li><a class="chip" href="${rutas.pais(c)}">${esc(c.nombre)}</a></li>`).join('')}</ul>`}
  </div>
</section>`;
}

function seccionPreguntas(lista, titulo = 'Preguntas frecuentes') {
  return `<section class="seccion" id="preguntas" aria-labelledby="preguntas-titulo">
  <div class="contenedor contenedor-angosto">
    <div class="seccion-cabecera" data-revelar>
      <p class="antetitulo">Resolvemos tus dudas</p>
      <h2 id="preguntas-titulo">${esc(titulo)}</h2>
    </div>
    <div class="preguntas">
      ${lista
        .map(
          q => `<details class="pregunta" data-revelar>
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
  return `<section class="seccion seccion-cta" aria-labelledby="cta-titulo">
  <div class="contenedor cta" data-revelar>
    ${hera('hera hera-cta')}
    <h2 id="cta-titulo">${esc(titulo)}</h2>
    <p>Responde unas preguntas y elige: reservar un día para armar tu negocio con nosotros o escribirnos ahora mismo.</p>
    <div class="acciones">${botonEmpezar({ texto: 'Empezar ahora', extra })}${botonWhatsapp({ extra })}</div>
    <p class="nota">Sin compromiso · Te responde una persona · ${config.whatsappVisible}</p>
  </div>
</section>`;
}

function hero({ antetitulo, titulo, texto, extra = '' }) {
  return `<section class="hero" aria-labelledby="hero-titulo">
  <div class="contenedor hero-in">
    <div class="hero-texto">
      <p class="antetitulo">${esc(antetitulo)}</p>
      <h1 id="hero-titulo">${titulo}</h1>
      <p class="hero-bajada">${esc(texto)}</p>
      <div class="acciones">${botonEmpezar({ extra })}${botonWhatsapp({ extra })}</div>
      <ul class="hero-senales">
        <li>${icono('reloj', 'ico')}3 minutos</li>
        <li>${icono('usuarios', 'ico')}Te acompañamos</li>
        <li>${icono('celular', 'ico')}Desde el celular</li>
      </ul>
    </div>
    <div class="hero-visual" aria-hidden="true">
      <div class="hero-halo"></div>
      ${hera('hera hera-hero')}
      <div class="globo globo-1"><span class="globo-punto alerta"></span><div><small>Fuga detectada</small><b>Fiados sin cobrar · $412</b></div></div>
      <div class="globo globo-2"><span class="globo-punto"></span><div><small>Stock bajo</small><b>Aceite 1 L · quedan 4</b></div></div>
      <div class="globo globo-3"><span class="globo-punto ok"></span><div><small>Caja cerrada</small><b>Cuadró en 4 minutos</b></div></div>
    </div>
  </div>
</section>`;
}

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
  antetitulo: 'Para tiendas, cafeterías, ferreterías y todo tipo de negocio',
  titulo: 'Tu negocio vende.<br><em>¿Sabes dónde se escapa el dinero?</em>',
  texto: 'Fiados que nadie cobra, inventario que no cuadra, una caja que no cierra. SmartBusiness y Hera, su asistente con inteligencia artificial, te muestran cada fuga y te ayudan a cerrarla. Te acompañamos a armarlo, paso a paso.',
})}
${seccionFugas()}
${demo()}
${seccionPasos()}
${seccionFunciones()}
${seccionCasos()}
${seccionSectores()}
${seccionPreguntas(preguntas)}
${ctaFinal()}`;
  return layout({ titulo, descripcion, ruta: '/', jsonld: ld, contenido });
}

function bloqueTexto({ id, antetitulo, titulo, parrafos = [], lista, listaOrdenada, clase = '' }) {
  const items = lista || listaOrdenada;
  const tag = listaOrdenada ? 'ol' : 'ul';
  return `<section class="seccion ${clase}" ${id ? `id="${id}"` : ''} aria-labelledby="${id || ''}-t">
  <div class="contenedor contenedor-angosto texto-largo" data-revelar>
    ${antetitulo ? `<p class="antetitulo">${esc(antetitulo)}</p>` : ''}
    <h2 id="${id || ''}-t">${esc(titulo)}</h2>
    ${parrafos.map(p => `<p>${esc(p)}</p>`).join('')}
    ${items ? `<${tag} class="lista-check">${items.map(t => `<li>${icono(listaOrdenada ? 'flecha' : 'check')}<span>${esc(t)}</span></li>`).join('')}</${tag}>` : ''}
  </div>
</section>`;
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
  antetitulo: s.nombre,
  titulo: `Sistema de gestión para ${esc(s.plural)}.<br><em>Deja de perder dinero sin saber dónde.</em>`,
  texto: s.contexto,
  extra: s.su,
})}
${seccionFugas({ titulo: `Las fugas más comunes en ${s.plural}`, subtitulo: `Cada una tiene solución. Toca la que más se parece a lo que pasa en ${s.su}.`, sector: s })}
${bloqueTexto({
  id: 'como-ayuda',
  antetitulo: `${config.marca} para ${s.corto}`,
  titulo: `Cómo te ayuda en ${s.su}`,
  parrafos: [
    `${mayus(s.su)} tiene su propio ritmo: ${s.productos}, ${s.clientes} y ${s.lugar}. Por eso no empezamos con una configuración genérica: antes de la sesión te preguntamos cuántas sucursales tienes, cuántas personas trabajan contigo, cuántos ${s.unidad === 'platos' ? 'platos tiene tu carta' : `${s.unidad} vendes`} y cómo es tu conexión a internet.`,
  ],
  lista: funciones.slice(0, 6).map(f => `${f.titulo}: ${f.texto}`),
})}
${demo()}
${seccionCasos(s.slug)}
${seccionPreguntas(faq, `Preguntas sobre ${s.plural}`)}
${ctaFinal({ titulo: `Arma ${s.su} con nosotros`, extra: s.su })}`;
  return layout({
    titulo,
    descripcion,
    ruta,
    jsonld: [paginaLd(ruta, titulo, descripcion), softwareLd(), faqLd(faq)],
    contenido,
    pagina: { sector: s.slug },
    migasItems,
  });
}

export function paginaProblema(p) {
  const ruta = rutas.problema(p);
  const titulo = `${p.titulo}: ${p.hook} | ${config.marca}`;
  const descripcion = `${p.hook} ${p.resumen.split('. ')[0]}. Resuélvelo con ${config.marca}: ${p.funcion.toLowerCase()}.`;
  const generico = { su: 'tu negocio', plural: 'negocios', clientes: 'tus clientes', venta: 'un producto', productos: 'tus productos', lugar: 'el almacén', unidad: 'productos' };
  const faq = p.faq(generico);
  const migasItems = [{ nombre: 'Problemas', ruta: '/#fugas' }, { nombre: p.nombre, ruta }];
  const contenido = `
${hero({ antetitulo: p.villano, titulo: `${esc(p.titulo)}.<br><em>${esc(p.hook)}</em>`, texto: p.resumen })}
${bloqueTexto({ id: 'escena', antetitulo: 'Así se ve', titulo: '¿Te suena esta escena?', parrafos: [p.escena(generico)] })}
${bloqueTexto({ id: 'sintomas', antetitulo: 'Señales', titulo: 'Señales de que te está pasando', lista: p.sintomas(generico), clase: 'seccion-suave' })}
${bloqueTexto({ id: 'causa', antetitulo: 'Por qué pasa', titulo: 'La causa real (y no es la que parece)', parrafos: [p.causa()] })}
${bloqueTexto({ id: 'solucion', antetitulo: 'Cómo se resuelve', titulo: `Cómo lo resuelve ${config.marca}`, listaOrdenada: p.pasos(generico), clase: 'seccion-suave' })}
<section class="seccion" aria-labelledby="por-sector-t">
  <div class="contenedor">
    <div class="seccion-cabecera" data-revelar><p class="antetitulo">Por sector</p><h2 id="por-sector-t">${esc(p.nombre)} en tu tipo de negocio</h2></div>
    <ul class="rejilla rejilla-sectores">${sectores
      .map((s, i) => `<li data-revelar style="--i:${i}"><a class="sector" href="${rutas.combo(s, p)}">${icono(s.icono)}<span>${esc(s.nombre)}</span></a></li>`)
      .join('')}</ul>
  </div>
</section>
${seccionPreguntas(faq, `Preguntas sobre ${p.nombre.toLowerCase()}`)}
${ctaFinal({ titulo: `Cierra la fuga de ${p.nombre.toLowerCase()}` })}`;
  return layout({
    titulo,
    descripcion,
    ruta,
    jsonld: [paginaLd(ruta, titulo, descripcion), faqLd(faq)],
    contenido,
    pagina: { problema: p.clave },
    migasItems,
  });
}

export function paginaCombo(s, p) {
  const ruta = rutas.combo(s, p);
  const h1 = p.tituloPara(s);
  const titulo = `${h1} | ${config.marca}`;
  const descripcion = `${p.hook} ${config.marca} lo resuelve en ${s.plural} con ${p.funcion.toLowerCase()}. Empieza en 3 minutos.`;
  const faq = p.faq(s);
  const otros = problemas.filter(o => o.slug !== p.slug);
  const migasItems = [
    { nombre: 'Sectores', ruta: '/#sectores' },
    { nombre: s.nombre, ruta: rutas.sector(s) },
    { nombre: p.nombre, ruta },
  ];
  const contenido = `
${hero({ antetitulo: `${s.nombre} · ${p.villano}`, titulo: `${esc(h1)}.<br><em>${esc(p.hook)}</em>`, texto: p.escena(s), extra: s.su })}
${bloqueTexto({ id: 'sintomas', antetitulo: 'Señales', titulo: `Señales de ${p.nombre.toLowerCase()} en ${s.su}`, lista: p.sintomas(s), clase: 'seccion-suave' })}
${bloqueTexto({ id: 'causa', antetitulo: 'Por qué pasa', titulo: `Por qué pasa en ${s.plural}`, parrafos: [p.causa(s), s.contexto] })}
${bloqueTexto({ id: 'solucion', antetitulo: 'Cómo se resuelve', titulo: `Cómo lo resuelve ${config.marca} en ${s.su}`, listaOrdenada: p.pasos(s), clase: 'seccion-suave' })}
${seccionCasos(s.slug)}
${seccionPreguntas(faq, `Preguntas sobre ${p.nombre.toLowerCase()} en ${s.plural}`)}
<section class="seccion seccion-suave" aria-labelledby="otras-t">
  <div class="contenedor">
    <div class="seccion-cabecera" data-revelar><p class="antetitulo">Otras fugas</p><h2 id="otras-t">Otras fugas comunes en ${esc(s.plural)}</h2></div>
    <ul class="chips">${otros.map(o => `<li><a class="chip" href="${rutas.combo(s, o)}">${esc(o.nombre)}</a></li>`).join('')}</ul>
  </div>
</section>
${ctaFinal({ titulo: `Cierra esta fuga en ${s.su}`, extra: s.su })}`;
  return layout({
    titulo,
    descripcion,
    ruta,
    jsonld: [paginaLd(ruta, h1, descripcion), faqLd(faq)],
    contenido,
    pagina: { sector: s.slug, problema: p.clave },
    migasItems,
  });
}

export function paginaPais(c) {
  const ruta = rutas.pais(c);
  const titulo = `Sistema de gestión para negocios ${c.en}: inventario, caja y fiados | ${config.marca}`;
  const descripcion = `Sistema para tiendas, ferreterías, restaurantes y pymes ${c.en}: ventas en ${c.monedas.join(' y ')}, inventario, caja y fiados desde el celular.`;
  const faq = [
    { p: `¿SmartBusiness funciona ${c.en}?`, r: `Sí. Trabajamos con negocios ${c.en}. ${c.nota}` },
    { p: `¿Puedo cobrar en ${c.monedas.join(' y ')}?`, r: c.monedas.length > 1 ? `Sí. Cada cobro guarda su moneda y ves el saldo de ${c.monedas.join(', ')} por separado.` : `Sí. Además, si algún cliente paga en otra moneda, el cobro guarda la moneda en que lo recibiste.` },
    { p: '¿La atención es en español?', r: `Sí. Te atiende una persona del equipo por WhatsApp (${config.whatsappVisible}) y la sesión para armar tu negocio es en español.` },
    { p: `¿Sirve para la facturación o los impuestos ${c.en}?`, r: `${config.marca} te da el control del día a día: ventas, caja, inventario y ganancia. Las obligaciones fiscales ${c.en} las sigue llevando tu contador; si tienes una necesidad específica, pregúntanos en la sesión.` },
  ];
  const migasItems = [{ nombre: 'Países', ruta: '/#sectores' }, { nombre: c.nombre, ruta }];
  const contenido = `
${hero({
  antetitulo: `${config.marca} ${c.en}`,
  titulo: `Sistema de gestión para negocios ${esc(c.en)}.<br><em>Ventas, caja, inventario y fiados en un solo lugar.</em>`,
  texto: `${c.nota} Controla lo que vendes en ${c.monedas.join(' y ')}, sabe cuánto ganas y quién te debe, desde el celular.`,
  extra: `mi negocio ${c.en}`,
})}
${seccionFugas()}
${seccionSectores(c)}
${seccionFunciones(`Todo tu negocio ${c.en} en un solo lugar`)}
${seccionCasos()}
${seccionPreguntas(faq, `Preguntas de negocios ${c.en}`)}
${ctaFinal({ extra: `mi negocio ${c.en}` })}`;
  return layout({
    titulo,
    descripcion,
    ruta,
    jsonld: [paginaLd(ruta, titulo, descripcion), softwareLd(), faqLd(faq)],
    contenido,
    pagina: { pais: c.slug },
    migasItems,
  });
}
