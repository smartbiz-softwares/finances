import React, { forwardRef, useImperativeHandle } from 'react';
import { motion, useAnimate } from 'motion/react';
import type { AnimatedIconHandle, AnimatedIconProps } from './types';

/**
 * Iconos animados propios.
 *
 * La colección de origen no trae los que más importan aquí: no hay micrófono
 * —y el registro por voz es el corazón de esta app—, ni cámara, ni nada para
 * ingreso y gasto. Estos siguen la misma API (`ref` con `startAnimation`), así
 * que `IconoAnimado` los trata igual que a los descargados.
 *
 * Cada animación dice algo sobre lo que hace el botón: el micrófono pulsa como
 * si escuchara, la cámara parpadea como un obturador, el ingreso sube y el
 * gasto baja. Ninguna dura más de 600 ms.
 */

const trazo = {
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Genera un icono con una animación concreta, sin repetir el andamiaje. */
function crearIcono(
  nombre: string,
  dibujo: React.ReactNode,
  animar: (animate: ReturnType<typeof useAnimate>[1]) => unknown,
  reposo: (animate: ReturnType<typeof useAnimate>[1]) => unknown
) {
  const Icono = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
    ({ size = 24, color = 'currentColor', strokeWidth = 2, className = '', ...resto }, ref) => {
      const [scope, animate] = useAnimate();

      useImperativeHandle(ref, () => ({
        startAnimation: () => { animar(animate); },
        stopAnimation: () => { reposo(animate); },
      }));

      return (
        <motion.svg
          ref={scope}
          onHoverStart={() => animar(animate)}
          onHoverEnd={() => reposo(animate)}
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`inline-flex items-center justify-center ${className}`}
          style={{ overflow: 'visible' }}
          {...(resto as any)}
        >
          {dibujo}
        </motion.svg>
      );
    }
  );
  Icono.displayName = nombre;
  return Icono;
}

// --- Micrófono: pulsa como si estuviera escuchando ------------------------
export const IconoMicrofono = crearIcono(
  'IconoMicrofono',
  <>
    <motion.rect className="mic-cuerpo" x="9" y="2" width="6" height="11" rx="3" {...trazo} />
    <motion.path className="mic-onda" d="M5 10a7 7 0 0 0 14 0" {...trazo} />
    <motion.path d="M12 17v4M8 21h8" {...trazo} />
  </>,
  (animate) => {
    animate('.mic-cuerpo', { scaleY: [1, 0.88, 1] }, { duration: 0.45, ease: 'easeInOut' });
    return animate('.mic-onda', { scale: [1, 1.15, 1], opacity: [1, 0.55, 1] },
      { duration: 0.6, ease: 'easeOut' });
  },
  (animate) => {
    animate('.mic-cuerpo', { scaleY: 1 }, { duration: 0.2 });
    animate('.mic-onda', { scale: 1, opacity: 1 }, { duration: 0.2 });
  }
);

// --- Cámara: el obturador parpadea ---------------------------------------
export const IconoCamara = crearIcono(
  'IconoCamara',
  <>
    <motion.path
      className="cam-cuerpo"
      d="M3 9a2 2 0 0 1 2-2h2l1.5-2h7L17 7h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
      {...trazo}
    />
    <motion.circle className="cam-lente" cx="12" cy="13" r="3.5" {...trazo} />
  </>,
  (animate) => {
    animate('.cam-cuerpo', { scale: [1, 1.04, 1] }, { duration: 0.3, ease: 'easeOut' });
    // El aro se cierra y se abre: es el gesto de disparar una foto.
    return animate('.cam-lente', { scale: [1, 0.55, 1] },
      { duration: 0.42, ease: 'easeInOut' });
  },
  (animate) => {
    animate('.cam-cuerpo', { scale: 1 }, { duration: 0.2 });
    animate('.cam-lente', { scale: 1 }, { duration: 0.2 });
  }
);

// --- Ingreso: la flecha sube ---------------------------------------------
export const IconoIngreso = crearIcono(
  'IconoIngreso',
  <>
    <motion.g className="flecha">
      <motion.path d="M12 19V5" {...trazo} />
      <motion.path d="M6 11l6-6 6 6" {...trazo} />
    </motion.g>
  </>,
  (animate) => animate('.flecha', { y: [0, -4, 0] }, { duration: 0.45, ease: 'easeOut' }),
  (animate) => { animate('.flecha', { y: 0 }, { duration: 0.2 }); }
);

// --- Gasto: la flecha baja -----------------------------------------------
export const IconoGasto = crearIcono(
  'IconoGasto',
  <>
    <motion.g className="flecha">
      <motion.path d="M12 5v14" {...trazo} />
      <motion.path d="M6 13l6 6 6-6" {...trazo} />
    </motion.g>
  </>,
  (animate) => animate('.flecha', { y: [0, 4, 0] }, { duration: 0.45, ease: 'easeOut' }),
  (animate) => { animate('.flecha', { y: 0 }, { duration: 0.2 }); }
);

