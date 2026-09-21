'use client';

import React from 'react';
import { AllStatus } from '@/types';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  Calendar,
  Award,
  Minus,
  FileCheck2,
  HelpCircle
} from 'lucide-react';

export interface StatusBadgeProps {
  status: AllStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

interface StatusConfig {
  label: string;
  icon: React.ReactNode;
  classes: string;
}

const statusConfigs: Record<AllStatus, StatusConfig> = {
  ACTIVE: {
    label: 'Active',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-bold',
  },
  PENDING: {
    label: 'Pending',
    icon: <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
    classes: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  APPROVED: {
    label: 'Approved',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  COMPLETED: {
    label: 'Completed',
    icon: <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
    classes: 'bg-emerald-100/70 text-emerald-900 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700',
  },
  PENDING_APPROVAL: {
    label: 'Pending Approval',
    icon: <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
    classes: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  REVIEW_DUE: {
    label: 'Review Due',
    icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
    classes: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    icon: <Loader2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 animate-spin" />,
    classes: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />,
    classes: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  },
  REVIEW_COMPLETED: {
    label: 'Review Completed',
    icon: <FileCheck2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />,
    classes: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
  },
  REVISION_REQUESTED: {
    label: 'Revision Requested',
    icon: <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
    classes: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 font-bold',
  },
  REJECTED: {
    label: 'Rejected',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
    classes: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  },
  DRAFT: {
    label: 'Draft',
    icon: <Minus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />,
    classes: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
  NOT_REQUIRED: {
    label: 'Not Required',
    icon: <Minus className="w-3.5 h-3.5 text-slate-400" />,
    classes: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  },
  PENDING_SUBMISSION: {
    label: 'Pending Submission',
    icon: <Clock className="w-3.5 h-3.5 text-slate-500" />,
    classes: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
  },
  SUBMITTED: {
    label: 'Submitted',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />,
    classes: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
  },
};

const sizeStyles = {
  sm: 'text-[11px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-0.5 gap-1.5',
  lg: 'text-xs px-3 py-1 gap-2 font-semibold',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const config = statusConfigs[status] || {
    label: status.replace(/_/g, ' '),
    icon: <HelpCircle className="w-3.5 h-3.5 text-slate-400" />,
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium select-none shadow-2xs ${config.classes} ${sizeStyles[size]}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
