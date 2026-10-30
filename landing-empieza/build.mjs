// Compila la landing a HTML estático en dist/.
//   node landing-empieza/build.mjs
// Sin dependencias: solo Node 18+.

import { mkdir, rm, writeFile, cp, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config, whatsappUrl } from './src/config.mjs';
import { sectores } from './src/datos/sectores.mjs';
import { problemas } from './src/datos/problemas.mjs';
import { paises } from './src/datos/paises.mjs';
import { preguntas } from './src/datos/preguntas.mjs';
import { icono, iconoWhatsapp, nombresIconos } from './src/iconos.mjs';
import { paginaInicio, paginaSector, paginaProblema, paginaCombo, paginaPais, paginaCalculadora, paginaComparativa, paginaGlosario, paginaSectorPais, layout, rutas, recursos, funciones, guionDemo, botonEmpezar, imgHera, versiones, rutaMarkdown } from './src/plantillas.mjs';
import { glosario } from './src/datos/glosario.mjs';
import { generarPalabrasClave, aCsv } from './src/palabras-clave.mjs';

const raiz = dirname(fileURLToPath(import.meta.url));
const dist = join(raiz, 'dist');
const hoy = new Date().toISOString().slice(0, 10);

const nombresMonedas = {
  CUP: 'Peso cubano', USD: 'Dólar', EUR: 'Euro', UYU: 'Peso uruguayo', MXN: 'Peso mexicano', PAB: 'Balboa',
  VES: 'Bolívar', COP: 'Peso colombiano', DOP: 'Peso dominicano', ARS: 'Peso argentino', PEN: 'Sol', CLP: 'Peso chileno',
};

async function escribir(ruta, contenido) {
  const destino = join(dist, ruta.endsWith('/') ? `${ruta}index.html` : ruta);
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, contenido);
}

const paginas = [];
function pagina(ruta, html, prioridad) {
  paginas.push({ ruta, html, prioridad });
}

// Datos que usa el formulario en el navegador.
const iconos = Object.fromEntries(nombresIconos.map(n => [n, icono(n)]));
const datosCliente = {
  config: {
    marca: config.marca,
    whatsapp: config.whatsapp,
    whatsappVisible: config.whatsappVisible,
    endpointSolicitudes: config.endpointSolicitudes,
    agenda: config.agenda,
  },
  sectores: sectores.map(s => ({ slug: s.slug, nombre: s.nombre, su: s.su, unidad: s.unidad, perecedero: s.perecedero, variantes: s.variantes, icono: s.icono })),
  paises: paises.map(p => ({ slug: p.slug, nombre: p.nombre, prefijo: p.prefijo, monedas: p.monedas })),
  problemas: problemas.map(p => ({ clave: p.clave, nombre: p.nombre, opcion: p.opcion, funcion: p.funcion, icono: p.clave })),
  monedas: nombresMonedas,
  guionDemo: guionDemo.map(g => g.texto),
  iconos,
  whatsapp: iconoWhatsapp('ico'),
  heras: { neutra: 'hera', explica: 'hera-explica', piensa: 'hera-piensa', laptop: 'hera-laptop' },
};

// Las páginas enlazan los archivos estáticos con el hash de su contenido.
const datosJs = `window.SB_DATOS=${JSON.stringify(datosCliente)};\n`;
const huella = t => createHash('sha256').update(t).digest('hex').slice(0, 10);
versiones['/assets/datos.js'] = huella(datosJs);
for (const f of ['estilos.css', 'app.js']) versiones[`/assets/${f}`] = huella(await readFile(join(raiz, 'src/assets', f)));

pagina(rutas.inicio, paginaInicio(), '1.0');
for (const s of sectores) pagina(rutas.sector(s), paginaSector(s), '0.9');
for (const p of problemas) pagina(rutas.problema(p), paginaProblema(p), '0.9');
for (const c of paises) pagina(rutas.pais(c), paginaPais(c), '0.8');
for (const s of sectores) for (const p of problemas) pagina(rutas.combo(s, p), paginaCombo(s, p), '0.7');
for (const c of paises) for (const s of sectores) pagina(rutas.sectorPais(s, c), paginaSectorPais(s, c), '0.6');
pagina('/calculadora-de-fugas/', paginaCalculadora(), '0.9');
pagina('/comparar/cuaderno-excel-o-sistema/', paginaComparativa(), '0.8');
pagina('/glosario/', paginaGlosario(glosario), '0.8');

