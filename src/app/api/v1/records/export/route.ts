import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/api/auth';
import { apiError } from '@/lib/api/response';

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  const needsQuoting = /[",\n\r]/.test(str);
  if (needsQuoting) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

// GET /api/v1/records/export - Streams RFC 4180 CSV Export of Student Records (HOD Only)
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireRole(['HOD']);
    const { searchParams } = new URL(request.url);

    const year = searchParams.get('year');
    const section = searchParams.get('section');
    const search = searchParams.get('search');

    const supabase = await createClient();

    let query = supabase.from('students').select('*, users(email)');

    if (year && year !== 'ALL') query = query.eq('year', year);
    if (section && section !== 'ALL') query = query.eq('section', section);
    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      query = query.or(`name.ilike.${q},register_number.ilike.${q}`);
    }

    const { data: students, error } = await query.order('register_number', { ascending: true });

    if (error) {
      console.error('Error fetching student records export:', error);
      return apiError('QUERY_ERROR', error.message, 500);
    }

    const headers = ['Register Number', 'Student Name', 'Department', 'Year', 'Section', 'Email'];
    const csvLines: string[] = [headers.map(escapeCsvCell).join(',')];

    (students || []).forEach((s: any) => {
      csvLines.push(
        [
          s.register_number,
          s.name,
          s.department || 'CSE',
          s.year,
          s.section,
          s.email || s.users?.email || '',
        ]
          .map(escapeCsvCell)
          .join(',')
      );
    });

    await supabase.from('audit_logs').insert({
      actor_id: authUser.id,
      actor_role: 'HOD',
      action_title: 'Student Directory Records Exported',
      details: `HOD exported ${(students || []).length} student directory records to CSV.`,
      target_id: authUser.id,
    });

    const filename = `SIET_CSE_Student_Directory_${new Date().toISOString().slice(0, 10)}.csv`;
    const csvData = csvLines.join('\r\n');

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'HOD authorization required.', 403);
    }
    console.error('Error in GET /api/v1/records/export:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
