'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { SelectOption } from '@/types';

export interface MultiSelectProps {
  label?: string;
  helperText?: string;
  options: SelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  isRequired?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  helperText,
  options,
  selectedValues,
  onChange,
  placeholder = 'Select options...',
  isRequired,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const removeValue = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== val));
  };

  return (
    <div ref={containerRef} className="w-full space-y-1.5 text-left relative">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
          {label}
          {isRequired && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      {/* Main interactive display box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-9 w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-1.5 pr-8 flex flex-wrap gap-1.5 items-center cursor-pointer shadow-2xs transition-all focus-within:ring-1 focus-within:ring-slate-900"
      >
        {selectedValues.length === 0 ? (
          <span className="text-slate-400 pl-1.5">{placeholder}</span>
        ) : (
          selectedValues.map((val) => {
            const opt = options.find((o) => o.value === val);
            const labelText = opt ? opt.label : val;
            return (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-medium"
              >
                <span>{labelText}</span>
                <button
                  type="button"
                  onClick={(e) => removeValue(val, e)}
                  className="hover:text-rose-600 rounded-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })
        )}

        <span className="absolute right-2.5 top-2.5 pointer-events-none text-slate-400">
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const isChecked = selectedValues.includes(opt.value);
            return (
              <div
                key={opt.value}
                onClick={() => toggleOption(opt.value)}
                className={`flex items-center justify-between px-3 py-2 text-xs rounded-md cursor-pointer transition-colors ${
                  isChecked
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>
                  <p>{opt.label}</p>
                  {opt.description && (
                    <p className="text-[10px] text-slate-400 font-normal">{opt.description}</p>
                  )}
                </div>
                {isChecked && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{helperText}</p>
      )}
    </div>
  );
};
