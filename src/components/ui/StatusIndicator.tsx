import React from 'react';

export type StatusType =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVISION_REQUESTED'
  | 'UPCOMING'
  | 'ONGOING'
  | 'COMPLETED'
  | 'SCHEDULED'
  | string;

interface StatusIndicatorProps {
  status: StatusType;
  text?: string;
  className?: string;
  showDot?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  text,
  className = '',
  showDot = true,
}) => {
  const norm = (status || '').toUpperCase();

  let dotColor = 'bg-zinc-400';
  let textColor = 'text-zinc-600 dark:text-zinc-400';
  let label = text || status;

  switch (norm) {
    case 'APPROVED':
    case 'COMPLETED':
      dotColor = 'bg-emerald-700';
      textColor = 'text-emerald-800 dark:text-emerald-400';
      if (!text) label = norm === 'COMPLETED' ? 'Completed' : 'Approved';
      break;
    case 'PENDING':
    case 'SUBMITTED':
      dotColor = 'bg-amber-500';
      textColor = 'text-amber-800 dark:text-amber-300';
      if (!text) label = 'Pending';
      break;
    case 'REJECTED':
      dotColor = 'bg-red-600';
      textColor = 'text-red-700 dark:text-red-400';
      if (!text) label = 'Rejected';
      break;
    case 'REVISION_REQUESTED':
      dotColor = 'bg-amber-600';
      textColor = 'text-amber-800 dark:text-amber-400';
      if (!text) label = 'Clarification Needed';
      break;
    case 'UPCOMING':
    case 'SCHEDULED':
      dotColor = 'bg-zinc-700 dark:bg-zinc-300';
      textColor = 'text-zinc-700 dark:text-zinc-300';
      if (!text) label = 'Upcoming';
      break;
    case 'ONGOING':
      dotColor = 'bg-emerald-600 animate-pulse';
      textColor = 'text-emerald-700 dark:text-emerald-300';
      if (!text) label = 'Ongoing';
      break;
    default:
      if (!text) label = status;
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColor} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      <span>{label}</span>
    </span>
  );
};

export default StatusIndicator;
