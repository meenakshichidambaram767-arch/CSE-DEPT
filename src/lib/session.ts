import { User, UserRole } from '@/types';
import { studentUser, hodUser } from '@/data/mock/users';
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

export function getCurrentSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  // Fallback dev mode mock session if Supabase credentials are unset
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
  const session: UserSession = {
    userId: studentUser.id,
    role: 'STUDENT',
    user: studentUser,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem('siet_cse_user_session', JSON.stringify(session));
  }
  return studentUser;
}

export function loginAsHod(): User {
  const session: UserSession = {
    userId: hodUser.id,
    role: 'HOD',
    user: hodUser,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem('siet_cse_user_session', JSON.stringify(session));
  }
  return hodUser;
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
    }
  }
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('siet_cse_user_session');
  }
}
