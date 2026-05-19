import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-10 text-center">
          <p className="text-5xl mb-4">⚠️</p>
          <h3 className="font-display font-bold text-xl text-foreground mb-2">
            Oups, quelque chose a planté
          </h3>
          <p className="font-body text-sm text-muted-foreground mb-6 max-w-xs">
            Cette section a rencontré une erreur inattendue. Notre équipe a été notifiée.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-primary text-white font-display font-bold text-sm py-3 px-6 rounded-xl"
          >
            🔄 Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
