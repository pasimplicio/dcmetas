import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Dashboard Crash Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-[var(--bg-surface)] rounded-[2.5rem] border-2 border-red-500/20 shadow-2xl">
          <div className="bg-red-500/10 p-6 rounded-3xl mb-6 text-red-500">
            <AlertTriangle size={48} />
          </div>
          <h2 className="text-2xl font-black text-[var(--text-main)] heading-text mb-2">Ops! Algo deu errado.</h2>
          <p className="text-[var(--text-muted)] mb-8 max-w-md">
            Houve um erro ao processar os dados deste painel. Tente recarregar a página ou limpar a base de dados.
          </p>
          <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/20 mb-8 w-full max-w-lg overflow-auto">
             <code className="text-xs text-red-400 font-mono">
                {this.state.error?.toString()}
             </code>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black transition-all shadow-xl shadow-brand-500/20"
          >
            <RefreshCw size={20} />
            Recarregar Aplicativo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
