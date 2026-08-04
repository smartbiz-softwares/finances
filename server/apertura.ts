/**
 * Lo que Hera dice al abrir, sin esperar a que le pregunten.
 *
 * Una pantalla de chat en blanco es el mayor freno que hay: la gente no sabe
 * qué preguntar y se va. Aquí se mira qué está pasando de verdad en sus cuentas
 * y se abre por ahí.
 *
 * Todo lo que se dice sale de datos reales. Si no hay nada que contar, se
 * ofrece algo útil en vez de inventar una alarma: exagerar para llamar la
 * atención funciona una vez y quema la confianza para siempre.
 */

export interface Apertura {
  /** Lo que dice Hera. */
  texto: string;
  /** Respuestas rápidas, para no tener que escribir. */
  sugerencias: string[];
  /** De qué va, por si la interfaz quiere destacarla. */
  motivo: 'gasto-alto' | 'racha' | 'meta-cerca' | 'sin-registrar' | 'fin-de-mes' | 'bienvenida' | 'general';
}

const SIMBOLOS: Record<string, string> = {
  EUR: '€', USD: '$', CUP: 'CUP', MXN: '$', COP: '$', ARS: '$', CLP: '$', PEN: 'S/', DOP: 'RD$',
};

const dinero = (n: number, moneda = 'EUR') => {
  const simbolo = SIMBOLOS[String(moneda).toUpperCase()] || '€';
  return `${Number(n).toLocaleString('es', { maximumFractionDigits: Math.abs(n) < 100 ? 2 : 0 })}${simbolo}`;
};

/** Elección estable para el mismo usuario y día. */
function elegir<T>(lista: T[], semilla: string): T {
  let h = 0;
  for (let i = 0; i < semilla.length; i++) h = (Math.imul(31, h) + semilla.charCodeAt(i)) | 0;
  return lista[Math.abs(h) % lista.length];
}

function menosDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

