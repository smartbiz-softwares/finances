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
    // El contenido se sirve desde el propio paquete; solo las llamadas de API
    // salen a la red.
    androidScheme: 'https',
  },
};

export default config;
