import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Trophy, Check, X } from 'lucide-react';
import { apiUrl, getToken } from './api';

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
        <Flame size={15} />
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
            <Flame size={24} />
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
            <Trophy size={15} className="text-brand" />
            Logros
          </h3>
          <span className="font-mono text-xs text-text-secondary">
            {estado.conseguidos} / {estado.total}
          </span>
        </div>

        <ul className="divide-y divide-border">
          {estado.logros.map((l) => (
            <li key={l.id} className="p-4 flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  l.conseguido
                    ? 'bg-success/10 border-success/25 text-success'
                    : 'bg-bg border-border text-text-dim'
                }`}
              >
                {l.conseguido ? <Check size={15} /> : <Trophy size={14} />}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-xs ${l.conseguido ? 'text-text-primary' : 'text-text-secondary'}`}>
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
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
};

/**
 * Aviso de logro recién conseguido.
 *
 * Aparece una sola vez: el servidor marca como anunciado lo que entrega, así
 * que recargar la página no repite la celebración.
 */
export const AvisoLogro: React.FC = () => {
  const [cola, setCola] = useState<LogroUI[]>([]);

  useEffect(() => {
    fetch(apiUrl('/api/logros/nuevos'), { headers: cabeceras() })
      .then((r) => r.json())
      .then((d) => setCola(d.logros || []))
      .catch(() => { /* Sin celebración si falla. */ });
  }, []);

  const actual = cola[0];
  if (!actual) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={actual.id}
        initial={{ opacity: 0, y: -16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.96 }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        role="status"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] max-w-[340px] w-[calc(100%-2rem)]
                   bg-surface border border-brand/30 rounded-2xl p-4 shadow-xl flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-brand/12 border border-brand/25 text-brand flex items-center justify-center shrink-0">
          <Trophy size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest text-brand font-mono">Logro</p>
          <p className="text-sm font-medium text-text-primary truncate">{actual.nombre}</p>
          <p className="text-[11px] text-text-secondary truncate">{actual.descripcion}</p>
        </div>
        <button
          type="button"
          onClick={() => setCola((c) => c.slice(1))}
          aria-label="Cerrar"
          className="p-1.5 rounded-lg text-text-dim hover:text-text-primary transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
