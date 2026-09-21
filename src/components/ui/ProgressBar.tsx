import React from 'react';

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  colorClass?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = true,
  size = 'md',
  colorClass = 'bg-emerald-600',
  className = ''
}) => {
  const clamped = Math.min(100, Math.max(0, progress));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
          <span>Progress</span>
          <span className="font-mono text-emerald-700 dark:text-emerald-400">{clamped}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/80 dark:border-slate-700/60 ${heightClasses[size]}`}>
        <div
          className={`${heightClasses[size]} ${colorClass} rounded-full transition-all duration-500 ease-out shadow-xs`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
