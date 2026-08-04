/**
 * Pruebas de la apertura del chat.
 *
 * Lo que se vigila aquí es que no diga cosas falsas: una alarma inventada
 * funciona una vez y quema la confianza para siempre.
 *
 *   npx tsx server/apertura.prueba.ts
 */
import Database from 'better-sqlite3';
import { componer } from './apertura.ts';

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

function baseDePrueba() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, displayName TEXT, currency TEXT);
    CREATE TABLE transactions (
      id TEXT PRIMARY KEY, userId TEXT, type TEXT, amount REAL,
      category TEXT, date TEXT
    );
    CREATE TABLE goals (
      id TEXT PRIMARY KEY, userId TEXT, name TEXT,
      targetAmount REAL, currentAmount REAL
    );
  `);
  db.prepare("INSERT INTO users VALUES ('u1', 'Ana Pérez', 'EUR')").run();
  return db;
}

let n = 0;
function mov(db: any, fecha: string, importe: number, categoria = 'Comida', tipo = 'expense') {
  db.prepare('INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?)')
    .run(`t${++n}`, 'u1', tipo, importe, categoria, fecha);
}

// --- Cuenta nueva ----------------------------------------------------------
console.log('\nCuenta nueva');
{
  const db = baseDePrueba();
  const a = componer(db, 'u1', '2026-08-15');
  comprobar('saluda por su nombre', a.texto.includes('Ana'), a.texto);
  comprobar('lo trata como bienvenida', a.motivo === 'bienvenida');
  comprobar('ofrece por dónde empezar', a.sugerencias.length >= 2);
  comprobar('no inventa cifras', !/\d+€/.test(a.texto), a.texto);
}

// --- Categoría disparada ---------------------------------------------------
console.log('\nGasto por encima de lo normal');
{
  const db = baseDePrueba();
  // Tres meses previos a 100 al mes, y este a 300.
  ['2026-05-10', '2026-06-10', '2026-07-10'].forEach((f) => mov(db, f, 100, 'Transporte'));
  mov(db, '2026-08-05', 300, 'Transporte');

  const a = componer(db, 'u1', '2026-08-15');
  comprobar('lo detecta', a.motivo === 'gasto-alto', a);
  comprobar('nombra la categoría', a.texto.includes('Transporte'), a.texto);
  comprobar('da la cifra real', a.texto.includes('300'), a.texto);
}
{
  const db = baseDePrueba();
  // Sin meses previos no hay con qué comparar: no debe avisar de nada.
  mov(db, '2026-08-05', 300, 'Transporte');
  const a = componer(db, 'u1', '2026-08-06');
  comprobar('sin histórico no inventa una desviación',
    a.motivo !== 'gasto-alto', a.motivo);
}

// --- Meta cerca ------------------------------------------------------------
console.log('\nMeta a punto');
{
  const db = baseDePrueba();
  mov(db, '2026-08-14', 10);
  db.prepare("INSERT INTO goals VALUES ('g1','u1','Portátil',1000,850)").run();

  const a = componer(db, 'u1', '2026-08-15');
  comprobar('avisa de la meta cercana', a.motivo === 'meta-cerca', a);
  comprobar('dice lo que falta', a.texto.includes('150'), a.texto);
}
{
  const db = baseDePrueba();
  mov(db, '2026-08-14', 10);
  // Al 50 % no está "a punto": avisar de eso sería ruido.
  db.prepare("INSERT INTO goals VALUES ('g1','u1','Portátil',1000,500)").run();
  const a = componer(db, 'u1', '2026-08-15');
  comprobar('una meta a medias no se anuncia como cercana',
    a.motivo !== 'meta-cerca', a.motivo);
}
{
  const db = baseDePrueba();
  mov(db, '2026-08-14', 10);
  // Ya cumplida: no debe pedir nada.
  db.prepare("INSERT INTO goals VALUES ('g1','u1','Portátil',1000,1000)").run();
  const a = componer(db, 'u1', '2026-08-15');
  comprobar('una meta cumplida no pide más dinero', a.motivo !== 'meta-cerca', a.motivo);
}

// --- Ausencia --------------------------------------------------------------
console.log('\nDías sin registrar');
{
  const db = baseDePrueba();
  mov(db, '2026-08-01', 20);
  const a = componer(db, 'u1', '2026-08-10');
  comprobar('lo menciona', a.motivo === 'sin-registrar', a);
  comprobar('dice cuántos días', a.texto.includes('9'), a.texto);
}
{
  const db = baseDePrueba();
  mov(db, '2026-08-14', 20);
  const a = componer(db, 'u1', '2026-08-15');
  comprobar('un solo día no cuenta como ausencia',
    a.motivo !== 'sin-registrar', a.motivo);
}

// --- Fin de mes ------------------------------------------------------------
console.log('\nFin de mes');
{
  const db = baseDePrueba();
  mov(db, '2026-08-01', 1000, 'Nómina', 'income');
  mov(db, '2026-08-20', 900, 'Varios');
  mov(db, '2026-08-27', 10, 'Comida');

  const a = componer(db, 'u1', '2026-08-28');
  comprobar('avisa cuando queda poco', a.motivo === 'fin-de-mes', a);
  comprobar('dice cuánto queda', a.texto.includes('90'), a.texto);
}
{
  const db = baseDePrueba();
  mov(db, '2026-08-01', 1000, 'Nómina', 'income');
  mov(db, '2026-08-20', 100, 'Varios');
  mov(db, '2026-08-27', 10, 'Comida');

  const a = componer(db, 'u1', '2026-08-28');
  comprobar('con margen de sobra no alarma', a.motivo !== 'fin-de-mes', a.motivo);
}

// --- Nada que destacar -----------------------------------------------------
console.log('\nSin novedades');
{
  const db = baseDePrueba();
  mov(db, '2026-08-14', 20);
  mov(db, '2026-08-15', 15);

  const a = componer(db, 'u1', '2026-08-15');
  comprobar('ofrece algo útil sin inventar alarmas', a.motivo === 'general', a);
  comprobar('siempre trae sugerencias', a.sugerencias.length >= 2);

  const repetida = componer(db, 'u1', '2026-08-15');
  comprobar('el mismo día dice lo mismo', repetida.texto === a.texto);
}

console.log(`\n${pruebas - fallos}/${pruebas} pruebas correctas`);
process.exit(fallos > 0 ? 1 : 0);
