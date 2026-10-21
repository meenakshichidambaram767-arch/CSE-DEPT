import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isProd = process.env.NODE_ENV === 'production';
  const devMocksAllowed = !isProd && process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

  const pathname = request.nextUrl.pathname;
  const isProtectedPath = pathname.startsWith('/student') || pathname.startsWith('/hod');

  // In production, missing Supabase configuration must fail loudly, not allow access
  const isMissingConfig =
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes('placeholder') ||
    supabaseAnonKey.includes('placeholder');

  if (isMissingConfig) {
    if (isProd) {
      if (isProtectedPath || pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({
            type: 'https://httpstatuses.com/500',
            title: 'Configuration Error',
            status: 500,
            detail: 'Supabase environment configuration (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) is missing or unconfigured in production.',
          }),
          { status: 500, headers: { 'content-type': 'application/problem+json' } }
        );
      }
    }
  }

  const supabase = createServerClient(
    supabaseUrl || 'https://placeholder-project.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key',
    {
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
    }
  );

  // Authenticate user via Supabase
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  // Handle protected student and hod routes
  if (isProtectedPath) {
    // If not authenticated
    if (!user) {
      // In dev mode ONLY behind explicit dev flag, allow dev mock session cookie if present
      if (devMocksAllowed) {
        const mockRole = request.cookies.get('siet_cse_user_role')?.value;
        if (mockRole === 'STUDENT' && pathname.startsWith('/hod')) {
          const url = request.nextUrl.clone();
          url.pathname = '/student/dashboard';
          return NextResponse.redirect(url);
        }
        if (mockRole === 'HOD' && pathname.startsWith('/student')) {
          const url = request.nextUrl.clone();
          url.pathname = '/hod/dashboard';
          return NextResponse.redirect(url);
        }
        if (mockRole) {
          return supabaseResponse;
        }
      }

      // Real auth required: redirect to login
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // User is authenticated in Supabase: verify role server-side
    let userRole = user.user_metadata?.role || user.app_metadata?.role;
    try {
      const { data: dbUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      if (dbUser?.role) {
        userRole = dbUser.role;
      }
    } catch {
      // Fallback to user metadata if DB query fails
    }

    // Enforce strict role boundary based on verified userRole
    if (userRole === 'STUDENT' && pathname.startsWith('/hod')) {
      const url = request.nextUrl.clone();
      url.pathname = '/student/dashboard';
      return NextResponse.redirect(url);
    }

    if (userRole === 'HOD' && pathname.startsWith('/student')) {
      const url = request.nextUrl.clone();
      url.pathname = '/hod/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
