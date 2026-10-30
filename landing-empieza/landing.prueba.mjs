/**
 * Pruebas de la landing empieza.smartbiz.com.uy.
 *
 * Lo que importa: que ninguna solicitud con datos raros rompa el correo o
 * inyecte HTML, y que cada página tenga lo que buscadores e IAs necesitan
 * (un solo h1, canonical, datos estructurados válidos, título único).
 *
 *   node landing-empieza/landing.prueba.mjs
 */
import { validarSolicitud, construirCorreo } from './solicitud.mjs';
import { sectores } from './src/datos/sectores.mjs';
import { problemas } from './src/datos/problemas.mjs';
import { paises } from './src/datos/paises.mjs';
import { paginaInicio, paginaSector, paginaProblema, paginaCombo, paginaPais, paginaCalculadora, paginaComparativa, paginaGlosario, paginaSectorPais, rutas, calcularFugas, calcDefecto } from './src/plantillas.mjs';
import { glosario } from './src/datos/glosario.mjs';
import { generarPalabrasClave } from './src/palabras-clave.mjs';

let fallos = 0;
let pruebas = 0;

function comprobar(descripcion, condicion, detalle) {
  pruebas++;
  if (condicion) console.log(`  ok   ${descripcion}`);
  else {
    fallos++;
    console.log(`  FALLO ${descripcion}`, detalle !== undefined ? JSON.stringify(detalle) : '');
  }
}

const base = {
  tipo: 'formulario',
  nombre: 'María Pérez',
  telefono: '+53 59079144',
  negocio: 'Mini Súper La Esquina',
  respuestas: [{ pregunta: 'Sector', respuesta: 'Tienda, almacén o minimarket' }, { pregunta: 'Conexión a internet', respuesta: 'Más o menos' }],
  tamano: 'pequeno',
};

console.log('\nValidación de solicitudes');
{
  const v = validarSolicitud(base);
  comprobar('una solicitud normal es válida', v.ok && !v.bot);
  comprobar('el WhatsApp queda solo con dígitos', v.datos.whatsapp === '5359079144', v.datos.whatsapp);
  comprobar('el tamaño se traduce', v.datos.tamano === 'Pequeño');
  comprobar('rechaza tipos desconocidos', !validarSolicitud({ ...base, tipo: 'hack' }).ok);
  comprobar('rechaza teléfonos cortos', !validarSolicitud({ ...base, telefono: '123' }).ok);
  comprobar('rechaza sin nombre', !validarSolicitud({ ...base, nombre: ' ' }).ok);
  comprobar('rechaza cuerpo que no es objeto', !validarSolicitud('hola').ok && !validarSolicitud(null).ok);
  comprobar('marca como bot si rellena el campo trampa', validarSolicitud({ ...base, sitio: 'http://spam' }).bot === true);
  const largo = validarSolicitud({ ...base, nombre: 'x'.repeat(500), respuestas: Array.from({ length: 100 }, () => ({ pregunta: 'P', respuesta: 'r' })) });
  comprobar('recorta textos largos', largo.datos.nombre.length === 80);
  comprobar('limita la cantidad de respuestas', largo.datos.respuestas.length === 40);
  comprobar('la reserva solo cuenta en solicitudes de reserva', validarSolicitud({ ...base, reserva: 'lunes' }).datos.reserva === '');
}

console.log('\nCorreo');
{
  const malicioso = validarSolicitud({ ...base, tipo: 'reserva', reserva: 'jueves 5, 10:00', negocio: '<script>alert(1)</script>', respuestas: [{ pregunta: 'Sector', respuesta: '<img src=x onerror=alert(1)>' }] }).datos;
  const { asunto, plano, html } = construirCorreo(malicioso, new Date('2026-11-05T14:00:00Z'));
  comprobar('el HTML escapa lo que escribe el cliente', !html.includes('<script>') && !html.includes('<img src=x') && html.includes('&lt;script&gt;'));
  comprobar('el asunto dice que es una reserva y cuándo', asunto.startsWith('Nueva reserva de sesión') && asunto.includes('jueves 5, 10:00'), asunto);
  comprobar('el texto plano incluye el enlace de WhatsApp', plano.includes('https://wa.me/5359079144'));
  comprobar('incluye las respuestas', plano.includes('Sector: <img'));
  const normal = construirCorreo(validarSolicitud(base).datos);
  comprobar('una solicitud de formulario no habla de reserva', normal.asunto.startsWith('Nueva solicitud') && !normal.plano.includes('Sesión reservada'));
}

