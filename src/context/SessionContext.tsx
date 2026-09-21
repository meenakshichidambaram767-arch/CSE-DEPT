'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, UserRole } from '@/types';
import {
  getCurrentSession,
  loginAsStudent as mockLoginStudent,
  loginAsHod as mockLoginHod,
  logout as mockLogout,
} from '@/lib/session';

interface SessionContextType {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  loginAsStudent: () => void;
  loginAsHod: () => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = () => {
    const session = getCurrentSession();
    if (session) {
      setUser(session.user);
      setRole(session.role);
    } else {
      setUser(null);
      setRole(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshSession();
  }, []);

  // Seamless Role Adaptation & Navigation
  useEffect(() => {
    if (isLoading) return;

    if (pathname.startsWith('/hod')) {
      if (role !== 'HOD') {
        const u = mockLoginHod();
        setUser(u);
        setRole('HOD');
      }
    } else if (pathname.startsWith('/student')) {
      if (role !== 'STUDENT') {
        const u = mockLoginStudent();
        setUser(u);
        setRole('STUDENT');
      }
    }
  }, [role, pathname, isLoading]);

  const handleLoginStudent = () => {
    const u = mockLoginStudent();
    setUser(u);
    setRole('STUDENT');
    router.push('/student/dashboard');
  };

  const handleLoginHod = () => {
    const u = mockLoginHod();
    setUser(u);
    setRole('HOD');
    router.push('/hod/dashboard');
  };

  const handleLogout = () => {
    mockLogout();
    setUser(null);
    setRole(null);
    router.push('/login');
  };

  return (
    <SessionContext.Provider
      value={{
        user,
        role,
        isLoading,
        loginAsStudent: handleLoginStudent,
        loginAsHod: handleLoginHod,
        logout: handleLogout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
