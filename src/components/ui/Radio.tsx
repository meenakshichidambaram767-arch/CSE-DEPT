'use client';

import React, { forwardRef, InputHTMLAttributes } from 'react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  options,
  selectedValue,
  onChange,
  orientation = 'vertical',
  disabled = false,
}) => {
  return (
    <div className="space-y-1.5 text-left">
      {label && (
        <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}

      <div
        className={`flex ${
          orientation === 'vertical' ? 'flex-col space-y-2' : 'flex-wrap gap-4'
        }`}
      >
        {options.map((opt) => {
          const isSelected = selectedValue === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer select-none ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={isSelected}
                disabled={disabled}
                onChange={() => onChange(opt.value)}
                className="h-4 w-4 mt-0.5 text-emerald-700 focus:ring-emerald-600 border-slate-300 dark:border-slate-700 accent-emerald-700"
              />
              <div className="flex flex-col">
                <span
                  className={`text-xs font-medium ${
                    isSelected ? 'text-emerald-900 dark:text-emerald-200 font-semibold' : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {opt.label}
                </span>
                {opt.description && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {opt.description}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
