/**
 * Redacción de las notificaciones.
 *
 * El requisito es que un mensaje no se repita nunca. Una lista fija de frases
 * se agota en dos semanas y a partir de ahí la gente deja de leerlas, así que
 * aquí los mensajes se *componen*: gancho + motivo, elegidos con una semilla
 * que depende de la persona y del día. Dos usuarios no reciben lo mismo el
 * mismo día, y el mismo usuario tarda meses en ver una combinación repetida.
 *
 * Los mensajes con datos varían solos: llevan sus cifras dentro, y esas cifras
 * no se repiten.
 *
 * Regla de estilo: cada mensaje dice algo concreto. "No olvides registrar tus
 * gastos" no mueve a nadie; "llevas tres días sin anotar nada, ¿te ayudo a
 * ponerte al día en un minuto?" sí.
 */

/** Generador determinista: misma semilla, misma secuencia. */
function aleatorio(semilla: string): () => number {
  // xmur3 para mezclar la cadena en un entero, y mulberry32 para la secuencia.
  let h = 1779033703 ^ semilla.length;
  for (let i = 0; i < semilla.length; i++) {
    h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = (h ^= h >>> 16) >>> 0;

  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const elegir = <T,>(lista: T[], r: () => number): T => lista[Math.floor(r() * lista.length)];

export const dinero = (n: number, simbolo = '€') =>
  `${Number(n).toLocaleString('es', { maximumFractionDigits: Math.abs(n) < 100 ? 2 : 0 })}${simbolo}`;

// --- Mensajes para quien no ha registrado nada hoy -------------------------
//
// Se combinan tres piezas. Ninguna presupone que la persona hizo algo mal:
// culpar al usuario es la forma más rápida de que desactive las notificaciones.

const GANCHOS = [
  'Un minuto y tu día queda cuadrado',
  '¿Qué tal fue el día en gastos?',
  'Dos toques y lo tienes anotado',
  'Cuéntaselo a Hera antes de que se te olvide',
  'Lo que no se anota, no se recuerda',
  'El café, el bus, lo pequeño: eso es lo que se escapa',
  'Tu yo de fin de mes te lo agradecerá',
  'Háblale a Hera y ella lo anota',
  '¿Algo que registrar de hoy?',
  'Los números de hoy, en un momento',
  'Sin formularios: díctalo y ya',
  'Foto al recibo y listo',
  'Ponte al día en lo que dura un semáforo',
  'Hoy también cuenta',
  'Nada que anotar también es un dato',
  'Un repaso rápido y cierras el día',
  'Tu dinero de hoy, en 30 segundos',
  '¿Se te escapó algún gasto?',
  'Cierra el día con las cuentas claras',
  'Anota ahora, decide mejor luego',
];

const MOTIVOS = [
  'Con el día completo, la predicción de fin de mes acierta.',
  'Cada registro afina lo que Hera puede aconsejarte.',
  'Los días sueltos son los que rompen el mes.',
  'Registrar a diario cuesta menos que reconstruir la semana.',
  'Lo que anotas hoy es lo que verás claro el domingo.',
  'Tu Score sube cuando el registro es constante.',
  'Sin datos de hoy, el resumen de la semana va cojo.',
  'Es el gasto pequeño repetido el que desordena el mes.',
  'Hera aprende de tus hábitos, pero necesita verlos.',
  'Un mes completo vale mucho más que veinte días sueltos.',
  'Así sabrás de verdad en qué se te va el dinero.',
  'Diez segundos hoy te ahorran una hora a fin de mes.',
  'Cuanto más completo el histórico, mejores las alertas.',
  'Las metas avanzan solas cuando el registro está al día.',
  'Es la diferencia entre suponer y saber.',
];

/** Máximo común divisor, para elegir un paso que recorra todo el ciclo. */
function mcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b];
  return a;
}

/**
 * Mensaje para un día sin registros.
 *
 * Elegir gancho y motivo al azar repite combinaciones mucho antes de agotarlas
 * —con 300 posibles, en 60 días ya salen repetidas—. En vez de eso se recorre
 * el ciclo completo: se avanza cada día un paso fijo, coprimo con el total, así
 * que pasan las 300 combinaciones antes de que vuelva a salir ninguna.
 *
 * El punto de partida y el paso dependen de la persona, de modo que dos
 * usuarios no van sincronizados.
 */
