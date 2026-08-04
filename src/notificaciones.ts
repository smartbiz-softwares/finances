/**
 * Suscripción a las notificaciones desde el navegador.
 *
 * El permiso de notificaciones se concede una sola vez en la vida: si se pide
 * nada más entrar, la mayoría dice que no y ya no hay forma de volver a
 * preguntar. Por eso aquí solo se expone la función, y quien decide *cuándo*
 * pedirlo es la interfaz, después de que la persona haya registrado algo y
 * entienda para qué sirve.
 */
import { apiUrl, getToken, IS_NATIVE_APP } from './api';

/** La clave VAPID viaja en base64url y el navegador la quiere en bytes. */
function claveABytes(base64: string): Uint8Array {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
  const normal = (base64 + relleno).replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(normal);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

export const soportaPush = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

/** Si ya está instalada como app, en iOS es la única forma de recibir push. */
export const instaladaComoApp = () =>
  (navigator as any).standalone === true ||
  window.matchMedia?.('(display-mode: standalone)').matches;

export type EstadoPermiso = 'concedido' | 'denegado' | 'sin-pedir' | 'no-soportado';

export function estadoPermiso(): EstadoPermiso {
  if (!soportaPush()) return 'no-soportado';
  if (Notification.permission === 'granted') return 'concedido';
  if (Notification.permission === 'denied') return 'denegado';
  return 'sin-pedir';
}

/**
 * Pide permiso y registra el dispositivo. Devuelve si quedó suscrito.
 *
 * Es idempotente: si ya había una suscripción se reenvía al servidor, que la
 * actualiza en lugar de duplicarla.
 */
export async function activarNotificaciones(): Promise<boolean> {
  if (!soportaPush()) return false;

  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') return false;

  const registro = await navigator.serviceWorker.ready;

  const respuesta = await fetch(apiUrl('/api/push/clave'));
  const { clave, activo } = await respuesta.json();
  if (!clave || !activo) return false;

  let suscripcion = await registro.pushManager.getSubscription();
  if (!suscripcion) {
    suscripcion = await registro.pushManager.subscribe({
      // Obligatorio en todos los navegadores actuales: no se permiten
      // notificaciones silenciosas.
      userVisibleOnly: true,
      applicationServerKey: claveABytes(clave),
    });
  }

  const datos = suscripcion.toJSON();
  const envio = await fetch(apiUrl('/api/push/suscribir'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      endpoint: datos.endpoint,
      keys: datos.keys,
      // Solo a quien tiene la app instalada le sirve saber que hay un APK nuevo.
      esApp: IS_NATIVE_APP,
    }),
  });

  return envio.ok;
}

export async function desactivarNotificaciones(): Promise<void> {
  if (!soportaPush()) return;

  const registro = await navigator.serviceWorker.ready;
  const suscripcion = await registro.pushManager.getSubscription();
  if (!suscripcion) return;

  await fetch(apiUrl('/api/push/cancelar'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ endpoint: suscripcion.endpoint }),
  });

  await suscripcion.unsubscribe();
}

/** ¿Este dispositivo ya está suscrito? */
export async function estaSuscrito(): Promise<boolean> {
  if (!soportaPush() || Notification.permission !== 'granted') return false;
  const registro = await navigator.serviceWorker.ready;
  return !!(await registro.pushManager.getSubscription());
}

/** Avisa al servidor de que se abrió una notificación, para medir qué funciona. */
export function marcarAbierta(tipo: string) {
  if (!tipo) return;
  fetch(apiUrl('/api/notificaciones/abierta'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ tipo }),
  }).catch(() => { /* Perder una métrica no debe romper nada. */ });
}
