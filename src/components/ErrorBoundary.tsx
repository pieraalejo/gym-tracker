import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-5xl">💥</p>
        <p className="font-pixel text-accent" style={{ fontSize: '12px' }}>
          ALGO SALIÓ MAL
        </p>
        <p className="text-textMuted text-sm max-w-sm">
          La app encontró un error inesperado. Probá recargar la página.
        </p>
        <pre className="text-xs text-textMuted bg-surface p-3 rounded-lg max-w-sm overflow-auto">
          {this.state.error.message}
        </pre>
        <div className="flex gap-2">
          <button
            onClick={this.reset}
            className="bg-surface border border-border text-textPrimary font-pixel px-4 py-2 rounded-lg"
            style={{ fontSize: '9px' }}
          >
            REINTENTAR
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-accent text-background font-pixel px-4 py-2 rounded-lg"
            style={{ fontSize: '9px' }}
          >
            RECARGAR
          </button>
        </div>
      </div>
    );
  }
}
