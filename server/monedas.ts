/**
 * Moneda de un movimiento.
 *
 * El saldo de una cuenta, los borrados que lo revierten y todos los informes
 * suponen que `amount` está en la moneda de la cuenta. Por eso, cuando alguien
 * registra un movimiento en otra moneda, `amount` sigue siendo el importe ya
 * convertido a la moneda de la cuenta, y lo que la persona escribió se guarda
 * aparte (`currency`, `originalAmount`, `exchangeRate`). Así nada de lo que ya
 * existe tiene que enterarse de que hay más monedas.
 *
 * El tipo de cambio lo pone la persona: la app no tiene una fuente de cambios
 * fiable (en Cuba el oficial y el real no se parecen), y adivinarlo le
 * cambiaría el saldo sin avisar.
 */

export const MONEDA_VALIDA = /^[A-Z]{2,6}$/;

export interface MonedaResuelta {
  /** Importe en la moneda de la cuenta: lo que mueve el saldo. */
  amount: number;
  /** Moneda en la que se registró el movimiento. */
  currency: string;
  /** Lo que se escribió, solo si difiere de la moneda de la cuenta. */
  originalAmount: number | null;
  /** Cuánto vale 1 unidad de `currency` en la moneda de la cuenta. */
  exchangeRate: number | null;
}

const redondear = (n: number) => Math.round(n * 100) / 100;

export function resolverMoneda(
  monedaCuenta: string | null | undefined,
  entrada: { amount: any; currency?: any; exchangeRate?: any }
): MonedaResuelta | { error: string } {
  const cuenta = String(monedaCuenta || 'EUR').toUpperCase();
  const importe = Number(entrada.amount);

  if (!Number.isFinite(importe) || importe <= 0) return { error: 'El importe debe ser mayor que cero' };

  const pedida = entrada.currency ? String(entrada.currency).trim().toUpperCase() : cuenta;
  if (!MONEDA_VALIDA.test(pedida)) return { error: 'Moneda no válida' };

  if (pedida === cuenta) {
    return { amount: importe, currency: cuenta, originalAmount: null, exchangeRate: null };
  }

  const tasa = Number(entrada.exchangeRate);
  if (!Number.isFinite(tasa) || tasa <= 0) {
    return { error: `Indica a cuánto equivale 1 ${pedida} en ${cuenta}` };
  }

  const convertido = redondear(importe * tasa);
  if (convertido <= 0) return { error: 'El importe convertido es demasiado pequeño' };

  return { amount: convertido, currency: pedida, originalAmount: importe, exchangeRate: tasa };
}
