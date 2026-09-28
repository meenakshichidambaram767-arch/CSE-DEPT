import { createClient } from '@/lib/supabase/server';
import { UserRole } from '@/types';

export interface AuthenticatedUserContext {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  studentProfile?: {
    id: string;
    registerNumber: string;
    department: string;
    year: string;
    section: string;
  };
  hodProfile?: {
    id: string;
    designation: string;
    department: string;
  };
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUserContext | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Query user profile from database
    const { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!dbUser) {
      // Return metadata derived from auth user metadata or fallback
      const role = (user.user_metadata?.role as UserRole) || 'STUDENT';
      return {
        id: user.id,
        email: user.email || '',
        role,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      };
    }

    let studentProfile;
    let hodProfile;

    if (dbUser.role === 'STUDENT') {
      const { data: sp } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (sp) {
        studentProfile = {
          id: sp.id,
          registerNumber: sp.register_number,
          department: sp.department,
          year: sp.year,
          section: sp.section,
        };
      }
    } else if (dbUser.role === 'HOD') {
      const { data: hp } = await supabase
        .from('hods')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (hp) {
        hodProfile = {
          id: hp.id,
          designation: hp.designation,
          department: hp.department,
        };
      }
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role as UserRole,
      name: dbUser.name,
      studentProfile,
      hodProfile,
    };
  } catch (e) {
    console.error('Error fetching authenticated user:', e);
    return null;
  }
}

export async function requireAuth(): Promise<AuthenticatedUserContext> {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    throw new Error('UNAUTHORIZED');
  }
  return authUser;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<AuthenticatedUserContext> {
  const authUser = await requireAuth();
  if (!allowedRoles.includes(authUser.role)) {
    throw new Error('FORBIDDEN');
  }
  return authUser;
}
