/**
 * Iconos animados (itshover, MIT), envueltos para que también funcionen al
 * tocar y no solo al pasar el ratón. Ver `Animado.tsx`.
 *
 * **No son un reemplazo de lucide-react.** Se usan solo donde una animación
 * aporta algo: navegación, acciones principales y momentos de celebración. Todo
 * lo que se repite muchas veces por pantalla —los iconos de categoría de cada
 * transacción, por ejemplo— sigue siendo estático: cada icono animado monta su
 * propio motor de animación, y cincuenta a la vez se notan en un teléfono
 * modesto.
 *
 * Se renombran al castellano para que en el código se lea qué representan aquí,
 * no cómo se llamaban en la colección de origen.
 */
export { IconoAnimado } from './Animado';
export type { AnimatedIconHandle, AnimatedIconProps } from './types';

export { default as IconoInicio } from './home-icon';
export { default as IconoTarjeta } from './credit-card';
export { default as IconoMeta } from './target-icon';
export { default as IconoEnviar } from './send-horizontal-icon';
export { default as IconoCampana } from './filled-bell-icon';
export { default as IconoHecho } from './checked-icon';
export { default as IconoAjustes } from './gear-icon';
export { default as IconoActualizar } from './refresh-icon';
export { default as IconoEstrella } from './star-icon';
export { default as IconoCelebracion } from './party-popper-icon';
export { default as IconoPapelera } from './trash-icon';
export { default as IconoCopiar } from './copy-icon';
export { default as IconoWhatsapp } from './whatsapp-icon';
export { default as IconoEscanear } from './scan-barcode-icon';
export { default as IconoBuscar } from './magnifier-icon';
export { default as IconoSalir } from './logout-icon';
export { default as IconoEscudo } from './shield-check';
export { default as IconoAviso } from './triangle-alert-icon';
export { default as IconoVolumen } from './volume-2-icon';
export { default as IconoCohete } from './rocket-icon';
export { default as IconoLuna } from './moon-icon';
export { default as IconoSol } from './brightness-down-icon';
export { default as IconoFlechaArriba } from './arrow-narrow-up-icon';
export { default as IconoFlechaAbajo } from './arrow-narrow-down-icon';
export { default as IconoDobleCheck } from './double-check-icon';
export { default as IconoCompartir } from './send-icon';
export { default as IconoCampanaMuda } from './bell-off-icon';
export { default as IconoEditar } from './pen-icon';
export { default as IconoGlobo } from './globe-icon';
export { default as IconoAmpliar } from './expand-icon';

// Los que la colección de origen no trae; ver `propios.tsx`.
export {
  IconoMicrofono,
  IconoCamara,
  IconoIngreso,
  IconoGasto,
  IconoLlama,
  IconoTrofeo,
  IconoRegalo,
  IconoGrafico,
  IconoReloj,
  IconoChispa,
} from './propios';
