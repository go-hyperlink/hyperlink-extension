import React from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { HyperlinkIcon } from './HyperlinkIcon';
import { Check, AlertTriangle, AlertCircle, Sparkles, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useHyperlink();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[2147483647] flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const getIndicator = () => {
          switch (toast.type) {
            case 'success':
              return { icon: <Check size={14} className="text-emerald-400" />, border: 'border-emerald-500/30' };
            case 'error':
              return { icon: <AlertCircle size={14} className="text-rose-400" />, border: 'border-rose-500/30' };
            case 'warning':
              return { icon: <AlertTriangle size={14} className="text-amber-400" />, border: 'border-amber-500/30' };
            default:
              return { icon: <Sparkles size={14} className="text-indigo-400" />, border: 'border-indigo-500/30' };
          }
        };

        const ind = getIndicator();

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-[#0b0f19]/90 backdrop-blur-2xl border ${ind.border} shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-200 animate-hyperlink-slide`}
          >
            <div className="mt-0.5 shrink-0">
              {ind.icon}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="font-semibold text-xs text-white leading-tight">{toast.title}</div>
              {toast.message && (
                <div className="text-[11px] text-zinc-400 mt-1 leading-relaxed truncate">{toast.message}</div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-500 hover:text-white p-0.5 rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
