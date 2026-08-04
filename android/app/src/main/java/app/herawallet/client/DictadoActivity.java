package app.herawallet.client;

import android.Manifest;
import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.MotionEvent;
import android.view.View;
import android.view.animation.LinearInterpolator;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
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
 * Extiende AppCompatActivity y no ComponentActivity: el tema es un
 * `Theme.AppCompat`, y con una actividad que no lo sea la pantalla ni siquiera
 * llega a montarse. Ese era el motivo de que el botón no grabara nada.
 *
 * Se mantiene pulsado para hablar, como un walkie. El aro que rodea el botón
 * late mientras graba: sin esa señal no hay forma de saber si el micrófono está
 * abierto, y la gente suelta antes de tiempo.
 */
public class DictadoActivity extends AppCompatActivity {

    private static final int PERMISO_MICROFONO = 2001;
    private static final ExecutorService hilos = Executors.newSingleThreadExecutor();

    private MediaRecorder grabadora;
    private File archivo;
    private boolean grabando = false;
    private boolean enviando = false;

    private TextView estado;
    private TextView ayuda;
    private View boton;
    private View aro;
    private ObjectAnimator latido;
    private long inicioGrabacion;

    // Campos del paso de confirmación.
    private EditText importe;
    private EditText categoria;
    private EditText descripcion;
    private boolean esIngreso = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // El Modo Live es una conversación: se delega en la app.
        if (WidgetHera.ACCION_LIVE.equals(getIntent().getAction())) {
            Intent app = new Intent(this, MainActivity.class);
            app.setData(Uri.parse(PuenteSesion.servidor(this) + "/?modo=live"));
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
        ayuda = findViewById(R.id.dictado_ayuda);
        boton = findViewById(R.id.dictado_boton);
        aro = findViewById(R.id.dictado_aro);

        boton.setOnTouchListener((v, evento) -> {
            switch (evento.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    empezar();
                    return true;
                case MotionEvent.ACTION_UP:
                case MotionEvent.ACTION_CANCEL:
                    v.performClick();
                    parar();
                    return true;
                default:
                    return false;
            }
        });

        findViewById(R.id.dictado_cerrar).setOnClickListener(v -> finish());

        // Tocar fuera de la tarjeta cierra, como cualquier hoja del sistema.
        // Salvo con la confirmación abierta: ahí un roce perdería lo dictado.
        findViewById(R.id.dictado_fondo).setOnClickListener(v -> {
            if (findViewById(R.id.bloque_confirmar).getVisibility() != View.VISIBLE) finish();
        });

        if (!tienePermiso()) {
            estado.setText("Necesito el micrófono");
            ayuda.setText("Concede el permiso para poder dictar");
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.RECORD_AUDIO}, PERMISO_MICROFONO);
        }
    }

    private boolean tienePermiso() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int codigo, @NonNull String[] permisos,
                                           @NonNull int[] resultados) {
        super.onRequestPermissionsResult(codigo, permisos, resultados);
        if (codigo != PERMISO_MICROFONO) return;

        if (resultados.length > 0 && resultados[0] == PackageManager.PERMISSION_GRANTED) {
            estado.setText("Mantén pulsado y habla");
            ayuda.setText("Di el gasto y Hera lo anota");
        } else {
            estado.setText("Sin micrófono no puedo escucharte");
            ayuda.setText("Puedes concederlo en los ajustes del teléfono");
        }
    }

    private void empezar() {
        if (grabando || enviando) return;

        if (!tienePermiso()) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.RECORD_AUDIO}, PERMISO_MICROFONO);
            return;
        }

        try {
            archivo = new File(getCacheDir(), "dictado.m4a");
            if (archivo.exists()) archivo.delete();

            grabadora = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                    ? new MediaRecorder(this)
                    : new MediaRecorder();

            grabadora.setAudioSource(MediaRecorder.AudioSource.MIC);
            grabadora.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            grabadora.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            // 16 kHz mono es lo que espera la transcripción; más resolución solo
            // engorda el envío por una red que puede ser lenta.
            grabadora.setAudioSamplingRate(16000);
            grabadora.setAudioEncodingBitRate(64000);
            grabadora.setAudioChannels(1);
            grabadora.setOutputFile(archivo.getAbsolutePath());
            grabadora.prepare();
            grabadora.start();

            grabando = true;
            inicioGrabacion = System.currentTimeMillis();

            Haptica.pulsar(this);
            estado.setText("Escuchando…");
            ayuda.setText("Suelta cuando termines");
            animarAro(true);
        } catch (Exception e) {
            grabando = false;
            estado.setText("No se pudo abrir el micrófono");
            ayuda.setText("Puede estar en uso por otra app");
            liberar();
        }
    }

    private void parar() {
        if (!grabando) return;
        grabando = false;
        animarAro(false);

        // Menos de medio segundo no es una frase, es un toque sin querer.
        boolean muyCorto = System.currentTimeMillis() - inicioGrabacion < 500;

        try {
            grabadora.stop();
        } catch (Exception e) {
            // Parar antes de que llegue a grabar nada lanza excepción; el
            // archivo queda inservible y se descarta.
            muyCorto = true;
        } finally {
            liberar();
        }

        if (muyCorto || archivo == null || archivo.length() < 1500) {
            estado.setText("Mantén pulsado mientras hablas");
            ayuda.setText("Suéltalo solo al terminar la frase");
            return;
        }

        Haptica.pulsar(this);
        enviando = true;
        estado.setText("Enviando…");
        ayuda.setText("Un momento");
        enviar();
    }

    private void liberar() {
        if (grabadora == null) return;
        try {
            grabadora.release();
        } catch (Exception ignorado) {
        }
        grabadora = null;
    }

    /** El aro late mientras se graba, para que se vea que está escuchando. */
    private void animarAro(boolean encender) {
        if (latido != null) {
            latido.cancel();
            latido = null;
        }

        if (!encender) {
            aro.setAlpha(0f);
            aro.setScaleX(1f);
            aro.setScaleY(1f);
            return;
        }

        aro.setAlpha(1f);
        latido = ObjectAnimator.ofPropertyValuesHolder(aro,
                android.animation.PropertyValuesHolder.ofFloat("scaleX", 1f, 1.35f),
                android.animation.PropertyValuesHolder.ofFloat("scaleY", 1f, 1.35f),
                android.animation.PropertyValuesHolder.ofFloat("alpha", 0.85f, 0f));
        latido.setDuration(1100);
        latido.setRepeatCount(ValueAnimator.INFINITE);
        latido.setInterpolator(new LinearInterpolator());
        latido.start();
    }

    private void enviar() {
        final File aEnviar = archivo;

        hilos.execute(() -> {
            String mensaje;
            boolean correcto = false;

            try {
                byte[] audio = new byte[(int) aEnviar.length()];
                try (FileInputStream entrada = new FileInputStream(aEnviar)) {
                    if (entrada.read(audio) <= 0) throw new Exception("audio vacío");
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
                conexion.setReadTimeout(45000);

                try (DataOutputStream salida = new DataOutputStream(conexion.getOutputStream())) {
                    salida.write(cuerpo.toString().getBytes("UTF-8"));
                }

                boolean ok = conexion.getResponseCode() == 200;
                StringBuilder respuesta = new StringBuilder();
                try (BufferedReader lector = new BufferedReader(new InputStreamReader(
                        ok ? conexion.getInputStream() : conexion.getErrorStream()))) {
                    String linea;
                    while ((linea = lector.readLine()) != null) respuesta.append(linea);
                }

                JSONObject datos = new JSONObject(respuesta.toString());
                mensaje = ok ? datos.optString("mensaje", "Listo")
                             : datos.optString("error", "No se pudo procesar");
                correcto = ok;

                if (ok) {
                    // Lo dictado no se registra a ciegas: se enseña lo entendido
                    // para confirmarlo o corregirlo. Un micrófono en la calle se
                    // equivoca, y un ingreso donde iba un gasto cuesta más de
                    // arreglar que de confirmar.
                    JSONObject movimiento = datos.optJSONObject("movimiento");
                    final String dicho = datos.optString("transcripcion", "");

                    if (movimiento != null) {
                        final JSONObject entendido = movimiento;
                        new Handler(Looper.getMainLooper()).post(
                                () -> mostrarConfirmacion(entendido, dicho));
                        return;
                    }

                    // Sin cifra reconocible no hay nada que confirmar: se pasa a
                    // la app, que es donde hay teclado y contexto para rematarlo.
                    abrirConfirmacion(new JSONObject().put("texto", dicho).toString());
                    return;
                }
            } catch (Exception e) {
                mensaje = "Sin conexión. Inténtalo desde la app.";
            }

            final String aMostrar = mensaje;
            final boolean fueBien = correcto;

            new Handler(Looper.getMainLooper()).post(() -> {
                if (fueBien) Haptica.exito(this);
                Toast.makeText(this, aMostrar, Toast.LENGTH_LONG).show();
                finish();
            });
        });
    }

    /**
     * Enseña lo entendido para revisarlo, sin salir de la hoja.
     *
     * Aquí, y no en la app: el sentido del widget es anotar un gasto sin abrir
     * nada. Mandar a la app solo para pulsar "guardar" deshacía justo eso.
     */
    private void mostrarConfirmacion(JSONObject movimiento, String dicho) {
        enviando = false;
        Haptica.exito(this);

        findViewById(R.id.bloque_grabar).setVisibility(View.GONE);
        View panel = findViewById(R.id.bloque_confirmar);
        panel.setVisibility(View.VISIBLE);

        TextView loDicho = findViewById(R.id.confirmar_dicho);
        loDicho.setText(dicho.isEmpty() ? "" : "«" + dicho + "»");
        loDicho.setVisibility(dicho.isEmpty() ? View.GONE : View.VISIBLE);

        importe = findViewById(R.id.confirmar_importe);
        categoria = findViewById(R.id.confirmar_categoria);
        descripcion = findViewById(R.id.confirmar_descripcion);

        double cantidad = movimiento.optDouble("amount", 0);
        // Sin decimales si son cero: escribir encima de "20" es más rápido que
        // sobre "20.00", y esto se corrige de pie en la calle.
        importe.setText(cantidad == Math.floor(cantidad)
                ? String.valueOf((long) cantidad)
                : String.valueOf(cantidad));
        categoria.setText(movimiento.optString("category", ""));
        descripcion.setText(movimiento.optString("description", dicho));

        esIngreso = "income".equals(movimiento.optString("type"));
        pintarTipo();

        findViewById(R.id.confirmar_gasto).setOnClickListener(v -> {
            esIngreso = false;
            Haptica.pulsar(this);
            pintarTipo();
        });
        findViewById(R.id.confirmar_ingreso).setOnClickListener(v -> {
            esIngreso = true;
            Haptica.pulsar(this);
            pintarTipo();
        });

        findViewById(R.id.confirmar_guardar).setOnClickListener(v -> guardar());

        findViewById(R.id.confirmar_repetir).setOnClickListener(v -> {
            Haptica.pulsar(this);
            panel.setVisibility(View.GONE);
            findViewById(R.id.bloque_grabar).setVisibility(View.VISIBLE);
            estado.setText("Mantén pulsado y habla");
            ayuda.setText("Di el gasto y Hera lo anota");
        });
    }

    /** El lado elegido se ve lleno; el otro, apagado. */
    private void pintarTipo() {
        TextView gasto = findViewById(R.id.confirmar_gasto);
        TextView ingreso = findViewById(R.id.confirmar_ingreso);

        gasto.setBackgroundResource(esIngreso ? R.drawable.pestana_inactiva : R.drawable.pestana_activa);
        gasto.setTextColor(esIngreso ? 0xFFB4AEA8 : 0xFF1A1815);

        ingreso.setBackgroundResource(esIngreso ? R.drawable.pestana_activa : R.drawable.pestana_inactiva);
        ingreso.setTextColor(esIngreso ? 0xFF1A1815 : 0xFFB4AEA8);
    }

    /** Registra el movimiento con lo que haya en los campos. */
    private void guardar() {
        if (enviando) return;

        double cantidad;
        try {
            cantidad = Double.parseDouble(importe.getText().toString().replace(',', '.'));
        } catch (Exception e) {
            cantidad = 0;
        }
        if (cantidad <= 0) {
            importe.requestFocus();
            Toast.makeText(this, "Pon un importe", Toast.LENGTH_SHORT).show();
            return;
        }

        enviando = true;
        Haptica.pulsar(this);
        TextView boton = findViewById(R.id.confirmar_guardar);
        boton.setText("Guardando…");

        final double total = cantidad;
        final String cat = categoria.getText().toString().trim();
        final String desc = descripcion.getText().toString().trim();
        final boolean ingreso = esIngreso;

        hilos.execute(() -> {
            String error = null;
            try {
                JSONObject cuerpo = new JSONObject();
                cuerpo.put("type", ingreso ? "income" : "expense");
                cuerpo.put("amount", total);
                cuerpo.put("category", cat.isEmpty() ? (ingreso ? "Ingresos" : "Varios") : cat);
                cuerpo.put("description", desc);

                // Sin accountId: el servidor usa la primera cuenta del usuario,
                // que desde el widget es la única elección razonable.
                URL url = new URL(PuenteSesion.servidor(this) + "/api/finance/transactions");
                HttpURLConnection conexion = (HttpURLConnection) url.openConnection();
                conexion.setRequestMethod("POST");
                conexion.setRequestProperty("Content-Type", "application/json");
                conexion.setRequestProperty("Authorization", "Bearer " + PuenteSesion.token(this));
                conexion.setDoOutput(true);
                conexion.setConnectTimeout(10000);
                conexion.setReadTimeout(20000);

                try (DataOutputStream salida = new DataOutputStream(conexion.getOutputStream())) {
                    salida.write(cuerpo.toString().getBytes("UTF-8"));
                }

                if (conexion.getResponseCode() != 200) error = "No se pudo guardar";
            } catch (Exception e) {
                error = "Sin conexión";
            }

            final String fallo = error;
            new Handler(Looper.getMainLooper()).post(() -> {
                if (fallo != null) {
                    enviando = false;
                    boton.setText("Guardar");
                    Toast.makeText(this, fallo, Toast.LENGTH_LONG).show();
                    return;
                }

                Haptica.exito(this);
                // El widget muestra los gastos de hoy: sin esto seguiría con la
                // cifra de antes hasta el siguiente refresco, que puede tardar
                // media hora.
                WidgetHera.actualizarTodos(this);
                Toast.makeText(this,
                        (ingreso ? "Ingreso" : "Gasto") + " registrado", Toast.LENGTH_SHORT).show();
                finish();
            });
        });
    }

    /**
     * Abre la app con lo dictado, para confirmarlo o corregirlo.
     *
     * Antes esto viajaba como parámetro en la URL del Intent, y no llegaba
     * nunca: la app carga la dirección fijada en la configuración de Capacitor,
     * así que el WebView jamás veía ese `?dictado=`. Además MainActivity es
     * `singleTask`, de modo que con la app ya abierta ni siquiera se recarga.
     *
     * Ahora se deja en las preferencias y se avisa por el Intent: si la app
     * arranca de cero, la web lo recoge al montar; si ya estaba abierta,
     * MainActivity se lo lanza como evento.
     */
    private void abrirConfirmacion(String json) {
        new Handler(Looper.getMainLooper()).post(() -> {
            Haptica.exito(this);
            try {
                PuenteSesion.guardarDictado(this, json);
                Intent app = new Intent(this, MainActivity.class);
                app.putExtra(MainActivity.EXTRA_DICTADO, true);
                app.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                startActivity(app);
            } catch (Exception e) {
                Toast.makeText(this, "Ábrelo en la app para completarlo", Toast.LENGTH_LONG).show();
            }
            finish();
        });
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Si la ventana pierde el foco a media grabación se descarta: dejar el
        // micrófono abierto en segundo plano sin que nadie lo sepa no vale.
        if (grabando) {
            grabando = false;
            animarAro(false);
            try {
                grabadora.stop();
            } catch (Exception ignorado) {
            }
            liberar();
        }
    }
}
