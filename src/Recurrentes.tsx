/**
 * Gastos que se repiten, detectados solos.
 *
 * Nadie da de alta sus suscripciones a mano —por eso siguen cobrándose años
 * después de dejar de usarlas—, así que se deducen del histórico y se enseñan
 * aquí con lo que cuestan al año, que es la cifra que hace reaccionar: 12,99 al
 * mes no parece nada; 156 al año sí.
 *
 * Nada se registra solo. Se propone, y la persona confirma o descarta.
 */
import React, { useCallback, useEffect, useState } from 'react';
import api from './api';
import { compacto } from './formato';

export interface Recurrente {
  clave: string;
  descripcion: string;
  category: string;
  importe: number;
  cadencia: string;
  diasEntre: number;
  veces: number;
  ultima: string;
  proxima: string;
  retraso: number;
  decision: 'confirmado' | 'descartado' | null;
}

interface Props {
  simbolo: string;
  /** Para anotar un recibo pendiente desde el chat. */
  alRegistrar?: (texto: string) => void;
  mostrarAviso?: (texto: string, tipo?: string) => void;
}

export const Recurrentes: React.FC<Props> = ({ simbolo, alRegistrar, mostrarAviso }) => {
  const [lista, setLista] = useState<Recurrente[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const r = await api('/finance/recurring');
      setLista(r.detectados || []);
    } catch {
      // Sin detección la sección no aparece: no es un error que contar.
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const decidir = async (r: Recurrente, decision: 'confirmado' | 'descartado') => {
    // Se quita de la vista al instante; si falla, se recupera del servidor.
    if (decision === 'descartado') setLista((p) => p.filter((x) => x.clave !== r.clave));
    else setLista((p) => p.map((x) => (x.clave === r.clave ? { ...x, decision } : x)));

    try {
      await api('/finance/recurring/decidir', {
        method: 'POST',
        body: JSON.stringify({ clave: r.clave, decision }),
      });
    } catch {
      cargar();
      mostrarAviso?.('No se pudo guardar', 'error');
    }
  };

  if (cargando || lista.length === 0) return null;

  const alAno = (r: Recurrente) => Math.round(r.importe * (365 / r.diasEntre));
  const total = lista.reduce((suma, r) => suma + alAno(r), 0);

  return (
    <div className="bg-surface border border-border rounded-3xl p-5 shadow-xs space-y-4">
      <div>
        <h3 className="text-base font-serif font-semibold text-text-primary">Gastos que se repiten</h3>
        <p className="text-xs text-text-secondary mt-0.5">
          Detectados en tu histórico · <strong className="text-text-primary font-mono">{compacto(total)}{simbolo}</strong> al año entre todos
        </p>
      </div>

      <div className="space-y-3">
        {lista.map((r) => {
          const atrasado = r.retraso > 0;

          return (
            <div
              key={r.clave}
              className={`rounded-2xl border p-4 space-y-3 ${atrasado ? 'border-amber-500/40 bg-amber-500/5' : 'border-border bg-surface-hover/30'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{r.descripcion}</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {r.cadencia} · {r.category} · visto {r.veces} veces
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-mono font-bold text-text-primary">
                    {compacto(r.importe)}{simbolo}
                  </p>
                  <p className="text-[10px] font-mono text-text-dim">
                    {compacto(alAno(r))}{simbolo}/año
                  </p>
                </div>
              </div>

              {atrasado ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-amber-500">
                    Tocaba el {r.proxima} · {r.retraso} {r.retraso === 1 ? 'día' : 'días'} de retraso
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => alRegistrar?.(`Registra ${r.descripcion} de ${r.importe} en ${r.category}`)}
                      className="px-3 py-1.5 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand text-[11px] font-semibold transition-all active:scale-[0.96] cursor-pointer"
                    >
                      Anotarlo
                    </button>
                    <button
                      onClick={() => decidir(r, 'descartado')}
                      className="px-3 py-1.5 rounded-xl bg-surface-hover hover:bg-border text-text-secondary text-[11px] font-medium transition-all active:scale-[0.96] cursor-pointer"
                    >
                      Ya no lo pago
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-text-secondary">Próximo: {r.proxima}</span>
                  {r.decision !== 'confirmado' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decidir(r, 'confirmado')}
                        className="px-3 py-1.5 rounded-xl bg-surface-hover hover:bg-border text-text-primary text-[11px] font-medium transition-all active:scale-[0.96] cursor-pointer"
                      >
                        Sí, es fijo
                      </button>
                      <button
                        onClick={() => decidir(r, 'descartado')}
                        className="px-3 py-1.5 rounded-xl text-text-dim hover:text-rose-500 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        No lo es
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Recurrentes;
