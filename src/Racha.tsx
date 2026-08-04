import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import {
  IconoAnimado, IconoCelebracion, IconoTrofeo, IconoLlama, IconoDobleCheck,
} from './iconos';
import { apiUrl, getToken } from './api';
import { exito } from './haptica';

/**
 * Racha y logros.
 *
 * La racha se enseña como una fila de días, no como un número suelto: ver el
 * hueco de ayer explica mejor lo que hay que hacer hoy que la palabra "3".
 *
 * Nada de esto castiga. Cuando la racha está a cero no se dice que se perdió,
 * se ofrece empezar; una insignia conseguida no se retira nunca.
 */

interface LogroUI {
  id: string;
  nombre: string;
  descripcion: string;
  meta: number;
  grupo: string;
  progreso: number;
  conseguido: boolean;
}

interface Estado {
  racha: number;
  registroHoy: boolean;
  siguienteHito: number | null;
  conseguidos: number;
  total: number;
  logros: LogroUI[];
}

const cabeceras = () => ({ Authorization: `Bearer ${getToken()}` });

/** Fila compacta para el menú de perfil. */
export const RachaResumen: React.FC<{ onAbrir?: () => void }> = ({ onAbrir }) => {
  const [estado, setEstado] = useState<Estado | null>(null);

  useEffect(() => {
    fetch(apiUrl('/api/logros'), { headers: cabeceras() })
      .then((r) => r.json())
      .then(setEstado)
      .catch(() => { /* Sin datos no se pinta nada. */ });
  }, []);

  if (!estado) return null;

  const encendida = estado.racha > 0;

  return (
    <button
      type="button"
      onClick={onAbrir}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-surface-hover transition-colors text-left group cursor-pointer"
    >
      <div
        className={`w-7.5 h-7.5 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
          encendida ? 'bg-brand/12 text-brand' : 'bg-bg text-text-dim'
        }`}
      >
        <IconoAnimado icono={IconoLlama} size={15} activo={encendida} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-xs text-text-primary">
          {encendida
            ? `${estado.racha} ${estado.racha === 1 ? 'día seguido' : 'días seguidos'}`
            : 'Empieza tu racha'}
        </span>
        <p className="text-[10px] text-text-secondary">
          {estado.registroHoy
            ? `${estado.conseguidos} de ${estado.total} logros`
            : 'Registra algo hoy para sumar'}
        </p>
      </div>
    </button>
  );
};

