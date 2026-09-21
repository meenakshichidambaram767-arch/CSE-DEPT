'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '@/types';
import { UserMenu } from './UserMenu';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';
import { SietLogo } from '@/components/common/SietLogo';
import { useData } from '@/context/DataContext';
import { useSession } from '@/context/SessionContext';
import {
  Menu,
  Bell,
  CheckCheck,
  Clock,
  Send,
  AlertCircle,
  FileCheck,
  Trophy,
  FolderKanban,
  X,
} from 'lucide-react';
import Link from 'next/link';

export interface HeaderProps {
  role: UserRole;
  onOpenMobileNav?: () => void;
  breadcrumbs?: React.ReactNode | BreadcrumbItem[];
  title?: string;
  userName?: string;
  userMeta?: string;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  role,
  onOpenMobileNav,
  breadcrumbs,
  className = '',
}) => {
  const { notifications, markNotificationAsRead, clearAllNotifications } = useData();
  const { user } = useSession();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Filter notifications for this role/user
  const userNotifs = notifications.filter(
    (n) =>
      n.userId === 'all' ||
      (role === 'HOD' ? n.userId === 'usr-hod-001' : n.userId !== 'usr-hod-001')
  );
  const unreadCount = userNotifs.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className={`h-16 border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-colors ${className}`}
    >
      {/* Left side: Mobile menu toggle + Breadcrumbs */}
      <div className="flex items-center gap-3 truncate">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open mobile navigation"
            className="lg:hidden p-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2">
          <SietLogo size="sm" />
          {breadcrumbs ? (
            <div className="truncate">
              {Array.isArray(breadcrumbs) ? (
                <Breadcrumbs items={breadcrumbs} />
              ) : (
                breadcrumbs
              )}
            </div>
          ) : (
            <div className="truncate text-xs font-bold text-[#064e3b]">
              SIET CSE • Student Tracking Platform
            </div>
          )}
        </div>
      </div>

      {/* Right side: Notifications + Role badge & Switcher + User Menu */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Quick Role Switcher Button */}
        <Link
          href={role === 'HOD' ? '/student/dashboard' : '/hod/dashboard'}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-900 shadow-2xs transition-all cursor-pointer"
          title={`Switch view to ${role === 'HOD' ? 'Student' : 'HOD'}`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Switch:</span>
          <span className="font-extrabold text-emerald-900">{role === 'HOD' ? 'Student' : 'HOD'}</span>
          <span className="text-emerald-600 font-bold">⇄</span>
        </Link>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3.5 bg-[#064e3b] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-300" />
                  <span className="text-xs font-bold uppercase tracking-wide text-amber-200">
                    System Reminders &amp; Alerts
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    className="text-[10px] text-emerald-200 hover:text-white flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {userNotifs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active notifications or reminders.
                  </div>
                ) : (
                  userNotifs.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-3.5 hover:bg-emerald-50/40 transition-colors cursor-pointer ${
                        !n.isRead ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <strong className="text-xs font-bold text-slate-900 line-clamp-1">
                          {n.title}
                        </strong>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {n.message}
                      </p>
                      {n.linkUrl && (
                        <Link
                          href={n.linkUrl}
                          className="inline-block mt-2 text-[11px] font-bold text-emerald-700 hover:underline"
                        >
                          View Details →
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Identity Chip */}
        <span
          className={`hidden md:inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            role === 'HOD'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {role === 'HOD' ? 'Dr. Priya Kumar (HOD CSE)' : 'Meena C (II Year CSE)'}
        </span>

        <UserMenu />
      </div>
    </header>
  );
};
