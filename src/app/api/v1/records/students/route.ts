import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// GET /api/v1/records/students - Paginated & Filtered Student Directory (HOD Only)
export async function GET(request: NextRequest) {
  try {
    await requireRole(['HOD']);
    const { searchParams } = new URL(request.url);

    const year = searchParams.get('year');
    const section = searchParams.get('section');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '20', 10);

    const supabase = await createClient();

    let query = supabase
      .from('students')
      .select('*, users!inner(email, name)', { count: 'exact' });

    if (year && year !== 'ALL') {
      query = query.eq('year', year);
    }
    if (section && section !== 'ALL') {
      query = query.eq('section', section);
    }
    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      query = query.or(`name.ilike.${q},register_number.ilike.${q}`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: rawStudents, count, error } = await query
      .order('register_number', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Error querying students:', error);
      return apiError('QUERY_ERROR', error.message, 500);
    }

    const formattedStudents = (rawStudents || []).map((s: Record<string, unknown>) => ({
      id: s.id as string,
      userId: s.user_id as string,
      registerNumber: s.register_number as string,
      regNo: s.register_number as string,
      name: s.name as string,
      department: (s.department as string) || 'CSE',
      year: s.year as string,
      section: s.section as string,
      email: (s.email as string) || ((s.users as Record<string, unknown>)?.email as string) || '',
      createdAt: s.created_at as string,
    }));

    return apiSuccess(formattedStudents, 200, {
      page,
      page_size: pageSize,
      total: count || 0,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'HOD authorization required.', 403);
    }
    console.error('Error in GET /api/v1/records/students:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
