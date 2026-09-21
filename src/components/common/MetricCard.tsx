'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'highlight';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  changeType = 'neutral',
  description,
  icon,
  variant = 'default',
}) => {
  const trendIcons = {
    positive: <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
    negative: <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
    neutral: <Minus className="w-3.5 h-3.5 text-slate-400" />,
  };

  const trendColors = {
    positive: 'text-emerald-700 dark:text-emerald-400',
    negative: 'text-rose-700 dark:text-rose-400',
    neutral: 'text-slate-500 dark:text-slate-400',
  };

  return (
    <Card className={variant === 'highlight' ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/20' : ''}>
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
          {label}
        </span>
        {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </span>

        {change && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trendColors[changeType]}`}>
            {trendIcons[changeType]}
            <span>{change}</span>
          </span>
        )}
      </div>

      {description && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {description}
        </p>
      )}
    </Card>
  );
};
