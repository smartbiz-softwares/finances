/**
 * Pruebas de los totales en varias monedas.
 *
 * Lo que importa: nunca se suman monedas distintas como si fueran la misma, y
 * lo que no se puede convertir se avisa en vez de esconderse.
 *
 *   npx tsx server/cambios.prueba.ts
 */
import Database from 'better-sqlite3';
import * as C from './cambios.ts';
import * as M from './movimientos.ts';

let fallos = 0;
function comprobar(descripcion: string, condicion: boolean, detalle?: any) {
  if (condicion) console.log(`  ok   ${descripcion}`);
  else { fallos++; console.log(`  FALLO ${descripcion}`, detalle !== undefined ? JSON.stringify(detalle) : ''); }
}

const db = new Database(':memory:');
db.exec(`
  CREATE TABLE users (id TEXT PRIMARY KEY, currency TEXT);
  CREATE TABLE accounts (id TEXT PRIMARY KEY, userId TEXT, type TEXT, name TEXT, balance REAL DEFAULT 0,
    currency TEXT, icon TEXT, color TEXT);
  CREATE TABLE transactions (
    id TEXT PRIMARY KEY, userId TEXT, accountId TEXT, type TEXT, amount REAL, category TEXT,
    description TEXT, date TEXT, receiptUrl TEXT, createdAt TEXT,
    currency TEXT, originalAmount REAL, exchangeRate REAL
  );
`);
C.crearTablas(db);
db.exec(`
  INSERT INTO users VALUES ('u1','USD'), ('u2','USD');
  INSERT INTO accounts (id,userId,type,name,balance,currency) VALUES
    ('usd','u1','bank','Banco',100,'USD'), ('cup','u1','cash','Pesos',32000,'CUP');
`);

console.log('\nTipos de cambio');
comprobar('misma moneda vale 1', C.tasa(db, 'u1', 'usd', 'USD') === 1);
comprobar('sin datos no se inventa', C.tasa(db, 'u1', 'CUP', 'USD') === null);
C.guardarTasa(db, 'u1', 'USD', 'CUP', 320);
comprobar('directa', C.tasa(db, 'u1', 'USD', 'CUP') === 320);
comprobar('inversa', Math.abs((C.tasa(db, 'u1', 'CUP', 'USD') as number) - 1 / 320) < 1e-12);
C.guardarTasa(db, 'u1', 'CUP', 'USD', 1 / 400);
comprobar('guardar al revés reemplaza la anterior', Math.abs((C.tasa(db, 'u1', 'USD', 'CUP') as number) - 400) < 1e-9, C.listar(db, 'u1'));
comprobar('solo queda un registro por par', C.listar(db, 'u1').length === 1);
comprobar('tasa cero se ignora', C.guardarTasa(db, 'u1', 'USD', 'EUR', 0) === false);
comprobar('cada usuario tiene las suyas', C.tasa(db, 'u2', 'USD', 'CUP') === null);

console.log('\nResumen');
let r = C.resumen(db, 'u1');
comprobar('convierte a la moneda principal', r.moneda === 'USD' && r.totalBalance === 180, r);
comprobar('nada sin convertir', r.sinConvertir.length === 0);

db.exec(`INSERT INTO accounts (id,userId,type,name,balance,currency) VALUES ('eur','u1','bank','Euros',50,'EUR')`);
r = C.resumen(db, 'u1');
comprobar('una cuenta sin tipo de cambio no se suma a ciegas', r.totalBalance === 180, r);
comprobar('y se avisa de ella', r.sinConvertir.length === 1 && r.sinConvertir[0].currency === 'EUR', r.sinConvertir);

M.crear(db, 'u1', { accountId: 'cup', type: 'expense', amount: 4000, category: 'Comida' }, '2026-10-07');
M.crear(db, 'u1', { accountId: 'usd', type: 'income', amount: 10, category: 'Venta' }, '2026-10-07');
r = C.resumen(db, 'u1');
comprobar('gastos en CUP se convierten', r.totalExpense === 10 && r.totalIncome === 10, r);

M.crear(db, 'u1', { accountId: 'usd', type: 'expense', amount: 20, category: 'Viaje', currency: 'EUR', exchangeRate: 1.1 }, '2026-10-07');
comprobar('registrar en otra moneda aprende el tipo de cambio', C.tasa(db, 'u1', 'EUR', 'USD') === 1.1);
r = C.resumen(db, 'u1');
comprobar('y la cuenta en EUR ya entra en el total', r.sinConvertir.length === 0 && r.totalBalance === 213 /* 88 USD + 28000 CUP a 400 + 50 EUR a 1.1 */, r);

db.exec(`INSERT INTO transactions (id,userId,accountId,type,amount,category,date) VALUES ('viejo','u1','borrada','income',5,'x','2026-01-01')`);
r = C.resumen(db, 'u1');
comprobar('movimientos de cuentas borradas sin moneda cuentan en la principal', r.totalIncome === 15, r);

console.log('\nConvertidor para listas');
const { moneda, convertir } = C.convertidor(db, 'u1');
comprobar('usa la moneda principal', moneda === 'USD');
comprobar('misma moneda queda igual', convertir(12.5, 'USD') === 12.5);
comprobar('convierte con el tipo guardado', convertir(4000, 'CUP') === 10);
comprobar('sin moneda se asume la principal', convertir(7, null) === 7);
comprobar('sin tipo de cambio devuelve null', convertir(5, 'JPY') === null);

console.log(fallos ? `\n${fallos} fallos` : '\nTodo bien');
process.exit(fallos ? 1 : 0);
