import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, requireRole } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// GET /api/v1/events/[id] - Single Event Detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const supabase = await createClient();

    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .or(`id.eq.${id},code.eq.${id}`)
      .single();

    if (error || !event) {
      return apiError('NOT_FOUND', 'Event not found.', 404);
    }

    // Query attached OD requests count & list
    const { data: odRequests } = await supabase
      .from('od_requests')
      .select('id, code, student_id, event_name, status, start_date, end_date')
      .eq('event_id', event.id);

    return apiSuccess({
      id: event.id,
      code: event.code,
      title: event.title,
      purpose: event.purpose,
      date: event.date,
      endDate: event.end_date || event.date,
      venue: event.venue,
      city: event.city || '',
      status: event.status,
      createdAt: event.created_at,
      attachedODs: (odRequests || []).map((od: Record<string, unknown>) => ({
        id: od.id,
        code: od.code,
        status: od.status,
        startDate: od.start_date,
        endDate: od.end_date,
      })),
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    console.error('Error in GET /api/v1/events/[id]:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}

// PUT /api/v1/events/[id] - Update Event (HOD Only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['HOD']);
    const { id } = await params;
    const body = await request.json();

    const supabase = await createClient();

    const { data: event, error: fetchErr } = await supabase
      .from('events')
      .select('*')
      .or(`id.eq.${id},code.eq.${id}`)
      .single();

    if (fetchErr || !event) {
      return apiError('NOT_FOUND', 'Event not found.', 404);
    }

    const {
      title,
      purpose,
      date,
      end_date,
      venue,
      city,
      status,
    } = body;

    const { data: updatedEvent, error: updateErr } = await supabase
      .from('events')
      .update({
        title: title ? title.trim() : event.title,
        purpose: purpose ? purpose.trim() : event.purpose,
        date: date || event.date,
        end_date: end_date || event.end_date,
        venue: venue ? venue.trim() : event.venue,
        city: city !== undefined ? (city ? city.trim() : null) : event.city,
        status: status || event.status,
      })
      .eq('id', event.id)
      .select()
      .single();

    if (updateErr) {
      console.error('Error updating event:', updateErr);
      return apiError('DATABASE_ERROR', updateErr.message, 500);
    }

    return apiSuccess({
      id: updatedEvent.id,
      code: updatedEvent.code,
      title: updatedEvent.title,
      purpose: updatedEvent.purpose,
      date: updatedEvent.date,
      endDate: updatedEvent.end_date,
      venue: updatedEvent.venue,
      city: updatedEvent.city,
      status: updatedEvent.status,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'HOD authorization required.', 403);
    }
    console.error('Error in PUT /api/v1/events/[id]:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}

// DELETE /api/v1/events/[id] - Soft-delete / Close Event (HOD Only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['HOD']);
    const { id } = await params;
    const supabase = await createClient();

    const { data: event, error: fetchErr } = await supabase
      .from('events')
      .select('*')
      .or(`id.eq.${id},code.eq.${id}`)
      .single();

    if (fetchErr || !event) {
      return apiError('NOT_FOUND', 'Event not found.', 404);
    }

    const { data: updatedEvent, error: updateErr } = await supabase
      .from('events')
      .update({ status: 'CLOSED' })
      .eq('id', event.id)
      .select()
      .single();

    if (updateErr) {
      return apiError('DATABASE_ERROR', updateErr.message, 500);
    }

    return apiSuccess({
      id: updatedEvent.id,
      code: updatedEvent.code,
      title: updatedEvent.title,
      status: 'CLOSED',
      message: 'Event successfully closed.',
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'HOD authorization required.', 403);
    }
    console.error('Error in DELETE /api/v1/events/[id]:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
