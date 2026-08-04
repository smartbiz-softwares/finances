/**
 * Service worker de HeraWallet.
 *
 * Su único cometido es que la app arranque sin cobertura y que no dependa de
 * la red para lo que no cambia. Todo lo demás pasa de largo.
 *
 * Las reglas son deliberadamente conservadoras: un service worker mal ajustado
 * sirve una versión vieja para siempre, y eso es peor que no tenerlo.
 *
 *  - Nada de `/api`: los datos financieros se piden siempre a la red. Una
 *    respuesta cacheada aquí mostraría saldos falsos.
 *  - La navegación va primero a la red. Solo si falla se sirve la copia, para
 *    que un despliegue nuevo llegue en la primera carga y no en la segunda.
 *  - Los archivos de `/assets` llevan un hash en el nombre: cuando cambian,
 *    cambia la URL. Esos sí se sirven de la caché sin preguntar.
 */

const VERSION = 'hera-v1';
const CACHE_ESTATICO = `${VERSION}-estatico`;

// Lo mínimo para pintar algo con el avión activado.
const BASICOS = [
  '/',
  '/manifest.webmanifest',
  '/logo.svg',
  '/icon-192.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_ESTATICO)
      // `addAll` falla entero si un archivo no está; se piden de uno en uno
      // para que un recurso ausente no impida instalar el worker.
      .then((cache) => Promise.allSettled(BASICOS.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(
        claves.filter((c) => !c.startsWith(VERSION)).map((c) => caches.delete(c))
      ))
      .then(() => self.clients.claim())
  );
});

// --- Notificaciones --------------------------------------------------------

self.addEventListener('push', (evento) => {
  let datos = {};
  try {
    datos = evento.data ? evento.data.json() : {};
  } catch {
    // Si el cuerpo no es JSON no se descarta el aviso: se muestra genérico.
    datos = { titulo: 'HeraWallet', cuerpo: evento.data ? evento.data.text() : '' };
  }

  const opciones = {
    body: datos.cuerpo || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    // Agrupar por tipo evita apilar tres resúmenes si el teléfono estuvo
    // apagado: se ve el último, que es el que importa.
    tag: datos.tipo || 'hera',
    renotify: true,
    data: { url: datos.url || '/', tipo: datos.tipo || '' },
    actions: (datos.acciones || []).slice(0, 2).map((a) => ({
      action: a.action,
      title: a.title,
    })),
  };

  evento.waitUntil(
    self.registration.showNotification(datos.titulo || 'HeraWallet', opciones)
  );
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();

  const datos = evento.notification.data || {};
  // Pulsar el botón de registrar lleva directo al dictado: el recordatorio se
  // convierte en el registro, sin pasos intermedios.
  let destino = datos.url || '/';
  if (evento.action === 'registrar') destino = '/?accion=registrar';
  // El botón de la notificación de versión nueva descarga el archivo directo.
  else if (evento.action === 'actualizar') destino = '/descargar/HeraWallet.apk';

  evento.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

    // Si la app ya está abierta se reutiliza esa pestaña en vez de abrir otra.
    for (const ventana of ventanas) {
      if ('focus' in ventana) {
        await ventana.focus();
        ventana.postMessage({ tipo: 'notificacion-abierta', destino, notificacion: datos.tipo });
        return;
      }
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow(destino);
    }
  })());
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;

  if (peticion.method !== 'GET') return;

  const url = new URL(peticion.url);

  // Otro origen (fuentes, ipapi): que lo resuelva el navegador.
  if (url.origin !== self.location.origin) return;

  // Datos y descargas siempre frescos.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/descargar/')) return;

  // Navegación: red primero, caché como red de seguridad.
  if (peticion.mode === 'navigate') {
    evento.respondWith(
      fetch(peticion)
        .then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(CACHE_ESTATICO).then((cache) => cache.put('/', copia));
          return respuesta;
        })
        .catch(() => caches.match('/').then((r) => r || Response.error()))
    );
    return;
  }

  // Recursos con hash en el nombre: inmutables, se sirven de caché.
  const inmutable = url.pathname.startsWith('/assets/');

  evento.respondWith(
    caches.match(peticion).then((cacheado) => {
      if (cacheado && inmutable) return cacheado;

      const desdeRed = fetch(peticion)
        .then((respuesta) => {
          if (respuesta.ok && respuesta.type === 'basic') {
            const copia = respuesta.clone();
            caches.open(CACHE_ESTATICO).then((cache) => cache.put(peticion, copia));
          }
          return respuesta;
        })
        .catch(() => cacheado || Response.error());

      // Sin conexión vale la copia; con conexión manda la red.
      return cacheado ? desdeRed.catch(() => cacheado) : desdeRed;
    })
  );
});
