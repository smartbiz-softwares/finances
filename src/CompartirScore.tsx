import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { IconoAnimado, IconoWhatsapp, IconoHecho } from './iconos';

/**
 * Tarjeta compartible del Score Hera.
 *
 * La imagen se dibuja en un canvas y no con una captura de pantalla: así sale
 * igual en todos los teléfonos, pesa poco y no arrastra la interfaz —barras,
 * menús, el saldo real— a una imagen que va a acabar en un grupo de WhatsApp.
 *
 * Por lo mismo, la tarjeta enseña el Score y nada más. Ni saldos, ni cuentas,
 * ni categorías: compartir dinero por accidente no tiene vuelta atrás.
 */

interface Props {
  score: number;
  desglose?: { label: string; pts: number; max: number }[];
  nombre?: string;
}

const ANCHO = 1080;
const ALTO = 1350; // 4:5, que es lo que no recorta ninguna red social

/** Redondea un rectángulo; `roundRect` no existe en todos los navegadores. */
function rectangulo(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function dibujar(canvas: HTMLCanvasElement, props: Props) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = ANCHO;
  canvas.height = ALTO;

  const { score, desglose = [], nombre } = props;
  const marca = '#D97757';

  ctx.fillStyle = '#20201F';
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Resplandor detrás del número, para que el ojo caiga ahí primero.
  const halo = ctx.createRadialGradient(ANCHO / 2, 520, 40, ANCHO / 2, 520, 420);
  halo.addColorStop(0, 'rgba(217,119,87,0.22)');
  halo.addColorStop(1, 'rgba(217,119,87,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 100, ANCHO, 840);

  ctx.textAlign = 'center';

  ctx.fillStyle = marca;
  ctx.font = '600 30px Inter, system-ui, sans-serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('SCORE HERA', ANCHO / 2, 190);
  ctx.letterSpacing = '0px';

  // El aro de progreso: 100 puntos es la vuelta completa.
  const cx = ANCHO / 2;
  const cy = 520;
  const radio = 210;

  ctx.lineWidth = 26;
  ctx.strokeStyle = '#2C2C2A';
  ctx.beginPath();
  ctx.arc(cx, cy, radio, 0, Math.PI * 2);
  ctx.stroke();

  const proporcion = Math.max(0, Math.min(100, score)) / 100;
  ctx.strokeStyle = score >= 75 ? '#5DAF84' : score >= 50 ? marca : '#E2B04C';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, radio, -Math.PI / 2, -Math.PI / 2 + proporcion * Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ECE7E1';
  ctx.font = '700 190px Inter, system-ui, sans-serif';
  ctx.fillText(String(Math.round(score)), cx, cy + 62);

  ctx.fillStyle = '#8B857E';
  ctx.font = '400 34px Inter, system-ui, sans-serif';
  ctx.fillText('de 100', cx, cy + 122);

  // Una frase que dé contexto: un número suelto no dice nada a quien lo ve.
  ctx.fillStyle = '#B4AEA8';
  ctx.font = '400 36px Inter, system-ui, sans-serif';
  const frase = score >= 85 ? 'Mis finanzas están bajo control'
    : score >= 70 ? 'Voy por buen camino'
    : score >= 50 ? 'Estoy poniendo orden en mis cuentas'
    : 'Empezando a ordenar mis finanzas';
  ctx.fillText(nombre ? `${frase}, ${nombre}` : frase, cx, 830);

  // Los tres pilares más fuertes, como prueba de que el número sale de algo.
  const mejores = [...desglose].sort((a, b) => (b.pts / b.max) - (a.pts / a.max)).slice(0, 3);
  const anchoCaja = 280;
  const separacion = 30;
  const totalAncho = mejores.length * anchoCaja + (mejores.length - 1) * separacion;
  let x = (ANCHO - totalAncho) / 2;

  for (const pilar of mejores) {
    ctx.fillStyle = '#2C2C2A';
    rectangulo(ctx, x, 900, anchoCaja, 150, 24);
    ctx.fill();

    ctx.fillStyle = marca;
    ctx.font = '700 46px Inter, system-ui, sans-serif';
    ctx.fillText(`${pilar.pts}/${pilar.max}`, x + anchoCaja / 2, 965);

    ctx.fillStyle = '#8B857E';
    ctx.font = '400 22px Inter, system-ui, sans-serif';
    const etiqueta = pilar.label.length > 22 ? `${pilar.label.slice(0, 20)}…` : pilar.label;
    ctx.fillText(etiqueta, x + anchoCaja / 2, 1005);

    x += anchoCaja + separacion;
  }

  ctx.fillStyle = '#ECE7E1';
  ctx.font = '600 44px Inter, system-ui, sans-serif';
  ctx.fillText('HeraWallet', cx, 1215);

  ctx.fillStyle = '#8B857E';
  ctx.font = '400 30px Inter, system-ui, sans-serif';
  ctx.fillText('herawallet.app', cx, 1262);
}

export const CompartirScore: React.FC<Props> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [estado, setEstado] = useState<'listo' | 'trabajando' | 'hecho'>('listo');

  const generar = (): Promise<Blob | null> =>
    new Promise((resolver) => {
      const canvas = canvasRef.current;
      if (!canvas) return resolver(null);
      dibujar(canvas, props);
      canvas.toBlob((b) => resolver(b), 'image/png', 0.92);
    });

  const compartir = async () => {
    setEstado('trabajando');
    try {
      const imagen = await generar();
      if (!imagen) throw new Error();

      const archivo = new File([imagen], 'mi-score-hera.png', { type: 'image/png' });
      const texto = `Mi Score Hera es ${Math.round(props.score)}/100. Llevo mis cuentas con HeraWallet: le hablas y ella las anota.`;

      // Compartir el archivo solo funciona en móvil; en escritorio se descarga,
      // que es lo que se puede hacer allí.
      if (navigator.canShare?.({ files: [archivo] })) {
        await navigator.share({
          files: [archivo],
          text: texto,
          url: 'https://herawallet.app',
        });
      } else {
        const url = URL.createObjectURL(imagen);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'mi-score-hera.png';
        enlace.click();
        URL.revokeObjectURL(url);
      }

      setEstado('hecho');
      setTimeout(() => setEstado('listo'), 2200);
    } catch {
      // Cancelar la hoja de compartir no es un error.
      setEstado('listo');
    }
  };

  return (
    <>
      {/* El canvas nunca se muestra: solo sirve para fabricar la imagen. */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      <motion.button
        type="button"
        onClick={compartir}
        disabled={estado === 'trabajando'}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 rounded-2xl bg-surface border border-border hover:border-brand/40 text-xs font-medium text-text-primary flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
      >
        {estado === 'hecho'
          ? <><IconoAnimado icono={IconoHecho} size={15} activo /> Listo</>
          : <><IconoAnimado icono={IconoWhatsapp} size={15} /> {estado === 'trabajando' ? 'Preparando…' : 'Compartir mi Score'}</>}
      </motion.button>
    </>
  );
};
