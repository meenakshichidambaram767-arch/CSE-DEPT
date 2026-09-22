'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types';
import {
  Home,
  Inbox,
  Calendar as CalendarIcon,
  Sparkles,
  Users,
  FileSpreadsheet,
  PlusCircle,
  X
} from 'lucide-react';

export interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onClose,
  role,
}) => {
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const studentNav = [
    { label: 'Home', href: '/student/od-requests', icon: Home },
    { label: 'Apply for OD', href: '/student/apply-od', icon: PlusCircle },
    { label: 'Calendar', href: '/student/calendar', icon: CalendarIcon },
    { label: 'Events', href: '/student/events', icon: Sparkles },
  ];

  const hodNav = [
    { label: 'Home', href: '/hod/dashboard', icon: Home },
    { label: 'Requests', href: '/hod/requests', icon: Inbox },
    { label: 'Calendar', href: '/hod/calendar', icon: CalendarIcon },
    { label: 'Events', href: '/hod/events', icon: Sparkles },
    { label: 'Students', href: '/hod/students', icon: Users },
    { label: 'Records', href: '/hod/records', icon: FileSpreadsheet },
  ];

  const navItems = role === 'STUDENT' ? studentNav : hodNav;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="relative flex flex-col w-64 max-w-[80vw] bg-[#fbfbfa] dark:bg-zinc-950 shadow-xl border-r border-zinc-200 dark:border-zinc-800 z-10 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <div className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              OD MANAGEMENT
            </div>
            <div className="text-[10px] text-zinc-400">
              CSE · {role === 'STUDENT' ? 'Student' : 'HOD Office'}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 text-left">
          <p className="text-[11px] text-zinc-500 font-medium">
            {role === 'STUDENT' ? 'Meena C · II Year' : 'Dr. Priya Kumar · HOD'}
          </p>
        </div>
      </div>
    </div>
  );
};

