import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Hyperlink ErrorBoundary caught an error:', error, errorInfo);
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && this.props.children !== prevProps.children) {
      this.setState({ hasError: false, error: null });
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-white shadow-xl max-w-md m-4">
          <div className="flex items-center gap-2.5 text-rose-400 mb-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              {this.props.fallbackTitle || 'Component Notice'}
            </h3>
          </div>
          <p className="text-xs text-rose-200/90 leading-relaxed mb-3">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recover View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
