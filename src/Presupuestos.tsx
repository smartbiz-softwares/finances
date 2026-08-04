/**
 * Presupuestos por categoría.
 *
 * Un tope al mes por categoría, con aviso al 80 %. Ese momento es el que
 * importa: al 100 % ya no hay nada que decidir y al 50 % todavía no hay nada
 * que hacer; al 80 % quedan días de mes y margen para cambiar algo.
 *
 * Lo que se enseña es siempre "cuánto queda", no "cuánto llevas": la primera es
 * la cifra con la que se decide si entrar o no a un sitio.
 */
import React, { useCallback, useEffect, useState } from 'react';
import api from './api';
import { compacto, exacto } from './formato';

export interface Presupuesto {
  id: string;
  category: string;
  amount: number;
  gastado: number;
  proporcion: number;
  restante: number;
  situacion: 'bien' | 'cerca' | 'pasado';
}

interface Props {
  simbolo: string;
  /** Categorías ya usadas por la persona, para no hacerle escribirlas. */
  categorias: string[];
  /** Avisa al contenedor para que refresque lo que dependa de esto. */
  alCambiar?: () => void;
  mostrarAviso?: (texto: string, tipo?: string) => void;
}

const COLORES = {
  bien: { barra: 'bg-emerald-500', texto: 'text-emerald-500', borde: 'border-border' },
  cerca: { barra: 'bg-amber-500', texto: 'text-amber-500', borde: 'border-amber-500/40' },
  pasado: { barra: 'bg-rose-500', texto: 'text-rose-500', borde: 'border-rose-500/40' },
} as const;

export const Presupuestos: React.FC<Props> = ({ simbolo, categorias, alCambiar, mostrarAviso }) => {
  const [lista, setLista] = useState<Presupuesto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [categoria, setCategoria] = useState('');
  const [tope, setTope] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLista(await api('/finance/budgets'));
    } catch {
      // Sin presupuestos la sección simplemente no aparece.
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    const importe = Number(String(tope).replace(',', '.'));
    if (!categoria.trim()) return mostrarAviso?.('Elige una categoría', 'error');
    if (!Number.isFinite(importe) || importe <= 0) {
      return mostrarAviso?.('El tope tiene que ser mayor que cero', 'error');
    }

    setGuardando(true);
    try {
      const r = await api('/finance/budgets', {
        method: 'POST',
        body: JSON.stringify({ category: categoria.trim(), amount: importe }),
      });
      setLista(r.presupuestos || []);
      setAbierto(false);
      setCategoria('');
      setTope('');
      mostrarAviso?.('Presupuesto guardado', 'success');
      alCambiar?.();
    } catch (e: any) {
      mostrarAviso?.(e?.message || 'No se pudo guardar', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (p: Presupuesto) => {
    setLista((previa) => previa.filter((x) => x.id !== p.id));
    try {
      await api(`/finance/budgets/${p.id}`, { method: 'DELETE' });
      alCambiar?.();
    } catch {
      // Si falla se recupera del servidor, que es la verdad.
      cargar();
      mostrarAviso?.('No se pudo eliminar', 'error');
    }
  };

  if (cargando) return null;

  // Categorías que aún no tienen tope: ofrecer una que ya está puesta solo
  // lleva a sobrescribirla sin querer.
  const disponibles = categorias.filter(
    (c) => !lista.some((p) => p.category.toLowerCase() === c.toLowerCase())
  );

  return (
    <div className="bg-surface border border-border rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-serif font-semibold text-text-primary">Presupuestos del mes</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Te avisamos al llegar al 80 %, cuando todavía se puede hacer algo
          </p>
        </div>
        <button
          onClick={() => setAbierto((v) => !v)}
          className="px-3 py-2 rounded-2xl bg-brand/10 hover:bg-brand/20 text-brand text-xs font-semibold transition-all active:scale-[0.96] cursor-pointer shrink-0"
        >
          {abierto ? 'Cerrar' : 'Poner tope'}
        </button>
      </div>

      {abierto && (
        <div className="rounded-2xl border border-border bg-surface-hover/40 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              list="categorias-presupuesto"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Categoría"
              className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim outline-none focus:border-brand/60"
            />
            <datalist id="categorias-presupuesto">
              {disponibles.map((c) => <option key={c} value={c} />)}
            </datalist>

            <input
              value={tope}
              onChange={(e) => setTope(e.target.value)}
              inputMode="decimal"
              placeholder={`Tope al mes (${simbolo})`}
              className="sm:w-48 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm font-mono text-text-primary placeholder:text-text-dim outline-none focus:border-brand/60"
            />
          </div>

          <button
            onClick={guardar}
            disabled={guardando}
            className="w-full py-2.5 rounded-xl bg-brand hover:bg-brand-hover disabled:opacity-60 text-white text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      )}

      {lista.length === 0 ? (
        <p className="text-xs text-text-secondary py-2">
          Aún no tienes ninguno. Empieza por la categoría en la que más se te va el dinero.
        </p>
      ) : (
        <div className="space-y-3">
          {lista.map((p) => {
            const color = COLORES[p.situacion];
            // La barra se recorta al 100 % aunque el gasto se pase: lo que
            // sobra ya lo dice el texto, y una barra desbordada no se lee.
            const ancho = Math.min(100, Math.round(p.proporcion * 100));

            return (
              <div key={p.id} className={`rounded-2xl border ${color.borde} bg-surface-hover/30 p-4 space-y-2`}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-text-primary truncate">{p.category}</span>
                  <span className={`text-xs font-mono font-bold shrink-0 ${color.texto}`}>
                    {p.restante >= 0
                      ? `quedan ${compacto(p.restante)}${simbolo}`
                      : `${compacto(Math.abs(p.restante))}${simbolo} de más`}
                  </span>
                </div>

                <div className="h-2 rounded-full bg-border/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color.barra} transition-[width] duration-500`}
                    style={{ width: `${ancho}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono text-text-secondary" title={exacto(p.gastado, simbolo)}>
                    {compacto(p.gastado)}{simbolo} de {compacto(p.amount)}{simbolo} · {Math.round(p.proporcion * 100)} %
                  </span>
                  <button
                    onClick={() => borrar(p)}
                    className="text-[11px] text-text-dim hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Presupuestos;
