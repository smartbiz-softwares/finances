/**
 * Pruebas de lo que se saca de una frase dictada.
 *
 * Lo que importa es que no confunda un gasto con un ingreso: meter dinero donde
 * salía cuesta más de arreglar que de confirmar.
 *
 *   npx tsx server/extraer.prueba.ts
 */

// La función vive en server.ts; se replica aquí su contrato para poder probarla
// sin arrancar el servidor entero.
function extraerMovimiento(texto: string) {
  const limpio = texto.toLowerCase();

  const numero = limpio.match(/(\d+(?:[.,]\d{1,2})?)/);
  if (!numero) return null;

  const amount = Number(numero[1].replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const esIngreso = /\b(cobr|ingres|recib|me pagaron|me dieron|entr[oó]|gan[eé])/.test(limpio);

  const categorias: [RegExp, string][] = [
    [/\b(comida|comí|almuerzo|cena|desayuno|restaurante|pizza|café)\b/, 'Restaurantes'],
    [/\b(super|mercado|compra|tienda|víveres|viveres)\b/, 'Supermercado'],
    [/\b(gasolina|combustible|nafta|gasoil|taxi|bus|guagua|transporte|uber)\b/, 'Transporte'],
    [/\b(luz|agua|internet|teléfono|telefono|móvil|movil|recarga|factura|alquiler|renta)\b/, 'Servicios'],
    [/\b(ropa|zapatos|camisa|pantal[oó]n)\b/, 'Ropa'],
    [/\b(salario|sueldo|n[oó]mina|paga)\b/, 'Salario'],
    [/\b(medicina|farmacia|m[eé]dico|doctor|consulta)\b/, 'Salud'],
  ];

  const categoria = categorias.find(([patron]) => patron.test(limpio))?.[1]
    || (esIngreso ? 'Ingresos' : 'Varios');

  return {
    type: esIngreso ? 'income' : 'expense',
    amount,
    category: categoria,
    description: texto.charAt(0).toUpperCase() + texto.slice(1),
  };
}

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

console.log('\nImportes');
comprobar('entero', extraerMovimiento('gasté 20 en comida')?.amount === 20);
comprobar('con coma', extraerMovimiento('gasté 12,50 en el café')?.amount === 12.5);
comprobar('con punto', extraerMovimiento('gasté 12.50 en el café')?.amount === 12.5);
comprobar('miles', extraerMovimiento('pagué 1500 de alquiler')?.amount === 1500);
comprobar('sin número no devuelve nada', extraerMovimiento('gasté algo hoy') === null);
comprobar('cero no vale', extraerMovimiento('gasté 0 euros') === null);

console.log('\nGasto o ingreso');
comprobar('gastar es gasto', extraerMovimiento('gasté 20 en comida')?.type === 'expense');
comprobar('pagar es gasto', extraerMovimiento('pagué 30 de taxi')?.type === 'expense');
comprobar('cobrar es ingreso', extraerMovimiento('cobré 500 del trabajo')?.type === 'income');
comprobar('me pagaron es ingreso', extraerMovimiento('me pagaron 200')?.type === 'income');
comprobar('recibí es ingreso', extraerMovimiento('recibí 45 de un cliente')?.type === 'income');
comprobar('sin verbo claro se asume gasto',
  extraerMovimiento('30 de gasolina')?.type === 'expense');

console.log('\nCategorías');
const categoria = (frase: string) => extraerMovimiento(frase)?.category;
comprobar('comida', categoria('gasté 20 en comida') === 'Restaurantes');
comprobar('supermercado', categoria('40 en el mercado') === 'Supermercado');
comprobar('transporte', categoria('15 de taxi') === 'Transporte');
comprobar('cubano: guagua', categoria('5 en la guagua') === 'Transporte');
comprobar('servicios', categoria('pagué 60 de internet') === 'Servicios');
comprobar('salud', categoria('25 en la farmacia') === 'Salud');
comprobar('ingreso sin categoría clara', categoria('cobré 500') === 'Ingresos');
comprobar('gasto sin categoría clara', categoria('gasté 33') === 'Varios');

console.log('\nDescripción');
const d = extraerMovimiento('gasté 20 en comida');
comprobar('guarda la frase entera', d?.description === 'Gasté 20 en comida', d?.description);

console.log(`\n${pruebas - fallos}/${pruebas} pruebas correctas`);
process.exit(fallos > 0 ? 1 : 0);
