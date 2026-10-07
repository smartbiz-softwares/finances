/**
 * Aviso de cuentas que no entran en los totales.
 *
 * Con cuentas en varias monedas, el total solo suma lo que se puede convertir a
 * la moneda principal. Una cuenta sin tipo de cambio queda fuera, y eso no
 * puede pasar en silencio: el patrimonio parecería más pequeño sin motivo.
 */
import React, { useState } from 'react';
import api from './api';

interface CuentaSinConvertir { accountId: string; name: string; currency: string; balance: number; }

interface Props {
  moneda: string;
  cuentas: CuentaSinConvertir[];
  alGuardar?: () => void;
  mostrarAviso?: (texto: string, tipo?: string) => void;
}

export const AvisoMonedas: React.FC<Props> = ({ moneda, cuentas, alGuardar, mostrarAviso }) => {
  const [tasas, setTasas] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState<string | null>(null);

  if (!cuentas || cuentas.length === 0) return null;

  // Una entrada por moneda: con dos cuentas en EUR basta un tipo de cambio.
  const monedas: string[] = cuentas.map(c => c.currency).filter((m, i, todas) => todas.indexOf(m) === i);

  const guardar = async (de: string) => {
    const tasa = parseFloat(tasas[de] || '');
    if (!(tasa > 0)) return;
    setGuardando(de);
    try {
      await api('/finance/exchange-rates', { method: 'PUT', body: JSON.stringify({ de, a: moneda, tasa }) });
      mostrarAviso?.(`Guardado: 1 ${de} = ${tasa} ${moneda}`, 'success');
      alGuardar?.();
    } catch (e: any) {
      mostrarAviso?.(e?.message || 'No se pudo guardar el tipo de cambio', 'error');
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="bg-warning/5 border border-warning/30 rounded-3xl p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-text-primary">Hay cuentas fuera del total</p>
        <p className="text-xs text-text-secondary mt-0.5">
          Están en otra moneda y aún no sé a cuánto cambiarla a {moneda}:{' '}
          {cuentas.map(c => `${c.name} (${c.balance} ${c.currency})`).join(', ')}.
        </p>
      </div>
      {monedas.map(de => (
        <div key={de} className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-text-secondary">1 {de} =</span>
          <input
            type="number"
            step="any"
            inputMode="decimal"
            value={tasas[de] || ''}
            onChange={e => setTasas(p => ({ ...p, [de]: e.target.value }))}
            placeholder="0.00"
            className="w-28 bg-bg border border-border rounded-xl px-3 py-1.5 text-xs font-mono text-text-primary focus:outline-none focus:border-brand/60"
          />
          <span className="text-xs font-mono text-text-secondary">{moneda}</span>
          <button
            onClick={() => guardar(de)}
            disabled={guardando === de || !(parseFloat(tasas[de] || '') > 0)}
            className="px-3 py-1.5 rounded-xl bg-brand text-white text-[11px] font-semibold disabled:opacity-50 cursor-pointer"
          >
            {guardando === de ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      ))}
    </div>
  );
};

export default AvisoMonedas;
