'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types';
import { SietLogo } from '@/components/common/SietLogo';
import { useSession } from '@/context/SessionContext';
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
  X,
  ArrowRightLeft,
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
  const { user, loginAsStudent, loginAsHod } = useSession();

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
    { label: 'Apply OD', href: '/student/apply-od', icon: PlusCircle },
    { label: 'My OD Requests', href: '/student/od-requests', icon: FileCheck },
    { label: 'Calendar', href: '/student/calendar', icon: CalendarIcon },
    { label: 'Events', href: '/student/events', icon: Sparkles },
    { label: 'Reports', href: '/student/reports', icon: FileSpreadsheet },
  ];

  const hodNav = [
    { label: 'Dashboard', href: '/hod/dashboard', icon: LayoutDashboard },
    { label: 'Approvals', href: '/hod/approvals', icon: BadgeCheck },
    { label: 'OD Requests', href: '/hod/requests', icon: FileCheck },
    { label: 'Student Records', href: '/hod/records', icon: GraduationCap },
    { label: 'Projects', href: '/hod/projects', icon: FolderKanban },
    { label: 'Internships', href: '/hod/internships', icon: BriefcaseBusiness },
    { label: 'Hackathons', href: '/hod/hackathons', icon: Trophy },
    { label: 'Reviews', href: '/hod/reviews', icon: ClipboardCheck },
    { label: 'NAAC / NBA Reports', href: '/hod/reports', icon: FileText },
    { label: 'Calendar', href: '/hod/calendar', icon: CalendarIcon },
    { label: 'Events', href: '/hod/events', icon: Sparkles },
  ];

  const navItems = role === 'STUDENT' ? studentNav : hodNav;

  const handleRoleSwitch = () => {
    onClose();
    if (role === 'HOD') {
      loginAsStudent();
    } else {
      loginAsHod();
    }
  };

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="relative flex flex-col w-64 max-w-[80vw] bg-[#064024] text-white shadow-2xl border-r border-[#042f1a] z-10 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#0a5c36]/60">
          <div className="flex items-center gap-2.5">
            <SietLogo size="sm" variant="dark" />
            <div>
              <div className="text-xs font-black tracking-wider text-[#fed403] uppercase">
                SIET
              </div>
              <div className="text-[10px] text-emerald-200 uppercase font-semibold">
                OD MANAGEMENT
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1 rounded-md text-emerald-300 hover:text-white hover:bg-[#0a5c36]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/hod/dashboard' && item.href !== '/student/od-requests' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#0a5c36] text-white font-semibold'
                    : 'text-emerald-100 hover:bg-[#0a5c36]/50 hover:text-white'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#fed403] rounded-r" />
                )}
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#fed403]' : 'text-emerald-300'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer with Role Switcher */}
        <div className="p-4 border-t border-[#0a5c36]/60 bg-[#042f1a]/60 space-y-3">
          <div>
            <div className="text-xs font-semibold text-white">
              {user?.name ?? (role === 'STUDENT' ? 'Student' : 'HOD')}
            </div>
            <div className="text-[10px] text-emerald-200">
              {role === 'STUDENT'
                ? [user?.department, user?.registerNumber].filter(Boolean).join(' · ') || 'Student portal'
                : user?.designation ?? 'Head of Department · CSE'}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRoleSwitch}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold bg-[#0a5c36] text-white hover:bg-[#084c2c] transition-colors border border-[#0e7545]"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#fed403]" />
            <span>Switch to {role === 'HOD' ? 'Student Portal' : 'HOD Portal'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileNavigation;
