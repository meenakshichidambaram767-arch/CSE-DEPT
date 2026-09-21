import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ActivityStatus, ActivityType } from '@/types';
import confetti from 'canvas-confetti';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function triggerConfetti() {
  if (typeof window === 'undefined') return;
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  } catch (e) {
    console.log(e);
  }
}

export function getStatusConfig(status: ActivityStatus) {
  switch (status) {
    case 'ACTIVE':
    case 'APPROVED':
      return {
        label: 'Active / Approved',
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300',
        dot: 'bg-emerald-500',
        badge: 'border-emerald-300 bg-emerald-50 text-emerald-800'
      };
    case 'SUBMITTED':
    case 'PENDING_APPROVAL':
      return {
        label: 'Pending Approval',
        bg: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300',
        dot: 'bg-amber-500 animate-pulse',
        badge: 'border-amber-300 bg-amber-50 text-amber-800'
      };
    case 'UNDER_REVIEW':
      return {
        label: 'Under Review',
        bg: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300',
        dot: 'bg-blue-500 animate-pulse',
        badge: 'border-blue-300 bg-blue-50 text-blue-800'
      };
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        bg: 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300',
        dot: 'bg-indigo-500',
        badge: 'border-indigo-300 bg-indigo-50 text-indigo-800'
      };
    case 'REVIEW_DUE':
      return {
        label: 'Review Due',
        bg: 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300',
        dot: 'bg-purple-500 animate-ping',
        badge: 'border-purple-300 bg-purple-50 text-purple-800'
      };
    case 'REVIEW_COMPLETED':
      return {
        label: 'Review Completed',
        bg: 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-300',
        dot: 'bg-teal-500',
        badge: 'border-teal-300 bg-teal-50 text-teal-800'
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        bg: 'bg-emerald-100/70 border-emerald-300 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-200',
        dot: 'bg-emerald-600',
        badge: 'border-emerald-400 bg-emerald-100 text-emerald-900'
      };
    case 'REJECTED':
      return {
        label: 'Rejected / Action Needed',
        bg: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300',
        dot: 'bg-rose-500',
        badge: 'border-rose-300 bg-rose-50 text-rose-800'
      };
    case 'DRAFT':
    default:
      return {
        label: 'Draft',
        bg: 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300',
        dot: 'bg-slate-400',
        badge: 'border-slate-300 bg-slate-100 text-slate-800'
      };
  }
}

export function getTypeBadge(type: ActivityType) {
  switch (type) {
    case 'PROJECT':
      return {
        label: 'PROJECT',
        className: 'bg-emerald-600 text-white font-semibold'
      };
    case 'INTERNSHIP':
      return {
        label: 'INTERNSHIP',
        className: 'bg-blue-600 text-white font-semibold'
      };
    case 'HACKATHON':
      return {
        label: 'HACKATHON',
        className: 'bg-purple-600 text-white font-semibold'
      };
  }
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
