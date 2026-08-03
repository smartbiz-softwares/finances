import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {IS_NATIVE_APP} from './api';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// El service worker hace que la app arranque sin cobertura y es requisito para
// que se pueda instalar. Dentro del APK no aporta nada —el contenido ya está en
// el teléfono— y solo añadiría una capa de caché que confunde al depurar.
if ('serviceWorker' in navigator && !IS_NATIVE_APP && (import.meta as any).env?.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Sin service worker la app funciona igual; solo pierde el modo offline.
    });
  });
}
