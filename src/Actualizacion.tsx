import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X } from 'lucide-react';
import { apiUrl, IS_NATIVE_APP } from './api';

/**
 * Aviso de que hay una versión nueva de la app.
 *
 * La interfaz se carga del servidor, así que los cambios de la web llegan solos
 * al abrir. Esto es solo para lo que sí requiere reinstalar: permisos nuevos,
 * el icono, el widget. Va a saltar pocas veces, y por eso puede permitirse
 * interrumpir cuando salta.
 *
 * No es obligatorio: se puede posponer, y no se vuelve a insistir con la misma
 * versión hasta el día siguiente. Una app que bloquea hasta actualizar es una
 * app que se desinstala.
 */

const CLAVE_POSPUESTO = 'hera_actualizacion_pospuesta';

interface Publicada {
  disponible: boolean;
  version?: string;
  versionCode?: number;
  mb?: number;
}

export const AvisoActualizacion: React.FC = () => {
  const [nueva, setNueva] = useState<Publicada | null>(null);

  useEffect(() => {
    if (!IS_NATIVE_APP) return;

    (async () => {
      try {
        // El plugin solo existe dentro de la app; se carga aquí para que la web
        // no arrastre el código.
        const { App } = await import('@capacitor/app');
        const info = await App.getInfo();
        const instalada = Number(info.build || 0);

        const res = await fetch(apiUrl('/api/app/latest'));
        const publicada: Publicada = await res.json();

        if (!publicada?.disponible || !publicada.versionCode) return;
        if (publicada.versionCode <= instalada) return;

        // Posponer vale por un día: al siguiente se vuelve a ofrecer.
        try {
          const pospuesta = JSON.parse(localStorage.getItem(CLAVE_POSPUESTO) || '{}');
          const hoy = new Date().toISOString().slice(0, 10);
          if (pospuesta.version === publicada.versionCode && pospuesta.dia === hoy) return;
        } catch { /* Sin almacenamiento se muestra igual. */ }

        setNueva(publicada);
      } catch {
        // Sin conexión o fuera de la app: no se avisa de nada.
      }
    })();
  }, []);

  const posponer = () => {
    try {
      localStorage.setItem(CLAVE_POSPUESTO, JSON.stringify({
        version: nueva?.versionCode,
        dia: new Date().toISOString().slice(0, 10),
      }));
    } catch { /* Sin almacenamiento volverá a salir. */ }
    setNueva(null);
  };

  if (!nueva) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        role="status"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-[380px]
                   bg-surface border border-border rounded-2xl p-4 shadow-xl flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-brand/12 border border-brand/25 text-brand flex items-center justify-center shrink-0">
          <Download size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">Hay una versión nueva</p>
          <p className="text-[11px] text-text-secondary truncate">
            {nueva.version ? `Versión ${nueva.version}` : 'Actualización disponible'}
            {nueva.mb ? ` · ${nueva.mb} MB` : ''}
          </p>
        </div>

        <a
          href={apiUrl('/descargar/HeraWallet.apk')}
          download
          onClick={posponer}
          className="shrink-0 px-3.5 py-2 rounded-xl bg-brand text-white text-xs font-medium transition-transform active:scale-[0.97]"
        >
          Actualizar
        </a>

        <button
          type="button"
          onClick={posponer}
          aria-label="Ahora no"
          className="shrink-0 p-1.5 rounded-lg text-text-dim hover:text-text-primary transition-colors"
        >
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
