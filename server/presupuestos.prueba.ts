/**
 * Pruebas de los presupuestos por categoría.
 *
 * Lo que importa: que el aviso salte al 80 % y no antes, que solo cuente el mes
 * en curso, y que la huella distinga los dos escalones para que ninguno se
 * mande dos veces.
 *
 *   npx tsx server/presupuestos.prueba.ts
 */
import Database from 'better-sqlite3';
import * as P from './presupuestos.ts';

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

const db = new Database(':memory:');
db.exec(`
  CREATE TABLE transactions (
    id TEXT PRIMARY KEY, userId TEXT, type TEXT, amount REAL, category TEXT, date TEXT
  );
`);
P.crearTablas(db);

const USUARIO = 'u1';
const HOY = '2026-03-20';

let siguiente = 0;
function gasto(categoria: string, importe: number, fecha = HOY, tipo = 'expense') {
  db.prepare('INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?)')
    .run(`t${siguiente++}`, USUARIO, tipo, importe, categoria, fecha);
}

function tope(categoria: string, importe: number) {
  db.prepare('INSERT INTO budgets (id, userId, category, amount, creadoEn) VALUES (?, ?, ?, ?, ?)')
    .run(`b-${categoria}`, USUARIO, categoria, importe, HOY);
}

console.log('\nSin presupuestos');
comprobar('no devuelve nada', P.estado(db, USUARIO, HOY).length === 0);

console.log('\nCuenta del mes en curso');
tope('Comida', 100);
gasto('Comida', 30);
gasto('Comida', 20, '2026-03-01');
gasto('Comida', 999, '2026-02-15');   // Mes anterior: no cuenta.
gasto('Comida', 500, '2026-04-02');   // Mes siguiente: tampoco.
gasto('Comida', 40, HOY, 'income');   // Un ingreso no gasta presupuesto.

let comida = P.estado(db, USUARIO, HOY)[0];
comprobar('solo suma el mes en curso', comida.gastado === 50, comida.gastado);
comprobar('ignora los ingresos', comida.gastado === 50);
comprobar('calcula lo que queda', comida.restante === 50, comida.restante);
comprobar('la mitad no es aviso', comida.situacion === 'bien', comida.situacion);

console.log('\nEl umbral');
gasto('Comida', 29);   // 79 de 100
comida = P.estado(db, USUARIO, HOY)[0];
comprobar('al 79 % todavía no', comida.situacion === 'bien', comida.proporcion);

gasto('Comida', 1);    // 80 justos
comida = P.estado(db, USUARIO, HOY)[0];
comprobar('al 80 % justo ya avisa', comida.situacion === 'cerca', comida.proporcion);
comprobar('sale en los avisables', P.paraAvisar(db, USUARIO, HOY).length === 1);

gasto('Comida', 25);   // 105
comida = P.estado(db, USUARIO, HOY)[0];
comprobar('pasado el tope se distingue', comida.situacion === 'pasado', comida.situacion);
comprobar('lo restante va en negativo', comida.restante === -5, comida.restante);
comprobar('la proporción no se recorta', comida.proporcion > 1, comida.proporcion);

console.log('\nHuellas');
const aviso = P.paraAvisar(db, USUARIO, HOY)[0];
comprobar('la huella lleva mes y escalón',
  aviso.huella === 'presupuesto:Comida:2026-03:pasado', aviso.huella);

// Al 80 % la huella es otra: así se manda un aviso por escalón y no dos veces
// el mismo.
db.prepare('DELETE FROM transactions WHERE amount = 25').run();
comprobar('el escalón del 80 tiene huella propia',
  P.paraAvisar(db, USUARIO, HOY)[0].huella === 'presupuesto:Comida:2026-03:80');

console.log('\nVarias categorías');
tope('Transporte', 50);
gasto('Transporte', 10);
const todos = P.estado(db, USUARIO, HOY);
comprobar('devuelve las dos', todos.length === 2, todos.length);
comprobar('solo avisa la que toca', P.paraAvisar(db, USUARIO, HOY).length === 1);
comprobar('una categoría sin gastos va a cero',
  todos.find((t) => t.category === 'Transporte')?.gastado === 10);

console.log('\nCasos raros');
tope('Vacío', 0);
const cero = P.estado(db, USUARIO, HOY).find((t) => t.category === 'Vacío');
comprobar('un tope de cero no divide por cero',
  cero?.proporcion === 0 && cero?.situacion === 'bien', cero);

console.log(`\n${pruebas - fallos}/${pruebas} pruebas correctas`);
process.exit(fallos > 0 ? 1 : 0);
