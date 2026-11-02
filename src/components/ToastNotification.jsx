import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastNotification({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';
        const isInfo = toast.type === 'info' || (!isSuccess && !isError && !isWarning);

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-slide-in ${
              isSuccess
                ? 'bg-emerald-50/95 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                : isError
                ? 'bg-red-50/95 dark:bg-red-950/80 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
                : isWarning
                ? 'bg-amber-50/95 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                : 'bg-white/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
            }`}
            role="alert"
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              {isError && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              {isInfo && <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              {toast.title && (
                <div className="text-xs font-semibold uppercase tracking-wider mb-0.5 opacity-90">
                  {toast.title}
                </div>
              )}
              <div className="text-sm font-medium leading-relaxed break-words">
                {toast.message}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
