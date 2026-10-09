'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types';
import { useData } from '@/context/DataContext';
import { useSession } from '@/context/SessionContext';
import { SietLogo } from '@/components/common/SietLogo';
import {
  LayoutDashboard,
  Layers,
  FolderKanban,
  BriefcaseBusiness,
  Trophy,
  ClipboardCheck,
  FileCheck,
  GraduationCap,
  BadgeCheck,
  FileText,
  Calendar as CalendarIcon,
  Sparkles,
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
  const { user } = useSession();
  const dataContext = useData();

  // Live data counts
  const pendingApprovalsCount = dataContext?.getPendingApprovals?.()?.length || 0;
  const pendingODCount = dataContext?.getPendingODSubmissions?.()?.length || 0;

  // Student navigation
  const studentNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { id: 'activities', label: 'My Activities', href: '/student/activities', icon: Layers },
    { id: 'projects', label: 'Projects', href: '/student/projects', icon: FolderKanban },
    { id: 'internships', label: 'Internships', href: '/student/internships', icon: BriefcaseBusiness },
    { id: 'hackathons', label: 'Hackathons', href: '/student/hackathons', icon: Trophy },
    { id: 'reviews', label: 'Reviews', href: '/student/reviews', icon: ClipboardCheck },
    { id: 'apply-od', label: 'Apply OD', href: '/student/apply-od', icon: PlusCircle },
    { id: 'od', label: 'My OD Requests', href: '/student/od-requests', icon: FileCheck },
    { id: 'calendar', label: 'Calendar', href: '/student/calendar', icon: CalendarIcon },
    { id: 'events', label: 'Events', href: '/student/events', icon: Sparkles },
    { id: 'reports', label: 'Reports', href: '/student/reports', icon: FileSpreadsheet },
  ];

  // HOD navigation
  const hodNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', href: '/hod/dashboard', icon: LayoutDashboard },
    { id: 'approvals', label: 'Approvals', href: '/hod/approvals', icon: BadgeCheck, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined },
    { id: 'requests', label: 'OD Requests', href: '/hod/requests', icon: FileCheck, badge: pendingODCount > 0 ? pendingODCount : undefined },
    { id: 'records', label: 'Student Records', href: '/hod/records', icon: GraduationCap },
    { id: 'projects', label: 'Projects', href: '/hod/projects', icon: FolderKanban },
    { id: 'internships', label: 'Internships', href: '/hod/internships', icon: BriefcaseBusiness },
    { id: 'hackathons', label: 'Hackathons', href: '/hod/hackathons', icon: Trophy },
    { id: 'reviews', label: 'Reviews', href: '/hod/reviews', icon: ClipboardCheck },
    { id: 'reports', label: 'NAAC / NBA Reports', href: '/hod/reports', icon: FileText },
    { id: 'calendar', label: 'Calendar', href: '/hod/calendar', icon: CalendarIcon },
    { id: 'events', label: 'Events', href: '/hod/events', icon: Sparkles },
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
            <span className="text-xs font-black tracking-wider text-[#fed403] uppercase leading-tight">
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
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#fed403] rounded-r" />
              )}

              <div className="flex items-center gap-2.5 truncate pl-1">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#fed403]' : 'text-emerald-200/70 group-hover:text-white'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span className="text-[10px] font-bold text-[#064024] px-1.5 py-0.5 rounded bg-[#fed403] shadow-xs">
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
          {user?.name ?? (role === 'STUDENT' ? 'Student' : 'HOD')}
        </div>
        <div className="text-[11px] text-emerald-200/80 truncate">
          {role === 'STUDENT'
            ? [user?.year && `Year ${user.year}`, user?.registerNumber].filter(Boolean).join(' · ') || 'Student portal'
            : user?.designation ?? 'Head of Department · CSE'}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
