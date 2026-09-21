'use client';

import React, { forwardRef, InputHTMLAttributes } from 'react';
import { Calendar as CalendarIcon, Clock as ClockIcon } from 'lucide-react';

export interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  isRequired?: boolean;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, helperText, errorMessage, isRequired, id, className = '', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

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
          <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
            <CalendarIcon className="w-4 h-4 text-emerald-700" />
          </span>

          <input
            ref={ref}
            id={inputId}
            type="date"
            className={`w-full text-xs rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 py-2 pl-9 pr-3 transition-all duration-150 shadow-2xs outline-none border-slate-300 dark:border-slate-700 focus:border-slate-900 dark:focus:border-slate-300 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-300 font-mono ${
              errorMessage ? 'border-rose-400' : ''
            } ${className}`}
            {...props}
          />
        </div>

        {errorMessage ? (
          <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1">
            {errorMessage}
          </p>
        ) : (
          helperText && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{helperText}</p>
          )
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export interface TimePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  isRequired?: boolean;
}

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  ({ label, helperText, errorMessage, isRequired, id, className = '', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

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
          <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
            <ClockIcon className="w-4 h-4 text-amber-600" />
          </span>

          <input
            ref={ref}
            id={inputId}
            type="time"
            className={`w-full text-xs rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 py-2 pl-9 pr-3 transition-all duration-150 shadow-2xs outline-none border-slate-300 dark:border-slate-700 focus:border-slate-900 dark:focus:border-slate-300 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-300 font-mono ${
              errorMessage ? 'border-rose-400' : ''
            } ${className}`}
            {...props}
          />
        </div>

        {errorMessage ? (
          <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-1">
            {errorMessage}
          </p>
        ) : (
          helperText && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{helperText}</p>
          )
        )}
      </div>
    );
  }
);

TimePicker.displayName = 'TimePicker';
