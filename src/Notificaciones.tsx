import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import {
  IconoAnimado, IconoCampana, IconoCampanaMuda, IconoHecho, IconoAviso,
} from './iconos';
import { apiUrl, getToken } from './api';
import {
  activarNotificaciones, desactivarNotificaciones, estaSuscrito,
  estadoPermiso, soportaPush, instaladaComoApp,
} from './notificaciones';

/**
 * Permiso y ajustes de notificaciones.
 *
 * El permiso se concede **una sola vez en la vida**: si se pide nada más entrar,
 * la mayoría dice que no y ya no hay forma de volver a preguntar. Por eso la
 * app no lo pide sola; primero explica qué va a recibir, y solo cuando la
 * persona pulsa se lanza el diálogo del sistema.
 */

interface Prefs {
  activadas: number;
  resumenDiario: number;
  resumenSemanal: number;
  resumenMensual: number;
  resumenAnual: number;
  avisos: number;
  racha: number;
  maxPorDia: number;
  zonaHoraria: string;
  dispositivos: number;
}

const cabeceras = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

const TIPOS: { clave: keyof Prefs; titulo: string; detalle: string }[] = [
  { clave: 'resumenDiario', titulo: 'Resumen del día', detalle: 'Por la noche, con lo que registraste' },
  { clave: 'resumenSemanal', titulo: 'Resumen de la semana', detalle: 'Los domingos por la tarde' },
  { clave: 'resumenMensual', titulo: 'Cierre del mes', detalle: 'El día 1, con el balance del mes anterior' },
  { clave: 'resumenAnual', titulo: 'Tu año en números', detalle: 'Una vez al año, el 1 de enero' },
  { clave: 'racha', titulo: 'Racha en peligro', detalle: 'Si llevas días seguidos y hoy aún no registraste' },
  { clave: 'avisos', titulo: 'Avisos y novedades', detalle: 'Cambios importantes y versiones nuevas' },
];

