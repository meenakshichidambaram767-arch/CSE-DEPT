import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/api/auth';
import { apiError } from '@/lib/api/response';

// Utility helper to safely escape CSV cells following RFC 4180
function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  const needsQuoting = /[",\n\r]/.test(str);
  if (needsQuoting) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

// GET /api/v1/reports/export - RFC 4180 CSV Export Endpoint (HOD Only)
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireRole(['HOD']);
    const { searchParams } = new URL(request.url);

    const exportType = searchParams.get('type') || 'accreditation';
    const year = searchParams.get('year');
    const section = searchParams.get('section');
    const status = searchParams.get('status');

    const supabase = await createClient();

    let csvLines: string[] = [];
    let filename = `SIET_CSE_Export_${exportType}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (exportType === 'student') {
      let query = supabase.from('students').select('*, users(email)');
      if (year && year !== 'ALL') query = query.eq('year', year);
      if (section && section !== 'ALL') query = query.eq('section', section);

      const { data: students } = await query.order('register_number', { ascending: true });

      const headers = ['Register Number', 'Student Name', 'Department', 'Year', 'Section', 'Email', 'Created At'];
      csvLines.push(headers.map(escapeCsvCell).join(','));

      (students || []).forEach((s: any) => {
        csvLines.push(
          [
            s.register_number,
            s.name,
            s.department || 'CSE',
            s.year,
            s.section,
            s.email || s.users?.email || '',
            s.created_at ? new Date(s.created_at).toISOString().slice(0, 10) : '',
          ]
            .map(escapeCsvCell)
            .join(',')
        );
      });
    } else if (exportType === 'activity') {
      let query = supabase.from('activities').select('*, students(name, register_number, year, section)');
      if (status && status !== 'ALL') query = query.eq('status', status);

      const { data: activities } = await query.order('created_at', { ascending: false });

      const headers = [
        'Activity Code',
        'Type',
        'Title',
        'Student Name',
        'Register Number',
        'Year',
        'Section',
        'Status',
        'Start Date',
        'End Date',
        'Technologies',
      ];
      csvLines.push(headers.map(escapeCsvCell).join(','));

      (activities || []).forEach((a: any) => {
        csvLines.push(
          [
            a.code,
            a.type,
            a.title,
            a.students?.name || '',
            a.students?.register_number || '',
            a.students?.year || '',
            a.students?.section || '',
            a.status,
            a.start_date || '',
            a.end_date || '',
            Array.isArray(a.technologies) ? a.technologies.join('; ') : a.technologies || '',
          ]
            .map(escapeCsvCell)
            .join(',')
        );
      });
    } else if (exportType === 'od') {
      let query = supabase.from('od_requests').select('*, students(name, register_number, year, section)');
      if (status && status !== 'ALL') query = query.eq('status', status);

      const { data: odRequests } = await query.order('submitted_date', { ascending: false });

      const headers = [
        'OD Code',
        'Student Name',
        'Register Number',
        'Year',
        'Section',
        'Purpose',
        'Event Name',
        'Total Days',
        'Start Date',
        'End Date',
        'Status',
        'Remarks / Notes',
      ];
      csvLines.push(headers.map(escapeCsvCell).join(','));

      (odRequests || []).forEach((o: any) => {
        csvLines.push(
          [
            o.code,
            o.students?.name || '',
            o.students?.register_number || '',
            o.students?.year || '',
            o.students?.section || '',
            o.purpose,
            o.event_name,
            o.total_days || 1,
            o.start_date || '',
            o.end_date || '',
            o.status,
            o.remarks || o.rejection_reason || o.revision_notes || '',
          ]
            .map(escapeCsvCell)
            .join(',')
        );
      });
    } else if (exportType === 'review') {
      let query = supabase.from('review_sessions').select('*, activities(title, code, type)');
      if (status && status !== 'ALL') query = query.eq('status', status);

      const { data: reviews } = await query.order('date', { ascending: false });

      const headers = [
        'Session Code',
        'Activity Code',
        'Activity Title',
        'Review Type',
        'Review Number',
        'Date',
        'Time',
        'Venue',
        'Status',
        'Meeting Notes',
        'Next Goal',
      ];
      csvLines.push(headers.map(escapeCsvCell).join(','));

      (reviews || []).forEach((r: any) => {
        csvLines.push(
          [
            r.code,
            r.activities?.code || '',
            r.activities?.title || '',
            r.review_type || 'PROJECT_WEEKLY',
            r.review_number,
            r.date || '',
            r.time || '',
            r.venue || '',
            r.status,
            r.meeting_notes || '',
            r.next_week_goal || '',
          ]
            .map(escapeCsvCell)
            .join(',')
        );
      });
    } else {
      // Default: NAAC/NBA Accreditation Audit Summary
      const { data: activities } = await supabase.from('activities').select('*, students(name, register_number, year)');
      const { data: ods } = await supabase.from('od_requests').select('*, students(name, register_number, year)');

      const headers = ['Record ID', 'Student Name', 'Register Number', 'Year', 'Category', 'Title', 'NAAC Criterion', 'Status', 'Date'];
      csvLines.push(headers.map(escapeCsvCell).join(','));

      (activities || []).forEach((a: any) => {
        const naacCode = a.type === 'PROJECT' ? 'NAAC 1.3.2 (Capstone Projects)' : a.type === 'HACKATHON' ? 'NAAC 5.3.1 (National Hackathons)' : 'NAAC 1.3.3 (Corporate Internships)';
        csvLines.push(
          [
            a.code,
            a.students?.name || '',
            a.students?.register_number || '',
            a.students?.year || '',
            a.type,
            a.title,
            naacCode,
            a.status,
            `${a.start_date || ''} to ${a.end_date || ''}`,
          ]
            .map(escapeCsvCell)
            .join(',')
        );
      });

      (ods || []).forEach((o: any) => {
        csvLines.push(
          [
            o.code,
            o.students?.name || '',
            o.students?.register_number || '',
            o.students?.year || '',
            'ON-DUTY (OD)',
            o.event_name,
            'NAAC 5.3.3 (OD Attendance Concessions)',
            o.status,
            o.start_date || o.submitted_date || '',
          ]
            .map(escapeCsvCell)
            .join(',')
        );
      });
    }

    // Record Audit Log for export action
    await supabase.from('audit_logs').insert({
      actor_id: authUser.id,
      actor_role: 'HOD',
      action_title: `Report CSV Export Generated (${exportType})`,
      details: `HOD exported ${csvLines.length - 1} records as RFC 4180 CSV for type '${exportType}'.`,
      target_id: authUser.id,
    });

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
    console.error('Error in GET /api/v1/reports/export:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
