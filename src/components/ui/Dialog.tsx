'use client';

import React, { useEffect, ReactNode } from 'react';
import { X, AlertTriangle, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Button } from './Button';

export type DialogVariant = 'confirmation' | 'warning' | 'danger' | 'information';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  isLoading?: boolean;
  children?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const variantConfig: Record<
  DialogVariant,
  {
    icon: React.ReactNode;
    confirmVariant: 'primary' | 'secondary' | 'danger' | 'success';
    headerBg: string;
  }
> = {
  confirmation: {
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    confirmVariant: 'primary',
    headerBg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
  },
  information: {
    icon: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
    confirmVariant: 'secondary',
    headerBg: 'bg-sky-50/50 dark:bg-sky-950/20',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    confirmVariant: 'primary',
    headerBg: 'bg-amber-50/50 dark:bg-amber-950/20',
  },
  danger: {
    icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    confirmVariant: 'danger',
    headerBg: 'bg-rose-50/50 dark:bg-rose-950/20',
  },
};

const widthStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  variant = 'confirmation',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isLoading = false,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const config = variantConfig[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div
        className={`relative w-full ${widthStyles[maxWidth]} bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 ${config.headerBg}`}>
          <div className="flex items-center gap-3 pr-4">
            {config.icon}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              {description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content if any */}
        {children && <div className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">{children}</div>}

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-slate-50/60 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          {onConfirm && (
            <Button
              variant={config.confirmVariant}
              size="sm"
              isLoading={isLoading}
              onClick={() => {
                onConfirm();
              }}
            >
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
