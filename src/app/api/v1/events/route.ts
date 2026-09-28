import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requireRole } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// GET /api/v1/events - List Department Events
export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '20', 10);

    const supabase = await createClient();

    let query = supabase
      .from('events')
      .select('*', { count: 'exact' });

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }
    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      query = query.or(`title.ilike.${q},venue.ilike.${q},city.ilike.${q},code.ilike.${q}`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: rawEvents, count, error } = await query
      .order('date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error querying events:', error);
      return apiError('QUERY_ERROR', error.message, 500);
    }

    const formattedEvents = (rawEvents || []).map((e: any) => ({
      id: e.id,
      code: e.code,
      title: e.title,
      purpose: e.purpose,
      date: e.date,
      endDate: e.end_date || e.date,
      venue: e.venue,
      city: e.city || '',
      status: e.status,
      createdAt: e.created_at,
    }));

    return apiSuccess(formattedEvents, 200, {
      page,
      page_size: pageSize,
      total: count || 0,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    console.error('Error in GET /api/v1/events:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}

// POST /api/v1/events - Create New Department Event (HOD Only)
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(['HOD']);
    const body = await request.json();

    const {
      code,
      title,
      purpose,
      date,
      end_date,
      venue,
      city,
      status = 'UPCOMING',
    } = body;

    // Validation
    if (!title || !title.trim()) {
      return apiError('VALIDATION_ERROR', 'Event title is required.', 400, { field: 'title' });
    }
    if (!purpose || !purpose.trim()) {
      return apiError('VALIDATION_ERROR', 'Event purpose is required.', 400, { field: 'purpose' });
    }
    if (!date) {
      return apiError('VALIDATION_ERROR', 'Event date is required.', 400, { field: 'date' });
    }
    if (!venue || !venue.trim()) {
      return apiError('VALIDATION_ERROR', 'Venue is required.', 400, { field: 'venue' });
    }

    const supabase = await createClient();

    // Auto-generate code EVT-2026-NNN if not provided
    let eventCode = code;
    if (!eventCode) {
      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });
      eventCode = `EVT-2026-${String((count || 0) + 1).padStart(3, '0')}`;
    }

    const { data: newEvent, error: insertError } = await supabase
      .from('events')
      .insert({
        code: eventCode,
        title: title.trim(),
        purpose: purpose.trim(),
        date,
        end_date: end_date || date,
        venue: venue.trim(),
        city: city ? city.trim() : null,
        status,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting event:', insertError);
      return apiError('DATABASE_ERROR', insertError.message, 500);
    }

    return apiSuccess(
      {
        id: newEvent.id,
        code: newEvent.code,
        title: newEvent.title,
        purpose: newEvent.purpose,
        date: newEvent.date,
        endDate: newEvent.end_date,
        venue: newEvent.venue,
        city: newEvent.city,
        status: newEvent.status,
        createdAt: newEvent.created_at,
      },
      201
    );
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'HOD authorization required.', 403);
    }
    console.error('Error in POST /api/v1/events:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
