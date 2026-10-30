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
import { validarEventos, analizar } from './servidor/telemetria.mjs';
import { listarReservas, citasPorAvisar } from './servidor/reservas.mjs';
import { inicioCita } from './servidor/zona.mjs';
import { crearAlmacen } from './servidor/almacen.mjs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

console.log('\nTelemetría');
{
  const ahora = new Date('2026-10-30T15:00:00Z');
  const lote = { eventos: [
    { e: 'vista', s: 'sesion0001', v: 'visita0001', r: '/', d: { ruta: '/', disp: 'celular', inventado: 'x' } },
    { e: 'respuesta', s: 'sesion0001', v: 'visita0001', d: { paso: 'nombre', valor: 'María' } },
    { e: 'respuesta', s: 'sesion0001', v: 'visita0001', d: { paso: 'sector', valor: 'ferreteria' } },
    { e: 'borrarTodo', s: 'sesion0001', v: 'visita0001' },
    { e: 'vista', s: 'X', v: 'visita0001' },
  ] };
  const ok = validarEventos(lote, ahora);
  comprobar('solo pasan eventos conocidos con ids válidos', ok.length === 2, ok.map(e => e.e));
  comprobar('descarta propiedades que no están en el esquema', !('inventado' in ok[0].d));
  comprobar('nunca guarda lo que se escribe a mano (nombre)', !ok.some(e => e.d.paso === 'nombre'));
  comprobar('la hora es la del servidor', ok[0].f === ahora.toISOString());

  const ev = [
    { f: '2026-10-29T15:00:00Z', e: 'vista', s: 'a', v: 'va', d: { ruta: '/', disp: 'celular' } },
    { f: '2026-10-29T15:01:00Z', e: 'empezar', s: 'a', v: 'va', d: { origen: 'hero' } },
    { f: '2026-10-29T15:02:00Z', e: 'paso', s: 'a', v: 'va', d: { paso: 'sector' } },
    { f: '2026-10-29T15:03:00Z', e: 'paso', s: 'a', v: 'va', d: { paso: 'internet' } },
    { f: '2026-10-29T16:00:00Z', e: 'vista', s: 'b', v: 'vb', d: { ruta: '/', disp: 'computadora' } },
    { f: '2026-10-29T16:01:00Z', e: 'empezar', s: 'b', v: 'vb', d: {} },
    { f: '2026-10-29T16:02:00Z', e: 'resultado', s: 'b', v: 'vb', d: {} },
  ];
  const so = [{ fecha: '2026-10-29T16:02:00Z', tipo: 'formulario', respuestas: [{ pregunta: 'Lo que más le preocupa', respuesta: 'A, B', valores: ['Fiados', 'Caja'] }] }];
  const a = analizar({ eventos: ev, solicitudes: so, desde: '2026-10-29T04:00:00Z', hasta: '2026-10-30T04:00:00Z', zona: 'America/Havana' });
  comprobar('cuenta visitantes y solicitudes', a.totales.visitantes === 2 && a.totales.solicitudes === 1, a.totales);
  comprobar('el embudo baja de 2 visitas a 1 que terminó', a.embudo[0].sesiones === 2 && a.embudo.find(x => x.id === 'envio').sesiones === 1);
  comprobar('el abandono apunta a la última pregunta vista', a.abandono[0]?.nombre === 'internet', a.abandono);
  comprobar('las respuestas múltiples se cuentan por opción', a.formulario[0].respuestas.length === 2);
  comprobar('la serie diaria usa el día del negocio', a.serie.length === 1 && a.serie[0].dia === '2026-10-29', a.serie);
}

console.log('\nAvisos de citas');
{
  const zona = 'America/Havana';
  comprobar('la cita se convierte bien a UTC (Cuba, horario de verano)', inicioCita('2026-10-30', '10:00', zona).toISOString() === '2026-10-30T14:00:00.000Z', inicioCita('2026-10-30', '10:00', zona).toISOString());
  const sol = [
    { id: 'cita00000001', tipo: 'reserva', reservaDia: '2026-10-30', reservaHora: '16:00' },
    { id: 'cita00000002', tipo: 'reserva', reservaDia: '2026-10-31', reservaHora: '16:00' },
    { id: 'cita00000003', tipo: 'reserva', reservaDia: '2026-10-30', reservaHora: '17:00' },
  ];
  const estado = { cita00000003: { estadoReserva: 'cancelada' } };
  const ahora = new Date('2026-10-30T16:30:00Z'); // 12:30 en Cuba: faltan 3 h 30 para la de las 16:00
  const avisar = citasPorAvisar(listarReservas(sol, estado, zona), ahora, 5);
  comprobar('avisa la cita que entra en las 5 h', avisar.length === 1 && avisar[0].id === 'cita00000001', avisar.map(r => r.id));
  comprobar('no avisa la de mañana ni la cancelada', !avisar.some(r => r.id !== 'cita00000001'));
  const ya = citasPorAvisar(listarReservas(sol, { cita00000001: { avisoEnviado: 'x' } }, zona), ahora, 5);
  comprobar('no repite un aviso ya enviado', !ya.some(r => r.id === 'cita00000001'));
  const movida = listarReservas(sol, { cita00000001: { dia: '2026-11-02', hora: '09:00' } }, zona).find(r => r.id === 'cita00000001');
  comprobar('un cambio de día desde el panel manda sobre lo original', movida.dia === '2026-11-02' && movida.hora12 === '9:00 a. m.');
}

console.log('\nAlmacén');
{
  const dir = await mkdtemp(join(tmpdir(), 'empieza-'));
  const a1 = await crearAlmacen(dir);
  const s = await a1.agregarSolicitud({ fecha: '2026-10-30T10:00:00Z', tipo: 'formulario', nombre: 'Ana' });
  await Promise.all([a1.agregarEventos([{ e: 'vista' }]), a1.agregarEventos([{ e: 'vista' }]), a1.actualizar(s.id, { estado: 'contactada' })]);
  const a2 = await crearAlmacen(dir);
  comprobar('lo guardado sobrevive a un reinicio', a2.solicitudes.length === 1 && a2.eventos.length === 2 && a2.estado[s.id]?.estado === 'contactada');
  await rm(dir, { recursive: true, force: true });
}

console.log(`\n${pruebas - fallos}/${pruebas} pruebas pasan.`);
if (fallos) process.exit(1);
