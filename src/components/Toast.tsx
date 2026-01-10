import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { haptics } from '../lib/mobileUtils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, type, message, duration = 3000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Haptic feedback based on type
    if (type === 'success') haptics.success();
    else if (type === 'error') haptics.error();
    else if (type === 'warning') haptics.warning();
    else haptics.light();

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, type, duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    error: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    info: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
  };

  const styles = {
    success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-300 ${
        styles[type]
      } ${
        isExiting
          ? 'opacity-0 translate-x-full'
          : 'opacity-100 translate-x-0 animate-slideInRight'
      }`}
    >
      {icons[type]}
      <p className="flex-1 text-sm font-medium text-slate-900 dark:text-white">
        {message}
      </p>
      <button
        onClick={() => {
          haptics.light();
          setIsExiting(true);
          setTimeout(() => onClose(id), 300);
        }}
        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
      >
        <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; type: ToastType; message: string }>;
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-20 right-4 z-[10000] space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}

// Hook for using toasts
let toastId = 0;
const toastListeners: Array<(toasts: any[]) => void> = [];
let toastsState: any[] = [];

export function useToast() {
  const [toasts, setToasts] = useState<any[]>([]);

  useEffect(() => {
    const listener = (newToasts: any[]) => setToasts(newToasts);
    toastListeners.push(listener);
    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) toastListeners.splice(index, 1);
    };
  }, []);

  const showToast = (type: ToastType, message: string, duration?: number) => {
    const id = `toast-${toastId++}`;
    const newToast = { id, type, message, duration };
    toastsState = [...toastsState, newToast];
    toastListeners.forEach(listener => listener(toastsState));
  };

  const closeToast = (id: string) => {
    toastsState = toastsState.filter(t => t.id !== id);
    toastListeners.forEach(listener => listener(toastsState));
  };

  return {
    toasts,
    showToast,
    closeToast,
    success: (message: string, duration?: number) => showToast('success', message, duration),
    error: (message: string, duration?: number) => showToast('error', message, duration),
    warning: (message: string, duration?: number) => showToast('warning', message, duration),
    info: (message: string, duration?: number) => showToast('info', message, duration)
  };
}