export function diarioSinDatos(userId: string, fecha: string, variante = 0) {
  const total = GANCHOS.length * MOTIVOS.length;
  const r = aleatorio(`${userId}|paso`);

  const inicio = Math.floor(aleatorio(`${userId}|inicio`)() * total);

  // Cualquier paso coprimo con el total sirve; se busca uno a partir del azar
  // sembrado con el usuario.
  let paso = 1 + Math.floor(r() * (total - 1));
  while (mcd(paso, total) !== 1) paso = (paso % (total - 1)) + 1;

  const dias = Math.floor(Date.parse(`${fecha}T00:00:00Z`) / 86400000) + variante;
  const indice = (((inicio + dias * paso) % total) + total) % total;

  const gancho = GANCHOS[indice % GANCHOS.length];
  const motivo = MOTIVOS[Math.floor(indice / GANCHOS.length) % MOTIVOS.length];

  return {
    titulo: gancho,
    cuerpo: motivo,
    huella: `sin-datos:${indice}`,
  };
}

// --- Resumen del día -------------------------------------------------------

export function diarioConDatos(opciones: {
  userId: string;
  fecha: string;
  gastos: number;
  ingresos: number;
  movimientos: number;
  categoriaTop?: string;
  simbolo?: string;
}) {
  const { userId, fecha, gastos, ingresos, movimientos, categoriaTop, simbolo = '€' } = opciones;
  const r = aleatorio(`${userId}|${fecha}|dia`);

  const aperturas = movimientos === 1
    ? ['Un movimiento hoy', 'Hoy registraste uno', 'Un apunte de hoy']
    : [`${movimientos} movimientos hoy`, `Hoy anotaste ${movimientos}`, `Van ${movimientos} de hoy`];

  const partes: string[] = [];
  if (gastos > 0) partes.push(`${dinero(gastos, simbolo)} en gastos`);
  if (ingresos > 0) partes.push(`${dinero(ingresos, simbolo)} de ingresos`);
  if (categoriaTop) partes.push(`lo más alto en ${categoriaTop}`);

  return {
    titulo: elegir(aperturas, r),
    cuerpo: partes.join(' · ') || 'Día cerrado.',
    huella: `dia:${fecha}`,
  };
}

// --- Resumen de la semana --------------------------------------------------

export function semanal(opciones: {
  userId: string;
  hasta: string;
  gastos: number;
  ingresos: number;
  variacionPct: number | null;
  categoriaTop?: string;
  diasRegistrados: number;
  simbolo?: string;
}) {
  const { userId, hasta, gastos, ingresos, variacionPct, categoriaTop, diasRegistrados, simbolo = '€' } = opciones;
  const r = aleatorio(`${userId}|${hasta}|semana`);

  const titulos = [
    'Tu semana en números',
    'Cómo fue la semana',
    'Resumen de los últimos 7 días',
    'La semana, cerrada',
  ];

  const partes = [`${dinero(gastos, simbolo)} gastados`];
  if (ingresos > 0) partes.push(`${dinero(ingresos, simbolo)} ingresados`);

  if (variacionPct !== null && Math.abs(variacionPct) >= 5) {
    // El signo importa más que el número: sube o baja respecto a la semana pasada.
    partes.push(variacionPct > 0
      ? `${Math.round(variacionPct)}% más que la semana pasada`
      : `${Math.abs(Math.round(variacionPct))}% menos que la semana pasada`);
  }
  if (categoriaTop) partes.push(`sobre todo en ${categoriaTop}`);
  if (diasRegistrados < 7) partes.push(`registraste ${diasRegistrados} de 7 días`);

  return {
    titulo: elegir(titulos, r),
    cuerpo: partes.join(' · '),
    huella: `semana:${hasta}`,
  };
}

// --- Resumen del mes -------------------------------------------------------