// --- Llama de la racha: oscila como el fuego -----------------------------
export const IconoLlama = crearIcono(
  'IconoLlama',
  <>
    <motion.path
      className="llama"
      d="M12 2c1 3.5 4.5 4.8 4.5 9a4.5 4.5 0 0 1-9 0c0-1.6.6-2.7 1.3-3.7C9.7 9.8 11 10.6 11 12c0-2.2 1-3.5 1-5 0-1.6-.4-2.6-.6-3.2z"
      {...trazo}
    />
    <motion.path className="brasa" d="M12 22a6 6 0 0 0 6-6" {...trazo} opacity={0.45} />
  </>,
  (animate) => {
    animate('.llama', { scaleY: [1, 1.12, 0.96, 1], rotate: [0, -3, 3, 0] },
      { duration: 0.7, ease: 'easeInOut' });
    return animate('.brasa', { opacity: [0.45, 0.85, 0.45] }, { duration: 0.7 });
  },
  (animate) => {
    animate('.llama', { scaleY: 1, rotate: 0 }, { duration: 0.25 });
    animate('.brasa', { opacity: 0.45 }, { duration: 0.25 });
  }
);

// --- Trofeo: se alza ------------------------------------------------------
export const IconoTrofeo = crearIcono(
  'IconoTrofeo',
  <>
    <motion.g className="copa">
      <motion.path d="M7 4h10v5a5 5 0 0 1-10 0z" {...trazo} />
      <motion.path d="M7 6H5a2 2 0 0 0 2 3M17 6h2a2 2 0 0 1-2 3" {...trazo} />
      <motion.path d="M12 14v4M9 21h6M10 18h4" {...trazo} />
    </motion.g>
  </>,
  (animate) => animate('.copa', { y: [0, -3, 0], rotate: [0, -6, 6, 0] },
    { duration: 0.6, ease: 'easeInOut' }),
  (animate) => { animate('.copa', { y: 0, rotate: 0 }, { duration: 0.25 }); }
);

// --- Regalo: la tapa salta -----------------------------------------------
export const IconoRegalo = crearIcono(
  'IconoRegalo',
  <>
    <motion.rect className="tapa" x="3" y="7" width="18" height="4" rx="1" {...trazo} />
    <motion.path className="caja" d="M5 11v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" {...trazo} />
    <motion.path d="M12 7v14" {...trazo} />
    <motion.path className="lazo" d="M12 7C10 7 8 6 8 4.5S10 3 12 7c2-4 4-2 4-.5S14 7 12 7z" {...trazo} />
  </>,
  (animate) => {
    animate('.tapa', { y: [0, -3, 0] }, { duration: 0.45, ease: 'easeOut' });
    return animate('.lazo', { scale: [1, 1.2, 1], rotate: [0, -8, 8, 0] },
      { duration: 0.55, ease: 'easeInOut' });
  },
  (animate) => {
    animate('.tapa', { y: 0 }, { duration: 0.2 });
    animate('.lazo', { scale: 1, rotate: 0 }, { duration: 0.2 });
  }
);

// --- Gráfico: las barras crecen ------------------------------------------
export const IconoGrafico = crearIcono(
  'IconoGrafico',
  <>
    <motion.path d="M3 3v16a2 2 0 0 0 2 2h16" {...trazo} />
    <motion.path className="barra1" d="M8 17v-4" {...trazo} />
    <motion.path className="barra2" d="M13 17V8" {...trazo} />
    <motion.path className="barra3" d="M18 17v-7" {...trazo} />
  </>,
  (animate) => {
    // Escalonadas: se leen como una serie que crece, no como un parpadeo.
    animate('.barra1', { scaleY: [0.4, 1] }, { duration: 0.35, ease: 'easeOut' });
    animate('.barra2', { scaleY: [0.4, 1] }, { duration: 0.35, delay: 0.06, ease: 'easeOut' });
    return animate('.barra3', { scaleY: [0.4, 1] }, { duration: 0.35, delay: 0.12, ease: 'easeOut' });
  },
  (animate) => {
    animate('.barra1, .barra2, .barra3', { scaleY: 1 }, { duration: 0.2 });
  }
);

// --- Reloj del historial: la aguja da una vuelta --------------------------
export const IconoReloj = crearIcono(
  'IconoReloj',
  <>
    <motion.circle cx="12" cy="12" r="9" {...trazo} />
    <motion.path className="aguja" d="M12 7v5l3 2" {...trazo} style={{ transformOrigin: '12px 12px' }} />
  </>,
  (animate) => animate('.aguja', { rotate: [0, 360] }, { duration: 0.7, ease: 'easeInOut' }),
  (animate) => { animate('.aguja', { rotate: 0 }, { duration: 0.2 }); }
);

// --- Chispa de la IA: destella -------------------------------------------
export const IconoChispa = crearIcono(
  'IconoChispa',
  <>
    <motion.path
      className="chispa-grande"
      d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"
      {...trazo}
    />
    <motion.path className="chispa-chica" d="M18 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" {...trazo} />
  </>,
  (animate) => {
    animate('.chispa-grande', { scale: [1, 1.12, 1], rotate: [0, 12, 0] },
      { duration: 0.55, ease: 'easeInOut' });
    return animate('.chispa-chica', { scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] },
      { duration: 0.55, delay: 0.08, ease: 'easeOut' });
  },
  (animate) => {
    animate('.chispa-grande', { scale: 1, rotate: 0 }, { duration: 0.2 });
    animate('.chispa-chica', { scale: 1, opacity: 1 }, { duration: 0.2 });
  }
);
