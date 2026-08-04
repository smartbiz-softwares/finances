import React, { useEffect, useRef, forwardRef } from 'react';
import type { AnimatedIconHandle, AnimatedIconProps } from './types';

/**
 * Envoltorio para los iconos animados.
 *
 * Los iconos de origen solo animan con `onHoverStart`, y en un teléfono no hay
 * ratón: la mayoría de la gente no vería nunca la animación. Aquí se añaden dos
 * disparadores que sí existen en móvil:
 *
 *   - al tocar el icono
 *   - al cambiar `activo` a cierto, para celebrar algo que acaba de pasar
 *     (un logro, un registro guardado) sin que nadie tenga que tocar nada
 *
 * Y se respeta `prefers-reduced-motion`: quien pidió al sistema que no le
 * muevan la interfaz, no la ve moverse.
 */

type ComponenteIcono = React.ForwardRefExoticComponent<
  AnimatedIconProps & React.RefAttributes<AnimatedIconHandle>
>;

interface Props extends AnimatedIconProps {
  icono: ComponenteIcono;
  /** Al pasar de falso a cierto, el icono se anima una vez. */
  activo?: boolean;
  /**
   * No animar al tocar.
   *
   * Para lo que se usa muchas veces al día —la navegación principal— una
   * animación en cada toque cansa y hace que la app parezca lenta. Ahí interesa
   * que se mueva solo cuando algo cambia de verdad, que es lo que hace `activo`.
   */
  sinToque?: boolean;
}

const sinMovimiento = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const IconoAnimado = forwardRef<AnimatedIconHandle, Props>(
  ({ icono: Icono, activo, sinToque, onPointerDown, ...resto }, refExterna) => {
    const interno = useRef<AnimatedIconHandle>(null);
    const anterior = useRef(activo);

    useEffect(() => {
      // Solo en el flanco: si `activo` ya era cierto al montar, no se celebra
      // algo que pasó antes de abrir la pantalla.
      if (activo && !anterior.current && !sinMovimiento()) {
        interno.current?.startAnimation();
      }
      anterior.current = activo;
    }, [activo]);

    return (
      <Icono
        ref={(nodo: AnimatedIconHandle | null) => {
          (interno as any).current = nodo;
          if (typeof refExterna === 'function') refExterna(nodo);
          else if (refExterna) (refExterna as any).current = nodo;
        }}
        onPointerDown={(e: React.PointerEvent<SVGSVGElement>) => {
          // El toque cubre lo que el hover no alcanza. En ratón se dispararía
          // dos veces, pero la animación es idempotente: reiniciarla no molesta.
          if (!sinToque && !sinMovimiento()) interno.current?.startAnimation();
          onPointerDown?.(e);
        }}
        {...resto}
      />
    );
  }
);

IconoAnimado.displayName = 'IconoAnimado';
