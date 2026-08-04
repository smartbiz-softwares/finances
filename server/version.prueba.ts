/**
 * Prueba del aviso de versión nueva.
 *
 * Lo que importa es que no se avise dos veces de lo mismo: el servidor llama a
 * esto en cada arranque, y reinicia varias veces al día.
 *
 *   npx tsx server/version.prueba.ts
 */
import Database from 'better-sqlite3';
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

const db = new Database(':memory:');
db.exec(`
  CREATE TABLE user_notifications (
    id TEXT PRIMARY KEY, userId TEXT, title TEXT, message TEXT, type TEXT,
    actionData TEXT, isRead INTEGER, createdAt TEXT
  );
`);
N.crearTablas(db);

const suscribir = (userId: string, esApp: boolean) => {
  db.prepare(`
    INSERT INTO push_subscriptions (id, userId, endpoint, p256dh, auth, esApp, createdAt)
    VALUES (?, ?, ?, 'p', 'a', ?, ?)
  `).run(`s-${userId}`, userId, `https://ejemplo/${userId}`, esApp ? 1 : 0, new Date().toISOString());
};

console.log('\nAviso de versión');

suscribir('conApp', true);
suscribir('soloWeb', false);

const primero = await N.avisarDeVersion(db, 57, '1.57');
comprobar('avisa a quien tiene la app', primero === 1, primero);

const web = db.prepare(
  "SELECT COUNT(*) n FROM notification_sent WHERE userId = 'soloWeb'"
).get() as any;
comprobar('no avisa a quien solo usa la web', web.n === 0, web);

const repetido = await N.avisarDeVersion(db, 57, '1.57');
comprobar('no repite el aviso de la misma versión', repetido === 0, repetido);

const siguiente = await N.avisarDeVersion(db, 58, '1.58');
comprobar('sí avisa de la siguiente versión', siguiente === 1, siguiente);

// Quien apagó los avisos no debe recibirlos.
db.prepare("UPDATE notification_prefs SET avisos = 0 WHERE userId = 'conApp'").run();
const silenciado = await N.avisarDeVersion(db, 59, '1.59');
comprobar('respeta a quien apagó los avisos', silenciado === 0, silenciado);

const sinCodigo = await N.avisarDeVersion(db, 0, '');
comprobar('sin versionCode no hace nada', sinCodigo === 0, sinCodigo);

const enCampana = db.prepare(
  "SELECT COUNT(*) n FROM user_notifications WHERE userId = 'conApp'"
).get() as any;
comprobar('queda también en la campana de la app', enCampana.n === 2, enCampana);

console.log(`\n${pruebas - fallos}/${pruebas} pruebas correctas`);
process.exit(fallos > 0 ? 1 : 0);
