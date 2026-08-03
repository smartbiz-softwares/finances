import React, { useEffect, useState } from 'react';
import { Gift, Save } from 'lucide-react';
import { apiUrl } from './api';

/**
 * Ajustes del programa de referidos, para el panel.
 *
 * Los importes se guardan al pulsar, no al escribir: son valores que afectan a
 * cuántos tokens se regalan, y un guardado automático mientras se teclea puede
 * dejar aplicado un número a medio escribir.
 */

interface Config {
  tokensReferidor: number;
  tokensReferido: number;
  activo: number;
  maxPorUsuario: number;
  canjes?: number;
  tokensRepartidos?: number;
}

interface Props {
  adminToken: string | null;
  onAviso: (mensaje: string, tipo: 'success' | 'error') => void;
}

export const PanelReferidos: React.FC<Props> = ({ adminToken, onAviso }) => {
  const [config, setConfig] = useState<Config | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    tokensReferidor: '',
    tokensReferido: '',
    maxPorUsuario: '',
    activo: true,
  });

  useEffect(() => {
    if (!adminToken) return;
    fetch(apiUrl('/api/admin/referidos/config'), {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((r) => r.json())
      .then((d: Config) => {
        setConfig(d);
        setForm({
          tokensReferidor: String(d.tokensReferidor ?? ''),
          tokensReferido: String(d.tokensReferido ?? ''),
          maxPorUsuario: String(d.maxPorUsuario ?? 0),
          activo: !!d.activo,
        });
      })
      .catch(() => { /* Sin configuración no se pinta el bloque. */ });
  }, [adminToken]);

  const guardar = async () => {
    if (!adminToken) return;
    setGuardando(true);
    try {
      const res = await fetch(apiUrl('/api/admin/referidos/config'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          tokensReferidor: Number(form.tokensReferidor),
          tokensReferido: Number(form.tokensReferido),
          maxPorUsuario: Number(form.maxPorUsuario),
          activo: form.activo,
        }),
      });

      if (!res.ok) throw new Error();
      const actualizada = await res.json();
      setConfig((previa) => ({ ...previa, ...actualizada }));
      onAviso('Programa de referidos actualizado', 'success');
    } catch {
      onAviso('No se pudo guardar la configuración de referidos', 'error');
    } finally {
      setGuardando(false);
    }
  };

  if (!config) return null;

  const campo = (
    etiqueta: string,
    clave: 'tokensReferidor' | 'tokensReferido' | 'maxPorUsuario',
    ayuda: string
  ) => (
    <div className="space-y-1.5">
      <label htmlFor={`ref-${clave}`} className="block text-[11px] font-medium text-text-primary">
        {etiqueta}
      </label>
      <input
        id={`ref-${clave}`}
        type="number"
        inputMode="numeric"
        min={0}
        value={form[clave]}
        onChange={(e) => setForm((f) => ({ ...f, [clave]: e.target.value }))}
        className="w-full px-3 py-2.5 rounded-xl bg-bg border border-border text-sm font-mono text-text-primary focus:border-brand focus:outline-none transition-colors"
      />
      <p className="text-[10px] text-text-secondary leading-snug">{ayuda}</p>
    </div>
  );

  return (
    <div className="bg-surface border border-border p-5 rounded-3xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Gift size={18} className="text-brand" />
          <div>
            <h3 className="text-base font-semibold text-text-primary">Programa de referidos</h3>
            <p className="text-[11px] text-text-secondary">
              {config.canjes || 0} invitaciones canjeadas ·{' '}
              {Number(config.tokensRepartidos || 0).toLocaleString('es')} tokens repartidos
            </p>
          </div>
        </div>

        {/* Apagarlo no borra nada: los canjes hechos se conservan */}
        <button
          type="button"
          role="switch"
          aria-checked={form.activo}
          aria-label="Activar el programa de referidos"
          onClick={() => setForm((f) => ({ ...f, activo: !f.activo }))}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
            form.activo ? 'bg-brand' : 'bg-border'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              form.activo ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {campo('Tokens para quien invita', 'tokensReferidor',
          'Se abonan cuando la persona invitada entra por primera vez.')}
        {campo('Tokens para el invitado', 'tokensReferido',
          'Se suman a su saldo al crear la cuenta.')}
        {campo('Tope por usuario', 'maxPorUsuario',
          'Máximo de invitaciones que puede cobrar cada persona. 0 = sin límite.')}
      </div>

      <p className="text-[11px] text-text-secondary leading-relaxed">
        Los cambios se aplican a las invitaciones nuevas. Cada canje guarda los importes que estaban
        vigentes en su momento, así que lo ya concedido no se reescribe.
      </p>

      <button
        type="button"
        onClick={guardar}
        disabled={guardando}
        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-medium flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        <Save size={14} />
        {guardando ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  );
};
