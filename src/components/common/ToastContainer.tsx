import React from 'react';
import { useTeacherStore } from '../../store/useTeacherStore';
import { Info, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useTeacherStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-4 bg-white border border-stone-200 shadow-lg rounded-xl animate-in slide-in-from-bottom-5 fade-in duration-300"
        >
          {toast.type === 'info' && <Info className="w-5 h-5 text-teal-600 shrink-0" />}
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
          
          <p className="text-sm text-stone-800 font-medium flex-1">{toast.message}</p>
          
          <button 
            onClick={() => removeToast(toast.id)}
            className="text-stone-400 hover:text-stone-600 p-0.5 rounded-md hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
