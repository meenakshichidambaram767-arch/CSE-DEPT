'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types';
import { useData } from '@/context/DataContext';
import {
  LayoutDashboard,
  Layers,
  FolderKanban,
  BriefcaseBusiness,
  Trophy,
  ClipboardCheck,
  BadgeCheck,
  FileCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';

export interface SidebarProps {
  role: UserRole;
  activePath?: string;
  onNavigate?: (path: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number | string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  collapsed: controlledCollapsed,
  onToggleCollapse,
  className = '',
}) => {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Initialize and persist collapse state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('siet_sidebar_collapsed');
      if (saved !== null) {
        setInternalCollapsed(saved === 'true');
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      try {
        localStorage.setItem('siet_sidebar_collapsed', String(next));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Student navigation: Dashboard, My Activities, Projects, Internships, Hackathons, Reviews
  // Note: DO NOT include Students, Reports, Notifications
  const studentNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { id: 'activities', label: 'My Activities', href: '/student/activities', icon: Layers },
    { id: 'projects', label: 'Projects', href: '/student/projects', icon: FolderKanban },
    { id: 'internships', label: 'Internships', href: '/student/internships', icon: BriefcaseBusiness },
    { id: 'hackathons', label: 'Hackathons', href: '/student/hackathons', icon: Trophy },
    { id: 'reviews', label: 'Reviews', href: '/student/reviews', icon: ClipboardCheck },
    { id: 'od', label: 'On-Duty (OD)', href: '/student/od-requests', icon: FileCheck },
  ];

  // Live data counts
  let pendingApprovalsCount = 0;
  let pendingODCount = 0;
  try {
    const { getPendingApprovals, getPendingODSubmissions } = useData();
    pendingApprovalsCount = getPendingApprovals().length;
    pendingODCount = getPendingODSubmissions().length;
  } catch (e) {
    // Fallback if rendered outside DataProvider
  }

  // HOD navigation: Dashboard, Approvals, Projects, Internships, Hackathons, Reviews, OD Submissions
  // Note: DO NOT include Students, Reports, Notifications
  const hodNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', href: '/hod/dashboard', icon: LayoutDashboard },
    { id: 'approvals', label: 'Approvals', href: '/hod/approvals', icon: BadgeCheck, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined },
    { id: 'projects', label: 'Projects', href: '/hod/projects', icon: FolderKanban },
    { id: 'internships', label: 'Internships', href: '/hod/internships', icon: BriefcaseBusiness },
    { id: 'hackathons', label: 'Hackathons', href: '/hod/hackathons', icon: Trophy },
    { id: 'reviews', label: 'Reviews', href: '/hod/reviews', icon: ClipboardCheck },
    { id: 'od-submissions', label: 'OD Clearances', href: '/hod/od-submissions', icon: FileCheck, badge: pendingODCount > 0 ? pendingODCount : undefined },
    { id: 'reports', label: 'NAAC / NBA Reports', href: '/hod/reports', icon: FileText },
  ];

  const currentNav = role === 'STUDENT' ? studentNav : hodNav;

  return (
    <aside
      className={`hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 ease-in-out relative select-none ${
        isCollapsed ? 'w-18' : 'w-64'
      } ${className}`}
      aria-label="Primary Navigation"
    >
      {/* Branding */}
      <div className={`h-16 flex items-center border-b border-slate-100 dark:border-slate-800/80 px-4 ${
        isCollapsed ? 'justify-center' : 'justify-between'
      }`}>
        <Link href={role === 'STUDENT' ? '/student/dashboard' : '/hod/dashboard'} className="flex items-center gap-3 truncate group">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:scale-105 transition-transform shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>

          {!isCollapsed && (
            <div className="truncate">
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate">
                CSE Activity Hub
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium truncate">
                Department of CSE
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto" aria-label="Sidebar Menu">
        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <div key={item.id} className="relative group">
              <Link
                href={item.href}
                className={`w-full flex items-center rounded-xl text-xs font-medium transition-all duration-150 relative ${
                  isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold shadow-2xs border border-emerald-200/60 dark:border-emerald-800/40'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-600 dark:bg-emerald-500 rounded-r-full ${
                      isCollapsed ? 'left-0.5' : 'left-0'
                    }`}
                  />
                )}

                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                  }`}
                />

                {!isCollapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          typeof item.badge === 'string'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>

              {/* Tooltip on hover when collapsed */}
              {isCollapsed && (
                <div
                  role="tooltip"
                  className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50"
                >
                  {item.label}
                  {item.badge && ` (${item.badge})`}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
        <button
          type="button"
          onClick={handleToggle}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`w-full flex items-center gap-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 p-2 rounded-xl transition-all ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
