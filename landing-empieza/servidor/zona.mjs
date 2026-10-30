// Fechas en la zona horaria del negocio (la agenda está en hora de Cuba): los
// días de las métricas y las citas se cuentan en esa hora, no en UTC.

// Crear un Intl.DateTimeFormat es caro: uno por zona, reutilizado.
const formatos = new Map();
const formatoDe = zona => {
  if (!formatos.has(zona)) formatos.set(zona, new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }));
  return formatos.get(zona);
};

export function partesEn(fecha, zona) {
  const p = Object.fromEntries(
    formatoDe(zona)
      .formatToParts(fecha)
      .map(x => [x.type, x.value]),
  );
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute };
}

/** Hora local del negocio -> instante UTC (corrige el desfase de la zona, con horario de verano). */
export function aUtc(y, m, d, h, min, zona) {
  const objetivo = Date.UTC(y, m - 1, d, h, min);
  let t = objetivo;
  for (let i = 0; i < 2; i++) {
    const p = partesEn(new Date(t), zona);
    t += objetivo - Date.UTC(p.y, p.m - 1, p.d, p.h, p.min);
  }
  return new Date(t);
}

const dos = n => String(n).padStart(2, '0');

/** "AAAA-MM-DD" del instante en la zona del negocio. */
export function diaEn(fecha, zona) {
  const p = partesEn(fecha, zona);
  return `${p.y}-${dos(p.m)}-${dos(p.d)}`;
}

/** Instante UTC de una cita guardada como día "AAAA-MM-DD" y hora "HH:MM" locales. */
export function inicioCita(dia, hora, zona) {
  const [y, m, d] = dia.split('-').map(Number);
  const [h, min] = hora.split(':').map(Number);
  return aUtc(y, m, d, h, min, zona);
}

export function hora12(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${dos(m)} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}
