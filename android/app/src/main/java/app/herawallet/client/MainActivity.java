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

    /** Avisa de que el widget dejó algo dictado esperando confirmación. */
    public static final String EXTRA_DICTADO = "hera_dictado";

    /** Callback del <input type="file"> mientras el usuario elige. */
    private android.webkit.ValueCallback<android.net.Uri[]> seleccionPendiente;

    private final androidx.activity.result.ActivityResultLauncher<android.content.Intent> seleccionArchivos =
            registerForActivityResult(
                    new androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult(),
                    resultado -> {
                        if (seleccionPendiente == null) return;
                        seleccionPendiente.onReceiveValue(
                                android.webkit.WebChromeClient.FileChooserParams.parseResult(
                                        resultado.getResultCode(), resultado.getData()));
                        seleccionPendiente = null;
                    });

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

        // Actualización sin salir de la app: descarga, avance real e instalación.
        getBridge().getWebView().addJavascriptInterface(
                new PuenteActualizacion(this, getBridge().getWebView()), "HeraActualizar");

        // Compartir imágenes: navigator.share con archivos no funciona en el
        // WebView, y sin esto el compartir acababa como una descarga fallida.
        getBridge().getWebView().addJavascriptInterface(new PuenteCompartir(this), "HeraCompartir");

        // El WebView no descarga nada por su cuenta: un enlace con `download`
        // se queda en nada, sin progreso ni aviso. Se delega en el gestor de
        // descargas de Android, que sí muestra progreso y avisa al terminar.
        getBridge().getWebView().setDownloadListener(
                (url, agente, disposicion, tipo, tamano) -> {
                    // Los blob: y data: son archivos que la propia app acaba de
                    // fabricar —una imagen para compartir, por ejemplo—. El
                    // gestor de descargas no los entiende, y mandárselos daba un
                    // "no se pudo iniciar la descarga" cuando lo que se quería
                    // era otra cosa.
                    if (url == null || url.startsWith("blob:") || url.startsWith("data:")) return;

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

            /**
             * Sin esto, un <input type="file"> no abre nada: el WebView no trae
             * selector propio. Era el motivo de que no se pudiera adjuntar un
             * archivo en el chat.
             */
            @Override
            public boolean onShowFileChooser(android.webkit.WebView vista,
                                             android.webkit.ValueCallback<android.net.Uri[]> callback,
                                             FileChooserParams parametros) {
                // Si quedaba uno pendiente se cancela: dejarlo colgado bloquea
                // el campo para siempre.
                if (seleccionPendiente != null) seleccionPendiente.onReceiveValue(null);
                seleccionPendiente = callback;

                try {
                    seleccionArchivos.launch(parametros.createIntent());
                    return true;
                } catch (Exception e) {
                    seleccionPendiente = null;
                    return false;
                }
            }
        });
    }

    /**
     * La app ya estaba abierta y el widget manda algo dictado.
     *
     * Como es `singleTask`, aquí no se recrea nada ni se recarga la página: el
     * WebView sigue exactamente donde estaba. Por eso se le entrega como evento,
     * que es lo único que la web puede oír sin volver a montarse.
     */
    @Override
    protected void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        if (intent == null || !intent.getBooleanExtra(EXTRA_DICTADO, false)) return;

        String json = PuenteSesion.recogerDictado(this);
        if (json == null) return;

        // Como texto JSON: así el contenido dictado no puede romper la
        // expresión ni colarse como código.
        String literal = org.json.JSONObject.quote(json);
        runOnUiThread(() -> getBridge().getWebView().evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('hera:dictado',{detail:" + literal + "}))",
                null));
    }

    private boolean tienePermiso(String permiso) {
        return ContextCompat.checkSelfPermission(this, permiso) == PackageManager.PERMISSION_GRANTED;
    }

    /**
     * Pide de una vez todos los permisos que la app necesita.
     *
     * Van juntos a propósito: dos llamadas seguidas a `requestPermissions` en el
     * mismo arranque hacen que Android descarte la segunda sin llegar a
     * mostrarla, y era el motivo de que el de notificaciones no apareciera
     * nunca.
     *
     * Android los presenta uno detrás de otro, y negar alguno no impide usar el
     * resto de la app: sin micrófono se sigue escribiendo, sin notificaciones se
     * usa igual.
     */
    private void pedirPermisosDelSistema() {
        java.util.List<String> pendientes = new java.util.ArrayList<>();

        if (!tienePermiso(Manifest.permission.RECORD_AUDIO)) {
            pendientes.add(Manifest.permission.RECORD_AUDIO);
        }
        if (!tienePermiso(Manifest.permission.CAMERA)) {
            pendientes.add(Manifest.permission.CAMERA);
        }

        // Desde Android 13 las notificaciones necesitan permiso explícito; sin
        // él el sistema las descarta en silencio y no hay forma de saber por qué
        // no llegan.
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            if (!tienePermiso("android.permission.POST_NOTIFICATIONS")) {
                pendientes.add("android.permission.POST_NOTIFICATIONS");
            }
            if (!tienePermiso("android.permission.READ_MEDIA_IMAGES")) {
                pendientes.add("android.permission.READ_MEDIA_IMAGES");
            }
        } else if (!tienePermiso(Manifest.permission.READ_EXTERNAL_STORAGE)) {
            pendientes.add(Manifest.permission.READ_EXTERNAL_STORAGE);
        }

        if (!pendientes.isEmpty()) {
            ActivityCompat.requestPermissions(this, pendientes.toArray(new String[0]), PERMISOS_MEDIOS);
        }
    }
}
