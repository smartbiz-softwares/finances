/**
 * Pruebas de los cobros recurrentes.
 *
 * Lo que importa: que las fechas no se desvíen (el 31, los retrasos) y que
 * cobrar mueva el dinero a la cuenta elegida, y solo a esa.
 *
 *   npx tsx server/cobros.prueba.ts
 */
import Database from 'better-sqlite3';
import * as C from './cobros.ts';

let fallos = 0;
function comprobar(descripcion: string, condicion: boolean, detalle?: any) {
  if (condicion) console.log(`  ok   ${descripcion}`);
  else { fallos++; console.log(`  FALLO ${descripcion}`, detalle !== undefined ? JSON.stringify(detalle) : ''); }
}

const db = new Database(':memory:');
db.exec(`
  CREATE TABLE accounts (id TEXT PRIMARY KEY, userId TEXT, name TEXT, balance REAL DEFAULT 0);
  CREATE TABLE transactions (
    id TEXT PRIMARY KEY, userId TEXT, accountId TEXT, type TEXT, amount REAL,
    category TEXT, description TEXT, date TEXT, createdAt TEXT
  );
`);
C.crearTablas(db);
db.prepare("INSERT INTO accounts VALUES ('a1','u1','Efectivo',100)").run();
db.prepare("INSERT INTO accounts VALUES ('a2','u1','Banco',500)").run();
db.prepare("INSERT INTO accounts VALUES ('x1','u2','Ajena',0)").run();

const nuevo = (extra: any = {}) => {
  const v = C.validar({ cliente: 'José Daniel', motivo: 'Netflix', monto: 25,
    frecuencia: 'mensual', proximoCobro: '2026-06-20', telefono: '+53 5555-1234', ...extra });
  if ('error' in v) throw new Error(v.error);
  return C.crear(db, 'u1', v.datos);
};
const saldo = (id: string) => (db.prepare('SELECT balance FROM accounts WHERE id = ?').get(id) as any).balance;

console.log('\nFechas');
comprobar('mensual suma un mes', C.siguienteFecha('2026-06-20', 'mensual') === '2026-07-20');
comprobar('semanal suma 7 días', C.siguienteFecha('2026-06-28', 'semanal') === '2026-07-05');
comprobar('trimestral', C.siguienteFecha('2026-11-15', 'trimestral') === '2027-02-15');
comprobar('anual', C.siguienteFecha('2026-06-20', 'anual') === '2027-06-20');
comprobar('31 de enero + 1 mes = fin de febrero', C.siguienteFecha('2026-01-31', 'mensual') === '2026-02-28');
comprobar('el 31 vuelve a ser 31 tras febrero', C.siguienteFecha('2026-02-28', 'mensual', 31) === '2026-03-31');
comprobar('bisiesto', C.siguienteFecha('2028-01-31', 'mensual') === '2028-02-29');
comprobar('manual no tiene siguiente', C.siguienteFecha('2026-06-20', 'manual') === null);

console.log('\nValidación');
comprobar('sin cliente falla', 'error' in C.validar({ motivo: 'x', monto: 1, frecuencia: 'mensual', proximoCobro: '2026-06-20' }));
comprobar('monto 0 falla', 'error' in C.validar({ cliente: 'a', motivo: 'x', monto: 0, frecuencia: 'mensual', proximoCobro: '2026-06-20' }));
comprobar('frecuencia rara falla', 'error' in C.validar({ cliente: 'a', motivo: 'x', monto: 1, frecuencia: 'diaria', proximoCobro: '2026-06-20' }));
comprobar('fecha mala falla', 'error' in C.validar({ cliente: 'a', motivo: 'x', monto: 1, frecuencia: 'mensual', proximoCobro: '20/06/2026' }));
comprobar('teléfono se limpia', C.limpiarTelefono('+53 (5) 555-1234') === '5355551234');

console.log('\nCobrar');
const id = nuevo();
const r = C.cobrar(db, 'u1', id, { cuentaId: 'a2', hoy: '2026-06-20' });
comprobar('cobrar funciona', 'ok' in r, r);
comprobar('el dinero entra en la cuenta elegida', saldo('a2') === 525, saldo('a2'));
comprobar('la otra cuenta no se toca', saldo('a1') === 100);
comprobar('el próximo cobro es el 20 del mes siguiente', (r as any).proximoCobro === '2026-07-20', r);
comprobar('se crea el ingreso', (db.prepare("SELECT COUNT(*) n FROM transactions WHERE type='income' AND accountId='a2'").get() as any).n === 1);

