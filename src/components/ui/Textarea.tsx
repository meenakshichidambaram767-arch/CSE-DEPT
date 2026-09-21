'use client';

import React, { forwardRef, TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  isRequired?: boolean;
  maxChars?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      isRequired,
      maxChars,
      value,
      disabled,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full space-y-1.5 text-left">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 select-none"
            >
              {label}
              {isRequired && <span className="text-rose-500 ml-1">*</span>}
            </label>
          )}

          {maxChars && (
            <span className="text-[11px] text-slate-400 font-mono">
              {charCount}/{maxChars}
            </span>
          )}
        </div>

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          value={value}
          className={`w-full text-xs rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 p-3 transition-all duration-150 shadow-2xs outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
            errorMessage
              ? 'border-rose-400 dark:border-rose-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
              : 'border-slate-300 dark:border-slate-700 focus:border-slate-900 dark:focus:border-slate-300 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-300'
          } ${className}`}
          {...props}
        />

        {errorMessage ? (
          <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1">
            {errorMessage}
          </p>
        ) : (
          helperText && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {helperText}
            </p>
          )
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
