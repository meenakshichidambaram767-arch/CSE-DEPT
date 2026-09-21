'use client';

import React, { forwardRef, InputHTMLAttributes } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export type InputState = 'default' | 'error' | 'success';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  successMessage?: string;
  state?: InputState;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isRequired?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      successMessage,
      state: controlledState,
      leftIcon,
      rightIcon,
      isRequired,
      disabled,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    // Compute effective state
    const effectiveState: InputState = errorMessage
      ? 'error'
      : successMessage
      ? 'success'
      : controlledState || 'default';

    const stateStyles: Record<InputState, string> = {
      default:
        'border-slate-300 dark:border-slate-700 focus:border-slate-900 dark:focus:border-slate-300 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-300',
      error:
        'border-rose-400 dark:border-rose-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100',
      success:
        'border-emerald-400 dark:border-emerald-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20',
    };

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 select-none"
          >
            {label}
            {isRequired && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full text-xs rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 py-2 transition-all duration-150 shadow-2xs outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-9' : 'pl-3'
            } ${
              rightIcon || effectiveState !== 'default' ? 'pr-9' : 'pr-3'
            } ${stateStyles[effectiveState]} ${className}`}
            {...props}
          />

          <span className="absolute right-3 flex items-center pointer-events-none">
            {effectiveState === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            ) : effectiveState === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              rightIcon && <span className="text-slate-400">{rightIcon}</span>
            )}
          </span>
        </div>

        {errorMessage && (
          <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1 animate-in fade-in">
            {errorMessage}
          </p>
        )}

        {!errorMessage && successMessage && (
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
            {successMessage}
          </p>
        )}

        {!errorMessage && !successMessage && helperText && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
