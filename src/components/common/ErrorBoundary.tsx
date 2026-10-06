import { Component, ErrorInfo, ReactNode } from 'react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('Uncaught error in ClassQue App:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('classque_teacher_os_v1');
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const id = useTeacherStore.getState().language === 'id';
      return (
        <div className="min-h-screen bg-(--app-bg) flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-stone-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-stone-900">{id ? 'Terjadi kesalahan' : 'Something went wrong'}</h2>
              <p className="text-xs text-stone-500 mt-1">
                {id ? 'Aplikasi mengalami kondisi tak terduga. Klik tombol di bawah untuk mengatur ulang cache lokal.' : 'The application encountered an unexpected state. Click below to reset local cache.'}
              </p>
            </div>
            {this.state.error && (
              <pre className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] font-mono text-stone-700 text-left overflow-x-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-3 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{id ? 'Atur Ulang & Muat Ulang Aplikasi' : 'Reset & Reload App'}</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
