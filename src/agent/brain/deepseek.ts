/**
 * Llamadas a DeepSeek con reintentos.
 *
 * En producción se vio una racha de `503` seguida de llamadas correctas: el
 * proveedor se satura a ratos. Sin reintento, cada uno de esos huecos le llega
 * al usuario como "ocurrió una interrupción en el servidor de inteligencia
 * financiera" y el chat parece roto aunque el servicio esté vivo.
 *
 * Se reintenta solo lo que tiene sentido reintentar: saturación (429), fallos
 * de servidor (5xx) y cortes de red. Un 401 (clave mala) o un 402 (saldo
 * agotado) no mejoran esperando, así que salen a la primera.
 */

const URL_CHAT = 'https://api.deepseek.com/chat/completions';

/** Esperas entre intentos. La longitud marca cuántos reintentos hay. */
const ESPERAS_MS = [500, 1500, 4000];

/** Corte por intento: más allá, el usuario ya dio la respuesta por perdida. */
const LIMITE_MS = 60_000;

export class ErrorDeepSeek extends Error {
  /** Código HTTP, o 0 si ni siquiera hubo respuesta. */
  readonly status: number;
  /** Cuerpo devuelto por el proveedor, recortado. */
  readonly detalle: string;

  constructor(status: number, detalle: string) {
    super(`DeepSeek API error status: ${status}`);
    this.name = 'ErrorDeepSeek';
    this.status = status;
    this.detalle = detalle;
  }

  /**
   * Qué contarle al usuario. El motivo real va al log; aquí solo lo que puede
   * accionar por su cuenta.
   */
  get mensajeParaUsuario(): string {
    if (this.status === 401 || this.status === 403)
      return 'El servicio de inteligencia financiera no está configurado correctamente. Avísanos y lo revisamos.';
    if (this.status === 402)
      return 'El servicio de inteligencia financiera está temporalmente fuera de servicio. Estamos en ello.';
    if (this.status === 429)
      return 'Hay mucha demanda ahora mismo. Espera unos segundos y vuelve a intentarlo.';
    return 'El servicio de inteligencia financiera no responde en este momento. Inténtalo de nuevo en un minuto.';
  }
}

const dormir = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Un 429 o un 5xx puede irse solo; el resto, no. */
const merecePena = (status: number) => status === 429 || status >= 500;

/**
 * Llama a DeepSeek reintentando los fallos pasajeros.
 *
 * @param cuerpo  Payload tal cual lo espera la API (model, messages, tools...).
 * @param apiKey  Clave; se recorta por si viene con espacios de la config.
 * @throws ErrorDeepSeek si se agotan los intentos o el fallo no es reintentable.
 */
export async function llamarDeepSeek(cuerpo: any, apiKey: string): Promise<any> {
  let ultimo: ErrorDeepSeek | null = null;

  for (let intento = 0; intento <= ESPERAS_MS.length; intento++) {
    if (intento > 0) {
      const espera = ESPERAS_MS[intento - 1];
      console.warn(`[DeepSeek] Reintento ${intento} tras ${ultimo?.status} — esperando ${espera}ms`);
      await dormir(espera);
    }

    try {
      const respuesta = await fetch(URL_CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(LIMITE_MS)
      });

      if (respuesta.ok) return await respuesta.json();

      // El cuerpo del error trae el motivo real ("Insufficient Balance",
      // "Model Not Exist"...). Sin él, un 400 es indistinguible de otro.
      const detalle = await respuesta.text().catch(() => '').then(t => t.slice(0, 300));
      ultimo = new ErrorDeepSeek(respuesta.status, detalle);

      if (!merecePena(respuesta.status)) throw ultimo;
    } catch (err: any) {
      if (err instanceof ErrorDeepSeek) {
        // Ya decidido arriba: si no merecía reintento, sale.
        if (!merecePena(err.status)) throw err;
        ultimo = err;
      } else {
        // Red caída, DNS, timeout: pasajero por definición.
        ultimo = new ErrorDeepSeek(0, String(err?.message ?? err));
      }
    }
  }

  console.error(`[DeepSeek] Agotados los reintentos: ${ultimo?.status} ${ultimo?.detalle}`);
  throw ultimo ?? new ErrorDeepSeek(0, 'sin respuesta');
}
