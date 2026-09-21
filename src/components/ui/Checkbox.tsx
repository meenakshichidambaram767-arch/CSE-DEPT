'use client';

import React, { forwardRef, InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, id, className = '', disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <label
        htmlFor={inputId}
        className={`flex items-start gap-2.5 select-none cursor-pointer text-left ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          disabled={disabled}
          className="h-4 w-4 mt-0.5 rounded-sm border-slate-300 dark:border-slate-700 text-emerald-700 focus:ring-emerald-600 dark:bg-slate-900 cursor-pointer accent-emerald-700"
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                {label}
              </span>
            )}
            {description && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
