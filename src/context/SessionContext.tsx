'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, UserRole } from '@/types';
import {
  getCurrentSession,
  getSupabaseSession,
  loginAsStudent as mockLoginStudent,
  loginAsHod as mockLoginHod,
  logoutSupabase,
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

  useEffect(() => {
    let isMounted = true;
    const loadSession = async () => {
      const sbSession = await getSupabaseSession();
      if (!isMounted) return;
      if (sbSession) {
        setUser(sbSession.user);
        setRole(sbSession.role);
        setIsLoading(false);
        return;
      }

      const mockSession = getCurrentSession();
      if (mockSession) {
        setUser(mockSession.user);
        setRole(mockSession.role);
      } else {
        setUser(null);
        setRole(null);
      }
      setIsLoading(false);
    };

    loadSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Strict Role Protection & Navigation (Prevents Client Role Escalation)
  useEffect(() => {
    if (isLoading) return;

    if (pathname.startsWith('/hod')) {
      if (role !== 'HOD') {
        // Redirect unauthorized users away from /hod
        console.warn('Unauthorized access attempt to HOD portal.');
        if (role === 'STUDENT') {
          router.replace('/student/dashboard');
        } else {
          router.replace('/login');
        }
      }
    } else if (pathname.startsWith('/student')) {
      if (role !== 'STUDENT') {
        if (role === 'HOD') {
          router.replace('/hod/dashboard');
        } else {
          router.replace('/login');
        }
      }
    }
  }, [role, pathname, isLoading, router]);

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

  const handleLogout = async () => {
    await logoutSupabase();
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
