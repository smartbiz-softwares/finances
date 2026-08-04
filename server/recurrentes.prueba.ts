/**
 * Pruebas del detector de gastos recurrentes.
 *
 * Lo que importa es que no invente: proponer como suscripción algo que solo se
 * compró tres veces sueltas hace que la persona deje de mirar la lista, y
 * entonces da igual lo que detecte bien.
 *
 *   npx tsx server/recurrentes.prueba.ts
 */
import Database from 'better-sqlite3';
import * as R from './recurrentes.ts';

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
    id TEXT PRIMARY KEY, userId TEXT, type TEXT, amount REAL,
    category TEXT, description TEXT, date TEXT
  );
`);
R.crearTablas(db);

const USUARIO = 'u1';
const HOY = '2026-06-15';

let n = 0;
function apuntar(descripcion: string, importe: number, categoria: string, fecha: string) {
  db.prepare('INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(`t${n++}`, USUARIO, 'expense', importe, categoria, descripcion, fecha);
}

/** Repite un gasto cada tantos días, hacia atrás desde una fecha. */
function repetir(descripcion: string, importe: number, categoria: string,
                 desde: string, cada: number, veces: number, ruido = 0) {
  for (let i = 0; i < veces; i++) {
    const d = new Date(`${desde}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - cada * i);
    const variacion = ruido ? importe * (((i % 3) - 1) * ruido) : 0;
    apuntar(descripcion, Math.round((importe + variacion) * 100) / 100,
            categoria, d.toISOString().slice(0, 10));
  }
}

console.log('\nNormalizar conceptos');
comprobar('quita cifras y relleno',
  R.normalizar('Pago Netflix marzo 2026') === 'netflix', R.normalizar('Pago Netflix marzo 2026'));
comprobar('mayúsculas y tildes dan igual',
  R.normalizar('NETFLIX') === R.normalizar('netflix'));
comprobar('el mismo recibo cae en la misma cesta',
  R.normalizar('Netflix 12/03') === R.normalizar('pago netflix'),
  [R.normalizar('Netflix 12/03'), R.normalizar('pago netflix')]);
comprobar('sin nada reconocible devuelve vacío', R.normalizar('12/03 - 45') === '');

console.log('\nDetección');
repetir('Netflix', 12.99, 'Ocio', '2026-06-02', 30, 6);
let lista = R.detectar(db, USUARIO, HOY);
comprobar('encuentra la suscripción', lista.length === 1, lista.map((r) => r.descripcion));
comprobar('la cadencia es mensual', lista[0]?.cadencia === 'mensual', lista[0]?.cadencia);
comprobar('el importe es el típico', lista[0]?.importe === 12.99, lista[0]?.importe);
comprobar('cuenta las veces', lista[0]?.veces === 6, lista[0]?.veces);
comprobar('calcula la próxima', lista[0]?.proxima === '2026-07-02', lista[0]?.proxima);

console.log('\nLo que no debe detectar');
apuntar('Zapatos', 60, 'Ropa', '2026-01-10');
apuntar('Zapatos', 55, 'Ropa', '2026-03-02');
apuntar('Zapatos', 70, 'Ropa', '2026-05-20');
comprobar('tres compras con huecos dispares no son recurrentes',
  !R.detectar(db, USUARIO, HOY).some((r) => r.descripcion === 'Zapatos'));

repetir('Supermercado', 40, 'Supermercado', '2026-06-10', 30, 5, 0.9);
comprobar('importes muy dispares no cuentan como recibo fijo',
  !R.detectar(db, USUARIO, HOY).some((r) => r.category === 'Supermercado'),
  R.detectar(db, USUARIO, HOY).map((r) => r.descripcion));

apuntar('Gimnasio', 30, 'Salud', '2026-05-01');
apuntar('Gimnasio', 30, 'Salud', '2026-06-01');
comprobar('dos veces no bastan',
  !R.detectar(db, USUARIO, HOY).some((r) => r.descripcion === 'Gimnasio'));

apuntar('Gimnasio', 30, 'Salud', '2026-04-01');
comprobar('a la tercera sí',
  R.detectar(db, USUARIO, HOY).some((r) => r.descripcion === 'Gimnasio'));

console.log('\nVarias compras el mismo día');
repetir('Cafe', 2, 'Restaurantes', '2026-06-14', 30, 4);
apuntar('Cafe', 2, 'Restaurantes', '2026-06-14');
apuntar('Cafe', 2, 'Restaurantes', '2026-06-14');
const cafe = R.detectar(db, USUARIO, HOY).find((r) => r.descripcion === 'Cafe');
comprobar('el mismo día cuenta una vez', cafe?.veces === 4, cafe?.veces);

console.log('\nOrden');
repetir('Alquiler', 600, 'Servicios', '2026-06-01', 30, 5);
lista = R.detectar(db, USUARIO, HOY);
comprobar('lo más caro al año va primero',
  lista[0]?.descripcion === 'Alquiler', lista.map((r) => r.descripcion));

console.log('\nDecisiones');
const netflix = lista.find((r) => r.descripcion === 'Netflix')!;
R.decidir(db, USUARIO, netflix.clave, 'descartado');
comprobar('lo descartado no vuelve a salir',
  !R.detectar(db, USUARIO, HOY).some((r) => r.clave === netflix.clave));

R.decidir(db, USUARIO, netflix.clave, 'confirmado');
const vuelto = R.detectar(db, USUARIO, HOY).find((r) => r.clave === netflix.clave);
comprobar('lo confirmado sí, y queda marcado', vuelto?.decision === 'confirmado', vuelto?.decision);

console.log('\nPendientes de cobro');
// El alquiler tocaba el 1 de julio: al 15 de junio todavía no.
comprobar('no avisa de lo que aún no toca',
  !R.pendientes(db, USUARIO, HOY).some((r) => r.descripcion === 'Alquiler'));

// Un mes y medio después ya lleva claramente de retraso.
const tarde = R.pendientes(db, USUARIO, '2026-07-20');
comprobar('avisa del que se pasó de fecha',
  tarde.some((r) => r.descripcion === 'Alquiler'), tarde.map((r) => r.descripcion));

// Pasado un ciclo entero deja de preguntarse: o se canceló o ya no interesa.
comprobar('deja de insistir pasado el ciclo',
  !R.pendientes(db, USUARIO, '2026-09-20').some((r) => r.descripcion === 'Alquiler'));

console.log(`\n${pruebas - fallos}/${pruebas} pruebas correctas`);
process.exit(fallos > 0 ? 1 : 0);
