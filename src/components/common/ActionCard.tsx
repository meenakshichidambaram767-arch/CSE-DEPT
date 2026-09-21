'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertCircle, Clock, ArrowRight } from 'lucide-react';

export interface ActionCardProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  dueText?: string;
  onAction: () => void;
  actionLabel?: string;
  variant?: 'warning' | 'danger' | 'info';
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  subtitle,
  badgeText = 'Action Required',
  dueText,
  onAction,
  actionLabel = 'Review',
  variant = 'warning',
}) => {
  const borderVariants = {
    warning: 'border-l-4 border-l-amber-500 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
    danger: 'border-l-4 border-l-rose-500 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
    info: 'border-l-4 border-l-sky-500 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
  };

  const badgeVariants = {
    warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
    danger: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300',
    info: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300',
  };

  return (
    <div
      className={`p-4 rounded-xl border shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left ${borderVariants[variant]}`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border ${badgeVariants[variant]}`}
          >
            {badgeText}
          </span>
          {dueText && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{dueText}</span>
            </span>
          )}
        </div>

        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{subtitle}</p>
      </div>

      <div className="shrink-0 self-end sm:self-auto">
        <Button
          size="sm"
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onAction}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
};
