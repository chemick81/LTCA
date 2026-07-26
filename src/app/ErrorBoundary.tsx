import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Attrape les erreurs de rendu React et affiche un écran propre au lieu d'une page blanche. */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erreur non gérée capturée par ErrorBoundary :', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
          <AlertTriangle className="h-10 w-10 text-primary" />
          <p className="text-lg font-semibold text-foreground">Une erreur inattendue est survenue.</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Essaie de recharger la page. Si le problème persiste, contacte le support.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Recharger la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
