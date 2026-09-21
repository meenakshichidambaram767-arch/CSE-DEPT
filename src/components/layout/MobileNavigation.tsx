'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types';
import {
  LayoutDashboard,
  Layers,
  FolderKanban,
  BriefcaseBusiness,
  Trophy,
  ClipboardCheck,
  BadgeCheck,
  FileCheck,
  X,
  GraduationCap
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
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Activities', href: '/student/activities', icon: Layers },
    { label: 'Projects', href: '/student/projects', icon: FolderKanban },
    { label: 'Internships', href: '/student/internships', icon: BriefcaseBusiness },
    { label: 'Hackathons', href: '/student/hackathons', icon: Trophy },
    { label: 'Reviews', href: '/student/reviews', icon: ClipboardCheck },
    { label: 'On-Duty (OD)', href: '/student/od-requests', icon: FileCheck },
  ];

  const hodNav = [
    { label: 'Dashboard', href: '/hod/dashboard', icon: LayoutDashboard },
    { label: 'Approvals', href: '/hod/approvals', icon: BadgeCheck },
    { label: 'Projects', href: '/hod/projects', icon: FolderKanban },
    { label: 'Internships', href: '/hod/internships', icon: BriefcaseBusiness },
    { label: 'Hackathons', href: '/hod/hackathons', icon: Trophy },
    { label: 'Reviews', href: '/hod/reviews', icon: ClipboardCheck },
    { label: 'OD Submissions', href: '/hod/od-submissions', icon: FileCheck },
  ];

  const navItems = role === 'STUDENT' ? studentNav : hodNav;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="relative flex flex-col w-72 max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 z-10 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                CSE Activity Hub
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">Department of CSE</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold shadow-2xs border border-emerald-200/60 dark:border-emerald-800/40'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            Logged in as <span className="font-semibold text-slate-700 dark:text-slate-300">{role}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
