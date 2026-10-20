import React from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useMarketplace();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          error: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          warning: <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
        };

        const borderStyles = {
          success: 'border-emerald-200 bg-white shadow-emerald-950/10',
          error: 'border-rose-200 bg-white shadow-rose-950/10',
          warning: 'border-amber-200 bg-white shadow-amber-950/10',
          info: 'border-blue-200 bg-white shadow-blue-950/10',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-fade-in ${borderStyles[toast.type]}`}
            role="alert"
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="text-sm font-bold text-slate-900 leading-tight mb-0.5">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs text-slate-600 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
