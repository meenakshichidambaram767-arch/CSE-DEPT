import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Get current user session from Supabase auth
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Non-blocking for offline or institutional session
  }

  const pathname = request.nextUrl.pathname;
  const roleCookie = request.cookies.get('siet_cse_user_role')?.value;
  const sessionCookie = request.cookies.get('siet_cse_user_session')?.value;
  const hasAuth = !!(user || roleCookie || sessionCookie);

  // Protect /student and /hod routes if user is not authenticated
  if (!hasAuth && (pathname.startsWith('/student') || pathname.startsWith('/hod'))) {
    const hasConfiguredSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder-project.supabase.co';

    if (hasConfiguredSupabase) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Enforce role isolation if institutional role cookie is present
  if (roleCookie === 'STUDENT' && pathname.startsWith('/hod')) {
    const url = request.nextUrl.clone();
    url.pathname = '/student/dashboard';
    return NextResponse.redirect(url);
  }

  if (roleCookie === 'HOD' && pathname.startsWith('/student')) {
    const url = request.nextUrl.clone();
    url.pathname = '/hod/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
