'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types';
import { useData } from '@/context/DataContext';
import {
  Home,
  Inbox,
  Calendar as CalendarIcon,
  Sparkles,
  Users,
  FileSpreadsheet,
  PlusCircle,
} from 'lucide-react';

export interface SidebarProps {
  role: UserRole;
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, className = '' }) => {
  const pathname = usePathname();

  let pendingODCount = 0;
  try {
    const { getPendingODSubmissions } = useData();
    pendingODCount = getPendingODSubmissions().length;
  } catch (e) {
    // Fallback if rendered outside DataProvider
  }

  // Student Navigation
  const studentNav: NavItem[] = [
    { id: 'home', label: 'Home', href: '/student/od-requests', icon: Home },
    { id: 'apply', label: 'Apply for OD', href: '/student/apply-od', icon: PlusCircle },
    { id: 'calendar', label: 'Calendar', href: '/student/calendar', icon: CalendarIcon },
    { id: 'events', label: 'Events', href: '/student/events', icon: Sparkles },
  ];

  // HOD Navigation: Home, Requests, Calendar, Events, Students, Records
  const hodNav: NavItem[] = [
    { id: 'home', label: 'Home', href: '/hod/dashboard', icon: Home },
    { id: 'requests', label: 'Requests', href: '/hod/requests', icon: Inbox, badge: pendingODCount > 0 ? pendingODCount : undefined },
    { id: 'calendar', label: 'Calendar', href: '/hod/calendar', icon: CalendarIcon },
    { id: 'events', label: 'Events', href: '/hod/events', icon: Sparkles },
    { id: 'students', label: 'Students', href: '/hod/students', icon: Users },
    { id: 'records', label: 'Records', href: '/hod/records', icon: FileSpreadsheet },
  ];

  const currentNav = role === 'STUDENT' ? studentNav : hodNav;

  return (
    <aside
      className={`hidden lg:flex flex-col w-60 h-screen sticky top-0 bg-[#fbfbfa] dark:bg-zinc-950 border-r border-zinc-200/80 dark:border-zinc-800/80 select-none z-30 ${className}`}
      aria-label="Primary Navigation"
    >
      {/* Brand Header */}
      <div className="pt-8 pb-6 px-6">
        <Link
          href={role === 'STUDENT' ? '/student/od-requests' : '/hod/dashboard'}
          className="block group"
        >
          <div className="text-[13px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
            OD
          </div>
          <div className="text-[13px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
            MANAGEMENT
          </div>
          <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mt-1">
            CSE · {role === 'STUDENT' ? 'Student' : 'HOD Office'}
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1" aria-label="Sidebar Menu">
        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/hod/dashboard' && item.href !== '/student/od-requests' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                isActive
                  ? 'bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 font-medium'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-emerald-800 dark:text-emerald-400'
                      : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 px-1.5 py-0.2 rounded-full bg-zinc-200/80 dark:bg-zinc-800">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Scope */}
      <div className="p-4 mx-3 mb-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate">
          {role === 'STUDENT' ? 'Meena C' : 'Dr. Priya Kumar'}
        </div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
          {role === 'STUDENT' ? 'II Year CSE · Student' : 'HOD · CSE Department'}
        </div>
      </div>
    </aside>
  );
};