const tarde = nuevo({ proximoCobro: '2026-06-10' });
const r2 = C.cobrar(db, 'u1', tarde, { cuentaId: 'a1', hoy: '2026-06-13' });
comprobar('cobrar con retraso mantiene el día 10', (r2 as any).proximoCobro === '2026-07-10', r2);

const olvidado = nuevo({ proximoCobro: '2026-01-05' });
const r3 = C.cobrar(db, 'u1', olvidado, { cuentaId: 'a1', hoy: '2026-06-13' });
comprobar('llevaba meses sin pagar: salta a la primera fecha futura', (r3 as any).proximoCobro === '2026-07-05', r3);

const ultimo = nuevo({ proximoCobro: '2026-01-31' });
C.cobrar(db, 'u1', ultimo, { cuentaId: 'a1', hoy: '2026-01-31' });
const r4 = C.cobrar(db, 'u1', ultimo, { cuentaId: 'a1', hoy: '2026-02-28' });
const r5 = C.cobrar(db, 'u1', ultimo, { cuentaId: 'a1', hoy: '2026-03-31' });
comprobar('el cobro del 31 pasa a febrero 28 y luego a marzo 31', (r4 as any).proximoCobro === '2026-03-31' && (r5 as any).proximoCobro === '2026-04-30', [r4, r5]);

comprobar('cuenta de otro usuario se rechaza',
  'error' in C.cobrar(db, 'u1', nuevo(), { cuentaId: 'x1', hoy: '2026-06-20' }));
comprobar('cuenta inexistente se rechaza',
  'error' in C.cobrar(db, 'u1', nuevo(), { cuentaId: '', hoy: '2026-06-20' }));
comprobar('cobro de otro usuario no existe',
  'error' in C.cobrar(db, 'u2', nuevo(), { cuentaId: 'x1', hoy: '2026-06-20' }));

const parcial = nuevo();
const antes = saldo('a1');
C.cobrar(db, 'u1', parcial, { cuentaId: 'a1', hoy: '2026-06-20', monto: 15 });
comprobar('se puede cobrar un monto distinto', saldo('a1') === antes + 15);

const manual = nuevo({ frecuencia: 'manual', proximoCobro: '2026-06-20' });
const rm = C.cobrar(db, 'u1', manual, { cuentaId: 'a1', hoy: '2026-06-20', proximaManual: '2026-09-01' });
comprobar('manual usa la fecha que se elige', (rm as any).proximoCobro === '2026-09-01', rm);
const rm2 = C.cobrar(db, 'u1', manual, { cuentaId: 'a1', hoy: '2026-09-01' });
comprobar('manual sin nueva fecha se queda sin próximo cobro', (rm2 as any).proximoCobro === null, rm2);

console.log('\nListado y avisos');
const lista = C.listar(db, 'u1', '2026-06-20');
const mio = lista.find((c) => c.id === id)!;
comprobar('acumula lo cobrado', mio.totalCobrado === 25 && mio.vecesCobrado === 1, mio);

db.exec('DELETE FROM charges; DELETE FROM charge_payments;');
nuevo({ proximoCobro: '2026-06-20' });
nuevo({ cliente: 'Ana', proximoCobro: '2026-06-18' });
nuevo({ cliente: 'Futuro', proximoCobro: '2026-07-01' });
const pausado = nuevo({ cliente: 'Pausa', proximoCobro: '2026-06-01' });
C.cambiarEstado(db, 'u1', pausado, 'pausado');
const p = C.pendientesDeAvisar(db, () => '2026-06-20');
comprobar('avisa de hoy y vencidos, no de futuros ni pausados',
  p.length === 1 && p[0].cobros.length === 2, p);
comprobar('el vencido lleva su retraso', p[0].cobros.some((c) => c.cliente === 'Ana' && c.retraso === 2));
comprobar('texto resumen con varios', C.textoAviso(p[0].cobros).titulo.includes('2'));

console.log(fallos ? `\n${fallos} fallos` : '\nTodo bien');
process.exit(fallos ? 1 : 0);
