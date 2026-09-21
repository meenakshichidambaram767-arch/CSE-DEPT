'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search activities, students, guides...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
        <Search className="w-3.5 h-3.5" />
      </span>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 py-2 pl-8.5 pr-8 transition-all shadow-2xs outline-none focus:border-slate-900 dark:focus:border-slate-300 focus:ring-1 focus:ring-slate-900"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-sm"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
