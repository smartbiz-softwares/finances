import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Red de seguridad para los errores de render.
 *
 * Un fallo dentro de un componente desmonta el árbol entero: React deja el
 * documento vacío y el usuario ve una pantalla negra sin explicación ni forma
 * de salir. Pasó en el panel con un "filter is not a function" cuando la sesión
 * de administrador caducaba.
 *
 * Aquí no se intenta arreglar nada: solo que siempre quede algo en pantalla y
 * una salida (recargar), y que el motivo se vea en la consola para poder
 * depurarlo.
 */
interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// El proyecto no instala @types/react, así que Component llega sin genéricos:
// props y state se declaran a mano para que TypeScript los vea.
export class PantallaDeError extends Component {
  declare props: Props;
  declare state: State;

  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[HeraWallet] Error de render:', error, info.componentStack);
  }

  private recargar = () => {
    // La sesión de administrador caducada es la causa conocida de que el panel
    // reventara; se descarta para que la recarga lleve al login y no al mismo
    // error otra vez.
    try {
      localStorage.removeItem('hera_admin_token');
    } catch {
      // Navegación privada o almacenamiento bloqueado: se recarga igual.
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-bg text-text-primary flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface border border-border rounded-3xl p-8 space-y-4 text-center shadow-xl">
          <h1 className="text-base font-bold">Algo se rompió al dibujar esta pantalla</h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            Tus datos están a salvo. Recarga para volver a empezar; si vuelve a pasar,
            el detalle del fallo está en la consola del navegador.
          </p>
          <p className="text-[11px] text-text-secondary/80 font-mono break-words">
            {this.state.error.message}
          </p>
          <button
            onClick={this.recargar}
            className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-medium rounded-2xl text-xs cursor-pointer transition-all"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
