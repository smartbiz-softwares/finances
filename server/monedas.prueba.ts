/**
 * Pruebas de la moneda de los movimientos.
 *
 * Lo que importa: sin moneda o con la de la cuenta nada cambia, y con otra
 * moneda el saldo se mueve por el importe convertido, nunca por el escrito.
 *
 *   npx tsx server/monedas.prueba.ts
 */
import { resolverMoneda } from './monedas.ts';

let fallos = 0;
function comprobar(descripcion: string, condicion: boolean, detalle?: any) {
  if (condicion) console.log(`  ok   ${descripcion}`);
  else { fallos++; console.log(`  FALLO ${descripcion}`, detalle !== undefined ? JSON.stringify(detalle) : ''); }
}

console.log('\nMisma moneda');
const a = resolverMoneda('EUR', { amount: 20 }) as any;
comprobar('sin moneda usa la de la cuenta', a.currency === 'EUR' && a.amount === 20 && a.originalAmount === null, a);
const b = resolverMoneda('EUR', { amount: 20, currency: 'eur', exchangeRate: 5 }) as any;
comprobar('misma moneda ignora el tipo de cambio', b.amount === 20 && b.exchangeRate === null, b);
const c = resolverMoneda(null, { amount: 5 }) as any;
comprobar('cuenta sin moneda se trata como EUR', c.currency === 'EUR', c);

console.log('\nOtra moneda');
const d = resolverMoneda('EUR', { amount: 20, currency: 'USD', exchangeRate: 0.92 }) as any;
comprobar('convierte a la moneda de la cuenta', d.amount === 18.4 && d.currency === 'USD' && d.originalAmount === 20 && d.exchangeRate === 0.92, d);
const e = resolverMoneda('CUP', { amount: 10, currency: 'USD', exchangeRate: '320' }) as any;
comprobar('acepta el tipo de cambio como texto', e.amount === 3200, e);
const f = resolverMoneda('USD', { amount: 10, currency: 'EUR', exchangeRate: 1.0857 }) as any;
comprobar('redondea a dos decimales', f.amount === 10.86, f);

console.log('\nErrores');
comprobar('otra moneda sin tipo de cambio falla', 'error' in resolverMoneda('EUR', { amount: 5, currency: 'USD' }));
comprobar('tipo de cambio cero falla', 'error' in resolverMoneda('EUR', { amount: 5, currency: 'USD', exchangeRate: 0 }));
comprobar('tipo de cambio negativo falla', 'error' in resolverMoneda('EUR', { amount: 5, currency: 'USD', exchangeRate: -1 }));
comprobar('importe cero falla', 'error' in resolverMoneda('EUR', { amount: 0 }));
comprobar('importe no numérico falla', 'error' in resolverMoneda('EUR', { amount: 'abc' }));
comprobar('moneda con basura falla', 'error' in resolverMoneda('EUR', { amount: 5, currency: 'US$;--', exchangeRate: 1 }));
comprobar('importe convertido a cero falla', 'error' in resolverMoneda('CUP', { amount: 1, currency: 'USD', exchangeRate: 0.000001 }));

console.log(fallos ? `\n${fallos} fallos` : '\nTodo bien');
process.exit(fallos ? 1 : 0);
