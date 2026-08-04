/**
 * Pruebas de lo que se saca de una frase dictada.
 *
 * Lo que importa es que no confunda un gasto con un ingreso: meter dinero donde
 * salía cuesta más de arreglar que de confirmar. Y que entienda los números en
 * palabras: Whisper transcribe "veinte", no "20", y sin eso la mitad de los
 * dictados se quedaban sin importe.
 *
 *   npx tsx server/extraer.prueba.ts
 */

import { extraerMovimiento, numeroEnPalabras } from './extraer.ts';

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

console.log('\nImportes');
comprobar('entero', extraerMovimiento('gasté 20 en comida')?.amount === 20);
comprobar('con coma', extraerMovimiento('gasté 12,50 en el café')?.amount === 12.5);
comprobar('con punto', extraerMovimiento('gasté 12.50 en el café')?.amount === 12.5);
comprobar('miles', extraerMovimiento('pagué 1500 de alquiler')?.amount === 1500);
comprobar('sin número no devuelve nada', extraerMovimiento('gasté algo hoy') === null);
comprobar('cero no vale', extraerMovimiento('gasté 0 euros') === null);

console.log('\nGasto o ingreso');
comprobar('gastar es gasto', extraerMovimiento('gasté 20 en comida')?.type === 'expense');
comprobar('pagar es gasto', extraerMovimiento('pagué 30 de taxi')?.type === 'expense');
comprobar('cobrar es ingreso', extraerMovimiento('cobré 500 del trabajo')?.type === 'income');
comprobar('me pagaron es ingreso', extraerMovimiento('me pagaron 200')?.type === 'income');
comprobar('recibí es ingreso', extraerMovimiento('recibí 45 de un cliente')?.type === 'income');
comprobar('sin verbo claro se asume gasto',
  extraerMovimiento('30 de gasolina')?.type === 'expense');

console.log('\nCategorías');
const categoria = (frase: string) => extraerMovimiento(frase)?.category;
comprobar('comida', categoria('gasté 20 en comida') === 'Restaurantes');
comprobar('supermercado', categoria('40 en el mercado') === 'Supermercado');
comprobar('transporte', categoria('15 de taxi') === 'Transporte');
comprobar('cubano: guagua', categoria('5 en la guagua') === 'Transporte');
comprobar('servicios', categoria('pagué 60 de internet') === 'Servicios');
comprobar('salud', categoria('25 en la farmacia') === 'Salud');
comprobar('ingreso sin categoría clara', categoria('cobré 500') === 'Ingresos');
comprobar('gasto sin categoría clara', categoria('gasté 33') === 'Varios');

console.log('\nDescripción');
const d = extraerMovimiento('gasté 20 en comida');
comprobar('guarda la frase entera', d?.description === 'Gasté 20 en comida', d?.description);

console.log('\nNúmeros en palabras');
const n = numeroEnPalabras;
comprobar('unidad', n('gasté cinco') === 5, n('gasté cinco'));
comprobar('decena', n('veinte') === 20, n('veinte'));
comprobar('compuesto con y', n('treinta y cinco') === 35, n('treinta y cinco'));
comprobar('veintitantos van juntos', n('veinticinco') === 25, n('veinticinco'));
comprobar('centena', n('doscientos') === 200, n('doscientos'));
comprobar('centena compuesta', n('ciento cincuenta') === 150, n('ciento cincuenta'));
comprobar('mil a secas', n('mil') === 1000, n('mil'));
comprobar('miles', n('dos mil') === 2000, n('dos mil'));
comprobar('miles con resto', n('mil quinientos') === 1500, n('mil quinientos'));
comprobar('millón', n('un millón') === 1000000, n('un millón'));
comprobar('sin número no inventa', n('gasté algo hoy') === null, n('gasté algo hoy'));
comprobar('se queda con la primera cifra',
  n('veinte de comida y tres de pan') === 20, n('veinte de comida y tres de pan'));

console.log('\nDictado tal como lo transcribe Whisper');
comprobar('gasté veinte en comida',
  extraerMovimiento('gasté veinte en comida')?.amount === 20,
  extraerMovimiento('gasté veinte en comida'));
comprobar('y sigue siendo gasto',
  extraerMovimiento('gasté veinte en comida')?.type === 'expense');
comprobar('cobré quinientos del trabajo',
  extraerMovimiento('cobré quinientos del trabajo')?.amount === 500,
  extraerMovimiento('cobré quinientos del trabajo'));
comprobar('y sigue siendo ingreso',
  extraerMovimiento('cobré quinientos del trabajo')?.type === 'income');
comprobar('pagué mil quinientos de alquiler',
  extraerMovimiento('pagué mil quinientos de alquiler')?.amount === 1500,
  extraerMovimiento('pagué mil quinientos de alquiler'));
comprobar('la categoría se mantiene',
  extraerMovimiento('pagué mil quinientos de alquiler')?.category === 'Servicios');
comprobar('la cifra manda sobre la palabra',
  extraerMovimiento('gasté 20 euros, unos veinte')?.amount === 20);

console.log(`\n${pruebas - fallos}/${pruebas} pruebas correctas`);
process.exit(fallos > 0 ? 1 : 0);
