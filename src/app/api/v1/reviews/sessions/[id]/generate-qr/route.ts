import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// POST /api/v1/reviews/sessions/[id]/generate-qr - Dynamic QR Generator (HOD Only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireRole(['HOD']);
    const { id } = await params;
    const supabase = await createClient();

    // Query session
    const { data: session, error: fetchErr } = await supabase
      .from('review_sessions')
      .select('*')
      .or(`id.eq.${id},code.eq.${id}`)
      .single();

    if (fetchErr || !session) {
      return apiError('NOT_FOUND', 'Review session not found.', 404);
    }

    if (session.status !== 'SCHEDULED') {
      return apiError(
        'INVALID_STATE',
        `Cannot generate QR for review session in '${session.status}' status.`,
        400
      );
    }

    // Generate random 32-hex cryptographic token
    const qrToken = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins validity

    const { data: updatedSession, error: updateErr } = await supabase
      .from('review_sessions')
      .update({
        qr_token: qrToken,
        qr_expires_at: expiresAt,
      })
      .eq('id', session.id)
      .select()
      .single();

    if (updateErr) {
      console.error('Error saving QR token:', updateErr);
      return apiError('DATABASE_ERROR', updateErr.message, 500);
    }

    return apiSuccess({
      sessionId: updatedSession.id,
      sessionCode: updatedSession.code,
      qrToken: updatedSession.qr_token,
      qrExpiresAt: updatedSession.qr_expires_at,
      expiresInSeconds: 900,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'HOD authorization required.', 403);
    }
    console.error('Error in POST /api/v1/reviews/sessions/[id]/generate-qr:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
