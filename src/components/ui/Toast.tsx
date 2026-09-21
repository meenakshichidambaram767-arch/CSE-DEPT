'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (title: string, description?: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (title: string, description?: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const typeConfigs: Record<ToastType, { icon: React.ReactNode; border: string; bg: string }> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
    border: 'border-emerald-200 dark:border-emerald-800',
    bg: 'bg-white dark:bg-slate-900',
  },
  error: {
    icon: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
    border: 'border-rose-200 dark:border-rose-800',
    bg: 'bg-white dark:bg-slate-900',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
    border: 'border-amber-200 dark:border-amber-800',
    bg: 'bg-white dark:bg-slate-900',
  },
  info: {
    icon: <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />,
    border: 'border-sky-200 dark:border-sky-800',
    bg: 'bg-white dark:bg-slate-900',
  },
};

export const ToastContainer: React.FC<{ toasts: ToastItem[]; onRemove: (id: string) => void }> = ({
  toasts,
  onRemove,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const config = typeConfigs[t.type];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg ${config.border} ${config.bg} animate-in fade-in slide-in-from-bottom-2 duration-150`}
          >
            {config.icon}
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{t.title}</p>
              {t.description && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                  {t.description}
                </p>
              )}
            </div>
            <button
              onClick={() => onRemove(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