export function componer(db: any, userId: string, hoy: string): Apertura {
  const usuario = db.prepare('SELECT displayName, currency FROM users WHERE id = ?')
    .get(userId) as any;
  const moneda = usuario?.currency || 'EUR';
  const nombre = String(usuario?.displayName || '').split(' ')[0];

  const total = (db.prepare('SELECT COUNT(*) AS n FROM transactions WHERE userId = ?')
    .get(userId) as any)?.n || 0;

  // --- Sin historial: no hay nada que analizar todavía --------------------
  if (total === 0) {
    return {
      texto: nombre
        ? `Hola ${nombre}. Cuéntame un gasto de hoy y empiezo a llevarte las cuentas: puedes escribirlo, dictarlo o mandarme la foto de un recibo.`
        : 'Cuéntame un gasto de hoy y empiezo a llevarte las cuentas. Puedes escribirlo, dictarlo o mandarme la foto de un recibo.',
      sugerencias: ['Gasté 20 en comida', '¿Cómo funcionas?', 'Quiero ahorrar para algo'],
      motivo: 'bienvenida',
    };
  }

  const inicioMes = `${hoy.slice(0, 7)}-01`;

  // --- Un gasto que se sale de lo normal ----------------------------------
  //
  // Se compara la categoría de este mes con la media de los tres anteriores.
  // Solo se avisa si hay con qué comparar; si no, cualquier cifra parecería
  // alta y el aviso no significaría nada.
  const desviada = db.prepare(`
    SELECT category,
           SUM(CASE WHEN date >= ? THEN amount ELSE 0 END) AS esteMes,
           SUM(CASE WHEN date < ? AND date >= ? THEN amount ELSE 0 END) / 3.0 AS mediaPrevia
    FROM transactions
    WHERE userId = ? AND type = 'expense' AND date >= ?
    GROUP BY category
    HAVING mediaPrevia > 0 AND esteMes > mediaPrevia * 1.4
    ORDER BY (esteMes - mediaPrevia) DESC
    LIMIT 1
  `).get(inicioMes, inicioMes, menosDias(inicioMes, 92), userId, menosDias(inicioMes, 92)) as any;

  if (desviada?.category) {
    const subida = Math.round(((desviada.esteMes - desviada.mediaPrevia) / desviada.mediaPrevia) * 100);
    return {
      texto: `Llevas ${dinero(desviada.esteMes, moneda)} en ${desviada.category} este mes, un ${subida}% por encima de lo habitual. ¿Miramos qué lo ha movido?`,
      sugerencias: [
        `Ver mis gastos en ${desviada.category}`,
        '¿Cómo voy este mes?',
        'Ponme un límite para esa categoría',
      ],
      motivo: 'gasto-alto',
    };
  }

  // --- Una meta a punto ----------------------------------------------------
  const meta = db.prepare(`
    SELECT name, targetAmount, currentAmount
    FROM goals
    WHERE userId = ? AND targetAmount > 0 AND currentAmount < targetAmount
      AND currentAmount >= targetAmount * 0.8
    ORDER BY (currentAmount * 1.0 / targetAmount) DESC LIMIT 1
  `).get(userId) as any;

  if (meta) {
    const falta = meta.targetAmount - meta.currentAmount;
    return {
      texto: `Te faltan ${dinero(falta, moneda)} para "${meta.name}". Estás muy cerca. ¿Quieres que veamos de dónde sacarlos?`,
      sugerencias: ['¿De dónde puedo recortar?', 'Ver mis metas', 'Añadir a esa meta'],
      motivo: 'meta-cerca',
    };
  }

  // --- Días sin registrar --------------------------------------------------
  const ultima = (db.prepare('SELECT MAX(date) AS d FROM transactions WHERE userId = ?')
    .get(userId) as any)?.d;

  if (ultima) {
    const dias = Math.round(
      (Date.parse(`${hoy}T12:00:00Z`) - Date.parse(`${ultima}T12:00:00Z`)) / 86400000
    );

    if (dias >= 3) {
      return {
        texto: `Han pasado ${dias} días desde tu último registro. Dime lo que recuerdes y lo ordeno yo, aunque sea a bulto.`,
        sugerencias: ['Estos días gasté…', '¿Cómo voy este mes?', 'Ver mis últimos movimientos'],
        motivo: 'sin-registrar',
      };
    }
  }

  // --- Fin de mes con el gasto disparado -----------------------------------
  const diaDelMes = Number(hoy.slice(8, 10));
  const diasDelMes = new Date(Number(hoy.slice(0, 4)), Number(hoy.slice(5, 7)), 0).getDate();

  if (diaDelMes >= diasDelMes - 7) {
    const mes = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS gastos,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS ingresos
      FROM transactions WHERE userId = ? AND date >= ?
    `).get(userId, inicioMes) as any;

    if (mes?.ingresos > 0 && mes.gastos > mes.ingresos * 0.85) {
      const queda = mes.ingresos - mes.gastos;
      return {
        texto: queda > 0
          ? `Te quedan ${dinero(queda, moneda)} para los ${diasDelMes - diaDelMes} días que faltan del mes. ¿Repasamos en qué conviene no gastarlos?`
          : `Este mes has gastado ${dinero(Math.abs(queda), moneda)} más de lo que entró. ¿Vemos dónde se fue?`,
        sugerencias: ['¿En qué se me fue?', 'Ayúdame a llegar a fin de mes', 'Ver el resumen del mes'],
        motivo: 'fin-de-mes',
      };
    }
  }

  // --- Nada urgente: se ofrece algo útil, no una alarma inventada ---------
  const generales: Apertura[] = [
    {
      texto: '¿Qué quieres saber de tus cuentas hoy?',
      sugerencias: ['¿Cómo voy este mes?', '¿En qué gasto más?', 'Registrar un gasto'],
      motivo: 'general',
    },
    {
      texto: 'Tus cuentas están al día. ¿Te preparo el resumen del mes o registramos algo?',
      sugerencias: ['Resumen del mes', 'Registrar un gasto', '¿Puedo ahorrar más?'],
      motivo: 'general',
    },
    {
      texto: 'Cuéntame un gasto o pregúntame lo que quieras sobre tu dinero.',
      sugerencias: ['¿Cuánto llevo gastado?', '¿Cómo va mi Score?', 'Crear una meta'],
      motivo: 'general',
    },
  ];

  return elegir(generales, `${userId}|${hoy}`);
}
