/**
 * Pruebas de racha y logros.
 *
 *   npx tsx server/logros.prueba.ts
 */
import Database from 'better-sqlite3';
import * as L from './logros.ts';
import * as N from './notificaciones.ts';

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
    CREATE TABLE users (id TEXT PRIMARY KEY, currency TEXT);
    CREATE TABLE transactions (
      id TEXT PRIMARY KEY, userId TEXT, accountId TEXT, type TEXT,
      amount REAL, category TEXT, description TEXT, date TEXT
    );
    CREATE TABLE goals (
      id TEXT PRIMARY KEY, userId TEXT, name TEXT,
      targetAmount REAL, currentAmount REAL
    );
    CREATE TABLE accounts (id TEXT PRIMARY KEY, userId TEXT, name TEXT, balance REAL);
    CREATE TABLE user_notifications (
      id TEXT PRIMARY KEY, userId TEXT, title TEXT, message TEXT, type TEXT,
      actionData TEXT, isRead INTEGER, createdAt TEXT
    );
  `);
  N.crearTablas(db);
  L.crearTablas(db);
  db.prepare("INSERT INTO users (id, currency) VALUES ('u1','EUR')").run();
  return db;
}

let n = 0;
function gasto(db: any, fecha: string) {
  db.prepare(`
    INSERT INTO transactions (id, userId, accountId, type, amount, category, description, date)
    VALUES (?, 'u1', 'a1', 'expense', 10, 'Comida', '', ?)
  `).run(`t${++n}`, fecha);
}

/** Días consecutivos terminando en la fecha dada. */
function diasSeguidos(db: any, hasta: string, cuantos: number) {
  const fin = Date.parse(`${hasta}T12:00:00Z`);
  for (let i = 0; i < cuantos; i++) {
    gasto(db, new Date(fin - i * 86400000).toISOString().slice(0, 10));
  }
}

// --- Primer logro ----------------------------------------------------------
console.log('\nPrimeros logros');
{
  const db = baseDePrueba();
  comprobar('sin datos no hay logros', L.revisar(db, 'u1', '2026-08-10').length === 0);

  gasto(db, '2026-08-10');
  const nuevos = L.revisar(db, 'u1', '2026-08-10');
  comprobar('el primer registro concede un logro',
    nuevos.some((l) => l.id === 'primer-registro'), nuevos.map((l) => l.id));

  const repetido = L.revisar(db, 'u1', '2026-08-10');
  comprobar('no se vuelve a conceder lo ya conseguido', repetido.length === 0, repetido);
}

// --- Racha -----------------------------------------------------------------
console.log('\nRacha');
{
  const db = baseDePrueba();
  diasSeguidos(db, '2026-08-10', 3);
  const nuevos = L.revisar(db, 'u1', '2026-08-10');
  comprobar('tres días seguidos dan el logro de racha',
    nuevos.some((l) => l.id === 'racha-3'), nuevos.map((l) => l.id));
  comprobar('pero no el de una semana',
    !nuevos.some((l) => l.id === 'racha-7'));
}
{
  const db = baseDePrueba();
  diasSeguidos(db, '2026-08-10', 8);
  L.revisar(db, 'u1', '2026-08-10');

  // Se borra todo: la racha cae, pero lo ganado no se retira.
  db.prepare('DELETE FROM transactions WHERE userId = ?').run('u1');
  const est = L.estado(db, 'u1', '2026-08-20');

  comprobar('la racha refleja los datos actuales', est.racha === 0, est.racha);
  comprobar('un logro conseguido no se pierde al bajar la racha',
    est.logros.find((l) => l.id === 'racha-7')?.conseguido === true);
}

// --- Metas y cuentas -------------------------------------------------------
console.log('\nMetas y cuentas');
{
  const db = baseDePrueba();
  db.prepare("INSERT INTO goals (id,userId,name,targetAmount,currentAmount) VALUES ('g1','u1','Casa',1000,300)").run();
  let nuevos = L.revisar(db, 'u1', '2026-08-10');
  comprobar('crear una meta da su logro', nuevos.some((l) => l.id === 'primera-meta'));
  comprobar('sin alcanzarla no da el de cumplida',
    !nuevos.some((l) => l.id === 'meta-cumplida'));

  db.prepare("UPDATE goals SET currentAmount = 1000 WHERE id = 'g1'").run();
  nuevos = L.revisar(db, 'u1', '2026-08-10');
  comprobar('alcanzarla sí lo da', nuevos.some((l) => l.id === 'meta-cumplida'));
}
{
  const db = baseDePrueba();
  db.prepare("INSERT INTO accounts (id,userId,name,balance) VALUES ('a1','u1','Efectivo',0)").run();
  comprobar('añadir una cuenta da su logro',
    L.revisar(db, 'u1', '2026-08-10').some((l) => l.id === 'primera-cuenta'));
}

// --- Mes completo ----------------------------------------------------------
console.log('\nMes completo');
{
  const db = baseDePrueba();
  // 20 días distintos del mismo mes.
  for (let d = 1; d <= 20; d++) gasto(db, `2026-08-${String(d).padStart(2, '0')}`);
  comprobar('veinte días del mes dan el logro',
    L.revisar(db, 'u1', '2026-08-25').some((l) => l.id === 'mes-completo'));
}
{
  const db = baseDePrueba();
  // Repartidos entre dos meses no deben contar como uno solo.
  for (let d = 1; d <= 10; d++) gasto(db, `2026-07-${String(d).padStart(2, '0')}`);
  for (let d = 1; d <= 10; d++) gasto(db, `2026-08-${String(d).padStart(2, '0')}`);
  comprobar('repartidos entre dos meses no cuentan',
    !L.revisar(db, 'u1', '2026-08-25').some((l) => l.id === 'mes-completo'));
}

// --- Estado para la interfaz ----------------------------------------------
console.log('\nEstado');
{
  const db = baseDePrueba();
  diasSeguidos(db, '2026-08-10', 4);
  L.revisar(db, 'u1', '2026-08-10');
  const est = L.estado(db, 'u1', '2026-08-10');

  comprobar('el siguiente hito es el 7', est.siguienteHito === 7, est.siguienteHito);
  comprobar('cuenta cuántos se llevan', est.conseguidos >= 2, est.conseguidos);
  comprobar('el progreso se recorta a la meta',
    est.logros.every((l) => l.progreso <= l.meta));
  comprobar('sabe que hoy ya registró', est.registroHoy === true);
}

console.log(`\n${pruebas - fallos}/${pruebas} pruebas correctas`);
process.exit(fallos > 0 ? 1 : 0);
