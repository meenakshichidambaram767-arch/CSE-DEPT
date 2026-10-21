import { User, UserRole } from '@/types';
import { createClient } from '@/lib/supabase/client';

export interface UserSession {
  userId: string;
  role: UserRole;
  user: User;
}

export async function getSupabaseSession(): Promise<UserSession | null> {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return null;

    // Fetch verified profile from /api/v1/me endpoint
    const res = await fetch('/api/v1/me');
    if (!res.ok) return null;

    const body = await res.json();
    const data = body.data;

    if (!data) return null;

    const user: User = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
      department: data.profile?.department || 'CSE',
      year: data.profile?.year,
      section: data.profile?.section,
      registerNumber: data.profile?.register_number,
      designation: data.profile?.designation,
    };

    return {
      userId: user.id,
      role: user.role,
      user,
    };
  } catch (e) {
    console.error('Error fetching Supabase session:', e);
    return null;
  }
}

import { areDevMocksEnabled } from '@/lib/api/client';

export function getCurrentSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  if (!areDevMocksEnabled()) return null;

  // Fallback dev mode mock session if dev mocks are explicitly enabled
  const stored = localStorage.getItem('siet_cse_user_session');
  if (stored) {
    try {
      return JSON.parse(stored) as UserSession;
    } catch {
      return null;
    }
  }
  return null;
}

export function getCurrentUser(): User | null {
  const session = getCurrentSession();
  return session ? session.user : null;
}

export function getCurrentRole(): UserRole | null {
  const session = getCurrentSession();
  return session ? session.role : null;
}

export function loginAsStudent(): User {
  if (!areDevMocksEnabled()) {
    throw new Error('Mock authentication is disabled in production.');
  }

  const devStudent: User = {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@siet.ac.in',
    role: 'STUDENT',
    department: 'CSE',
    year: 'IV',
    section: 'A',
    registerNumber: '7376221CS101',
  };

  const session: UserSession = {
    userId: devStudent.id,
    role: 'STUDENT',
    user: devStudent,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem('siet_cse_user_session', JSON.stringify(session));
    document.cookie = 'siet_cse_user_role=STUDENT; path=/; max-age=86400; SameSite=Lax';
    document.cookie = `siet_cse_user_session=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=86400; SameSite=Lax`;
  }
  return devStudent;
}

export function loginAsHod(): User {
  if (!areDevMocksEnabled()) {
    throw new Error('Mock authentication is disabled in production.');
  }

  const devHod: User = {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Dr. K. R. Meenakshi',
    email: 'hod.cse@siet.ac.in',
    role: 'HOD',
    department: 'CSE',
    designation: 'Head of Department & Professor',
  };

  const session: UserSession = {
    userId: devHod.id,
    role: 'HOD',
    user: devHod,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem('siet_cse_user_session', JSON.stringify(session));
    document.cookie = 'siet_cse_user_role=HOD; path=/; max-age=86400; SameSite=Lax';
    document.cookie = `siet_cse_user_session=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=86400; SameSite=Lax`;
  }
  return devHod;
}

export async function logoutSupabase(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
    await fetch('/api/v1/auth/sign-out', { method: 'POST' });
  } catch (e) {
    console.error('Error logging out from Supabase:', e);
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('siet_cse_user_session');
      document.cookie = 'siet_cse_user_role=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'siet_cse_user_session=; path=/; max-age=0; SameSite=Lax';
    }
  }
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('siet_cse_user_session');
    document.cookie = 'siet_cse_user_role=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'siet_cse_user_session=; path=/; max-age=0; SameSite=Lax';
  }
}