export const Notificaciones: React.FC = () => {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [suscrito, setSuscrito] = useState(false);
  const [permiso, setPermiso] = useState(estadoPermiso());
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    fetch(apiUrl('/api/notificaciones/preferencias'), { headers: cabeceras() })
      .then((r) => r.json())
      .then(setPrefs)
      .catch(() => { /* Sin preferencias no se pinta el detalle. */ });

    estaSuscrito().then(setSuscrito);
  }, []);

  const activar = async () => {
    setOcupado(true);
    try {
      const ok = await activarNotificaciones();
      setSuscrito(ok);
      setPermiso(estadoPermiso());

      // La zona horaria del dispositivo es la buena: las notificaciones se
      // envían en la hora local de cada persona, no en la del servidor.
      if (ok) {
        const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (zona) await guardar({ zonaHoraria: zona });
      }
    } finally {
      setOcupado(false);
    }
  };

  const desactivar = async () => {
    setOcupado(true);
    try {
      await desactivarNotificaciones();
      setSuscrito(false);
    } finally {
      setOcupado(false);
    }
  };

  const guardar = async (cambios: Record<string, any>) => {
    setPrefs((p) => (p ? { ...p, ...cambios } as Prefs : p));
    try {
      const res = await fetch(apiUrl('/api/notificaciones/preferencias'), {
        method: 'PUT', headers: cabeceras(), body: JSON.stringify(cambios),
      });
      if (res.ok) setPrefs(await res.json());
    } catch {
      /* Se queda con el valor optimista; se corregirá al recargar. */
    }
  };

  if (!soportaPush()) {
    return (
      <div className="p-5 rounded-3xl bg-surface border border-border space-y-2 text-center">
        <div className="w-10 h-10 rounded-2xl bg-bg border border-border text-text-dim flex items-center justify-center mx-auto">
          <IconoAnimado icono={IconoCampanaMuda} size={17} sinToque />
        </div>
        <p className="text-sm text-text-primary">Aquí no hay notificaciones</p>
        <p className="text-xs text-text-secondary leading-relaxed">
          Este navegador no las admite. En iPhone hay que añadir HeraWallet a la pantalla de inicio
          para poder recibirlas.
        </p>
      </div>
    );
  }

  if (permiso === 'denegado') {
    return (
      <div className="p-5 rounded-3xl bg-surface border border-border space-y-2 text-center">
        <div className="w-10 h-10 rounded-2xl bg-warning/10 border border-warning/25 text-warning flex items-center justify-center mx-auto">
          <IconoAnimado icono={IconoAviso} size={17} activo />
        </div>
        <p className="text-sm text-text-primary">Las bloqueaste antes</p>
        <p className="text-xs text-text-secondary leading-relaxed">
          El permiso solo se puede devolver desde los ajustes del navegador, en la sección de
          permisos de este sitio. Desde aquí ya no se puede volver a pedir.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estado principal */}
      <div className="p-5 rounded-3xl bg-surface border border-border space-y-4">
        <div className="flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
            suscrito ? 'bg-brand/12 border-brand/25 text-brand' : 'bg-bg border-border text-text-dim'
          }`}>
            <IconoAnimado icono={suscrito ? IconoCampana : IconoCampanaMuda} size={17} activo={suscrito} />
          </div>
          <div className="min-w-0 space-y-1">
            <h3 className="font-serif font-semibold text-base text-text-primary">
              {suscrito ? 'Notificaciones activas' : 'Que Hera te avise'}
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {suscrito
                ? `Recibirás como mucho ${prefs?.maxPorDia || 3} al día, entre las 9 y las 21 h.`
                : 'Un resumen de tu día, el balance de la semana y un aviso si tu racha está en juego. Como mucho tres al día.'}
            </p>
          </div>
        </div>

        {!suscrito ? (
          <>
            <button
              type="button"
              onClick={activar}
              disabled={ocupado}
              className="w-full py-3 rounded-2xl bg-brand text-white text-sm font-medium transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {ocupado ? 'Activando…' : 'Activar notificaciones'}
            </button>
            <p className="text-[11px] text-text-dim text-center leading-relaxed">
              El navegador te preguntará una vez. Si dices que no, no se puede volver a pedir desde
              aquí.
            </p>
          </>
        ) : (
          <button
            type="button"
            onClick={desactivar}
            disabled={ocupado}
            className="w-full py-2.5 rounded-2xl bg-bg border border-border text-text-secondary hover:text-text-primary text-xs font-medium transition-colors disabled:opacity-50"
          >
            {ocupado ? 'Desactivando…' : 'Dejar de recibir en este dispositivo'}
          </button>
        )}

        {suscrito && (prefs?.dispositivos || 0) > 1 && (
          <p className="text-[11px] text-text-dim text-center">
            Las recibes en {prefs?.dispositivos} dispositivos.
          </p>
        )}
      </div>

      {/* Qué recibir: solo tiene sentido si están activas */}
      {suscrito && prefs && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="rounded-3xl bg-surface border border-border overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <h4 className="text-xs font-medium text-text-primary">Qué quieres recibir</h4>
          </div>

          <ul className="divide-y divide-border">
            {TIPOS.map((t) => (
              <li key={t.clave} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-text-primary">{t.titulo}</p>
                  <p className="text-[11px] text-text-dim leading-snug">{t.detalle}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!prefs[t.clave]}
                  aria-label={t.titulo}
                  onClick={() => guardar({ [t.clave]: !prefs[t.clave] })}
                  className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${
                    prefs[t.clave] ? 'bg-brand' : 'bg-border'
                  }`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    prefs[t.clave] ? 'translate-x-[18px]' : 'translate-x-0.5'
                  }`} />
                </button>
              </li>
            ))}
          </ul>

          <div className="p-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="tope" className="text-xs text-text-primary">Como mucho al día</label>
              <span className="font-mono text-xs text-brand">{prefs.maxPorDia}</span>
            </div>
            <input
              id="tope"
              type="range"
              min={1}
              max={6}
              value={prefs.maxPorDia}
              onChange={(e) => guardar({ maxPorDia: Number(e.target.value) })}
              className="w-full accent-brand"
            />
            <p className="text-[11px] text-text-dim leading-relaxed">
              Nunca se envían dos del mismo tipo el mismo día, así que subir el tope no multiplica
              los avisos: solo deja pasar más clases distintas.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

/**
 * Invitación a activarlas, para el momento adecuado.
 *
 * Aparece cuando la persona ya ha registrado algo y entiende para qué sirve la
 * app. Se puede descartar, y entonces no vuelve: insistir con un permiso que
 * solo se concede una vez es la forma más rápida de perderlo.
 */
export const OfertaNotificaciones: React.FC<{ registros: number }> = ({ registros }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (registros < 1) return;
    if (!soportaPush() || estadoPermiso() !== 'sin-pedir') return;

    try {
      if (localStorage.getItem('hera_oferta_notif') === 'no') return;
    } catch { /* Sin almacenamiento se ofrece igual. */ }

    // En iPhone solo funcionan si la app está en la pantalla de inicio; ofrecerlo
    // en Safari suelto llevaría a un permiso que no sirve de nada.
    const esIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (esIos && !instaladaComoApp()) return;

    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, [registros]);

  const descartar = () => {
    setVisible(false);
    try { localStorage.setItem('hera_oferta_notif', 'no'); } catch { /* da igual */ }
  };

  const activar = async () => {
    const ok = await activarNotificaciones();
    if (ok) {
      const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (zona) {
        fetch(apiUrl('/api/notificaciones/preferencias'), {
          method: 'PUT', headers: cabeceras(), body: JSON.stringify({ zonaHoraria: zona }),
        }).catch(() => { /* La zona se puede ajustar después. */ });
      }
    }
    descartar();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          role="dialog"
          aria-label="Activar notificaciones"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[55] w-[calc(100%-2rem)] max-w-[340px]
                     bg-surface border border-border rounded-3xl p-5 shadow-2xl space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand/12 border border-brand/25 text-brand flex items-center justify-center shrink-0">
              <IconoAnimado icono={IconoCampana} size={17} activo />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-text-primary">¿Te aviso yo?</p>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Un resumen de tu día por la noche y el balance de la semana los domingos. Tres al
                día como mucho, y lo ajustas cuando quieras.
              </p>
            </div>
            <button
              type="button"
              onClick={descartar}
              aria-label="Ahora no"
              className="p-1.5 rounded-lg text-text-dim hover:text-text-primary transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={descartar}
              className="flex-1 py-2.5 rounded-xl bg-bg border border-border text-text-secondary text-xs font-medium transition-colors"
            >
              Ahora no
            </button>
            <button
              type="button"
              onClick={activar}
              className="flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-medium transition-transform active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <IconoAnimado icono={IconoHecho} size={13} sinToque />
              Sí, avísame
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