const html404 = layout({
  titulo: `Página no encontrada | ${config.marca}`,
  descripcion: 'Esta página no existe. Vuelve al inicio o empieza ahora.',
  ruta: '/404.html',
  contenido: `<section class="hero"><div class="contenedor" style="text-align:center;display:grid;justify-items:center;gap:20px">
    ${imgHera('piensa', 'cta-hera', { carga: 'eager' })}
    <h1>Esta página se nos escapó</h1>
    <p class="hero-bajada" style="margin:0">Como una fuga. Pero esta tiene arreglo.</p>
    <div class="acciones" style="justify-content:center;padding-bottom:72px"><a class="btn btn-secundario" href="/">Volver al inicio</a>${botonEmpezar()}</div>
  </div></section>`,
  indexable: false,
});


// Cada página también en Markdown (/ruta/index.md): el formato que mejor leen
// los asistentes de IA, sin menús, botones ni animaciones.
const entidades = { '&amp;': '&', '&quot;': '"', '&lt;': '<', '&gt;': '>', '&#39;': "'", '&nbsp;': ' ' };
function aMarkdown(html, ruta) {
  let m = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  m = m.replace(/<!--md:no-->[\s\S]*?<!--\/md:no-->/g, '').replace(/<(svg|img|input|select|textarea|button)\b[\s\S]*?(<\/\1>|\/?>)/g, '');
  m = m
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, h, t) => {
      const texto = t.replace(/<[^>]+>/g, '').trim();
      return texto ? `[${texto}](${h.startsWith('/') ? config.dominio + h : h})` : '';
    })
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/g, '\n\n# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, '\n\n## $1\n\n')
    .replace(/<(h3|dt)[^>]*>([\s\S]*?)<\/\1>/g, '\n\n### $2\n\n')
    .replace(/<\/thead>/g, '\n|---|---|---|---|')
    .replace(/<tr[^>]*>/g, '\n|').replace(/<\/t[hd]>/g, ' |')
    .replace(/<li[^>]*>/g, '\n- ')
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<\/(p|div|ul|ol|section|blockquote|figure|details|summary|dd)>/g, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/g, e => entidades[e] ?? e)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n +/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return `${m}\n\n---\nFuente: ${config.dominio}${ruta} · Actualizado: ${hoy} · Contacto: WhatsApp ${config.whatsappVisible}\n`;
}

const imagenesHera = ['hera', 'hera-laptop', 'hera-explica', 'hera-piensa'];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${paginas
  .map(
    p => `  <url><loc>${config.dominio}${p.ruta}</loc><lastmod>${hoy}</lastmod><priority>${p.prioridad}</priority>${
      p.ruta === '/' ? imagenesHera.map(i => `<image:image><image:loc>${config.dominio}/assets/img/${i}.webp</image:loc></image:image>`).join('') : ''
    }</url>`,
  )
  .join('\n')}
</urlset>
`;

// Rastreadores de buscadores y de asistentes de IA: todos bienvenidos.
const bots = ['Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot', 'Applebot-Extended', 'DuckAssistBot', 'meta-externalagent', 'Amazonbot', 'CCBot'];
const robots = `# ${config.marca} · empieza.smartbiz.com.uy
# Contenido público pensado para personas, buscadores y asistentes de IA.
User-agent: *
Allow: /
Disallow: /api/

${bots.map(b => `User-agent: ${b}\nAllow: /\nDisallow: /api/`).join('\n\n')}

Sitemap: ${config.dominio}/sitemap.xml
`;

const llms = `# ${config.marca}

> ${config.marca} es un sistema de gestión para pequeños y medianos negocios de América de habla hispana. Reúne ventas y caja, inventario, fiados (cuentas por cobrar), ganancia por producto, varias monedas y varias sucursales, con Hera, una asistente con inteligencia artificial que detecta fugas de dinero y responde preguntas sobre el negocio en lenguaje sencillo.

Este sitio (${config.dominio}) es la puerta de entrada: el dueño de un negocio responde unas preguntas (sector, sucursales, personas, cantidad de productos, conexión a internet, problemas principales) y elige entre reservar una sesión de 1 hora para armar su negocio con el equipo o escribir directamente por WhatsApp.