export function mensual(opciones: {
  userId: string;
  mes: string;
  nombreMes: string;
  gastos: number;
  ingresos: number;
  ahorro: number;
  categoriaTop?: string;
  variacionPct: number | null;
  simbolo?: string;
}) {
  const { userId, mes, nombreMes, gastos, ingresos, ahorro, categoriaTop, variacionPct, simbolo = '€' } = opciones;
  const r = aleatorio(`${userId}|${mes}|mes`);

  const titulos = [
    `${nombreMes}, cerrado`,
    `Tu ${nombreMes} en una línea`,
    `Cómo terminó ${nombreMes}`,
    `Balance de ${nombreMes}`,
  ];

  const partes: string[] = [];
  if (ahorro >= 0) partes.push(`ahorraste ${dinero(ahorro, simbolo)}`);
  else partes.push(`gastaste ${dinero(Math.abs(ahorro), simbolo)} más de lo que entró`);

  partes.push(`${dinero(gastos, simbolo)} en gastos`);
  if (categoriaTop) partes.push(`el grueso en ${categoriaTop}`);
  if (variacionPct !== null && Math.abs(variacionPct) >= 5) {
    partes.push(variacionPct > 0
      ? `${Math.round(variacionPct)}% por encima del mes anterior`
      : `${Math.abs(Math.round(variacionPct))}% por debajo del mes anterior`);
  }

  return {
    titulo: elegir(titulos, r),
    cuerpo: partes.join(' · '),
    huella: `mes:${mes}`,
  };
}

// --- Resumen del año -------------------------------------------------------

export function anual(opciones: {
  userId: string;
  anio: number;
  gastos: number;
  ingresos: number;
  ahorro: number;
  categoriaTop?: string;
  movimientos: number;
  mejorMes?: string;
  simbolo?: string;
}) {
  const { userId, anio, gastos, ingresos, ahorro, categoriaTop, movimientos, mejorMes, simbolo = '€' } = opciones;
  const r = aleatorio(`${userId}|${anio}|anio`);

  const titulos = [`Tu ${anio}, en números`, `Así fue tu ${anio}`, `${anio} completo`];

  const partes = [
    `${movimientos} movimientos`,
    `${dinero(gastos, simbolo)} en gastos`,
  ];
  if (ahorro > 0) partes.push(`${dinero(ahorro, simbolo)} ahorrados`);
  if (categoriaTop) partes.push(`tu mayor gasto: ${categoriaTop}`);
  if (mejorMes) partes.push(`tu mejor mes fue ${mejorMes}`);

  return {
    titulo: elegir(titulos, r),
    cuerpo: partes.join(' · '),
    huella: `anio:${anio}`,
  };
}

// --- Racha -----------------------------------------------------------------

export function rachaEnPeligro(userId: string, fecha: string, dias: number) {
  const r = aleatorio(`${userId}|${fecha}|racha`);
  const titulos = [
    `Llevas ${dias} días seguidos`,
    `No pierdas tus ${dias} días`,
    `${dias} días de racha en juego`,
  ];
  return {
    titulo: elegir(titulos, r),
    cuerpo: 'Un registro hoy y sigue viva. Te queda poco para que acabe el día.',
    huella: `racha-peligro:${fecha}`,
  };
}

export function rachaHito(userId: string, dias: number) {
  return {
    titulo: `${dias} días seguidos registrando`,
    cuerpo: 'Ese hábito es exactamente lo que hace que las cuentas cuadren.',
    huella: `racha-hito:${dias}`,
  };
}

// --- Vuelta tras una ausencia ---------------------------------------------

export function inactivo(userId: string, fecha: string, dias: number, pendiente: {
  gastosUltimos?: number;
  metaCerca?: string;
  simbolo?: string;
}) {
  const r = aleatorio(`${userId}|${fecha}|inactivo`);
  const { metaCerca, simbolo = '€', gastosUltimos } = pendiente;

  const titulos = [
    `${dias} días sin pasarte por aquí`,
    'Tus cuentas te esperan',
    'Retomamos donde lo dejaste',
  ];

  let cuerpo = 'Ponerte al día es más rápido de lo que parece: díctale a Hera lo que recuerdes.';
  if (metaCerca) cuerpo = `Tu meta "${metaCerca}" sigue avanzando. Un repaso rápido y la ves clara.`;
  else if (gastosUltimos) cuerpo = `Se te han quedado ${dinero(gastosUltimos, simbolo)} sin clasificar. Un minuto y queda ordenado.`;

  return { titulo: elegir(titulos, r), cuerpo, huella: `inactivo:${dias}` };
}
