'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from '../ui/Progress';
import { ActivityType, ActivityStatus } from '@/types';
import { FolderGit2, Briefcase, Trophy, Calendar, User, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ActivityCardProps {
  id: string;
  title: string;
  type: ActivityType;
  status: ActivityStatus;
  progress: number;
  subtitle?: string;
  studentName?: string;
  guideOrCompany?: string;
  dateRange?: string;
  tags?: string[];
  onAction?: () => void;
  actionLabel?: string;
}

const typeIcons: Record<ActivityType, React.ReactNode> = {
  PROJECT: <FolderGit2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />,
  INTERNSHIP: <Briefcase className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
  HACKATHON: <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
};

const typeLabels: Record<ActivityType, string> = {
  PROJECT: 'Project',
  INTERNSHIP: 'Internship',
  HACKATHON: 'Hackathon',
};

export const ActivityCard: React.FC<ActivityCardProps> = ({
  title,
  type,
  status,
  progress,
  subtitle,
  studentName,
  guideOrCompany,
  dateRange,
  tags = [],
  onAction,
  actionLabel = 'View Details',
}) => {
  return (
    <Card className="flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <div>
        {/* Top bar: Type + Status */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {typeIcons[type]}
            <span>{typeLabels[type]}</span>
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
          {title}
        </h4>

        {/* Subtitle / summary */}
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {subtitle}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] text-slate-400 self-center">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Progress */}
        <div className="mt-3 pt-2">
          <ProgressBar value={progress} size="sm" />
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 truncate pr-2">
          {studentName && (
            <span className="flex items-center gap-1 truncate">
              <User className="w-3 h-3 text-slate-400 shrink-0" />
              <strong className="font-medium text-slate-700 dark:text-slate-300">{studentName}</strong>
            </span>
          )}
          {guideOrCompany && <span>• {guideOrCompany}</span>}
        </div>

        {onAction && (
          <Button variant="ghost" size="sm" onClick={onAction} rightIcon={<ArrowRight className="w-3 h-3" />}>
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
};
