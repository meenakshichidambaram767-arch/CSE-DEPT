'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '@/types';
import { UserMenu } from './UserMenu';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';
import { useData } from '@/context/DataContext';
import {
  Menu,
  Bell,
  CheckCheck,
  ArrowRightLeft,
  Building,
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
      className={`h-14 border-b border-[#dfe6dc] bg-white sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between shadow-2xs ${className}`}
    >
      {/* Left side: Mobile menu toggle + Location */}
      <div className="flex items-center gap-3 truncate">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open mobile navigation"
            className="lg:hidden p-1.5 rounded-md border border-[#dfe6dc] text-[#586658] hover:bg-[#f2f9f1]"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2">
          {breadcrumbs ? (
            <div className="truncate text-xs text-[#586658]">
              {Array.isArray(breadcrumbs) ? (
                <Breadcrumbs items={breadcrumbs} />
              ) : (
                breadcrumbs
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-[#172017]">
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-[#eaf7e8] text-[#0a5c36] text-[10px] font-bold uppercase tracking-wider">
                SIET Autonomous
              </span>
              <span className="text-[#586658] font-normal truncate">
                Department of Computer Science &amp; Engineering
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Role badge + Role switcher + Notifications + User Menu */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Institutional Role Badge */}
        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-[#eaf7e8] text-[#0a5c36] border border-[#dfe6dc]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0a5c36]" />
          <span>{role === 'HOD' ? 'HOD · CSE' : 'STUDENT · CSE'}</span>
        </span>

        {/* Quick Role Switcher */}
        <Link
          href={role === 'HOD' ? '/student/od-requests' : '/hod/dashboard'}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-[#586658] hover:text-[#0a5c36] hover:bg-[#f2f9f1] border border-[#dfe6dc] transition-colors"
          title={`Switch view to ${role === 'HOD' ? 'Student' : 'HOD'}`}
        >
          <ArrowRightLeft className="w-3 h-3 text-[#889688]" />
          <span className="hidden sm:inline">Switch to {role === 'HOD' ? 'Student' : 'HOD'}</span>
        </Link>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifs(!showNotifs)}
            aria-label="Notifications"
            className="p-2 rounded-md hover:bg-[#f2f9f1] text-[#586658] hover:text-[#0a5c36] relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#facc15] ring-2 ring-white" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg border border-[#dfe6dc] shadow-lg z-50 overflow-hidden">
              <div className="p-3 border-b border-[#dfe6dc] flex items-center justify-between bg-[#f2f9f1]">
                <span className="text-xs font-bold text-[#0a5c36] uppercase tracking-wider">
                  Notifications ({unreadCount} unread)
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    className="text-[11px] text-[#0a5c36] hover:underline flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#edf2ea]">
                {userNotifs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#889688]">
                    No notifications
                  </div>
                ) : (
                  userNotifs.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-3 text-xs cursor-pointer hover:bg-[#f2f9f1] transition-colors ${
                        !n.isRead ? 'bg-[#eaf7e8]/40' : ''
                      }`}
                    >
                      <p className="font-semibold text-[#172017]">{n.title}</p>
                      <p className="text-[#586658] mt-0.5 text-[11px] line-clamp-2">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-[#889688] mt-1 block">
                        {n.createdAt}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
};

export default Header;
