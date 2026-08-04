import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { IconoAnimado, IconoActualizar, IconoHecho, IconoAviso } from './iconos';
import { apiUrl, IS_NATIVE_APP } from './api';
import { pulso, exito } from './haptica';

/**
 * Aviso de versión nueva de la app.
 *
 * Dentro de la app la actualización va entera desde aquí: se pulsa una vez, se
 * ve el avance real y al terminar se abre el instalador solo. Antes esto era un
 * enlace que abría el navegador y ahí se perdía el hilo —ni progreso, ni saber
 * qué hacer con el archivo al final—.
 *
 * En el navegador no hay puente nativo, así que se cae a una descarga normal,
 * que es todo lo que se puede hacer allí.
 *
 * El aviso no es obligatorio: se pospone y no vuelve a insistir con la misma
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

type Fase = 'ofrecida' | 'empezando' | 'descargando' | 'pausada' | 'listo' | 'error';

interface PuenteActualizar {
  iniciar: (url: string) => void;
  instalarDescargado: () => boolean;
}

const puente = (): PuenteActualizar | null => {
  const p = (window as any)?.HeraActualizar;
  return p && typeof p.iniciar === 'function' ? p : null;
};

/**
 * Dirección completa del APK.
 *
 * El gestor de descargas de Android necesita una URL absoluta: una ruta como
 * "/descargar/HeraWallet.apk" no tiene esquema y la rechaza sin más. El
 * navegador sí la resuelve contra el origen, y por eso el fallo solo se veía
 * dentro de la app.
 */
const urlDelApk = () => {
  const ruta = apiUrl('/descargar/HeraWallet.apk');
  return /^https?:\/\//i.test(ruta) ? ruta : `${window.location.origin}${ruta}`;
};

export const AvisoActualizacion: React.FC = () => {
  const [nueva, setNueva] = useState<Publicada | null>(null);
  const [fase, setFase] = useState<Fase>('ofrecida');
  const [porcentaje, setPorcentaje] = useState(0);

  // El avance lo manda la parte nativa mientras descarga.
  useEffect(() => {
    const alAvanzar = (e: Event) => {
      const detalle = (e as CustomEvent).detail || {};
      setFase(detalle.estado as Fase);
      setPorcentaje(Number(detalle.porcentaje) || 0);
      if (detalle.estado === 'listo') exito();
    };

    window.addEventListener('hera-descarga', alAvanzar);
    return () => window.removeEventListener('hera-descarga', alAvanzar);
  }, []);

  const descargar = () => {
    pulso();
    const p = puente();

    if (p) {
      setFase('empezando');
      p.iniciar(urlDelApk());
      return;
    }

    // Navegador: descarga normal, sin avance que enseñar.
    const enlace = document.createElement('a');
    enlace.href = urlDelApk();
    enlace.download = 'HeraWallet.apk';
    enlace.click();
    posponer();
  };

  const posponer = () => {
    try {
      localStorage.setItem(CLAVE_POSPUESTO, JSON.stringify({
        version: nueva?.versionCode,
        dia: new Date().toISOString().slice(0, 10),
      }));
    } catch { /* Sin almacenamiento volverá a salir. */ }
    setNueva(null);
  };

  useEffect(() => {
    if (!IS_NATIVE_APP) return;

    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const info = await App.getInfo();
        const instalada = Number(info.build || 0);

        const res = await fetch(apiUrl('/api/app/latest'));
        const publicada: Publicada = await res.json();

        if (!publicada?.disponible || !publicada.versionCode) return;
        if (publicada.versionCode <= instalada) return;

        // Si se llega desde la notificación, se empieza sin volver a preguntar:
        // ya se pulsó "Descargar" allí, y pedirlo dos veces sobra.
        const desdeNotificacion =
          new URLSearchParams(window.location.search).get('actualizar') === '1';

        if (!desdeNotificacion) {
          try {
            const pospuesta = JSON.parse(localStorage.getItem(CLAVE_POSPUESTO) || '{}');
            const hoy = new Date().toISOString().slice(0, 10);
            if (pospuesta.version === publicada.versionCode && pospuesta.dia === hoy) return;
          } catch { /* Sin almacenamiento se muestra igual. */ }
        }

        setNueva(publicada);

        if (desdeNotificacion) {
          const p = puente();
          if (p) {
            setFase('empezando');
            p.iniciar(urlDelApk());
          }
        }
      } catch {
        // Sin conexión o fuera de la app: no se avisa de nada.
      }
    })();
  }, []);

  if (!nueva) return null;

  const enMarcha = fase === 'empezando' || fase === 'descargando' || fase === 'pausada';

  const titulo = {
    ofrecida: 'Hay una versión nueva',
    empezando: 'Preparando la descarga',
    descargando: 'Descargando…',
    pausada: 'Descarga en pausa',
    listo: 'Listo para instalar',
    error: 'No se pudo descargar',
  }[fase];

  const detalle = {
    ofrecida: `${nueva.version ? `Versión ${nueva.version}` : 'Actualización disponible'}${nueva.mb ? ` · ${nueva.mb} MB` : ''}`,
    empezando: 'Un momento',
    descargando: nueva.mb
      ? `${(nueva.mb * porcentaje / 100).toFixed(1)} de ${nueva.mb} MB`
      : `${porcentaje}%`,
    pausada: 'Esperando conexión',
    listo: 'Confirma la instalación para terminar',
    error: 'Revisa tu conexión e inténtalo otra vez',
  }[fase];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        role="status"
        aria-live="polite"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-[380px]
                   bg-surface border border-border rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            fase === 'error'
              ? 'bg-warning/10 border-warning/25 text-warning'
              : 'bg-brand/12 border-brand/25 text-brand'
          }`}>
            <IconoAnimado
              icono={fase === 'listo' ? IconoHecho : fase === 'error' ? IconoAviso : IconoActualizar}
              size={17}
              activo
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary">{titulo}</p>
            <p className="text-[11px] text-text-secondary truncate">{detalle}</p>
          </div>

          {fase === 'ofrecida' && (
            <>
              <button
                type="button"
                onClick={descargar}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-brand text-white text-xs font-medium transition-transform active:scale-[0.97]"
              >
                Actualizar
              </button>
              <button
                type="button"
                onClick={posponer}
                aria-label="Ahora no"
                className="shrink-0 p-1.5 rounded-lg text-text-dim hover:text-text-primary transition-colors"
              >
                <X size={14} />
              </button>
            </>
          )}

          {fase === 'descargando' && (
            <span className="shrink-0 font-mono text-xs text-brand tabular-nums">
              {porcentaje}%
            </span>
          )}

          {fase === 'error' && (
            <button
              type="button"
              onClick={descargar}
              className="shrink-0 px-3.5 py-2 rounded-xl bg-brand text-white text-xs font-medium transition-transform active:scale-[0.97]"
            >
              Reintentar
            </button>
          )}

          {fase === 'listo' && (
            <button
              type="button"
              onClick={() => puente()?.instalarDescargado()}
              className="shrink-0 px-3.5 py-2 rounded-xl bg-brand text-white text-xs font-medium transition-transform active:scale-[0.97]"
            >
              Instalar
            </button>
          )}
        </div>

        {/* Barra de avance real, no una animación decorativa */}
        {enMarcha && (
          <div className="h-1 bg-bg">
            <motion.div
              className="h-full bg-brand"
              initial={{ width: 0 }}
              animate={{ width: `${porcentaje}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
