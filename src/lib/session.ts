import { User, UserRole } from '@/types';
import { studentUser, hodUser } from '@/data/mock/users';

const SESSION_KEY = 'siet_cse_user_session';

export interface MockSession {
  userId: string;
  role: UserRole;
  user: User;
}

export function getCurrentSession(): MockSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockSession;
  } catch (e) {
    console.error('Error reading mock session:', e);
    return null;
  }
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
  const session: MockSession = {
    userId: studentUser.id,
    role: 'STUDENT',
    user: studentUser,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return studentUser;
}

export function loginAsHod(): User {
  const session: MockSession = {
    userId: hodUser.id,
    role: 'HOD',
    user: hodUser,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return hodUser;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}
