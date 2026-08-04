/**
 * Puente con la parte nativa de Android.
 *
 * El widget de la pantalla de inicio vive fuera del WebView y no puede leer el
 * token de sesión del localStorage. `MainActivity` expone `HeraNativo` para que
 * la web se lo entregue, y así el widget puede pedir el saldo y registrar por
 * voz sin abrir la app.
 *
 * Fuera de Android no existe nada de esto, y las funciones no hacen nada.
 */

interface PuenteAndroid {
  guardarSesion: (token: string, servidor: string) => void;
  borrarSesion: () => void;
  refrescarWidget?: () => void;
}

const puente = (): PuenteAndroid | null => {
  const p = (window as any)?.HeraNativo;
  return p && typeof p.guardarSesion === 'function' ? p : null;
};

export const hayPuenteNativo = () => puente() !== null;

/** Entrega la sesión al widget. Se llama al entrar. */
export function compartirSesionConWidget(token: string | null) {
  const p = puente();
  if (!p || !token) return;

  try {
    p.guardarSesion(token, window.location.origin);
  } catch {
    // Un fallo aquí solo significa que el widget se queda sin datos; la app
    // funciona igual.
  }
}

/**
 * Avisa al widget de que los datos cambiaron.
 *
 * Android no deja que un widget se refresque por su cuenta más de una vez cada
 * media hora, así que sin este aviso un gasto recién registrado tardaba hasta
 * treinta minutos en aparecer en la pantalla de inicio.
 */
export function refrescarWidget() {
  const p = puente();
  if (!p?.refrescarWidget) return;

  try {
    p.refrescarWidget();
  } catch {
    // Con una versión antigua de la app este método no existe; no pasa nada.
  }
}

/** Borra la sesión del widget. Se llama al salir. */
export function olvidarSesionEnWidget() {
  const p = puente();
  if (!p) return;

  try {
    p.borrarSesion();
  } catch {
    // Igual que arriba: no debe impedir cerrar sesión.
  }
}
