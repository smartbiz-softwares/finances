package app.herawallet.client;

import android.content.Context;
import android.os.Build;
import android.os.CombinedVibration;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.webkit.JavascriptInterface;

/**
 * Vibración de respuesta al tacto.
 *
 * Los pulsos son cortos y flojos a propósito. Una vibración larga se percibe
 * como un aviso —algo va mal, algo llega—, y aquí solo se está confirmando que
 * el dedo tocó donde quería. Las apps que se sienten bien vibran poco y breve.
 *
 * La web llama a esto por `HeraVibrar`: el `navigator.vibrate` del WebView no
 * es fiable y no distingue intensidades.
 */
public class Haptica {

    /** Confirmación de un toque. Lo más suave que se puede sentir. */
    public static final int TOQUE = 12;
    /** Algo empieza o termina: grabar, abrir una hoja. */
    public static final int PULSO = 22;
    /** Algo salió bien y merece notarse. */
    public static final int EXITO = 34;

    private final Context contexto;

    public Haptica(Context contexto) {
        this.contexto = contexto;
    }

    private static Vibrator vibrador(Context contexto) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager gestor =
                    (VibratorManager) contexto.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            return gestor == null ? null : gestor.getDefaultVibrator();
        }
        return (Vibrator) contexto.getSystemService(Context.VIBRATOR_SERVICE);
    }

    private static void vibrar(Context contexto, int milisegundos, int amplitud) {
        try {
            Vibrator v = vibrador(contexto);
            // Un teléfono sin motor no debe llegar aquí con un error.
            if (v == null || !v.hasVibrator()) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(VibrationEffect.createOneShot(milisegundos, amplitud));
            } else {
                v.vibrate(milisegundos);
            }
        } catch (Exception ignorado) {
            // La vibración es un adorno: nunca puede tumbar una acción.
        }
    }

    public static void toque(Context contexto) {
        vibrar(contexto, TOQUE, 60);
    }

    public static void pulsar(Context contexto) {
        vibrar(contexto, PULSO, 120);
    }

    public static void exito(Context contexto) {
        vibrar(contexto, EXITO, 170);
    }

    // --- Lo que llama la web -------------------------------------------------

    @JavascriptInterface
    public void toque() {
        toque(contexto);
    }

    @JavascriptInterface
    public void pulso() {
        pulsar(contexto);
    }

    @JavascriptInterface
    public void exito() {
        exito(contexto);
    }
}
