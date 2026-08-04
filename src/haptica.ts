/**
 * Vibración de respuesta al tacto.
 *
 * Los pulsos son cortos y flojos a propósito. Una vibración larga se lee como
 * un aviso —algo va mal, algo llega—, y aquí solo se confirma que el dedo tocó
 * donde quería. Las apps que se sienten bien vibran poco y breve.
 *
 * Dentro de la app se usa el puente nativo, que distingue intensidades. En el
 * navegador se cae a `navigator.vibrate`, que solo entiende duraciones y no
 * existe en iPhone: allí, sencillamente, no vibra nada.
 */

type Intensidad = 'toque' | 'pulso' | 'exito';

/** Duraciones para el respaldo del navegador, en milisegundos. */
const DURACIONES: Record<Intensidad, number> = {
  toque: 10,
  pulso: 20,
  exito: 30,
};

interface PuenteHaptica {
  toque: () => void;
  pulso: () => void;
  exito: () => void;
}

const puente = (): PuenteHaptica | null => {
  const p = (window as any)?.HeraVibrar;
  return p && typeof p.toque === 'function' ? p : null;
};

/**
 * Quien pidió al sistema que no le muevan la interfaz tampoco quiere que le
 * vibre en la mano.
 */
const quieto = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function vibrar(intensidad: Intensidad) {
  if (typeof window === 'undefined' || quieto()) return;

  try {
    const nativo = puente();
    if (nativo) {
      nativo[intensidad]();
      return;
    }

    navigator.vibrate?.(DURACIONES[intensidad]);
  } catch {
    // Vibrar es un adorno: no puede tumbar la acción que lo disparó.
  }
}

/** Confirmación de un toque. Lo más suave que se puede sentir. */
export const toque = () => vibrar('toque');

/** Algo empieza o termina: se abre una hoja, arranca una grabación. */
export const pulso = () => vibrar('pulso');

/** Algo salió bien y merece notarse: un registro guardado, un logro. */
export const exito = () => vibrar('exito');

/**
 * Vibración en cualquier elemento pulsable de la app, sin tener que tocar cada
 * botón uno por uno.
 *
 * Se escucha en la fase de captura y sobre `pointerdown`, no sobre `click`: la
 * respuesta tiene que llegar con el dedo, no cuando se levanta. Se filtra a
 * botones y enlaces reales para no vibrar al desplazarse o al seleccionar
 * texto.
 */
export function activarHapticaGlobal() {
  if (typeof document === 'undefined') return;

  document.addEventListener('pointerdown', (evento) => {
    const destino = evento.target as HTMLElement | null;
    if (!destino?.closest) return;

    const pulsable = destino.closest(
      'button, a[href], [role="button"], [role="switch"], [role="tab"], input[type="range"]'
    ) as HTMLElement | null;

    if (!pulsable) return;
    if (pulsable.hasAttribute('disabled') || pulsable.getAttribute('aria-disabled') === 'true') return;

    toque();
  }, { capture: true, passive: true });
}
