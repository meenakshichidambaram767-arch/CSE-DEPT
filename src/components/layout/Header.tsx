'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '@/types';
import { UserMenu } from './UserMenu';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';
import { useData } from '@/context/DataContext';
import { useSession } from '@/context/SessionContext';
import {
  Menu,
  Bell,
  CheckCheck,
  ArrowRightLeft,
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
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

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
      className={`h-14 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-[#fbfbfa]/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between transition-colors ${className}`}
    >
      {/* Left side: Mobile menu toggle + Location */}
      <div className="flex items-center gap-3 truncate">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open mobile navigation"
            className="lg:hidden p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2">
          {breadcrumbs ? (
            <div className="truncate text-xs text-zinc-500">
              {Array.isArray(breadcrumbs) ? (
                <Breadcrumbs items={breadcrumbs} />
              ) : (
                breadcrumbs
              )}
            </div>
          ) : (
            <div className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Department of Computer Science & Engineering
            </div>
          )}
        </div>
      </div>

      {/* Right side: Notifications + Role switch + User Menu */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick Role Switcher */}
        <Link
          href={role === 'HOD' ? '/student/od-requests' : '/hod/dashboard'}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 transition-colors"
          title={`Switch view to ${role === 'HOD' ? 'Student' : 'HOD'}`}
        >
          <ArrowRightLeft className="w-3 h-3 text-zinc-400" />
          <span>Switch to {role === 'HOD' ? 'Student' : 'HOD'}</span>
        </Link>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-700" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg z-50 overflow-hidden text-xs">
              <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    className="text-[11px] text-zinc-400 hover:text-zinc-900 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                {userNotifs.length === 0 ? (
                  <div className="p-6 text-center text-zinc-400">
                    No new notifications
                  </div>
                ) : (
                  userNotifs.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer ${
                        !n.isRead ? 'bg-zinc-50/60 dark:bg-zinc-800/30' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <UserMenu />
      </div>
    </header>
  );
};

