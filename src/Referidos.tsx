import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Gift, Copy, Check, Share2, Users } from 'lucide-react';
import { IconoAnimado, IconoCopiar, IconoWhatsapp } from './iconos';
import { apiUrl, getToken } from './api';

/**
 * Pantalla de invitaciones.
 *
 * El objetivo es que se comparta, así que lo primero que se ve es el botón de
 * compartir y el código listo para copiar. La lista de quién ya entró va
 * después: es la prueba de que funciona, pero no es lo que hace que alguien
 * invite a otro.
 *
 * En móvil se usa la hoja de compartir del sistema, que es donde está WhatsApp.
 * Donde no exista, se copia el enlace al portapapeles.
 */

interface Referido {
  id: string;
  displayName?: string;
  email?: string;
  phone?: string;
  tokensReferidor: number;
  creadoEn: string;
}

interface Datos {
  codigo: string;
  enlace: string;
  activo: boolean;
  tokensPorInvitado: number;
  tokensParaInvitado: number;
  total: number;
  tokensGanados: number;
  lista: Referido[];
}

export const Referidos: React.FC<{ onCerrar?: () => void }> = () => {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    fetch(apiUrl('/api/referidos'), {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then(setDatos)
      .catch(() => { /* Se queda en el estado de carga fallida. */ })
      .finally(() => setCargando(false));
  }, []);

  const compartir = async () => {
    if (!datos) return;

    const texto = `Llevo mis cuentas con HeraWallet: le hablas y ella las anota. `
      + `Entra con mi enlace y empiezas con ${datos.tokensParaInvitado.toLocaleString('es')} tokens de regalo.`;

    // La hoja del sistema es la vía corta a WhatsApp, que es donde está la
    // gente. Solo existe en móvil y bajo HTTPS.
    if (navigator.share) {
      try {
        await navigator.share({ title: 'HeraWallet', text: texto, url: datos.enlace });
        return;
      } catch {
        // Cancelar la hoja de compartir no es un error; no se hace nada más.
        return;
      }
    }

    await copiar();
  };

  const copiar = async () => {
    if (!datos) return;
    try {
      await navigator.clipboard.writeText(datos.enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* Sin permiso de portapapeles el código sigue visible para copiarlo a mano. */
    }
  };

  if (cargando) {
    return (
      <div className="space-y-4">
        <div className="h-32 rounded-3xl bg-surface border border-border animate-pulse" />
        <div className="h-20 rounded-2xl bg-surface border border-border animate-pulse" />
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="p-6 rounded-3xl bg-surface border border-border text-center space-y-2">
        <p className="text-sm text-text-primary">No pudimos cargar tus invitaciones.</p>
        <p className="text-xs text-text-secondary">Vuelve a intentarlo en un momento.</p>
      </div>
    );
  }

  if (!datos.activo) {
    return (
      <div className="p-6 rounded-3xl bg-surface border border-border text-center space-y-2">
        <p className="text-sm text-text-primary">Las invitaciones están pausadas</p>
        <p className="text-xs text-text-secondary">Volverán a estar disponibles pronto.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Lo primero: qué gana y cómo compartirlo */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="p-6 rounded-3xl bg-surface border border-border space-y-5"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-brand/12 border border-brand/25 text-brand flex items-center justify-center shrink-0">
            <Gift size={18} />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="font-serif font-semibold text-base text-text-primary">
              Invita y ganáis los dos
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Por cada persona que entre con tu enlace recibes{' '}
              <b className="text-text-primary">{datos.tokensPorInvitado.toLocaleString('es')} tokens</b>,
              y ella empieza con{' '}
              <b className="text-text-primary">{datos.tokensParaInvitado.toLocaleString('es')}</b>.
            </p>
          </div>
        </div>

        {/* El código, grande y legible: mucha gente lo va a dictar en voz alta */}
        <button
          type="button"
          onClick={copiar}
          className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl bg-bg border border-border hover:border-brand/40 transition-colors group"
          aria-label={`Copiar tu código ${datos.codigo}`}
        >
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-widest text-text-dim font-mono">Tu código</p>
            <p className="font-mono font-bold text-xl tracking-[0.2em] text-text-primary mt-0.5">
              {datos.codigo}
            </p>
          </div>
          <span className="w-9 h-9 rounded-xl flex items-center justify-center text-text-secondary group-hover:text-brand transition-colors">
            {copiado
              ? <Check size={16} className="text-success" />
              : <IconoAnimado icono={IconoCopiar} size={16} />}
          </span>
        </button>

        <button
          type="button"
          onClick={compartir}
          className="w-full py-3.5 rounded-2xl bg-brand text-white text-sm font-medium flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
        >
          <IconoAnimado icono={IconoWhatsapp} size={16} />
          Compartir mi enlace
        </button>

        {copiado && (
          <p className="text-[11px] text-success text-center" role="status">
            Enlace copiado
          </p>
        )}
      </motion.div>

      {/* Resultados */}
      {datos.total > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.06, ease: [0.23, 1, 0.32, 1] }}
          className="rounded-3xl bg-surface border border-border overflow-hidden"
        >
          <div className="p-5 flex items-center justify-between border-b border-border">
            <div>
              <p className="text-sm font-medium text-text-primary">
                {datos.total} {datos.total === 1 ? 'persona ha entrado' : 'personas han entrado'}
              </p>
              <p className="text-[11px] text-text-secondary mt-0.5">con tu invitación</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-lg text-brand">
                +{datos.tokensGanados.toLocaleString('es')}
              </p>
              <p className="text-[10px] text-text-dim">tokens ganados</p>
            </div>
          </div>

          <ul className="divide-y divide-border">
            {datos.lista.map((r) => (
              <li key={r.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-text-primary truncate">
                    {r.displayName || r.email || r.phone || 'Cuenta nueva'}
                  </p>
                  <p className="text-[11px] text-text-dim">
                    {new Date(r.creadoEn).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <span className="font-mono text-xs text-success shrink-0">
                  +{r.tokensReferidor.toLocaleString('es')}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      ) : (
        <div className="p-6 rounded-3xl bg-surface border border-border text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-bg border border-border text-text-dim flex items-center justify-center mx-auto">
            <Users size={17} />
          </div>
          <p className="text-sm text-text-primary">Todavía no ha entrado nadie</p>
          <p className="text-xs text-text-secondary leading-relaxed max-w-[280px] mx-auto">
            Comparte tu enlace con alguien a quien le cueste llevar sus cuentas. Los tokens llegan en
            cuanto entra.
          </p>
        </div>
      )}
    </div>
  );
};
