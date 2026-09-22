'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types';
import { useData } from '@/context/DataContext';
import { SietLogo } from '@/components/common/SietLogo';
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

  // HOD Navigation: Home, Requests, Calendar, Events, Records
  const hodNav: NavItem[] = [
    { id: 'home', label: 'Home', href: '/hod/dashboard', icon: Home },
    { id: 'requests', label: 'Requests', href: '/hod/requests', icon: Inbox, badge: pendingODCount > 0 ? pendingODCount : undefined },
    { id: 'calendar', label: 'Calendar', href: '/hod/calendar', icon: CalendarIcon },
    { id: 'events', label: 'Events', href: '/hod/events', icon: Sparkles },
    { id: 'records', label: 'Records', href: '/hod/records', icon: FileSpreadsheet },
  ];

  const currentNav = role === 'STUDENT' ? studentNav : hodNav;

  return (
    <aside
      className={`hidden lg:flex flex-col w-60 h-screen sticky top-0 bg-[#064024] text-white border-r border-[#042f1a] select-none z-30 shadow-md ${className}`}
      aria-label="Primary Navigation"
    >
      {/* Brand Header with SIET Crest */}
      <div className="pt-6 pb-5 px-5 border-b border-[#0a5c36]/60">
        <Link
          href={role === 'STUDENT' ? '/student/od-requests' : '/hod/dashboard'}
          className="flex items-center gap-3 group"
        >
          <SietLogo size="md" variant="dark" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black tracking-wider text-[#facc15] uppercase leading-tight">
              SIET
            </span>
            <span className="text-[11px] font-bold tracking-tight text-white uppercase leading-tight">
              OD MANAGEMENT
            </span>
            <span className="text-[10px] font-medium text-emerald-200/80 leading-tight mt-0.5 truncate">
              {role === 'STUDENT' ? 'Student Portal' : 'HOD · CSE Dept'}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto" aria-label="Sidebar Menu">
        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/hod/dashboard' && item.href !== '/student/od-requests' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
                isActive
                  ? 'bg-[#0a5c36] text-white font-semibold shadow-xs'
                  : 'text-emerald-100/80 hover:text-white hover:bg-[#0a5c36]/50 font-medium'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Yellow Active Accent Marker */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#facc15] rounded-r" />
              )}

              <div className="flex items-center gap-2.5 truncate pl-1">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#facc15]' : 'text-emerald-200/70 group-hover:text-white'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className="text-[10px] font-bold text-[#064024] px-1.5 py-0.5 rounded bg-[#facc15] shadow-xs">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Scope */}
      <div className="p-4 mx-2.5 mb-3 rounded-lg bg-[#042f1a]/60 border border-[#0a5c36]/40">
        <div className="text-xs font-semibold text-white truncate">
          {role === 'STUDENT' ? 'Meena C' : 'Dr. Priya Kumar'}
        </div>
        <div className="text-[11px] text-emerald-200/80 truncate">
          {role === 'STUDENT' ? 'II Year · 714023104088' : 'Head of Department · CSE'}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
