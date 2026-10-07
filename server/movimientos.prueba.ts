/**
 * Pruebas del alta y la edición de movimientos.
 *
 * Lo que importa: el saldo siempre cuadra con los movimientos, y nadie puede
 * apuntar nada a una cuenta ajena.
 *
 *   npx tsx server/movimientos.prueba.ts
 */
import Database from 'better-sqlite3';
import * as M from './movimientos.ts';
import * as C from './cambios.ts';

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
  INSERT INTO users VALUES ('u1','EUR'), ('u2','USD'), ('u3','CUP');
  INSERT INTO accounts (id,userId,type,name,balance,currency) VALUES
    ('eur','u1','bank','Banco',100,'EUR'), ('usd','u1','cash','Dólares',50,'USD'), ('ajena','u2','bank','Ajena',0,'USD');
`);
const HOY = '2026-10-07';
const saldo = (id: string) => (db.prepare('SELECT balance FROM accounts WHERE id = ?').get(id) as any).balance;
const tx = (id: string) => db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;

console.log('\nCrear');
const g = M.crear(db, 'u1', { accountId: 'eur', type: 'expense', amount: 30, category: 'Comida' }, HOY) as any;
comprobar('un gasto resta del saldo', g.ok && saldo('eur') === 70, saldo('eur'));
comprobar('usa la fecha de hoy si no llega', tx(g.id).date === HOY);
const i = M.crear(db, 'u1', { accountId: 'eur', type: 'income', amount: 20, category: 'Venta', currency: 'USD', exchangeRate: 0.9 }, HOY) as any;
comprobar('un ingreso en otra moneda suma lo convertido', i.ok && saldo('eur') === 88, saldo('eur'));

comprobar('cuenta ajena se rechaza',
  'error' in M.crear(db, 'u1', { accountId: 'ajena', type: 'expense', amount: 5, category: 'x' }, HOY));
comprobar('la cuenta ajena no se toca', saldo('ajena') === 0);
comprobar('tipo inventado se rechaza',
  'error' in M.crear(db, 'u1', { accountId: 'eur', type: 'regalo', amount: 5, category: 'x' }, HOY));
comprobar('importe negativo se rechaza',
  'error' in M.crear(db, 'u1', { accountId: 'eur', type: 'expense', amount: -5, category: 'x' }, HOY));
comprobar('sin categoría se rechaza',
  'error' in M.crear(db, 'u1', { accountId: 'eur', type: 'expense', amount: 5, category: ' ' }, HOY));
comprobar('fecha mala se rechaza',
  'error' in M.crear(db, 'u1', { accountId: 'eur', type: 'expense', amount: 5, category: 'x', date: 'ayer' }, HOY));
comprobar('un rechazo no deja rastro', saldo('eur') === 88 &&
  (db.prepare("SELECT COUNT(*) n FROM transactions WHERE userId='u1'").get() as any).n === 2);

const sinCuenta = M.crear(db, 'u3', { type: 'expense', amount: 10, category: 'x' }, HOY) as any;
const nueva = db.prepare("SELECT * FROM accounts WHERE userId='u3'").get() as any;
comprobar('sin cuentas crea una de efectivo en su moneda', sinCuenta.ok && nueva?.currency === 'CUP' && nueva.balance === -10, nueva);

console.log('\nEditar');
let e = M.editar(db, 'u1', g.id, { amount: 50 }) as any;
comprobar('subir el importe corrige el saldo', e.ok && saldo('eur') === 68, saldo('eur'));
e = M.editar(db, 'u1', g.id, { type: 'income' }) as any;
comprobar('de gasto a ingreso corrige el saldo', e.ok && saldo('eur') === 168, saldo('eur'));
e = M.editar(db, 'u1', g.id, { accountId: 'usd', type: 'expense' }) as any;
comprobar('mover a una cuenta en otra moneda pide el tipo de cambio', 'error' in e && saldo('eur') === 168 && saldo('usd') === 50);
e = M.editar(db, 'u1', g.id, { accountId: 'usd', type: 'expense', exchangeRate: 1.1 }) as any;
comprobar('cambiar de cuenta devuelve el dinero a la anterior', e.ok && saldo('eur') === 118, saldo('eur'));
comprobar('y descuenta lo convertido de la nueva', saldo('usd') === -5, saldo('usd'));

e = M.editar(db, 'u1', i.id, { amount: 40 }) as any;
comprobar('en otra moneda reconvierte con el mismo tipo', e.ok && tx(i.id).amount === 36 && tx(i.id).originalAmount === 40, tx(i.id));
comprobar('y ajusta el saldo por la diferencia', saldo('eur') === 136, saldo('eur'));

e = M.editar(db, 'u1', i.id, { category: 'Ventas', description: 'Camisa', date: '2026-10-01' }) as any;
comprobar('cambiar textos y fecha no toca el saldo', e.ok && saldo('eur') === 136 && tx(i.id).category === 'Ventas');

comprobar('editar un movimiento ajeno no se puede', 'error' in M.editar(db, 'u2', g.id, { amount: 1 }));
comprobar('mover a una cuenta ajena no se puede', 'error' in M.editar(db, 'u1', g.id, { accountId: 'ajena' }));
comprobar('importe cero no se puede', 'error' in M.editar(db, 'u1', g.id, { amount: 0 }));
comprobar('los errores no cambian saldos', saldo('eur') === 136 && saldo('usd') === -5 && saldo('ajena') === 0);

console.log('\nCuadre final');
for (const c of ['eur', 'usd']) {
  const inicial = c === 'eur' ? 100 : 50;
  const mov = db.prepare(`SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END),0) s
                          FROM transactions WHERE accountId = ?`).get(c) as any;
  comprobar(`saldo de ${c} = inicial + movimientos`, Math.abs(inicial + mov.s - saldo(c)) < 1e-9, { inicial, mov: mov.s, saldo: saldo(c) });
}

console.log(fallos ? `\n${fallos} fallos` : '\nTodo bien');
process.exit(fallos ? 1 : 0);
