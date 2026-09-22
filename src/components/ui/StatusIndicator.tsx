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

  let dotColor = 'bg-[#687268]';
  let textColor = 'text-[#586658]';
  let label = text || status;

  switch (norm) {
    case 'APPROVED':
    case 'COMPLETED':
      dotColor = 'bg-[#0a5c36]';
      textColor = 'text-[#0a5c36]';
      if (!text) label = norm === 'COMPLETED' ? 'Completed' : 'Approved';
      break;
    case 'PENDING':
    case 'SUBMITTED':
      dotColor = 'bg-[#eab308]';
      textColor = 'text-[#92400e]';
      if (!text) label = 'Pending';
      break;
    case 'REJECTED':
      dotColor = 'bg-[#dc2626]';
      textColor = 'text-[#b91c1c]';
      if (!text) label = 'Rejected';
      break;
    case 'REVISION_REQUESTED':
      dotColor = 'bg-[#d97706]';
      textColor = 'text-[#92400e]';
      if (!text) label = 'Clarification Needed';
      break;
    case 'UPCOMING':
    case 'SCHEDULED':
      dotColor = 'bg-[#0a5c36]';
      textColor = 'text-[#172017]';
      if (!text) label = 'Upcoming';
      break;
    case 'ONGOING':
      dotColor = 'bg-[#0a5c36] animate-pulse';
      textColor = 'text-[#0a5c36]';
      if (!text) label = 'Ongoing';
      break;
    default:
      if (!text) label = status;
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColor} ${className}`}>
      {showDot && <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />}
      <span>{label}</span>
    </span>
  );
};

export default StatusIndicator;