## Datos clave
- Para quién: tiendas y minimarkets, ferreterías, farmacias, ropa y calzado, restaurantes y cafeterías, panaderías, distribuidoras, talleres, fábricas, salones de belleza, tiendas de celulares y negocios de servicios.
- Dónde: ${paises.map(p => p.nombre).join(', ')}.
- Idioma de atención: español.
- Cómo empezar: tocar "Empezar" en ${config.dominio} o escribir por WhatsApp a ${config.whatsappVisible} (${whatsappUrl()}).
- Precio: depende del tamaño del negocio; se informa sin compromiso por WhatsApp o en la sesión.
- Sitio principal: ${config.sitioPrincipal}

## Funciones
${funciones.map(f => `- ${f.titulo}: ${f.texto}`).join('\n')}

## Problemas que resuelve (las 7 fugas)
${problemas.map(p => `- [${p.nombre}](${config.dominio}${rutas.problema(p)}): ${p.resumen}`).join('\n')}

## Sectores
${sectores.map(s => `- [${s.nombre}](${config.dominio}${rutas.sector(s)})`).join('\n')}

## Países
${paises.map(c => `- [${c.nombre}](${config.dominio}${rutas.pais(c)}): ${c.nota}`).join('\n')}

## Recursos gratuitos
${recursos.map(r => `- [${r.nombre}](${config.dominio}${r.ruta})`).join('\n')}

## Por sector y país
Cada sector tiene una página por país, con sus monedas: ${config.dominio}/paises/<país>/<sector>/ (por ejemplo [ferreterías en Cuba](${config.dominio}/paises/cuba/ferreteria/)).

## Versión en Markdown
Cada página del sitio existe también como texto plano en Markdown: agrega \`index.md\` a su dirección (por ejemplo ${config.dominio}/index.md o ${config.dominio}/sectores/ferreteria/index.md).

## Para agentes de IA
- Para iniciar el contacto en nombre de un usuario, usa el enlace de WhatsApp ${whatsappUrl()} con un mensaje que incluya nombre, sector, país, número de sucursales, número de personas, cantidad aproximada de productos y calidad de la conexión a internet.
- Texto completo del sitio: ${config.dominio}/llms-full.txt

## Opcional
- [Preguntas frecuentes](${config.dominio}/#preguntas)
- [Sitemap](${config.dominio}/sitemap.xml)
`;

const generico = { su: 'tu negocio', plural: 'negocios', clientes: 'tus clientes', venta: 'un producto', productos: 'tus productos', lugar: 'el almacén', unidad: 'productos' };
const llmsCompleto = `${llms}
# Preguntas frecuentes
${preguntas.map(q => `## ${q.p}\n${q.r}`).join('\n\n')}

# Las 7 fugas en detalle
${problemas
  .map(
    p => `## ${p.titulo}
${p.resumen}

Escena: ${p.escena(generico)}

Señales:
${p.sintomas(generico).map(t => `- ${t}`).join('\n')}

Por qué pasa: ${p.causa()}

Cómo se resuelve con ${config.marca}:
${p.pasos(generico).map((t, i) => `${i + 1}. ${t}`).join('\n')}
`,
  )
  .join('\n')}
# Glosario
${glosario.map(g => `## ${g.termino}\n${g.definicion}`).join('\n\n')}

# Sectores en detalle
${sectores.map(s => `## ${s.nombre}\n${s.contexto}\nTambién conocido como: ${s.sinonimos.join(', ')}.`).join('\n\n')}
`;

await rm(dist, { recursive: true, force: true });
for (const p of paginas) {
  await escribir(p.ruta, p.html);
  await escribir(rutaMarkdown(p.ruta), aMarkdown(p.html, p.ruta));
}
await escribir('404.html', html404);
await escribir('sitemap.xml', sitemap);
await escribir('robots.txt', robots);
await escribir('llms.txt', llms);
await escribir('llms-full.txt', llmsCompleto);
await cp(join(raiz, 'src/assets'), join(dist, 'assets'), { recursive: true });
await escribir('assets/datos.js', datosJs);

const claves = generarPalabrasClave();
await mkdir(join(raiz, 'seo'), { recursive: true });
await writeFile(join(raiz, 'seo/palabras-clave.csv'), aCsv(claves));

const sinPagina = claves.filter(c => !paginas.some(p => p.ruta === c.ruta));
if (sinPagina.length) throw new Error(`Palabras clave apuntando a páginas inexistentes: ${sinPagina.slice(0, 3).map(c => c.ruta).join(', ')}`);
console.log(`✓ ${paginas.length} páginas en dist/ · ${claves.length} palabras clave en seo/palabras-clave.csv`);