console.log('\nPáginas');
{
  const paginas = [
    ['/', paginaInicio()],
    ...sectores.map(s => [rutas.sector(s), paginaSector(s)]),
    ...problemas.map(p => [rutas.problema(p), paginaProblema(p)]),
    ...paises.map(c => [rutas.pais(c), paginaPais(c)]),
    ...sectores.flatMap(s => problemas.map(p => [rutas.combo(s, p), paginaCombo(s, p)])),
    ...paises.flatMap(c => sectores.map(s => [rutas.sectorPais(s, c), paginaSectorPais(s, c)])),
    ['/calculadora-de-fugas/', paginaCalculadora()],
    ['/comparar/cuaderno-excel-o-sistema/', paginaComparativa()],
    ['/glosario/', paginaGlosario(glosario)],
  ];
  comprobar('se generan todas las páginas', paginas.length === 4 + sectores.length + problemas.length + paises.length + sectores.length * problemas.length + paises.length * sectores.length, paginas.length);

  const titulos = new Set();
  const problemasPagina = [];
  for (const [ruta, html] of paginas) {
    const h1 = (html.match(/<h1[\s>]/g) || []).length;
    const titulo = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const canonical = html.includes(`<link rel="canonical" href="https://empieza.smartbiz.com.uy${ruta}">`);
    let ldOk = false;
    try {
      const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.+?)<\/script>/s)[1]);
      ldOk = Array.isArray(ld['@graph']) && ld['@graph'].length >= 3;
    } catch { /* queda en false */ }
    const sinIndefinidos = !/undefined|NaN|\[object Object\]/.test(html);
    if (h1 !== 1 || !titulo || titulos.has(titulo) || !canonical || !ldOk || !sinIndefinidos) problemasPagina.push({ ruta, h1, titulo, canonical, ldOk, sinIndefinidos });
    titulos.add(titulo);
  }
  comprobar('cada página tiene un h1, título único, canonical y JSON-LD válido, sin "undefined"', problemasPagina.length === 0, problemasPagina.slice(0, 3));
  comprobar('las descripciones caben en el resultado de Google (≤ 160)', paginas.every(([, h]) => (h.match(/name="description" content="([^"]+)"/)?.[1].replace(/&quot;/g, '"').length || 0) <= 160));
  comprobar('el botón Empezar funciona sin JavaScript (lleva a WhatsApp)', paginas.every(([, h]) => /<a class="btn btn-[a-z]+" href="https:\/\/wa\.me\/5359079144\?text=[^"]+" data-empezar>/.test(h)));
}

console.log('\nPalabras clave');
{
  const claves = generarPalabrasClave();
  const rutasValidas = new Set(['/', '/calculadora-de-fugas/', '/comparar/cuaderno-excel-o-sistema/', '/glosario/', ...sectores.map(rutas.sector), ...problemas.map(rutas.problema), ...paises.map(rutas.pais), ...sectores.flatMap(s => problemas.map(p => rutas.combo(s, p))), ...paises.flatMap(c => sectores.map(s => rutas.sectorPais(s, c)))]);
  comprobar('hay más de 2.000 palabras clave', claves.length > 2000, claves.length);
  comprobar('todas apuntan a una página que existe', claves.every(c => rutasValidas.has(c.ruta)));
  comprobar('no hay repetidas', new Set(claves.map(c => c.palabra)).size === claves.length);
  comprobar('cada página recibe al menos una palabra clave', [...rutasValidas].every(r => claves.some(c => c.ruta === r)));
}

console.log('\nCalculadora');
{
  const r = calcularFugas(calcDefecto);
  comprobar('el ejemplo da la cuenta esperada', Math.round(r.fiado) === 120 && r.merma === 100 && r.caja === 130 && Math.round(r.total) === 428, r);
  comprobar('el anual es doce meses', Math.round(r.anual) === Math.round(r.total * 12));
  const cero = calcularFugas({ ventas: 0, fiado: 0, incobrable: 0, inventario: 0, merma: 0, caja: 0, horas: 0, valorHora: 0 });
  comprobar('todo en cero da cero', cero.total === 0);
}

console.log(`\n${pruebas - fallos}/${pruebas} pruebas pasan.`);
if (fallos) process.exit(1);
