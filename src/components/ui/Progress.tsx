'use client';

import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 - 100
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'info';
  className?: string;
}

const sizeHeights = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

const variantColors = {
  primary: 'bg-emerald-700 dark:bg-emerald-500',
  success: 'bg-emerald-600 dark:bg-emerald-400',
  warning: 'bg-amber-600 dark:bg-amber-400',
  info: 'bg-sky-600 dark:bg-sky-400',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercentage = true,
  size = 'md',
  variant = 'primary',
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs select-none">
          {label ? (
            <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
          ) : (
            <span />
          )}
          {showPercentage && (
            <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {clamped}%
            </span>
          )}
        </div>
      )}

      <div className={`w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden ${sizeHeights[size]}`}>
        <div
          className={`${sizeHeights[size]} ${variantColors[variant]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

export interface ProgressIndicatorProps {
  stepsCount: number;
  currentStep: number;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  stepsCount,
  currentStep,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {Array.from({ length: stepsCount }).map((_, idx) => {
        const stepNum = idx + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <div
            key={idx}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              isCompleted
                ? 'bg-emerald-700 dark:bg-emerald-500'
                : isCurrent
                ? 'bg-emerald-600 dark:bg-emerald-400 ring-2 ring-emerald-100 dark:ring-emerald-950'
                : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
        );
      })}
    </div>
  );
};
