/**
 * Cobros recurrentes: lo que otras personas te pagan cada cierto tiempo.
 *
 * Nada se anota solo. Al tocar "Cobrar" se elige la cuenta donde entra el
 * dinero, y solo entonces se crea el ingreso y el cobro pasa al siguiente
 * período.
 */
import React, { useCallback, useEffect, useState } from 'react';
import api from './api';
import { compacto } from './formato';

export interface Cobro {
  id: string;
  cliente: string;
  telefono: string;
  motivo: string;
  monto: number;
  frecuencia: 'semanal' | 'mensual' | 'trimestral' | 'anual' | 'manual';
  proximoCobro: string | null;
  estado: 'activo' | 'pausado' | 'finalizado';
  notas: string;
  retraso: number | null;
  totalCobrado: number;
  vecesCobrado: number;
}

interface Cuenta { id: string; name: string; balance?: number; }

interface Props {
  simbolo: string;
  cuentas: Cuenta[];
  /** Para refrescar saldos y movimientos tras cobrar. */
  alCambiar?: () => void;
  mostrarAviso?: (texto: string, tipo?: string) => void;
}

const FRECUENCIAS: { valor: Cobro['frecuencia']; nombre: string }[] = [
  { valor: 'semanal', nombre: 'Semanal' },
  { valor: 'mensual', nombre: 'Mensual' },
  { valor: 'trimestral', nombre: 'Trimestral' },
  { valor: 'anual', nombre: 'Anual' },
  { valor: 'manual', nombre: 'Fecha manual' },
];

const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const campo = 'w-full bg-bg border border-border rounded-2xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand/60';
const etiqueta = 'text-[11px] font-semibold text-text-secondary mb-1 block';

/** Enlace de WhatsApp con el recordatorio ya escrito. */
export function enlaceWhatsapp(c: Cobro, simbolo: string): string {
  const texto = `Hola ${c.cliente}, te recuerdo el pago de ${c.motivo}: ${c.monto}${simbolo}`
    + (c.proximoCobro ? ` (vence el ${c.proximoCobro}).` : '.') + ' ¡Gracias!';
  return `https://wa.me/${c.telefono}?text=${encodeURIComponent(texto)}`;
}

const vacio = {
  cliente: '', telefono: '', motivo: '', monto: '',
  frecuencia: 'mensual' as Cobro['frecuencia'], proximoCobro: hoyLocal(), notas: '',
};

