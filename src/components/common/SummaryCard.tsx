'use client';

import React, { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Sparkles } from 'lucide-react';

export interface SummaryItem {
  label: string;
  value: ReactNode;
}

export interface SummaryCardProps {
  title: string;
  items: SummaryItem[];
  badge?: string;
  footerAction?: ReactNode;
  className?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  items,
  badge,
  footerAction,
  className = '',
}) => {
  return (
    <Card className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {title}
          </h4>
        </div>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {badge}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-medium tracking-wider block">
              {item.label}
            </span>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {footerAction && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          {footerAction}
        </div>
      )}
    </Card>
  );
};
