/**
 * Formato de cifras.
 *
 * En una pantalla de móvil, "1.284.500,00 €" no cabe y además no se lee: quien
 * mira un resumen quiere el orden de magnitud, no el céntimo. Por eso los
 * resúmenes, gráficos y tarjetas van en forma compacta —1,2k · 3,4M— y el
 * importe exacto se reserva para donde es el dato en sí: el detalle de un
 * movimiento, un formulario, una factura.
 *
 * Se usa la coma decimal y el punto de millar del castellano, que es lo que
 * espera quien lee.
 */

const UNIDADES = [
  { limite: 1_000_000_000_000, sufijo: 'B' },
  { limite: 1_000_000_000, sufijo: 'MM' },
  { limite: 1_000_000, sufijo: 'M' },
  { limite: 1_000, sufijo: 'k' },
];

/**
 * Cifra compacta: 1,2k · 3,4M.
 *
 * Por debajo de mil se devuelve el número tal cual, porque "850" ya es corto y
 * "0,9k" sería peor de leer y menos exacto.
 */
export function compacto(valor: number | string | null | undefined, decimales = 1): string {
  const n = Number(valor);
  if (!Number.isFinite(n)) return '0';

  const signo = n < 0 ? '-' : '';
  const abs = Math.abs(n);

  if (abs < 1000) {
    // Los céntimos solo se enseñan si los hay: "12" se lee mejor que "12,00".
    const tieneDecimales = Math.round(abs * 100) % 100 !== 0;
    return signo + abs.toLocaleString('es', {
      minimumFractionDigits: tieneDecimales ? 2 : 0,
      maximumFractionDigits: 2,
    });
  }

  for (const { limite, sufijo } of UNIDADES) {
    if (abs < limite) continue;

    const reducido = abs / limite;
    // 1,2k pero 12k: con dos cifras enteras el decimal ya no aporta nada.
    const cifras = reducido >= 100 ? 0 : reducido >= 10 ? Math.min(decimales, 1) : decimales;

    return signo + reducido.toLocaleString('es', {
      minimumFractionDigits: 0,
      maximumFractionDigits: cifras,
    }) + sufijo;
  }

  return signo + abs.toLocaleString('es');
}

/** Cifra compacta con símbolo de moneda: 1,2k€ */
export function dinero(
  valor: number | string | null | undefined,
  simbolo = '€',
  decimales = 1
): string {
  return `${compacto(valor, decimales)}${simbolo}`;
}

/** Con signo delante, para ingresos y gastos: +1,2k€ · -340€ */
export function conSigno(
  valor: number | string | null | undefined,
  simbolo = '€',
  tipo?: 'income' | 'expense'
): string {
  const n = Number(valor) || 0;
  const positivo = tipo ? tipo === 'income' : n >= 0;
  return `${positivo ? '+' : '-'}${compacto(Math.abs(n))}${simbolo}`;
}

/**
 * Importe exacto, hasta el céntimo.
 *
 * Para el detalle de un movimiento, formularios y cualquier sitio donde la
 * cifra concreta *es* la información. Redondear ahí sería mentir.
 */
export function exacto(
  valor: number | string | null | undefined,
  simbolo = '€'
): string {
  const n = Number(valor);
  if (!Number.isFinite(n)) return `0${simbolo}`;

  return n.toLocaleString('es', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + simbolo;
}

/** Cantidades que no son dinero: 1,2k movimientos. */
export const cantidad = (valor: number | string | null | undefined) => compacto(valor, 1);
