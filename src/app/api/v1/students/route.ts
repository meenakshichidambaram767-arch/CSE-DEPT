import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// GET /api/v1/students - Minimal Student Directory for Teammate Selection (Authenticated Users)
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const { searchParams } = new URL(request.url);

    const year = searchParams.get('year');
    const section = searchParams.get('section');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '50', 10);

    const supabase = await createClient();

    let query = supabase
      .from('students')
      .select('id, user_id, register_number, name, department, year, section, email', { count: 'exact' });

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
      console.error('Error querying student directory:', error);
      return apiError('QUERY_ERROR', error.message, 500);
    }

    // Return minimal fields required for teammate selection
    const formattedStudents = (rawStudents || []).map((s: {
      id: string;
      user_id: string;
      register_number: string;
      name: string;
      department?: string;
      year?: string;
      section?: string;
      email?: string;
    }) => ({
      id: s.id,
      name: s.name,
      registerNumber: s.register_number,
      register_number: s.register_number,
      regNo: s.register_number,
      department: s.department || 'CSE',
      year: s.year || 'II',
      section: s.section || 'A',
      email: s.email || '',
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
    console.error('Error in GET /api/v1/students:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}

