'use client';

import React from 'react';
import { TimelineStep } from '@/types';
import { CheckCircle2, Clock, XCircle, Calendar } from 'lucide-react';

export interface ActivityTimelineProps {
  steps: TimelineStep[];
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  steps,
  orientation = 'vertical',
  className = '',
}) => {
  if (!steps || steps.length === 0) return null;

  if (orientation === 'horizontal') {
    return (
      <div className={`w-full overflow-x-auto py-2 ${className}`}>
        <div className="flex items-start justify-between min-w-[500px] relative">
          {/* Connecting line */}
          <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />

          {steps.map((step, idx) => {
            const isCompleted = step.status === 'COMPLETED';
            const isCurrent = step.status === 'CURRENT';
            const isFailed = step.status === 'FAILED';

            return (
              <div key={step.id || idx} className="flex flex-col items-center text-center z-10 px-2 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-900 transition-all ${
                    isCompleted
                      ? 'border-emerald-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50'
                      : isCurrent
                      ? 'border-amber-500 text-amber-500 ring-4 ring-amber-100 dark:ring-amber-950/40'
                      : isFailed
                      ? 'border-rose-600 text-rose-600 bg-rose-50'
                      : 'border-slate-300 dark:border-slate-700 text-slate-300'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  ) : isFailed ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  )}
                </div>

                <span
                  className={`text-xs font-semibold mt-2 ${
                    isCurrent
                      ? 'text-amber-700 dark:text-amber-400 font-bold'
                      : isCompleted
                      ? 'text-slate-900 dark:text-slate-100'
                      : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </span>

                {step.date && (
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">{step.date}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical orientation
  return (
    <div className={`space-y-4 pl-6 relative text-left ${className}`}>
      {/* Vertical tracking line */}
      <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800" />

      {steps.map((step, idx) => {
        const isCompleted = step.status === 'COMPLETED';
        const isCurrent = step.status === 'CURRENT';
        const isFailed = step.status === 'FAILED';

        return (
          <div key={step.id || idx} className="relative group">
            {/* Step Node */}
            <div
              className={`absolute -left-6 top-0.5 flex items-center justify-center w-5 h-5 rounded-full border-2 bg-white dark:bg-slate-900 transition-transform group-hover:scale-110 ${
                isCompleted
                  ? 'border-emerald-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60'
                  : isCurrent
                  ? 'border-amber-500 text-amber-500 ring-2 ring-amber-100 dark:ring-amber-950/50'
                  : isFailed
                  ? 'border-rose-600 text-rose-600 bg-rose-50'
                  : 'border-slate-300 dark:border-slate-700 text-slate-300'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
              ) : isCurrent ? (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              ) : isFailed ? (
                <XCircle className="w-3 h-3" />
              ) : (
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              )}
            </div>

            {/* Step Content */}
            <div
              className={`p-3 rounded-xl border text-xs transition-all ${
                isCurrent
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/80 shadow-2xs'
                  : isCompleted
                  ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                  : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h5
                  className={`font-semibold ${
                    isCompleted
                      ? 'text-slate-900 dark:text-slate-100'
                      : isCurrent
                      ? 'text-amber-900 dark:text-amber-300 font-bold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {step.title}
                </h5>

                {step.date && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono shrink-0">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {step.date}
                  </span>
                )}
              </div>

              {step.description && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
