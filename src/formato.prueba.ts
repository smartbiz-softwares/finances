/**
 * Pruebas del formato de cifras.
 *
 *   npx tsx src/formato.prueba.ts
 */
import { compacto, dinero, conSigno, exacto } from './formato.ts';

let fallos = 0;
let pruebas = 0;

function igual(descripcion: string, obtenido: string, esperado: string) {
  pruebas++;
  if (obtenido === esperado) console.log(`  ok   ${descripcion}: ${obtenido}`);
  else {
    fallos++;
    console.log(`  FALLO ${descripcion}: esperaba "${esperado}", vino "${obtenido}"`);
  }
}

console.log('\nCompacto');
igual('cero', compacto(0), '0');
igual('cifra pequeña sin céntimos', compacto(42), '42');
igual('cifra pequeña con céntimos', compacto(12.5), '12,50');
igual('céntimos exactos no se inventan', compacto(12), '12');
igual('justo por debajo del millar', compacto(999), '999');
igual('mil', compacto(1000), '1k');
igual('millar con decimal', compacto(1200), '1,2k');
igual('decenas de millar pierden el decimal fino', compacto(12500), '12,5k');
igual('centenas de millar van redondas', compacto(125000), '125k');
igual('millón', compacto(1_000_000), '1M');
igual('millón con decimal', compacto(1_250_000), '1,3M');
igual('millardo', compacto(1_500_000_000), '1,5MM');
igual('negativo mantiene el signo', compacto(-2500), '-2,5k');

console.log('\nDinero');
igual('con símbolo', dinero(1500), '1,5k€');
igual('otra moneda', dinero(2_300_000, '$'), '2,3M$');
igual('pequeño con símbolo', dinero(85.5, '$'), '85,50$');

console.log('\nCon signo');
igual('ingreso', conSigno(1200, '€', 'income'), '+1,2k€');
igual('gasto', conSigno(1200, '€', 'expense'), '-1,2k€');
igual('deduce del valor', conSigno(-450), '-450€');

console.log('\nExacto');
igual('siempre con dos decimales', exacto(12), '12,00€');
igual('no compacta', exacto(1_250_000), '1.250.000,00€');
igual('redondea al céntimo', exacto(12.345), '12,35€');

console.log('\nEntradas raras');
igual('nulo', compacto(null), '0');
igual('indefinido', compacto(undefined), '0');
igual('texto que no es número', compacto('hola' as any), '0');
igual('texto numérico', compacto('1500'), '1,5k');

console.log(`\n${pruebas - fallos}/${pruebas} pruebas correctas`);
process.exit(fallos > 0 ? 1 : 0);
