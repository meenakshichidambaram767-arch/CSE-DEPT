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
  const { isLoading } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f9f5] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-[#0a5c36] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#f7f9f5] text-[#172017] flex flex-row ${className}`}>
      {/* Desktop Responsive Sidebar */}
      <Sidebar role={role} />

      {/* Mobile Navigation Drawer */}
      <MobileNavigation
        role={role}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          role={role}
          breadcrumbs={breadcrumbs}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 sm:px-10 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
