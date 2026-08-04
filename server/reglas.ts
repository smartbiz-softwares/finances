/**
 * Qué se le cuenta a cada persona y cuándo.
 *
 * El planificador despierta cada media hora y recorre a quien tenga el push
 * activo, pero la inmensa mayoría de esas vueltas no envían nada: solo se
 * manda cuando hay algo que decir y estamos en la hora adecuada *de esa
 * persona*. El techo diario de `notificaciones.ts` corta lo que sobre.
 *
 * El orden de las reglas es el orden de importancia: si alguien solo va a
 * recibir un mensaje hoy, que sea el que más le sirve.
 */
import * as N from './notificaciones.ts';
import * as M from './mensajes.ts';
import * as P from './presupuestos.ts';
import * as R from './recurrentes.ts';

const SIMBOLOS: Record<string, string> = {
  EUR: '€', USD: '$', CUP: 'CUP', MXN: '$', COP: '$', ARS: '$', CLP: '$', PEN: 'S/', DOP: 'RD$',
};

const simboloDe = (moneda?: string) => SIMBOLOS[String(moneda || 'EUR').toUpperCase()] || '€';

/** Resta días a una fecha YYYY-MM-DD sin salirse del calendario. */
function menosDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

function sumas(db: any, userId: string, desde: string, hasta: string) {
  const fila = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS gastos,
      COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS ingresos,
      COUNT(*) AS movimientos,
      COUNT(DISTINCT date) AS dias
    FROM transactions
    WHERE userId = ? AND date >= ? AND date <= ?
  `).get(userId, desde, hasta) as any;

  const top = db.prepare(`
    SELECT category, SUM(amount) AS total
    FROM transactions
    WHERE userId = ? AND date >= ? AND date <= ? AND type = 'expense'
    GROUP BY category ORDER BY total DESC LIMIT 1
  `).get(userId, desde, hasta) as any;

  return {
    gastos: Number(fila?.gastos || 0),
    ingresos: Number(fila?.ingresos || 0),
    movimientos: Number(fila?.movimientos || 0),
    dias: Number(fila?.dias || 0),
    categoriaTop: top?.category as string | undefined,
  };
}

/** Variación porcentual entre dos periodos; null si no hay con qué comparar. */
function variacion(actual: number, anterior: number): number | null {
  if (!anterior) return null;
  return ((actual - anterior) / anterior) * 100;
}

/**
 * Racha de días consecutivos con al menos un registro.
 *
 * Se perdona un día suelto por semana: si la racha se rompe al primer despiste,
 * la gente la abandona y el mecanismo deja de servir para nada.
 */
export function calcularRacha(db: any, userId: string, hoy: string) {
  const dias = db.prepare(`
    SELECT DISTINCT date FROM transactions
    WHERE userId = ? AND date <= ? ORDER BY date DESC LIMIT 400
  `).all(userId, hoy).map((f: any) => f.date) as string[];

  const registrados = new Set(dias);
  const registroHoy = registrados.has(hoy);

  let racha = 0;
  let perdonesUsados = 0;
  // Si aún no ha registrado hoy la racha sigue viva: el día no ha terminado.
  let cursor = registroHoy ? hoy : menosDias(hoy, 1);

  while (racha < 400) {
    if (registrados.has(cursor)) {
      racha++;
      cursor = menosDias(cursor, 1);
      continue;
    }
    // Un hueco cada siete días de racha no la rompe.
    if (perdonesUsados < Math.floor(racha / 7) + (racha >= 1 ? 1 : 0) && racha > 0) {
      perdonesUsados++;
      cursor = menosDias(cursor, 1);
      continue;
    }
    break;
  }

  return { racha, registroHoy, mejorPosible: dias.length };
}

export interface Candidato extends N.Aviso {
  /** Menor es más importante. */
  prioridad: number;
}

/** Reúne todo lo que se le podría contar hoy a esta persona, ordenado. */
export function candidatos(db: any, usuario: any, ahora = new Date()): Candidato[] {
  const prefs = N.preferencias(db, usuario.id);
  const zona = prefs.zonaHoraria || 'America/Havana';
  const hoy = N.fechaLocal(zona, ahora);
  const hora = N.horaLocal(zona, ahora);
  const simbolo = simboloDe(usuario.currency);

  const fechaHoy = new Date(`${hoy}T12:00:00Z`);
  const diaSemana = fechaHoy.getUTCDay();      // 0 = domingo
  const diaMes = fechaHoy.getUTCDate();
  const mes = fechaHoy.getUTCMonth() + 1;

  const lista: Candidato[] = [];

  // 1. Resumen anual: el 1 de enero, por la mañana.
  if (prefs.resumenAnual && mes === 1 && diaMes === 1 && hora >= 10) {
    const anio = fechaHoy.getUTCFullYear() - 1;
    const s = sumas(db, usuario.id, `${anio}-01-01`, `${anio}-12-31`);
    if (s.movimientos > 0) {
      const mejor = db.prepare(`
        SELECT substr(date, 1, 7) AS mes,
               SUM(CASE WHEN type='income' THEN amount ELSE -amount END) AS balance
        FROM transactions WHERE userId = ? AND date >= ? AND date <= ?
        GROUP BY mes ORDER BY balance DESC LIMIT 1
      `).get(usuario.id, `${anio}-01-01`, `${anio}-12-31`) as any;

      lista.push({
        prioridad: 1,
        tipo: 'resumen-anual',
        url: '/?tab=reports',
        ...M.anual({
          userId: usuario.id, anio, gastos: s.gastos, ingresos: s.ingresos,
          ahorro: s.ingresos - s.gastos, categoriaTop: s.categoriaTop,
          movimientos: s.movimientos,
          mejorMes: mejor?.mes
            ? new Date(`${mejor.mes}-15T12:00:00Z`).toLocaleDateString('es', { month: 'long' })
            : undefined,
          simbolo,
        }),
      });
    }
  }

  // 2. Resumen mensual: el día 1, por la mañana.
  if (prefs.resumenMensual && diaMes === 1 && hora >= 10) {
    const finMesPasado = menosDias(hoy, 1);
    const inicioMesPasado = `${finMesPasado.slice(0, 7)}-01`;
    const s = sumas(db, usuario.id, inicioMesPasado, finMesPasado);

    if (s.movimientos > 0) {
      const finAnterior = menosDias(inicioMesPasado, 1);
      const inicioAnterior = `${finAnterior.slice(0, 7)}-01`;
      const previo = sumas(db, usuario.id, inicioAnterior, finAnterior);

      lista.push({
        prioridad: 2,
        tipo: 'resumen-mensual',
        url: '/?tab=reports',
        ...M.mensual({
          userId: usuario.id, mes: inicioMesPasado.slice(0, 7),
          nombreMes: new Date(`${inicioMesPasado}T12:00:00Z`).toLocaleDateString('es', { month: 'long' }),
          gastos: s.gastos, ingresos: s.ingresos, ahorro: s.ingresos - s.gastos,
          categoriaTop: s.categoriaTop,
          variacionPct: variacion(s.gastos, previo.gastos), simbolo,
        }),
      });
    }
  }

  // 3. Resumen semanal: domingo por la tarde, cuando la semana ya está hecha.
  if (prefs.resumenSemanal && diaSemana === 0 && hora >= 18) {
    const desde = menosDias(hoy, 6);
    const s = sumas(db, usuario.id, desde, hoy);

    if (s.movimientos > 0) {
      const previa = sumas(db, usuario.id, menosDias(hoy, 13), menosDias(hoy, 7));
      lista.push({
        prioridad: 3,
        tipo: 'resumen-semanal',
        url: '/?tab=reports',
        ...M.semanal({
          userId: usuario.id, hasta: hoy, gastos: s.gastos, ingresos: s.ingresos,
          variacionPct: variacion(s.gastos, previa.gastos),
          categoriaTop: s.categoriaTop, diasRegistrados: s.dias, simbolo,
        }),
      });
    }
  }

  // 4. La racha en peligro va antes que el resumen del día: es lo único con
  //    fecha de caducidad, y solo si de verdad hay racha que perder.
  if (prefs.racha && hora >= 19) {
    const { racha, registroHoy } = calcularRacha(db, usuario.id, hoy);
    if (!registroHoy && racha >= 3) {
      lista.push({
        prioridad: 4,
        tipo: 'racha-peligro',
        url: '/?accion=registrar',
        acciones: [{ action: 'registrar', title: 'Registrar ahora' }],
        ...M.rachaEnPeligro(usuario.id, hoy, racha),
      });
    }
  }

  // 5. Resumen del día. Si hubo registros se cuentan; si no, se manda algo que
  //    invite a registrar, distinto cada vez.
  if (prefs.resumenDiario && hora >= 20) {
    const s = sumas(db, usuario.id, hoy, hoy);

    if (s.movimientos > 0) {
      lista.push({
        prioridad: 5,
        tipo: 'resumen-diario',
        url: '/?tab=timeline',
        ...M.diarioConDatos({
          userId: usuario.id, fecha: hoy, gastos: s.gastos, ingresos: s.ingresos,
          movimientos: s.movimientos, categoriaTop: s.categoriaTop, simbolo,
        }),
      });
    } else {
      lista.push({
        prioridad: 6,
        tipo: 'sin-registros',
        url: '/?accion=registrar',
        acciones: [{ action: 'registrar', title: 'Registrar gasto' }],
        ...M.diarioSinDatos(usuario.id, hoy),
      });
    }
  }

  // 5 bis. Presupuesto que se acerca a su tope.
  //
  //   Va por delante de los resúmenes del día porque es lo único de la lista
  //   sobre lo que todavía se puede actuar: al 80 % quedan días de mes y margen
  //   para cambiar algo. Un resumen se puede leer mañana; esto no.
  if (prefs.avisos && hora >= 10) {
    // Días que quedan de mes: sin ese dato el aviso es un regaño, y con él es
    // una decisión ("me quedan 12 € para nueve días").
    const ultimoDia = new Date(Date.UTC(fechaHoy.getUTCFullYear(), mes, 0)).getUTCDate();
    const diasRestantes = ultimoDia - diaMes;

    for (const p of P.paraAvisar(db, usuario.id, hoy)) {
      lista.push({
        prioridad: 4,
        tipo: 'presupuesto',
        url: '/?tab=goals',
        ...M.presupuestoCerca({
          userId: usuario.id,
          fecha: hoy,
          categoria: p.category,
          gastado: p.gastado,
          tope: p.amount,
          proporcion: p.proporcion,
          diasRestantes,
          simbolo,
        }),
      });
    }
  }

  // 5 ter. Un recibo habitual que no ha aparecido.
  //
  //   Solo el más atrasado: soltar cinco preguntas de golpe es la manera de que
  //   no se conteste ninguna. La huella lleva el mes, así que cada recibo se
  //   pregunta una vez por ciclo.
  if (prefs.avisos && hora >= 12) {
    const atrasado = R.pendientes(db, usuario.id, hoy)
      .sort((a, b) => b.retraso - a.retraso)[0];

    if (atrasado) {
      lista.push({
        prioridad: 5,
        tipo: 'recurrente',
        url: '/?tab=timeline',
        ...M.recurrentePendiente({
          userId: usuario.id,
          fecha: hoy,
          descripcion: atrasado.descripcion,
          importe: atrasado.importe,
          diasTarde: atrasado.retraso,
          simbolo,
        }),
      });
    }
  }

  // 6. Vuelta tras una ausencia larga.
  //
  //    Tres intentos y se para: insistir cada día a quien ya se fue es la mejor
  //    forma de perderlo del todo. El tercero es el último; si a los mes y
  //    medio no ha vuelto, seguir escribiendo solo molesta.
  //
  //    Se mira por tramos y no por el día exacto: el planificador solo pasa
  //    dentro de la franja horaria de cada persona, así que exigir "el día 7
  //    justo" perdía a cualquiera que ese día tuviera el móvil apagado. La
  //    huella lleva el hito, no los días, para que el tramo no repita el aviso.
  if (prefs.avisos && hora >= 11) {
    const ultima = db.prepare(
      'SELECT MAX(date) AS d FROM transactions WHERE userId = ?'
    ).get(usuario.id) as any;

    // Quien nunca registró nada también se pierde, y es a quien más fácil se
    // recupera: cuenta desde que se dio de alta.
    const referencia = ultima?.d
      || String(usuario.createdAt || '').slice(0, 10)
      || null;

    if (referencia) {
      const diasFuera = Math.round(
        (Date.parse(`${hoy}T12:00:00Z`) - Date.parse(`${referencia}T12:00:00Z`)) / 86400000
      );

      const HITOS = [
        { hito: 7, desde: 7, hasta: 10 },
        { hito: 21, desde: 21, hasta: 25 },
        { hito: 45, desde: 45, hasta: 50 },
      ];
      const tramo = HITOS.find((h) => diasFuera >= h.desde && diasFuera <= h.hasta);

      if (tramo) {
        const meta = db.prepare(`
          SELECT name FROM goals WHERE userId = ?
          ORDER BY (currentAmount * 1.0 / NULLIF(targetAmount, 0)) DESC LIMIT 1
        `).get(usuario.id) as any;

        lista.push({
          prioridad: 7,
          tipo: 'vuelve',
          url: '/?tab=timeline',
          ...M.inactivo(usuario.id, hoy, diasFuera, {
            metaCerca: meta?.name, simbolo, hito: tramo.hito,
          }),
        });
      }
    }
  }

  return lista.sort((a, b) => a.prioridad - b.prioridad);
}

/** ¿Ya se le mandó exactamente este contenido antes? */
function yaEnviado(db: any, userId: string, huella?: string): boolean {
  if (!huella) return false;
  const previo = db.prepare(
    'SELECT 1 FROM notification_sent WHERE userId = ? AND huella = ? LIMIT 1'
  ).get(userId, huella);
  return !!previo;
}

/** Una pasada completa. Devuelve cuántas notificaciones salieron. */
export async function pasada(db: any, ahora = new Date()): Promise<number> {
  // Solo quien tenga al menos un dispositivo suscrito: sin push, el mensaje
  // quedaría solo en la campana y no traería a nadie de vuelta.
  const usuarios = db.prepare(`
    SELECT u.id, u.currency, u.createdAt FROM users u
    WHERE EXISTS (SELECT 1 FROM push_subscriptions p WHERE p.userId = u.id)
  `).all() as any[];

  let enviadas = 0;

  for (const usuario of usuarios) {
    try {
      for (const c of candidatos(db, usuario, ahora)) {
        // Los resúmenes son irrepetibles por definición: el de esta semana ya
        // se mandó o no, y no hay una segunda versión.
        if (yaEnviado(db, usuario.id, c.huella)) continue;

        const { prioridad, ...aviso } = c;
        if (await N.enviarSiProcede(db, usuario.id, aviso, ahora)) {
          enviadas++;
          break; // Uno por pasada: el resto puede esperar media hora.
        }
      }
    } catch (err) {
      console.error('[notificaciones] fallo evaluando usuario', usuario.id, err);
    }
  }

  return enviadas;
}

let temporizador: NodeJS.Timeout | null = null;

export function arrancarPlanificador(db: any) {
  if (temporizador) return;

  // Media hora es suficiente: las reglas miran la hora local, así que nadie
  // recibe nada fuera de su ventana aunque la pasada caiga a deshora.
  const CADA = 30 * 60 * 1000;

  const correr = async () => {
    try {
      const n = await pasada(db);
      if (n > 0) console.log(`[notificaciones] enviadas ${n}`);
    } catch (err) {
      console.error('[notificaciones] pasada fallida', err);
    }
  };

  temporizador = setInterval(correr, CADA);
  // Un margen tras el arranque para no competir con la carga inicial.
  setTimeout(correr, 60 * 1000);
  console.log('[notificaciones] planificador activo (cada 30 min)');
}
