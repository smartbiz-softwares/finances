package app.herawallet.client;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

/**
 * Actividad principal.
 *
 * El WebView de Android deniega por defecto las peticiones de micrófono y
 * cámara que hace `getUserMedia()`, aunque la app tenga los permisos
 * concedidos en el sistema. Sin el enganche de abajo, el dictado por voz y el
 * Modo Live fallan en silencio: el navegador pide permiso, nadie responde y la
 * promesa se rechaza.
 */
public class MainActivity extends BridgeActivity {

    private static final int PERMISOS_MEDIOS = 1001;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        pedirPermisosDelSistema();

        // Puente para el widget: la web le entrega el token de sesión, que vive
        // en el localStorage del WebView y desde Java no se puede leer.
        getBridge().getWebView().addJavascriptInterface(new PuenteSesion(this), "HeraNativo");

        // Vibración de respuesta al tacto. El navigator.vibrate del WebView no
        // es fiable y no distingue intensidades.
        getBridge().getWebView().addJavascriptInterface(new Haptica(this), "HeraVibrar");

        // El WebView no descarga nada por su cuenta: un enlace con `download`
        // se queda en nada, sin progreso ni aviso. Se delega en el gestor de
        // descargas de Android, que sí muestra progreso y avisa al terminar.
        getBridge().getWebView().setDownloadListener(
                (url, agente, disposicion, tipo, tamano) -> {
                    if (!DescargaApp.descargar(this, url)) {
                        Toast.makeText(this, "No se pudo iniciar la descarga",
                                Toast.LENGTH_LONG).show();
                    }
                });

        // El WebView pregunta al contenedor si concede lo que pide la web.
        // Solo se conceden micrófono y cámara, y solo si el sistema ya nos los
        // otorgó a nosotros: así el usuario decide una vez, en el diálogo de
        // Android, y no una vez por cada llamada.
        getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    java.util.List<String> concedidos = new java.util.ArrayList<>();

                    for (String recurso : request.getResources()) {
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(recurso)
                                && tienePermiso(Manifest.permission.RECORD_AUDIO)) {
                            concedidos.add(recurso);
                        } else if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(recurso)
                                && tienePermiso(Manifest.permission.CAMERA)) {
                            concedidos.add(recurso);
                        }
                    }

                    if (concedidos.isEmpty()) {
                        // Denegar explícitamente evita que la web se quede
                        // esperando una respuesta que no llegaría nunca.
                        request.deny();
                    } else {
                        request.grant(concedidos.toArray(new String[0]));
                    }
                });
            }
        });
    }

    private boolean tienePermiso(String permiso) {
        return ContextCompat.checkSelfPermission(this, permiso) == PackageManager.PERMISSION_GRANTED;
    }

    /**
     * Pide micrófono y cámara al arrancar. Android los concede por diálogo del
     * sistema; el WebView solo puede repartir lo que la app ya tiene.
     */
    private void pedirPermisosDelSistema() {
        java.util.List<String> pendientes = new java.util.ArrayList<>();

        if (!tienePermiso(Manifest.permission.RECORD_AUDIO)) {
            pendientes.add(Manifest.permission.RECORD_AUDIO);
        }
        if (!tienePermiso(Manifest.permission.CAMERA)) {
            pendientes.add(Manifest.permission.CAMERA);
        }

        if (!pendientes.isEmpty()) {
            ActivityCompat.requestPermissions(this, pendientes.toArray(new String[0]), PERMISOS_MEDIOS);
        }
    }
}
