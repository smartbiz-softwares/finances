import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Configuración de la app nativa.
 *
 * La app empaqueta el mismo cliente web que se sirve en herawallet.app y habla
 * con ese servidor por HTTPS. El `dist/` que se copia dentro del APK debe
 * compilarse con VITE_API_BASE apuntando a producción (ver `npm run apk`);
 * sin eso, las rutas relativas buscarían un servidor dentro del teléfono.
 */
const config: CapacitorConfig = {
  appId: 'app.herawallet.client',
  appName: 'HeraWallet',
  webDir: 'dist',

  android: {
    // El WebView no permite tráfico en claro: todo va por HTTPS.
    allowMixedContent: false,
  },

  plugins: {
    // Pantalla de arranque breve: el cliente ya carga rápido y una espera
    // larga solo añade fricción.
    SplashScreen: {
      launchShowDuration: 900,
      backgroundColor: '#20201F',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },

  server: {
    // La interfaz se carga del servidor, no del paquete.
    //
    // Empaquetada, cada cambio de la web obligaba a reinstalar el APK: quien lo
    // tuviera de ayer se quedaba sin lo de hoy. Así, cualquier cambio les llega
    // al abrir la app, y solo hace falta un APK nuevo cuando cambia algo nativo
    // —permisos, icono, widget—, que es raro.
    //
    // El service worker cachea el contenido, así que después de la primera
    // apertura sigue funcionando sin conexión. Esa primera vez sí necesita red,
    // pero la tiene: se acaba de descargar la app.
    url: 'https://herawallet.app',
    androidScheme: 'https',
    cleartext: false,
  },
};

export default config;
