import React from 'react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast, language } = useTeacherStore();

  if (toasts.length === 0) return null;

  return (
    <div role="status" aria-live="polite" className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 sm:max-w-sm sm:w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-4 bg-white border border-stone-200 shadow-lg rounded-xl animate-in slide-in-from-bottom-5 fade-in duration-300"
        >
          {toast.type === 'info' && <Info className="w-5 h-5 text-teal-600 shrink-0" />}
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />}
          
          <p className="text-sm text-stone-800 font-medium flex-1">{toast.message}</p>

          {toast.action && (
            <button
              onClick={() => { toast.action!.onClick(); removeToast(toast.id); }}
              className="shrink-0 px-3 py-1.5 -my-1 rounded-lg text-sm font-extrabold text-teal-800 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-teal-700 cursor-pointer"
            >
              {toast.action.label}
            </button>
          )}
          
          <button 
            onClick={() => removeToast(toast.id)}
            aria-label={language === 'id' ? 'Tutup' : 'Dismiss'}
            className="text-stone-500 hover:text-stone-700 p-1 rounded-md hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
