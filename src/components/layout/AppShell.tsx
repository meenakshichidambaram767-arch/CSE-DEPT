'use client';

import React, { useState } from 'react';
import { UserRole } from '@/types';
import { useSession } from '@/context/SessionContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNavigation } from './MobileNavigation';

export interface AppShellProps {
  role: UserRole;
  children: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  role,
  children,
  breadcrumbs,
  className = '',
}) => {
  const { user, isLoading } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // While checking session state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading CSE Activity Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-row ${className}`}>
      {/* Desktop Responsive Sidebar */}
      <Sidebar role={role} />

      {/* Mobile Navigation Drawer */}
      <MobileNavigation
        role={role}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          role={role}
          breadcrumbs={breadcrumbs}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
