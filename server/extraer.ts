/**
 * Saca importe, tipo y categoría de una frase dictada.
 *
 * Se hace con reglas y no con la IA a propósito: es instantáneo, no gasta
 * tokens y acierta en la forma en que la gente dicta de verdad ("gasté 20 en
 * comida"). Lo que no logre deducir se deja vacío para que se complete a mano.
 */

export interface Movimiento {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
}

/** Lo que vale cada palabra suelta. */
const VALORES: Record<string, number> = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
  trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintiun: 21,
  veintiuna: 21, veintidos: 22, veintitres: 23, veinticuatro: 24,
  veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28,
  veintinueve: 29, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60,
  setenta: 70, ochenta: 80, noventa: 90, cien: 100, ciento: 100,
  doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300,
  cuatrocientos: 400, cuatrocientas: 400, quinientos: 500, quinientas: 500,
  seiscientos: 600, seiscientas: 600, setecientos: 700, setecientas: 700,
  ochocientos: 800, ochocientas: 800, novecientos: 900, novecientas: 900,
};

/** Multiplicadores, de menor a mayor. */
const MULTIPLOS: Record<string, number> = {
  mil: 1000, miles: 1000,
  millon: 1_000_000, millones: 1_000_000,
};

/** Quita tildes para no duplicar cada entrada del diccionario. */
const sinTildes = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Convierte a número una cantidad dicha en palabras.
 *
 * Hace falta porque Whisper transcribe en letras lo que se dice en voz alta:
 * "gasté veinte" no llega nunca como "gasté 20". Sin esto, la mitad de los
 * dictados se quedaban sin importe.
 *
 * Devuelve null si en la frase no hay ninguna cantidad reconocible.
 */
export function numeroEnPalabras(frase: string): number | null {
  const palabras = sinTildes(frase.toLowerCase())
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  let total = 0;      // Cerrado por un multiplicador; ya no cambia.
  let parcial = 0;    // Lo que se está sumando ahora mismo.
  let hayAlgo = false;

  for (const palabra of palabras) {
    if (palabra === 'y') continue;  // "treinta y cinco"

    if (palabra in VALORES) {
      parcial += VALORES[palabra];
      hayAlgo = true;
      continue;
    }

    if (palabra in MULTIPLOS) {
      const factor = MULTIPLOS[palabra];
      // "mil" a secas vale 1000, no 0: sin nada delante se asume uno.
      parcial = (parcial === 0 ? 1 : parcial) * factor;

      // El grupo queda cerrado: "dos mil quinientos" son 2000 fijos más lo
      // que venga después.
      total += parcial;
      parcial = 0;
      hayAlgo = true;
      continue;
    }

    // Una palabra que no es número corta la cantidad: en "veinte de comida y
    // tres de pan" son dos cifras distintas, y nos quedamos con la primera.
    if (hayAlgo) break;
  }

  if (!hayAlgo) return null;

  const valor = total + parcial;
  return valor > 0 ? valor : null;
}

/** Palabras que suenan a cobro, no a pago. */
const INGRESO = /\b(cobr|ingres|recib|me pagaron|me dieron|entr[oó]|gan[eé])/;

const CATEGORIAS: [RegExp, string][] = [
  [/\b(comida|comí|almuerzo|cena|desayuno|restaurante|pizza|café)\b/, 'Restaurantes'],
  [/\b(super|mercado|compra|tienda|víveres|viveres)\b/, 'Supermercado'],
  [/\b(gasolina|combustible|nafta|gasoil|taxi|bus|guagua|transporte|uber)\b/, 'Transporte'],
  [/\b(luz|agua|internet|teléfono|telefono|móvil|movil|recarga|factura|alquiler|renta)\b/, 'Servicios'],
  [/\b(ropa|zapatos|camisa|pantal[oó]n)\b/, 'Ropa'],
  [/\b(salario|sueldo|n[oó]mina|paga)\b/, 'Salario'],
  [/\b(medicina|farmacia|m[eé]dico|doctor|consulta)\b/, 'Salud'],
];

export function extraerMovimiento(texto: string): Movimiento | null {
  const limpio = texto.toLowerCase();

  // Se admiten "20", "20,50" y "20.50"; el separador decimal varía según quién
  // dicte y qué transcriba.
  const enCifra = limpio.match(/(\d+(?:[.,]\d{1,2})?)/);

  // Las cifras mandan sobre las palabras: si Whisper escribió "20", eso es lo
  // que se dijo. Solo cuando no hay ninguna se buscan los números en letras.
  const amount = enCifra
    ? Number(enCifra[1].replace(',', '.'))
    : numeroEnPalabras(limpio);

  if (amount === null || !Number.isFinite(amount) || amount <= 0) return null;

  const esIngreso = INGRESO.test(limpio);

  const categoria = CATEGORIAS.find(([patron]) => patron.test(limpio))?.[1]
    || (esIngreso ? 'Ingresos' : 'Varios');

  return {
    type: esIngreso ? 'income' : 'expense',
    amount,
    category: categoria,
    // La frase entera como descripción: es lo que la persona dijo, y le va a
    // sonar más que cualquier resumen que hiciéramos por ella.
    description: texto.charAt(0).toUpperCase() + texto.slice(1),
  };
}
