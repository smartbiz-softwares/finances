/**
 * Pruebas de los reintentos contra DeepSeek.
 *
 * Lo que importa: que un 503 pasajero no llegue al usuario, y que un fallo que
 * no se arregla esperando (clave mala, saldo agotado) salga a la primera en vez
 * de tener al usuario diez segundos mirando un spinner.
 *
 *   npx tsx src/agent/brain/deepseek.prueba.ts
 */
import { llamarDeepSeek, ErrorDeepSeek } from './deepseek.ts';

let fallos = 0;
let pruebas = 0;

function comprobar(descripcion: string, condicion: boolean, detalle?: any) {
  pruebas++;
  if (condicion) console.log(`  ok   ${descripcion}`);
  else {
    fallos++;
    console.log(`  FALLO ${descripcion}`, detalle !== undefined ? JSON.stringify(detalle) : '');
  }
}

const fetchReal = globalThis.fetch;
let llamadas = 0;

/** Sustituye fetch por una secuencia guionizada de respuestas. */
function guion(...respuestas: Array<number | 'red'>) {
  llamadas = 0;
  globalThis.fetch = (async () => {
    const paso = respuestas[Math.min(llamadas, respuestas.length - 1)];
    llamadas++;
    if (paso === 'red') throw new Error('fetch failed');
    if (paso === 200) return new Response(JSON.stringify({ ok: true }), { status: 200 });
    return new Response('{"error":{"message":"boom"}}', { status: paso });
  }) as any;
}

// Los reintentos esperan de verdad; sin acortar el reloj la prueba tardaría
// seis segundos por caso.
const dormirReal = globalThis.setTimeout;
(globalThis as any).setTimeout = ((fn: any) => dormirReal(fn, 0)) as any;

async function principal() {
  console.log('\nReintentos');

  guion(503, 503, 200);
  const recuperado = await llamarDeepSeek({}, 'clave');
  comprobar('un 503 pasajero se supera solo', recuperado?.ok === true);
  comprobar('hizo exactamente 3 intentos', llamadas === 3, llamadas);

  guion(429, 200);
  await llamarDeepSeek({}, 'clave');
  comprobar('un 429 también se reintenta', llamadas === 2, llamadas);

  guion('red', 200);
  await llamarDeepSeek({}, 'clave');
  comprobar('un corte de red se reintenta', llamadas === 2, llamadas);

  console.log('\nFallos que no mejoran esperando');

  guion(401);
  try {
    await llamarDeepSeek({}, 'clave');
    comprobar('401 debería lanzar', false);
  } catch (e: any) {
    comprobar('401 sale a la primera', llamadas === 1, llamadas);
    comprobar('401 se identifica como configuración',
      e.mensajeParaUsuario.includes('no está configurado'));
  }

  guion(402);
  try {
    await llamarDeepSeek({}, 'clave');
    comprobar('402 debería lanzar', false);
  } catch (e: any) {
    comprobar('402 sale a la primera', llamadas === 1, llamadas);
    comprobar('402 no le enseña el saldo al usuario',
      !/saldo|balance/i.test(e.mensajeParaUsuario), e.mensajeParaUsuario);
  }

  console.log('\nAgotar los intentos');

  guion(503);
  try {
    await llamarDeepSeek({}, 'clave');
    comprobar('503 permanente debería lanzar', false);
  } catch (e: any) {
    comprobar('es un ErrorDeepSeek', e instanceof ErrorDeepSeek);
    comprobar('se rinde tras 4 intentos', llamadas === 4, llamadas);
    comprobar('conserva el código', e.status === 503, e.status);
    comprobar('conserva el detalle del proveedor', e.detalle.includes('boom'), e.detalle);
  }

  globalThis.fetch = fetchReal;
  console.log(`\n${pruebas - fallos}/${pruebas} pruebas correctas`);
  process.exit(fallos > 0 ? 1 : 0);
}

principal();
