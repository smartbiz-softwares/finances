package app.herawallet.client;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import android.webkit.JavascriptInterface;

import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;

/**
 * Compartir imágenes desde la app.
 *
 * `navigator.share` con archivos no funciona en el WebView de Android: unas
 * veces no existe y otras acepta la llamada y no hace nada. Al fallar, la web
 * caía a descargar un blob, el WebView lo interceptaba como descarga y el
 * resultado era un "no se pudo iniciar la descarga" cuando lo que se quería era
 * compartir una imagen.
 *
 * Aquí se guarda la imagen y se lanza el selector de compartir del sistema, que
 * es donde está WhatsApp.
 */
public class PuenteCompartir {

    private final Context contexto;

    public PuenteCompartir(Context contexto) {
        this.contexto = contexto;
    }

    /**
     * Comparte una imagen PNG codificada en base64.
     *
     * @return si se pudo abrir el selector; la web usa esto para saber si tiene
     *         que buscarse la vida por su cuenta.
     */
    @JavascriptInterface
    public boolean imagen(String base64, String texto, String nombre) {
        try {
            String limpio = base64.replaceFirst("^data:image/\\w+;base64,", "");
            byte[] bytes = Base64.decode(limpio, Base64.DEFAULT);

            // En la caché: es un archivo de paso, no algo que deba quedarse en
            // la galería de nadie.
            File carpeta = new File(contexto.getCacheDir(), "compartir");
            if (!carpeta.exists() && !carpeta.mkdirs()) return false;

            File archivo = new File(carpeta, nombre == null ? "hera.png" : nombre);
            try (FileOutputStream salida = new FileOutputStream(archivo)) {
                salida.write(bytes);
            }

            Uri uri = FileProvider.getUriForFile(
                    contexto, contexto.getPackageName() + ".fileprovider", archivo);

            Intent enviar = new Intent(Intent.ACTION_SEND);
            enviar.setType("image/png");
            enviar.putExtra(Intent.EXTRA_STREAM, uri);
            if (texto != null && !texto.isEmpty()) enviar.putExtra(Intent.EXTRA_TEXT, texto);
            enviar.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent selector = Intent.createChooser(enviar, "Compartir");
            selector.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            contexto.startActivity(selector);
            return true;
        } catch (Exception e) {
            android.util.Log.e("HeraCompartir", "No se pudo compartir la imagen", e);
            return false;
        }
    }
}
