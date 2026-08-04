package app.herawallet.client;

import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.JavascriptInterface;

/**
 * Puente entre la sesión de la web y el widget.
 *
 * El widget vive fuera del WebView: no puede leer el localStorage donde la app
 * guarda el token, así que la web se lo entrega por aquí y queda en las
 * preferencias de Android, que sí son accesibles desde el widget.
 *
 * Solo viaja el token de sesión, nada más. Al cerrar sesión se borra, para que
 * el widget no siga mostrando datos de quien ya no está dentro.
 */
public class PuenteSesion {

    public static final String PREFERENCIAS = "hera_widget";
    public static final String CLAVE_TOKEN = "token";
    public static final String CLAVE_SERVIDOR = "servidor";

    private final Context contexto;

    public PuenteSesion(Context contexto) {
        this.contexto = contexto;
    }

    private SharedPreferences preferencias() {
        return contexto.getSharedPreferences(PREFERENCIAS, Context.MODE_PRIVATE);
    }

    /** La web llama a esto al entrar. */
    @JavascriptInterface
    public void guardarSesion(String token, String servidor) {
        preferencias().edit()
                .putString(CLAVE_TOKEN, token)
                .putString(CLAVE_SERVIDOR, servidor)
                .apply();

        // El widget puede llevar horas mostrando "sin sesión"; en cuanto hay
        // una, conviene repintarlo sin esperar al siguiente refresco.
        WidgetHera.actualizarTodos(contexto);
    }

    /** La web llama a esto al cerrar sesión. */
    @JavascriptInterface
    public void borrarSesion() {
        preferencias().edit().clear().apply();
        WidgetHera.actualizarTodos(contexto);
    }

    /** Token guardado, o null si no hay sesión. */
    public static String token(Context contexto) {
        return contexto.getSharedPreferences(PREFERENCIAS, Context.MODE_PRIVATE)
                .getString(CLAVE_TOKEN, null);
    }

    public static String servidor(Context contexto) {
        return contexto.getSharedPreferences(PREFERENCIAS, Context.MODE_PRIVATE)
                .getString(CLAVE_SERVIDOR, "https://herawallet.app");
    }
}
