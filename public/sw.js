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
