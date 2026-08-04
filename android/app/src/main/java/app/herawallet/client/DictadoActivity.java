package app.herawallet.client;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.ComponentActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Base64;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Dictado desde el widget, sin abrir la app.
 *
 * Un widget no puede grabar audio: necesita una actividad. Esta se muestra como
 * una tarjeta pequeña sobre la pantalla de inicio, graba mientras se mantiene
 * pulsado, envía y se cierra sola. La sensación buscada es la de un walkie:
 * pulsar, hablar, soltar.
 *
 * El Modo Live sí abre la app: es una conversación, no un apunte suelto, y no
 * tiene sentido sostenerla desde una ventana flotante.
 */
public class DictadoActivity extends ComponentActivity {

    private static final int PERMISO_MICROFONO = 2001;
    private static final ExecutorService hilos = Executors.newSingleThreadExecutor();

    private MediaRecorder grabadora;
    private File archivo;
    private boolean grabando = false;
    private TextView estado;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // El Modo Live no se resuelve aquí: se delega en la app.
        if (WidgetHera.ACCION_LIVE.equals(getIntent().getAction())) {
            Intent app = new Intent(this, MainActivity.class);
            app.setData(Uri.parse("https://herawallet.app/?modo=live"));
            app.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(app);
            finish();
            return;
        }

        if (PuenteSesion.token(this) == null) {
            Toast.makeText(this, "Entra en HeraWallet para usar el dictado", Toast.LENGTH_LONG).show();
            finish();
            return;
        }

        setContentView(R.layout.actividad_dictado);
        estado = findViewById(R.id.dictado_estado);

        View boton = findViewById(R.id.dictado_boton);
        boton.setOnTouchListener((v, evento) -> {
            switch (evento.getActionMasked()) {
                case android.view.MotionEvent.ACTION_DOWN:
                    empezar();
                    return true;
                case android.view.MotionEvent.ACTION_UP:
                case android.view.MotionEvent.ACTION_CANCEL:
                    parar();
                    return true;
                default:
                    return false;
            }
        });

        findViewById(R.id.dictado_cerrar).setOnClickListener(v -> finish());

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.RECORD_AUDIO}, PERMISO_MICROFONO);
        }
    }

    private void empezar() {
        if (grabando) return;

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            estado.setText("Falta el permiso de micrófono");
            return;
        }

        try {
            archivo = new File(getCacheDir(), "dictado.m4a");

            grabadora = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                    ? new MediaRecorder(this)
                    : new MediaRecorder();

            grabadora.setAudioSource(MediaRecorder.AudioSource.MIC);
            grabadora.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            grabadora.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            // 16 kHz mono es lo que espera la transcripción; más resolución solo
            // engorda el envío por una red que puede ser lenta.
            grabadora.setAudioSamplingRate(16000);
            grabadora.setAudioChannels(1);
            grabadora.setOutputFile(archivo.getAbsolutePath());
            grabadora.prepare();
            grabadora.start();

            grabando = true;
            estado.setText("Escuchando…");
        } catch (Exception e) {
            estado.setText("No se pudo grabar");
            grabando = false;
        }
    }

    private void parar() {
        if (!grabando) return;
        grabando = false;

        try {
            grabadora.stop();
            grabadora.release();
            grabadora = null;
        } catch (Exception e) {
            estado.setText("No se pudo grabar");
            return;
        }

        if (archivo == null || archivo.length() < 2000) {
            // Menos de eso es un toque accidental, no una frase.
            estado.setText("Mantén pulsado y habla");
            return;
        }

        estado.setText("Enviando…");
        enviar();
    }

    private void enviar() {
        final File aEnviar = archivo;

        hilos.execute(() -> {
            String mensaje;
            try {
                byte[] audio = new byte[(int) aEnviar.length()];
                try (FileInputStream entrada = new FileInputStream(aEnviar)) {
                    int leidos = entrada.read(audio);
                    if (leidos <= 0) throw new Exception("audio vacío");
                }

                JSONObject cuerpo = new JSONObject();
                cuerpo.put("audio", Base64.getEncoder().encodeToString(audio));
                cuerpo.put("formato", "m4a");
                cuerpo.put("origen", "widget");

                URL url = new URL(PuenteSesion.servidor(this) + "/api/widget/dictado");
                HttpURLConnection conexion = (HttpURLConnection) url.openConnection();
                conexion.setRequestMethod("POST");
                conexion.setRequestProperty("Content-Type", "application/json");
                conexion.setRequestProperty("Authorization", "Bearer " + PuenteSesion.token(this));
                conexion.setDoOutput(true);
                conexion.setConnectTimeout(10000);
                conexion.setReadTimeout(30000);

                try (DataOutputStream salida = new DataOutputStream(conexion.getOutputStream())) {
                    salida.write(cuerpo.toString().getBytes("UTF-8"));
                }

                StringBuilder respuesta = new StringBuilder();
                boolean ok = conexion.getResponseCode() == 200;
                try (BufferedReader lector = new BufferedReader(new InputStreamReader(
                        ok ? conexion.getInputStream() : conexion.getErrorStream()))) {
                    String linea;
                    while ((linea = lector.readLine()) != null) respuesta.append(linea);
                }

                JSONObject datos = new JSONObject(respuesta.toString());
                mensaje = ok
                        ? datos.optString("mensaje", "Registrado")
                        : datos.optString("error", "No se pudo registrar");

                if (ok) WidgetHera.actualizarTodos(this);
            } catch (Exception e) {
                mensaje = "Sin conexión. Inténtalo luego.";
            }

            final String aMostrar = mensaje;
            new Handler(Looper.getMainLooper()).post(() -> {
                Toast.makeText(this, aMostrar, Toast.LENGTH_LONG).show();
                finish();
            });
        });
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Si la ventana pierde el foco a media grabación, se descarta: dejarla
        // viva en segundo plano grabaría sin que nadie lo sepa.
        if (grabando) {
            grabando = false;
            try {
                grabadora.stop();
                grabadora.release();
            } catch (Exception ignorado) {
            }
            grabadora = null;
        }
    }
}
