package app.herawallet.client;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import android.widget.Toast;

import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import java.io.File;

/**
 * Descarga e instalación de una versión nueva desde dentro de la app.
 *
 * El WebView **no maneja descargas**: un enlace con `download` no hace nada, ni
 * siquiera avisa. Por eso se intercepta y se delega en el gestor de descargas
 * de Android, que aporta lo que faltaba: barra de progreso en la bandeja de
 * notificaciones, aviso al terminar y reanudación si se corta la conexión.
 *
 * Cuando termina, se abre el instalador directamente. Bajar un archivo y
 * dejarlo en la carpeta de descargas sin decir nada es justo lo que pasaba
 * antes desde el navegador.
 */
public class DescargaApp {

    private static final String NOMBRE_ARCHIVO = "HeraWallet.apk";

    /** Lanza la descarga y devuelve si pudo empezar. */
    public static boolean descargar(Context contexto, String url) {
        try {
            // Un archivo de una descarga anterior haría que el gestor añadiera
            // un sufijo y luego no encontráramos el que acabamos de bajar.
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
            if (gestor == null) return false;

            long id = gestor.enqueue(peticion);
            registrarFinal(contexto, id);

            Toast.makeText(contexto, "Descargando la actualización…", Toast.LENGTH_SHORT).show();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /** Espera a que termine esa descarga concreta y abre el instalador. */
    private static void registrarFinal(Context contexto, long idDescarga) {
        BroadcastReceiver receptor = new BroadcastReceiver() {
            @Override
            public void onReceive(Context ctx, Intent intent) {
                long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                if (id != idDescarga) return;

                try {
                    ctx.unregisterReceiver(this);
                } catch (Exception ignorado) {
                }

                if (!descargaCorrecta(ctx, id)) {
                    Toast.makeText(ctx, "No se pudo descargar la actualización",
                            Toast.LENGTH_LONG).show();
                    return;
                }

                instalar(ctx);
            }
        };

        ContextCompat.registerReceiver(contexto, receptor,
                new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                ContextCompat.RECEIVER_EXPORTED);
    }

    private static boolean descargaCorrecta(Context contexto, long id) {
        DownloadManager gestor =
                (DownloadManager) contexto.getSystemService(Context.DOWNLOAD_SERVICE);
        if (gestor == null) return false;

        try (Cursor cursor = gestor.query(new DownloadManager.Query().setFilterById(id))) {
            if (cursor == null || !cursor.moveToFirst()) return false;
            int columna = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
            return columna >= 0 && cursor.getInt(columna) == DownloadManager.STATUS_SUCCESSFUL;
        } catch (Exception e) {
            return false;
        }
    }

    /** Abre el instalador del sistema con el archivo recién descargado. */
    public static void instalar(Context contexto) {
        File apk = new File(
                contexto.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), NOMBRE_ARCHIVO);

        if (!apk.exists()) {
            Toast.makeText(contexto, "No se encontró la descarga", Toast.LENGTH_LONG).show();
            return;
        }

        // Desde Android 8 hace falta permiso explícito para instalar desde una
        // app concreta. Sin esto el instalador se abriría y no haría nada.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && !contexto.getPackageManager().canRequestPackageInstalls()) {
            Toast.makeText(contexto,
                    "Permite instalar apps desde HeraWallet para continuar", Toast.LENGTH_LONG).show();

            Intent permiso = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + contexto.getPackageName()));
            permiso.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            contexto.startActivity(permiso);
            return;
        }

        Uri uri = FileProvider.getUriForFile(
                contexto, contexto.getPackageName() + ".fileprovider", apk);

        Intent instalar = new Intent(Intent.ACTION_VIEW);
        instalar.setDataAndType(uri, "application/vnd.android.package-archive");
        instalar.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
        contexto.startActivity(instalar);
    }
}
