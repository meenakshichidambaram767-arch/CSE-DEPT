'use client';

import React, { useState, forwardRef, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { SelectOption } from '@/types';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  options: SelectOption[];
  allowOther?: boolean;
  otherPlaceholder?: string;
  onOtherChange?: (customValue: string) => void;
  isRequired?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      options,
      allowOther = false,
      otherPlaceholder = 'Please specify other...',
      onOtherChange,
      isRequired,
      value,
      onChange,
      disabled,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const [isOtherSelected, setIsOtherSelected] = useState(value === 'other');
    const [otherText, setOtherText] = useState('');

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      const isOther = val === 'other';
      setIsOtherSelected(isOther);
      onChange?.(e);
      if (!isOther && onOtherChange) {
        onOtherChange('');
      }
    };

    const handleOtherInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const customVal = e.target.value;
      setOtherText(customVal);
      onOtherChange?.(customVal);
    };

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 select-none"
          >
            {label}
            {isRequired && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            value={value}
            onChange={handleSelectChange}
            className={`w-full appearance-none text-xs rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-2 pl-3 pr-9 transition-all duration-150 shadow-2xs outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
              errorMessage
                ? 'border-rose-400 dark:border-rose-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20'
                : 'border-slate-300 dark:border-slate-700 focus:border-slate-900 dark:focus:border-slate-300 focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-300'
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="py-1">
                {opt.label}
              </option>
            ))}
            {allowOther && (
              <option value="other" className="font-semibold text-emerald-700">
                + Other (Specify custom)
              </option>
            )}
          </select>

          <span className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </span>
        </div>

        {/* Dynamic Custom Input when "Other" is picked */}
        {allowOther && isOtherSelected && (
          <div className="pt-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <input
              type="text"
              value={otherText}
              onChange={handleOtherInput}
              placeholder={otherPlaceholder}
              className="w-full text-xs rounded-lg border border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100 px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-1">
              Specify your custom option above
            </p>
          </div>
        )}

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

Select.displayName = 'Select';
