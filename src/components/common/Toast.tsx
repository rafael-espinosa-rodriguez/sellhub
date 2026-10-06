import { Terminal, X } from 'lucide-react';
import type { ToastMessage } from '../../types/navigation.ts';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
      {toasts.map((toast) => {
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 bg-[#d4ff00] text-black border border-white font-mono text-xs uppercase font-bold shadow-[4px_4px_0px_0px_#ffffff] transition-all"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Terminal className="w-4 h-4 shrink-0" />
              <span className="truncate leading-tight">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="p-1 hover:bg-black/10 transition-colors shrink-0"
              aria-label="Cerrar notificación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
