package app.herawallet.client;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Widget de pantalla de inicio.
 *
 * Muestra el saldo, lo gastado hoy y la racha, y ofrece dos acciones que no
 * requieren abrir la app: dictar un movimiento y arrancar el Modo Live.
 *
 * Un widget no puede hacer red en el hilo principal ni mantener estado, así que
 * los datos se piden en segundo plano y se pintan cuando llegan. Mientras
 * tanto se muestra lo último que se supo, en vez de dejarlo en blanco.
 */
public class WidgetHera extends AppWidgetProvider {

    public static final String ACCION_DICTAR = "app.herawallet.client.DICTAR";
    public static final String ACCION_LIVE = "app.herawallet.client.LIVE";
    public static final String ACCION_REFRESCAR = "app.herawallet.client.REFRESCAR";

    private static final String PREF_CACHE = "hera_widget_cache";
    private static final ExecutorService hilos = Executors.newSingleThreadExecutor();

    @Override
    public void onUpdate(Context contexto, AppWidgetManager gestor, int[] ids) {
        for (int id : ids) {
            pintar(contexto, gestor, id, null);
        }
        refrescarDatos(contexto);
    }

    @Override
    public void onReceive(Context contexto, Intent intent) {
        super.onReceive(contexto, intent);

        String accion = intent.getAction();
        if (ACCION_REFRESCAR.equals(accion)) {
            refrescarDatos(contexto);
        }
    }

    /** Repinta todos los widgets colocados. */
    public static void actualizarTodos(Context contexto) {
        AppWidgetManager gestor = AppWidgetManager.getInstance(contexto);
        int[] ids = gestor.getAppWidgetIds(new ComponentName(contexto, WidgetHera.class));
        if (ids.length == 0) return;

        for (int id : ids) {
            pintar(contexto, gestor, id, null);
        }
    }

    private static void pintar(Context contexto, AppWidgetManager gestor, int id, JSONObject datos) {
        RemoteViews vistas = new RemoteViews(contexto.getPackageName(), R.layout.widget_hera);

        boolean haySesion = PuenteSesion.token(contexto) != null;

        if (!haySesion) {
            // Sin sesión no se inventan cifras: se invita a entrar.
            vistas.setTextViewText(R.id.widget_saldo, "—");
            vistas.setTextViewText(R.id.widget_detalle, "Entra en HeraWallet");
            vistas.setTextViewText(R.id.widget_racha, "");
        } else {
            JSONObject cache = datos != null ? datos : leerCache(contexto);
            if (cache != null) {
                vistas.setTextViewText(R.id.widget_saldo, cache.optString("saldo", "—"));

                String gasto = cache.optString("gastoHoy", "");
                int movimientos = cache.optInt("movimientos", 0);
                vistas.setTextViewText(R.id.widget_detalle,
                        movimientos == 0
                                ? "Nada registrado hoy"
                                : "Hoy: " + gasto);

                int racha = cache.optInt("racha", 0);
                vistas.setTextViewText(R.id.widget_racha,
                        racha > 0 ? racha + (racha == 1 ? " día" : " días") : "");
            } else {
                vistas.setTextViewText(R.id.widget_saldo, "…");
                vistas.setTextViewText(R.id.widget_detalle, "Cargando");
                vistas.setTextViewText(R.id.widget_racha, "");
            }
        }

        // Tocar el widget abre la app; los botones hacen lo suyo sin abrirla.
        vistas.setOnClickPendingIntent(R.id.widget_cuerpo, abrirApp(contexto, null));
        vistas.setOnClickPendingIntent(R.id.widget_dictar, accion(contexto, ACCION_DICTAR));
        vistas.setOnClickPendingIntent(R.id.widget_live, accion(contexto, ACCION_LIVE));

        gestor.updateAppWidget(id, vistas);
    }

    private static PendingIntent abrirApp(Context contexto, String ruta) {
        Intent intent = new Intent(contexto, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (ruta != null) intent.setData(Uri.parse(ruta));

        return PendingIntent.getActivity(contexto, ruta == null ? 0 : ruta.hashCode(), intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /**
     * Las dos acciones abren una actividad transparente: un widget no puede
     * grabar audio por sí mismo, hace falta algo con ventana aunque no se vea.
     */
    private static PendingIntent accion(Context contexto, String accion) {
        Intent intent = new Intent(contexto, DictadoActivity.class);
        intent.setAction(accion);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);

        return PendingIntent.getActivity(contexto, accion.hashCode(), intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Pide el resumen al servidor y repinta cuando llega. */
    private static void refrescarDatos(Context contexto) {
        String token = PuenteSesion.token(contexto);
        if (token == null) return;

        hilos.execute(() -> {
            try {
                URL url = new URL(PuenteSesion.servidor(contexto) + "/api/widget/resumen");
                HttpURLConnection conexion = (HttpURLConnection) url.openConnection();
                conexion.setRequestProperty("Authorization", "Bearer " + token);
                conexion.setConnectTimeout(8000);
                conexion.setReadTimeout(8000);

                if (conexion.getResponseCode() != 200) return;

                StringBuilder cuerpo = new StringBuilder();
                try (BufferedReader lector = new BufferedReader(
                        new InputStreamReader(conexion.getInputStream()))) {
                    String linea;
                    while ((linea = lector.readLine()) != null) cuerpo.append(linea);
                }

                JSONObject datos = new JSONObject(cuerpo.toString());
                guardarCache(contexto, cuerpo.toString());

                // Pintar toca la interfaz: hay que volver al hilo principal.
                new Handler(Looper.getMainLooper()).post(() -> {
                    AppWidgetManager gestor = AppWidgetManager.getInstance(contexto);
                    int[] ids = gestor.getAppWidgetIds(new ComponentName(contexto, WidgetHera.class));
                    for (int id : ids) pintar(contexto, gestor, id, datos);
                });
            } catch (Exception e) {
                // Sin conexión se queda lo último que se supo, que es mejor que
                // un widget en blanco.
            }
        });
    }

    private static void guardarCache(Context contexto, String json) {
        contexto.getSharedPreferences(PREF_CACHE, Context.MODE_PRIVATE)
                .edit().putString("datos", json).apply();
    }

    private static JSONObject leerCache(Context contexto) {
        String json = contexto.getSharedPreferences(PREF_CACHE, Context.MODE_PRIVATE)
                .getString("datos", null);
        if (json == null) return null;
        try {
            return new JSONObject(json);
        } catch (Exception e) {
            return null;
        }
    }
}
