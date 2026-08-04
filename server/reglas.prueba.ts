/**
 * Pruebas de las reglas de notificación.
 *
 * Se ejecutan contra una base en memoria con datos inventados, porque lo que se
 * quiere comprobar es la decisión —qué se manda y cuándo— y no el envío.
 *
 *   npx tsx server/reglas.prueba.ts
 */
import Database from 'better-sqlite3';
import * as N from './notificaciones.ts';
import * as M from './mensajes.ts';
import * as P from './presupuestos.ts';
import * as R from './recurrentes.ts';
import { candidatos, calcularRacha } from './reglas.ts';

let fallos = 0;
let pruebas = 0;

function comprobar(descripcion: string, condicion: boolean, detalle?: any) {
  pruebas++;
  if (condicion) {
    console.log(`  ok   ${descripcion}`);
  } else {
    fallos++;
    console.log(`  FALLO ${descripcion}`, detalle !== undefined ? JSON.stringify(detalle) : '');
  }
}

function baseDePrueba() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, currency TEXT, createdAt TEXT);
    CREATE TABLE transactions (
      id TEXT PRIMARY KEY, userId TEXT, accountId TEXT, type TEXT,
      amount REAL, category TEXT, description TEXT, date TEXT
    );
    CREATE TABLE goals (
      id TEXT PRIMARY KEY, userId TEXT, name TEXT,
      targetAmount REAL, currentAmount REAL
    );
    CREATE TABLE user_notifications (
      id TEXT PRIMARY KEY, userId TEXT, title TEXT, message TEXT, type TEXT,
      actionData TEXT, isRead INTEGER, createdAt TEXT
    );
  `);
  N.crearTablas(db);
  P.crearTablas(db);
  R.crearTablas(db);
  db.prepare("INSERT INTO users (id, currency) VALUES ('u1', 'EUR')").run();
  return db;
}

let contador = 0;
function gasto(db: any, fecha: string, importe: number, categoria = 'Comida') {
  db.prepare(`
    INSERT INTO transactions (id, userId, accountId, type, amount, category, description, date)
    VALUES (?, 'u1', 'a1', 'expense', ?, ?, 'prueba', ?)
  `).run(`t${++contador}`, importe, categoria, fecha);
}

/** Un instante concreto en hora de La Habana (UTC-4 en verano). */
const enHabana = (fechaHora: string) => new Date(`${fechaHora}-04:00`);

// --- Racha -----------------------------------------------------------------
console.log('\nRacha');
{
  const db = baseDePrueba();
  ['2026-08-01', '2026-08-02', '2026-08-03'].forEach((f) => gasto(db, f, 10));
  const r = calcularRacha(db, 'u1', '2026-08-03');
  comprobar('tres días seguidos cuentan tres', r.racha === 3, r);
  comprobar('detecta que hoy ya registró', r.registroHoy === true);
}
{
  const db = baseDePrueba();
  // Falta el día 2: el perdón semanal debe mantener viva la racha.
  ['2026-08-01', '2026-08-03', '2026-08-04'].forEach((f) => gasto(db, f, 10));
  const r = calcularRacha(db, 'u1', '2026-08-04');
  comprobar('un hueco suelto no rompe la racha', r.racha === 3, r);
}
{
  const db = baseDePrueba();
  // Dos huecos seguidos sí la rompen.
  ['2026-07-28', '2026-08-04'].forEach((f) => gasto(db, f, 10));
  const r = calcularRacha(db, 'u1', '2026-08-04');
  comprobar('un abandono largo sí la rompe', r.racha === 1, r);
}
{
  const db = baseDePrueba();
  ['2026-08-01', '2026-08-02'].forEach((f) => gasto(db, f, 10));
  const r = calcularRacha(db, 'u1', '2026-08-03');
  comprobar('sin registro hoy la racha sigue viva', r.racha === 2 && !r.registroHoy, r);
}

// --- Resumen del día -------------------------------------------------------
console.log('\nResumen del día');
{
  const db = baseDePrueba();
  gasto(db, '2026-08-05', 12.5);
  gasto(db, '2026-08-05', 30, 'Transporte');

  const aMediodia = candidatos(db, { id: 'u1', currency: 'EUR' }, enHabana('2026-08-05T13:00:00'));
  comprobar('a mediodía no hay resumen del día', !aMediodia.some((c) => c.tipo === 'resumen-diario'));

  const porLaNoche = candidatos(db, { id: 'u1', currency: 'EUR' }, enHabana('2026-08-05T20:30:00'));
  const diario = porLaNoche.find((c) => c.tipo === 'resumen-diario');
  comprobar('por la noche sí lo hay', !!diario);
  comprobar('el cuerpo lleva el importe real', !!diario?.cuerpo.includes('42'), diario?.cuerpo);
}
{
  const db = baseDePrueba();
  const sinNada = candidatos(db, { id: 'u1', currency: 'EUR' }, enHabana('2026-08-05T20:30:00'));
  const motivador = sinNada.find((c) => c.tipo === 'sin-registros');
  comprobar('un día sin registros manda un mensaje motivador', !!motivador);
  comprobar('ese mensaje lleva acción para registrar',
    motivador?.acciones?.[0]?.action === 'registrar');
  comprobar('no manda resumen si no hay datos',
    !sinNada.some((c) => c.tipo === 'resumen-diario'));
}

// --- Resumen semanal -------------------------------------------------------
console.log('\nResumen semanal');
{
  const db = baseDePrueba();
  // 2026-08-09 es domingo.
  ['2026-08-04', '2026-08-05', '2026-08-06'].forEach((f) => gasto(db, f, 20));

  const sabado = candidatos(db, { id: 'u1', currency: 'EUR' }, enHabana('2026-08-08T19:00:00'));
  comprobar('el sábado no hay resumen semanal',
    !sabado.some((c) => c.tipo === 'resumen-semanal'));

  const domingo = candidatos(db, { id: 'u1', currency: 'EUR' }, enHabana('2026-08-09T19:00:00'));
  const semanal = domingo.find((c) => c.tipo === 'resumen-semanal');
  comprobar('el domingo por la tarde sí', !!semanal);
  comprobar('dice cuántos días registró de siete',
    !!semanal?.cuerpo.includes('3 de 7'), semanal?.cuerpo);
}

// --- Ventana horaria y techo diario ---------------------------------------
console.log('\nVentana y techo');
{
  const db = baseDePrueba();
  gasto(db, '2026-08-05', 10);
  comprobar('de madrugada no se puede enviar',
    !N.puedeRecibir(db, 'u1', 'x', enHabana('2026-08-05T03:00:00')));
  comprobar('a media tarde sí',
    N.puedeRecibir(db, 'u1', 'x', enHabana('2026-08-05T16:00:00')));
  comprobar('pasadas las nueve de la noche tampoco',
    !N.puedeRecibir(db, 'u1', 'x', enHabana('2026-08-05T22:00:00')));

  const dentro = N.horaLocal('America/Havana', enHabana('2026-08-05T15:00:00'));
  comprobar('la hora local se calcula bien', dentro === 15, dentro);

  const fecha = N.fechaLocal('America/Havana', new Date('2026-08-06T02:00:00Z'));
  comprobar('las 02:00 UTC siguen siendo el día anterior en La Habana',
    fecha === '2026-08-05', fecha);
}
{
  const db = baseDePrueba();
  const ahora = new Date().toISOString();
  for (let i = 0; i < 3; i++) {
    db.prepare(`
      INSERT INTO notification_sent (id, userId, tipo, titulo, cuerpo, enviadoEn)
      VALUES (?, 'u1', ?, 't', 'c', ?)
    `).run(`n${i}`, `tipo${i}`, ahora);
  }
  // Las tres se anotan con la hora de ahora, así que se pregunta por ese mismo
  // instante para que la prueba no dependa de cuándo se ejecute.
  comprobar('con tres enviadas hoy no entra una cuarta',
    !N.puedeRecibir(db, 'u1', 'tipo9', new Date()) ||
    N.horaLocal('America/Havana') < N.HORA_INICIO ||
    N.horaLocal('America/Havana') >= N.HORA_FIN);
}

// --- Variedad de los mensajes ---------------------------------------------
console.log('\nVariedad');
{
  const vistos = new Set<string>();
  const fecha0 = Date.parse('2026-09-01T00:00:00Z');
  for (let dia = 0; dia < 60; dia++) {
    const fecha = new Date(fecha0 + dia * 86400000).toISOString().slice(0, 10);
    const m = M.diarioSinDatos('usuario-x', fecha);
    vistos.add(`${m.titulo}|${m.cuerpo}`);
  }

  // El ciclo completo debe recorrerse entero antes de repetir nada.
  const cicloCompleto = new Set<string>();
  for (let dia = 0; dia < 300; dia++) {
    const fecha = new Date(fecha0 + dia * 86400000).toISOString().slice(0, 10);
    const m = M.diarioSinDatos('usuario-y', fecha);
    cicloCompleto.add(`${m.titulo}|${m.cuerpo}`);
  }
  comprobar('en 300 días se recorren las 300 combinaciones sin repetir',
    cicloCompleto.size === 300, cicloCompleto.size);
  comprobar('60 días seguidos no repiten ni un mensaje',
    vistos.size === 60, vistos.size);

  const a = M.diarioSinDatos('usuario-a', '2026-09-01');
  const b = M.diarioSinDatos('usuario-b', '2026-09-01');
  comprobar('dos personas no reciben lo mismo el mismo día',
    a.titulo !== b.titulo || a.cuerpo !== b.cuerpo);

  const repetido = M.diarioSinDatos('usuario-a', '2026-09-01');
  comprobar('el mismo día para la misma persona es estable',
    repetido.titulo === a.titulo && repetido.cuerpo === a.cuerpo);
}

// --- Vuelta tras ausencia --------------------------------------------------
console.log('\nAusencia');
{
  const db = baseDePrueba();
  gasto(db, '2026-07-29', 15);
  const usuario = { id: 'u1', currency: 'EUR' };
  const vuelve = (cuando: string) =>
    candidatos(db, usuario, enHabana(cuando)).find((c) => c.tipo === 'vuelve');

  comprobar('a los seis días todavía no', !vuelve('2026-08-04T12:00:00'));
  comprobar('a los siete se avisa', !!vuelve('2026-08-05T12:00:00'));

  // El tramo existe porque el planificador solo pasa dentro de la franja de
  // cada persona: exigir el día exacto perdía a quien lo tuviera apagado.
  comprobar('dentro del tramo se sigue pudiendo avisar', !!vuelve('2026-08-07T12:00:00'));
  comprobar('la huella es la misma en todo el tramo',
    vuelve('2026-08-05T12:00:00')?.huella === vuelve('2026-08-07T12:00:00')?.huella,
    [vuelve('2026-08-05T12:00:00')?.huella, vuelve('2026-08-07T12:00:00')?.huella]);

  comprobar('pasado el tramo se calla', !vuelve('2026-08-12T12:00:00'));
  comprobar('al segundo intento vuelve', !!vuelve('2026-08-19T12:00:00'));
  comprobar('y el tercero es a los 45', !!vuelve('2026-09-12T12:00:00'));
  comprobar('después ya no se insiste más', !vuelve('2026-10-20T12:00:00'));
}

{
  // Quien se dio de alta y nunca registró nada es a quien más fácil se
  // recupera, y antes se quedaba fuera por no tener ninguna transacción.
  const db = baseDePrueba();
  db.prepare("UPDATE users SET createdAt = '2026-07-29T10:00:00.000Z' WHERE id = 'u1'").run();

  const sinNada = candidatos(db,
    { id: 'u1', currency: 'EUR', createdAt: '2026-07-29T10:00:00.000Z' },
    enHabana('2026-08-05T12:00:00'));
  comprobar('a quien nunca registró nada también se le escribe',
    sinNada.some((c) => c.tipo === 'vuelve'));
}

// --- Presupuestos ----------------------------------------------------------
console.log('\nPresupuesto al 80 %');
{
  const db = baseDePrueba();
  db.prepare(`INSERT INTO budgets (id, userId, category, amount, creadoEn)
              VALUES ('b1', 'u1', 'Restaurantes', 100, '2026-08-01')`).run();

  const sinGasto = candidatos(db, { id: 'u1', currency: 'EUR' }, enHabana('2026-08-05T12:00:00'));
  comprobar('sin gasto no avisa', !sinGasto.some((c) => c.tipo === 'presupuesto'));

  gasto(db, '2026-08-03', 50, 'Restaurantes');
  const aMitad = candidatos(db, { id: 'u1', currency: 'EUR' }, enHabana('2026-08-05T12:00:00'));
  comprobar('a mitad de tope tampoco', !aMitad.some((c) => c.tipo === 'presupuesto'));

  gasto(db, '2026-08-04', 35, 'Restaurantes');
  const al85 = candidatos(db, { id: 'u1', currency: 'EUR' }, enHabana('2026-08-05T12:00:00'))
    .find((c) => c.tipo === 'presupuesto');
  comprobar('pasado el 80 % sí avisa', !!al85);
  comprobar('el aviso dice cuánto queda', !!al85 && /15/.test(al85.cuerpo), al85?.cuerpo);
  comprobar('y cuántos días de mes faltan', !!al85 && /26 días/.test(al85.cuerpo), al85?.cuerpo);
}

console.log(`\n${pruebas - fallos}/${pruebas} pruebas correctas`);
process.exit(fallos > 0 ? 1 : 0);
