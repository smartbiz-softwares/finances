package app.herawallet.client;

import android.app.DownloadManager;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import java.io.File;

/**
 * Actualización sin salir de la app.
 *
 * Antes, "Actualizar" era un enlace: abría el navegador y ahí se perdía el
 * hilo. Nadie sabía si estaba descargando, cuánto faltaba, ni qué hacer con el
 * archivo al final.
 *
 * Ahora la web llama a `iniciar()` y este puente se encarga de todo: lanza la
 * descarga, va contando el avance real a la interfaz y, al terminar, abre el
 * instalador él mismo. El usuario solo confirma la instalación, que es lo único
 * que Android no deja automatizar.
 */
public class PuenteActualizacion {

    private static final String NOMBRE_ARCHIVO = "HeraWallet.apk";
    /** Medio segundo: suficiente para que la barra se mueva sin sondear de más. */
    private static final long CADA_MS = 500;

    private final Context contexto;
    private final WebView webView;
    private final Handler principal = new Handler(Looper.getMainLooper());

    private long descargaEnCurso = -1;

    public PuenteActualizacion(Context contexto, WebView webView) {
        this.contexto = contexto;
        this.webView = webView;
    }

    /** Arranca la descarga. La web solo tiene que llamar aquí. */
    @JavascriptInterface
    public void iniciar(String url) {
        // Dos descargas a la vez del mismo archivo se pisarían.
        if (descargaEnCurso != -1) return;

        try {
            File previo = new File(
                    contexto.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), NOMBRE_ARCHIVO);
            if (previo.exists()) previo.delete();

            DownloadManager.Request peticion = new DownloadManager.Request(Uri.parse(url));
            peticion.setTitle("HeraWallet");
            peticion.setDescription("Descargando la versión nueva");
            peticion.setNotificationVisibility(
                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            peticion.setDestinationInExternalFilesDir(
                    contexto, Environment.DIRECTORY_DOWNLOADS, NOMBRE_ARCHIVO);
            peticion.setMimeType("application/vnd.android.package-archive");

            DownloadManager gestor =
                    (DownloadManager) contexto.getSystemService(Context.DOWNLOAD_SERVICE);
            if (gestor == null) {
                avisar("error", 0);
                return;
            }

            descargaEnCurso = gestor.enqueue(peticion);
            avisar("empezando", 0);
            vigilar(gestor);
        } catch (Exception e) {
            descargaEnCurso = -1;
            avisar("error", 0);
        }
    }

    /**
     * Sondea el gestor de descargas y va informando del avance.
     *
     * Se sondea en vez de escuchar porque el gestor solo avisa al terminar, y
     * lo que se quiere es precisamente enseñar el camino.
     */
    private void vigilar(DownloadManager gestor) {
        principal.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (descargaEnCurso == -1) return;

                try (Cursor cursor = gestor.query(
                        new DownloadManager.Query().setFilterById(descargaEnCurso))) {

                    if (cursor == null || !cursor.moveToFirst()) {
                        terminar("error", 0);
                        return;
                    }

                    int iEstado = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                    int iBajado = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR);
                    int iTotal = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES);

                    int estado = iEstado >= 0 ? cursor.getInt(iEstado) : -1;
                    long bajado = iBajado >= 0 ? cursor.getLong(iBajado) : 0;
                    long total = iTotal >= 0 ? cursor.getLong(iTotal) : 0;

                    int porcentaje = total > 0 ? (int) ((bajado * 100) / total) : 0;

                    if (estado == DownloadManager.STATUS_SUCCESSFUL) {
                        terminar("listo", 100);
                        // Instalar de inmediato: descargar y no hacer nada con
                        // el archivo es justo lo que pasaba antes.
                        DescargaApp.instalar(contexto);
                        return;
                    }

                    if (estado == DownloadManager.STATUS_FAILED) {
                        terminar("error", porcentaje);
                        return;
                    }

                    avisar(estado == DownloadManager.STATUS_PAUSED ? "pausada" : "descargando",
                            porcentaje);
                    principal.postDelayed(this, CADA_MS);
                } catch (Exception e) {
                    terminar("error", 0);
                }
            }
        }, CADA_MS);
    }

    private void terminar(String estado, int porcentaje) {
        descargaEnCurso = -1;
        avisar(estado, porcentaje);
    }

    /** Manda el estado a la web, que es quien pinta la barra. */
    private void avisar(String estado, int porcentaje) {
        principal.post(() -> {
            try {
                webView.evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('hera-descarga',{detail:{estado:'"
                                + estado + "',porcentaje:" + porcentaje + "}}))", null);
            } catch (Exception ignorado) {
                // Que no se pueda pintar el avance no debe parar la descarga.
            }
        });
    }

    /** Por si la descarga ya estaba hecha de un intento anterior. */
    @JavascriptInterface
    public boolean instalarDescargado() {
        File apk = new File(
                contexto.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), NOMBRE_ARCHIVO);
        if (!apk.exists()) return false;

        DescargaApp.instalar(contexto);
        return true;
    }
}
