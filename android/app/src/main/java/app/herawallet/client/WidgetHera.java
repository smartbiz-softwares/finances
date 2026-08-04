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

import org.json.JSONArray;
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
 * Muestra el saldo, el movimiento de hoy, la racha y las tres categorías donde
 * más se va el dinero este mes, con un botón para dictar sin abrir la app.
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
        if (ACCION_REFRESCAR.equals(accion)
                || AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(accion)) {
            refrescarDatos(contexto);
        }
    }

    @Override
    public void onEnabled(Context contexto) {
        super.onEnabled(contexto);
        // Al colocar el primero conviene tener datos ya, no esperar media hora.
        refrescarDatos(contexto);
    }

    /**
     * Repinta todos los widgets colocados y pide datos frescos.
     *
     * Antes solo repintaba la caché, así que tras registrar un gasto el widget
     * volvía a dibujar exactamente las mismas cifras de antes y parecía que no
     * se enteraba de nada. El repintado va primero para que el cambio de sesión
     * se note al instante; la petición llega detrás y corrige las cifras.
     */
    public static void actualizarTodos(Context contexto) {
        AppWidgetManager gestor = AppWidgetManager.getInstance(contexto);
        int[] ids = gestor.getAppWidgetIds(new ComponentName(contexto, WidgetHera.class));
        if (ids.length == 0) return;

        for (int id : ids) {
            pintar(contexto, gestor, id, null);
        }

        refrescarDatos(contexto);
    }

    private static void pintar(Context contexto, AppWidgetManager gestor, int id, JSONObject datos) {
        RemoteViews vistas = new RemoteViews(contexto.getPackageName(), R.layout.widget_hera);

        boolean haySesion = PuenteSesion.token(contexto) != null;

        if (!haySesion) {
            // Sin sesión no se inventan cifras: se invita a entrar.
            vistas.setTextViewText(R.id.widget_saldo, "—");
            vistas.setTextViewText(R.id.widget_hoy, "Entra en HeraWallet");
            vistas.setTextViewText(R.id.widget_racha, "");
            ocultarBarras(vistas);
        } else {
            JSONObject cache = datos != null ? datos : leerCache(contexto);

            if (cache == null) {
                vistas.setTextViewText(R.id.widget_saldo, "…");
                vistas.setTextViewText(R.id.widget_hoy, "Cargando");
                vistas.setTextViewText(R.id.widget_racha, "");
                ocultarBarras(vistas);
            } else {
                vistas.setTextViewText(R.id.widget_saldo, cache.optString("saldo", "—"));

                // Lo de hoy: lo que entró y lo que salió, en una línea.
                String ingreso = cache.optString("ingresoHoy", "");
                String gasto = cache.optString("gastoHoy", "");
                vistas.setTextViewText(R.id.widget_hoy,
                        cache.optInt("movimientos", 0) == 0
                                ? "Hoy: nada aún"
                                : "Hoy  +" + ingreso + "  −" + gasto);

                int racha = cache.optInt("racha", 0);
                vistas.setTextViewText(R.id.widget_racha,
                        racha > 0 ? racha + (racha == 1 ? " día" : " días") : "");

                pintarBarras(vistas, cache.optJSONArray("categorias"));
            }
        }

        // Tocar el widget abre la app; los botones hacen lo suyo sin abrirla.
        vistas.setOnClickPendingIntent(R.id.widget_cuerpo, abrirApp(contexto, null));
        vistas.setOnClickPendingIntent(R.id.widget_dictar, accion(contexto, ACCION_DICTAR));

        gestor.updateAppWidget(id, vistas);
    }

    /** Cada fila con sus identificadores: contenedor, nombre, barra e importe. */
    private static final int[][] FILAS = {
        {R.id.widget_cat1, R.id.cat1_nombre, R.id.cat1_barra, R.id.cat1_importe},
        {R.id.widget_cat2, R.id.cat2_nombre, R.id.cat2_barra, R.id.cat2_importe},
        {R.id.widget_cat3, R.id.cat3_nombre, R.id.cat3_barra, R.id.cat3_importe},
    };

    /**
     * Pinta las tres categorías donde más se gasta este mes.
     *
     * El ancho sale de repartir el peso entre la barra y el hueco que queda a
     * su derecha: es lo único que se puede cambiar en un widget, porque ahí no
     * corre código de dibujo.
     */
    private static void pintarBarras(RemoteViews vistas, JSONArray categorias) {
        for (int i = 0; i < FILAS.length; i++) {
            int[] fila = FILAS[i];
            JSONObject categoria = categorias != null ? categorias.optJSONObject(i) : null;

            if (categoria == null) {
                vistas.setViewVisibility(fila[0], android.view.View.INVISIBLE);
                continue;
            }

            vistas.setViewVisibility(fila[0], android.view.View.VISIBLE);
            vistas.setTextViewText(fila[1], categoria.optString("nombre", ""));
            vistas.setTextViewText(fila[3], categoria.optString("importe", ""));

            // Un mínimo del 8 % para que la categoría más pequeña siga siendo
            // visible y no parezca que no hay nada.
            int proporcion = Math.max(8, Math.min(100, categoria.optInt("proporcion", 0)));
            vistas.setProgressBar(fila[2], 100, proporcion, false);
        }
    }

    private static void ocultarBarras(RemoteViews vistas) {
        for (int[] fila : FILAS) vistas.setViewVisibility(fila[0], android.view.View.INVISIBLE);
    }

    private static PendingIntent abrirApp(Context contexto, String ruta) {
        Intent intent = new Intent(contexto, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (ruta != null) intent.setData(Uri.parse(ruta));

        return PendingIntent.getActivity(contexto, ruta == null ? 0 : ruta.hashCode(), intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /**
     * Dictar abre una actividad transparente: un widget no puede grabar audio
     * por sí mismo, hace falta algo con ventana aunque no se vea.
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

                int codigo = conexion.getResponseCode();
                if (codigo == 401) {
                    // La sesión caducó o se cerró en la app.
                    mostrarEstado(contexto, "Vuelve a entrar en la app");
                    return;
                }
                if (codigo != 200) {
                    android.util.Log.w("HeraWidget", "El servidor respondió " + codigo);
                    mostrarEstado(contexto, "No se pudo cargar");
                    return;
                }

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
                android.util.Log.e("HeraWidget", "No se pudo leer el resumen", e);
                mostrarEstado(contexto, "Sin conexión");
            }
        });
    }

    /** Escribe un mensaje en la línea de detalle, para que el fallo se vea. */
    private static void mostrarEstado(Context contexto, String mensaje) {
        new Handler(Looper.getMainLooper()).post(() -> {
            try {
                AppWidgetManager gestor = AppWidgetManager.getInstance(contexto);
                int[] ids = gestor.getAppWidgetIds(new ComponentName(contexto, WidgetHera.class));

                for (int id : ids) {
                    RemoteViews vistas = new RemoteViews(contexto.getPackageName(), R.layout.widget_hera);
                    vistas.setTextViewText(R.id.widget_hoy, mensaje);
                    vistas.setOnClickPendingIntent(R.id.widget_cuerpo, abrirApp(contexto, null));
                    vistas.setOnClickPendingIntent(R.id.widget_dictar, accion(contexto, ACCION_DICTAR));
                    gestor.partiallyUpdateAppWidget(id, vistas);
                }
            } catch (Exception ignorado) {
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