/** Panel completo: racha, próximo hito y colección de logros. */
export const Racha: React.FC = () => {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch(apiUrl('/api/logros'), { headers: cabeceras() })
      .then((r) => r.json())
      .then(setEstado)
      .catch(() => { /* Se muestra el estado vacío. */ })
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div className="space-y-4">
        <div className="h-36 rounded-3xl bg-surface border border-border animate-pulse" />
        <div className="h-48 rounded-3xl bg-surface border border-border animate-pulse" />
      </div>
    );
  }

  if (!estado) return null;

  const encendida = estado.racha > 0;
  const faltan = estado.siguienteHito ? estado.siguienteHito - estado.racha : 0;

  // Últimos siete días para situar la racha; el de hoy se marca aparte.
  const ultimosDias = Array.from({ length: 7 }, (_, i) => {
    const desdeElFinal = 6 - i;
    return { activo: desdeElFinal < estado.racha, esHoy: desdeElFinal === 0 };
  });

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="p-6 rounded-3xl bg-surface border border-border space-y-5"
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
              encendida
                ? 'bg-brand/12 border-brand/25 text-brand'
                : 'bg-bg border-border text-text-dim'
            }`}
          >
            {/* Arde al abrir si la racha está viva; quieta si está a cero. */}
            <IconoAnimado icono={IconoLlama} size={24} activo={encendida} />
          </div>
          <div className="min-w-0">
            <p className="font-mono font-bold text-3xl text-text-primary leading-none">
              {estado.racha}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              {encendida
                ? `${estado.racha === 1 ? 'día seguido' : 'días seguidos'} registrando`
                : 'Registra algo hoy y empieza'}
            </p>
          </div>
        </div>

        {/* Los siete últimos días, para ver de un vistazo dónde se está */}
        <div className="flex gap-1.5" aria-hidden="true">
          {ultimosDias.map((dia, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                dia.activo ? 'bg-brand' : 'bg-border'
              } ${dia.esHoy && !estado.registroHoy ? 'ring-1 ring-brand/40' : ''}`}
            />
          ))}
        </div>

        {estado.siguienteHito && faltan > 0 && (
          <p className="text-[11px] text-text-secondary text-center">
            {faltan === 1
              ? 'Un día más para el siguiente logro'
              : `${faltan} días para llegar a ${estado.siguienteHito}`}
          </p>
        )}

        {!estado.registroHoy && encendida && (
          <p className="text-[11px] text-brand text-center">
            Aún no has registrado hoy. Tu racha sigue viva hasta esta noche.
          </p>
        )}
      </motion.div>

      {/* Colección */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.06, ease: [0.23, 1, 0.32, 1] }}
        className="rounded-3xl bg-surface border border-border overflow-hidden"
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-serif font-semibold text-sm text-text-primary flex items-center gap-2">
            <IconoAnimado icono={IconoTrofeo} size={15} className="text-brand" />
            Logros
          </h3>
          <span className="font-mono text-xs text-text-secondary">
            {estado.conseguidos} / {estado.total}
          </span>
        </div>

        <ul className="divide-y divide-border">
          {estado.logros.map((l, i) => (
            <motion.li
              key={l.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              // Escalonado corto: la lista entra como una serie, no de golpe.
              transition={{ duration: 0.25, delay: Math.min(i * 0.035, 0.4), ease: [0.23, 1, 0.32, 1] }}
              className={`p-4 flex items-center gap-3 ${l.conseguido ? 'bg-success/[0.03]' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  l.conseguido
                    ? 'bg-success/10 border-success/25 text-success'
                    : 'bg-bg border-border text-text-dim'
                }`}
              >
                {l.conseguido
                  ? <IconoAnimado icono={IconoDobleCheck} size={15} />
                  : <IconoAnimado icono={IconoTrofeo} size={14} sinToque />}
              </div>

              <div className="flex-1 min-w-0">
                {/* Los conseguidos van tachados: se lee de un vistazo qué queda */}
                <p className={`text-xs ${
                  l.conseguido ? 'text-text-secondary line-through decoration-success/50' : 'text-text-secondary'
                }`}>
                  {l.nombre}
                </p>
                <p className="text-[11px] text-text-dim truncate">{l.descripcion}</p>

                {/* Progreso solo en los que faltan: en los ganados sobra */}
                {!l.conseguido && l.meta > 1 && (
                  <div className="mt-1.5 h-1 rounded-full bg-bg overflow-hidden">
                    <div
                      className="h-full bg-brand/50 rounded-full transition-[width] duration-300"
                      style={{ width: `${Math.min(100, (l.progreso / l.meta) * 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {!l.conseguido && l.meta > 1 && (
                <span className="font-mono text-[11px] text-text-dim shrink-0">
                  {l.progreso}/{l.meta}
                </span>
              )}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
};

/**
 * Celebración de un logro recién conseguido.
 *
 * Es el único momento en que la app interrumpe para dar una buena noticia, así
 * que se le da espacio: la tarjeta entra desde abajo con un rebote corto, el
 * icono estalla y unas chispas salen del centro. Dura poco más de un segundo y
 * se va sola a los cinco.
 *
 * Si hay varios logros a la vez se muestran en cola, uno detrás de otro: dos
 * celebraciones superpuestas no se leen.
 *
 * Aparece una sola vez: el servidor marca como anunciado lo que entrega, así
 * que recargar la página no repite nada. Y con `prefers-reduced-motion` se
 * queda todo quieto, sin chispas.
 */
const CHISPAS = 10;

export const AvisoLogro: React.FC = () => {
  const [cola, setCola] = useState<LogroUI[]>([]);
  const quieto =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    fetch(apiUrl('/api/logros/nuevos'), { headers: cabeceras() })
      .then((r) => r.json())
      .then((d) => {
        const logros = d.logros || [];
        setCola(logros);
        // Un logro se celebra también en la mano.
        if (logros.length > 0) exito();
      })
      .catch(() => { /* Sin celebración si falla. */ });
  }, []);

  const actual = cola[0];

  // Se retira sola: nadie debería tener que cerrar una felicitación.
  useEffect(() => {
    if (!actual) return;
    const t = setTimeout(() => setCola((c) => c.slice(1)), 5000);
    return () => clearTimeout(t);
  }, [actual]);

  if (!actual) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={actual.id}
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={quieto
          ? { duration: 0.2 }
          : { type: 'spring', stiffness: 320, damping: 22, mass: 0.8 }}
        role="status"
        aria-live="polite"
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-[330px]"
      >
        <div className="relative bg-surface border border-brand/30 rounded-3xl p-5 shadow-2xl overflow-hidden">
          {/* Resplandor de fondo, muy tenue: da calidez sin robar atención */}
          {!quieto && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.5, 0.25], scale: 1.6 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-brand/25 blur-3xl pointer-events-none"
            />
          )}

          <div className="relative flex flex-col items-center text-center gap-3">
            <div className="relative">
              {/* Chispas: salen del icono en todas direcciones y se apagan */}
              {!quieto && Array.from({ length: CHISPAS }).map((_, i) => {
                const angulo = (i / CHISPAS) * Math.PI * 2;
                return (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      x: Math.cos(angulo) * 46,
                      y: Math.sin(angulo) * 46,
                      scale: [0, 1, 0.4],
                    }}
                    transition={{ duration: 0.85, delay: 0.12, ease: 'easeOut' }}
                    className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-brand pointer-events-none"
                  />
                );
              })}

              <motion.div
                initial={{ scale: 0.4, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={quieto
                  ? { duration: 0.2 }
                  : { type: 'spring', stiffness: 400, damping: 14, delay: 0.08 }}
                className="w-14 h-14 rounded-2xl bg-brand/12 border border-brand/25 text-brand flex items-center justify-center"
              >
                <IconoAnimado icono={IconoCelebracion} size={26} activo />
              </motion.div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.18em] text-brand font-mono">
                Logro conseguido
              </p>
              <p className="text-base font-serif font-semibold text-text-primary">
                {actual.nombre}
              </p>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                {actual.descripcion}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCola((c) => c.slice(1))}
            aria-label="Cerrar"
            className="absolute top-3 right-3 p-1.5 rounded-lg text-text-dim hover:text-text-primary transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Cuántos quedan por celebrar, si llegaron varios de golpe */}
        {cola.length > 1 && (
          <p className="text-[10px] text-text-dim text-center mt-2 font-mono">
            +{cola.length - 1} más
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