export const Cobros: React.FC<Props> = ({ simbolo, cuentas, alCambiar, mostrarAviso }) => {
  const [lista, setLista] = useState<Cobro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [formulario, setFormulario] = useState<{ id: string | null; datos: typeof vacio } | null>(null);
  const [cobrando, setCobrando] = useState<Cobro | null>(null);
  const [cuentaId, setCuentaId] = useState('');
  const [montoCobro, setMontoCobro] = useState('');
  const [proximaManual, setProximaManual] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const r = await api('/finance/charges');
      setLista(r.cobros || []);
    } catch {
      mostrarAviso?.('No se pudieron cargar los cobros', 'error');
    } finally {
      setCargando(false);
    }
  }, [mostrarAviso]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirCobro = (c: Cobro) => {
    setCobrando(c);
    setCuentaId(cuentas[0]?.id || '');
    setMontoCobro(String(c.monto));
    setProximaManual('');
  };

  const confirmarCobro = async () => {
    if (!cobrando || !cuentaId) return;
    setGuardando(true);
    try {
      await api(`/finance/charges/${cobrando.id}/cobrar`, {
        method: 'POST',
        body: JSON.stringify({
          cuentaId,
          monto: Number(montoCobro),
          proximaManual: cobrando.frecuencia === 'manual' && proximaManual ? proximaManual : undefined,
        }),
      });
      mostrarAviso?.(`Cobrado a ${cobrando.cliente}`, 'success');
      setCobrando(null);
      await cargar();
      alCambiar?.();
    } catch (e: any) {
      mostrarAviso?.(e?.message || 'No se pudo registrar el cobro', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const guardar = async () => {
    if (!formulario) return;
    setGuardando(true);
    try {
      const { id, datos } = formulario;
      await api(id ? `/finance/charges/${id}` : '/finance/charges', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify({ ...datos, monto: Number(datos.monto) }),
      });
      setFormulario(null);
      await cargar();
    } catch (e: any) {
      mostrarAviso?.(e?.message || 'No se pudo guardar', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (c: Cobro, estado: Cobro['estado']) => {
    try {
      await api(`/finance/charges/${c.id}/estado`, { method: 'POST', body: JSON.stringify({ estado }) });
      cargar();
    } catch {
      mostrarAviso?.('No se pudo cambiar el estado', 'error');
    }
  };

  const borrar = async (c: Cobro) => {
    if (!window.confirm(`¿Borrar el cobro de ${c.cliente}? Los ingresos ya registrados se conservan.`)) return;
    try {
      await api(`/finance/charges/${c.id}`, { method: 'DELETE' });
      cargar();
    } catch {
      mostrarAviso?.('No se pudo borrar', 'error');
    }
  };

  if (cargando) return null;

  const activos = lista.filter((c) => c.estado === 'activo');
  const vencidos = activos.filter((c) => (c.retraso ?? -1) > 0);
  const mes = hoyLocal().slice(0, 7);
  const esteMes = activos.filter((c) => c.proximoCobro && c.proximoCobro.slice(0, 7) <= mes);
  const sumar = (xs: Cobro[]) => xs.reduce((s, c) => s + c.monto, 0);

  return (
    <div className="bg-surface border border-border rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-serif font-semibold text-text-primary">Cobros recurrentes</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Por cobrar este mes: <strong className="text-text-primary font-mono">{compacto(sumar(esteMes))}{simbolo}</strong>
            {vencidos.length > 0 && (
              <> · <strong className="text-error font-mono">{compacto(sumar(vencidos))}{simbolo}</strong> vencido</>
            )}
          </p>
        </div>
        <button
          onClick={() => setFormulario({ id: null, datos: { ...vacio, proximoCobro: hoyLocal() } })}
          className="px-3.5 py-2 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-semibold shrink-0 transition-all active:scale-[0.97] cursor-pointer"
        >
          + Nuevo cobro
        </button>
      </div>

      {lista.length === 0 && (
        <p className="text-xs text-text-dim">
          Aquí llevas lo que te pagan cada semana, mes o año (por ejemplo, la cuota de Netflix de un cliente).
          Te avisamos cuando toca cobrar.
        </p>
      )}

      <div className="space-y-3">
        {lista.map((c) => {
          const vencido = c.estado === 'activo' && (c.retraso ?? -1) > 0;
          const hoy = c.estado === 'activo' && c.retraso === 0;
          const inactivo = c.estado !== 'activo';

          return (
            <div
              key={c.id}
              className={`rounded-2xl border p-4 space-y-3 ${vencido ? 'border-error/40 bg-error/5' : hoy ? 'border-warning/40 bg-warning/5' : 'border-border bg-surface-hover/30'} ${inactivo ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{c.cliente}</p>
                  <p className="text-[11px] text-text-secondary mt-0.5 truncate">
                    {c.motivo} · {c.frecuencia}
                    {c.estado !== 'activo' && ` · ${c.estado}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-mono font-bold text-text-primary">{compacto(c.monto)}{simbolo}</p>
                  {c.vecesCobrado > 0 && (
                    <p className="text-[10px] font-mono text-text-dim">
                      {compacto(c.totalCobrado)}{simbolo} cobrado
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`text-[11px] ${vencido ? 'text-error' : hoy ? 'text-warning' : 'text-text-secondary'}`}>
                  {!c.proximoCobro
                    ? 'Sin próxima fecha'
                    : vencido
                      ? `Tocaba el ${c.proximoCobro} · ${c.retraso} ${c.retraso === 1 ? 'día' : 'días'} de retraso`
                      : hoy
                        ? 'Toca cobrar hoy'
                        : `Próximo cobro: ${c.proximoCobro}`}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {c.estado !== 'finalizado' && (
                    <button
                      onClick={() => abrirCobro(c)}
                      className="px-3 py-1.5 rounded-xl bg-brand text-white hover:bg-brand-hover text-[11px] font-semibold transition-all active:scale-[0.96] cursor-pointer"
                    >
                      Cobrar
                    </button>
                  )}
                  {c.telefono && c.estado !== 'finalizado' && (
                    <a
                      href={enlaceWhatsapp(c, simbolo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-success/15 text-success hover:bg-success/25 text-[11px] font-semibold transition-all active:scale-[0.96]"
                    >
                      WhatsApp
                    </a>
                  )}
                  <button
                    onClick={() => setFormulario({
                      id: c.id,
                      datos: {
                        cliente: c.cliente, telefono: c.telefono, motivo: c.motivo, monto: String(c.monto),
                        frecuencia: c.frecuencia, proximoCobro: c.proximoCobro || hoyLocal(), notas: c.notas,
                      },
                    })}
                    className="px-3 py-1.5 rounded-xl bg-surface-hover hover:bg-border text-text-secondary text-[11px] font-medium cursor-pointer"
                  >
                    Editar
                  </button>
                  {c.estado === 'activo' && (
                    <button onClick={() => cambiarEstado(c, 'pausado')} className="text-[11px] text-text-dim hover:text-text-primary cursor-pointer">Pausar</button>
                  )}
                  {c.estado !== 'activo' && (
                    <button onClick={() => cambiarEstado(c, 'activo')} className="text-[11px] text-brand cursor-pointer">Reactivar</button>
                  )}
                  {c.estado !== 'finalizado' && (
                    <button onClick={() => cambiarEstado(c, 'finalizado')} className="text-[11px] text-text-dim hover:text-text-primary cursor-pointer">Finalizar</button>
                  )}
                  <button onClick={() => borrar(c)} className="text-[11px] text-text-dim hover:text-error cursor-pointer">Borrar</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Formulario: crear o editar */}
      {formulario && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center justify-center p-3" onClick={() => setFormulario(null)}>
          <div className="bg-surface border border-border rounded-3xl p-5 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-base font-serif font-semibold text-text-primary">
              {formulario.id ? 'Editar cobro' : 'Nuevo cobro recurrente'}
            </h4>

            {([
              ['cliente', 'Cliente', 'José Daniel', 'text'],
              ['telefono', 'Teléfono (con código de país, para WhatsApp)', '+53 5555 1234', 'tel'],
              ['motivo', 'Motivo', 'Pago de Netflix', 'text'],
              ['monto', `Monto (${simbolo})`, '25', 'number'],
            ] as const).map(([clave, titulo, ejemplo, tipo]) => (
              <div key={clave}>
                <label className={etiqueta}>{titulo}</label>
                <input
                  type={tipo}
                  inputMode={tipo === 'number' ? 'decimal' : undefined}
                  value={(formulario.datos as any)[clave]}
                  placeholder={ejemplo}
                  onChange={(e) => setFormulario({ ...formulario, datos: { ...formulario.datos, [clave]: e.target.value } })}
                  className={campo}
                />
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={etiqueta}>Frecuencia</label>
                <select
                  value={formulario.datos.frecuencia}
                  onChange={(e) => setFormulario({ ...formulario, datos: { ...formulario.datos, frecuencia: e.target.value as any } })}
                  className={campo}
                >
                  {FRECUENCIAS.map((f) => <option key={f.valor} value={f.valor}>{f.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={etiqueta}>Próximo cobro</label>
                <input
                  type="date"
                  value={formulario.datos.proximoCobro}
                  onChange={(e) => setFormulario({ ...formulario, datos: { ...formulario.datos, proximoCobro: e.target.value } })}
                  className={campo}
                />
              </div>
            </div>

            <div>
              <label className={etiqueta}>Notas (opcional)</label>
              <input
                value={formulario.datos.notas}
                onChange={(e) => setFormulario({ ...formulario, datos: { ...formulario.datos, notas: e.target.value } })}
                className={campo}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setFormulario(null)} className="flex-1 py-2.5 rounded-2xl bg-surface-hover text-text-secondary text-xs font-semibold cursor-pointer">Cancelar</button>
              <button
                onClick={guardar}
                disabled={guardando}
                className="flex-1 py-2.5 rounded-2xl bg-brand text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cobrar: elegir cuenta */}
      {cobrando && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center justify-center p-3" onClick={() => setCobrando(null)}>
          <div className="bg-surface border border-border rounded-3xl p-5 w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-base font-serif font-semibold text-text-primary">Cobrar a {cobrando.cliente}</h4>
            <p className="text-xs text-text-secondary">{cobrando.motivo}</p>

            <div>
              <label className={etiqueta}>¿A qué cuenta entra el dinero?</label>
              {cuentas.length === 0 ? (
                <p className="text-xs text-error">Primero crea una cuenta para poder cobrar.</p>
              ) : (
                <select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} className={campo}>
                  {cuentas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
            </div>

            <div>
              <label className={etiqueta}>Monto cobrado ({simbolo})</label>
              <input
                type="number"
                inputMode="decimal"
                value={montoCobro}
                onChange={(e) => setMontoCobro(e.target.value)}
                className={campo}
              />
            </div>

            {cobrando.frecuencia === 'manual' && (
              <div>
                <label className={etiqueta}>Próxima fecha (opcional; vacío = no volver a cobrar)</label>
                <input type="date" value={proximaManual} onChange={(e) => setProximaManual(e.target.value)} className={campo} />
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setCobrando(null)} className="flex-1 py-2.5 rounded-2xl bg-surface-hover text-text-secondary text-xs font-semibold cursor-pointer">Cancelar</button>
              <button
                onClick={confirmarCobro}
                disabled={guardando || !cuentaId || !(Number(montoCobro) > 0)}
                className="flex-1 py-2.5 rounded-2xl bg-brand text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {guardando ? 'Registrando…' : 'Confirmar cobro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cobros;
