import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// POST /api/v1/reviews/schedule - HOD Review Session Generator
// Derives schedules automatically based on activity type (PROJECT, HACKATHON, INTERNSHIP)
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireRole(['HOD']);
    const body = await request.json();

    const { activity_id, venue = 'CSE Lab 2 (AI Center)', time = '14:30:00' } = body;

    if (!activity_id) {
      return apiError('VALIDATION_ERROR', 'activity_id is required to schedule reviews.', 400, { field: 'activity_id' });
    }

    const supabase = await createClient();

    // Query target activity
    const { data: activity, error: fetchErr } = await supabase
      .from('activities')
      .select('*')
      .or(`id.eq.${activity_id},code.eq.${activity_id}`)
      .single();

    if (fetchErr || !activity) {
      return apiError('NOT_FOUND', 'Target activity not found.', 404);
    }

    // Check duplicate schedule
    const { data: existingSessions } = await supabase
      .from('review_sessions')
      .select('id')
      .eq('activity_id', activity.id);

    if (existingSessions && existingSessions.length > 0) {
      return apiError(
        'DUPLICATE_SCHEDULE',
        `Review sessions have already been scheduled for activity '${activity.code}'.`,
        400
      );
    }

    const startDate = new Date(activity.start_date);
    const endDate = new Date(activity.end_date);
    const sessionsToInsert: any[] = [];

    // Derive sessions based on activity.type
    if (activity.type === 'PROJECT') {
      // Weekly reviews across duration
      const diffTime = Math.max(1, endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const totalWeeks = Math.max(1, Math.min(16, Math.ceil(diffDays / 7)));

      for (let i = 1; i <= totalWeeks; i++) {
        const revDate = new Date(startDate);
        revDate.setDate(startDate.getDate() + (i - 1) * 7);

        sessionsToInsert.push({
          code: `REV-${activity.code}-W${i}`,
          activity_id: activity.id,
          review_number: i,
          review_type: 'PROJECT_WEEKLY',
          date: revDate.toISOString().split('T')[0],
          time,
          venue,
          status: 'SCHEDULED',
        });
      }
    } else if (activity.type === 'HACKATHON') {
      // Exactly ONE post-hackathon review after end_date
      const postDate = new Date(endDate);
      postDate.setDate(endDate.getDate() + 1);

      sessionsToInsert.push({
        code: `REV-${activity.code}-POST`,
        activity_id: activity.id,
        review_number: 1,
        review_type: 'HACKATHON_POST',
        date: postDate.toISOString().split('T')[0],
        time,
        venue,
        status: 'SCHEDULED',
      });
    } else if (activity.type === 'INTERNSHIP') {
      // Exactly TWO reviews: Midpoint & Final
      const midTime = startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2;
      const midDate = new Date(midTime);
      const finalDate = new Date(endDate);
      finalDate.setDate(endDate.getDate() + 1);

      sessionsToInsert.push(
        {
          code: `REV-${activity.code}-MID`,
          activity_id: activity.id,
          review_number: 1,
          review_type: 'INTERNSHIP_MID',
          date: midDate.toISOString().split('T')[0],
          time,
          venue,
          status: 'SCHEDULED',
        },
        {
          code: `REV-${activity.code}-FINAL`,
          activity_id: activity.id,
          review_number: 2,
          review_type: 'INTERNSHIP_FINAL',
          date: finalDate.toISOString().split('T')[0],
          time,
          venue,
          status: 'SCHEDULED',
        }
      );
    }

    // Insert derived review sessions
    const { data: createdSessions, error: insertErr } = await supabase
      .from('review_sessions')
      .insert(sessionsToInsert)
      .select();

    if (insertErr) {
      console.error('Error inserting review sessions:', insertErr);
      return apiError('DATABASE_ERROR', insertErr.message, 500);
    }

    // Update activity review_count
    await supabase
      .from('activities')
      .update({ review_count: sessionsToInsert.length })
      .eq('id', activity.id);

    // Record Audit Log
    await supabase.from('audit_logs').insert({
      actor_id: authUser.id,
      actor_role: 'HOD',
      action_title: 'Review Schedule Generated',
      details: `Generated ${sessionsToInsert.length} ${activity.type} review sessions for ${activity.code} (${activity.title}).`,
      target_id: activity.id,
    });

    return apiSuccess({
      activityId: activity.id,
      activityCode: activity.code,
      activityType: activity.type,
      sessionCount: createdSessions.length,
      sessions: (createdSessions || []).map((s: any) => ({
        id: s.id,
        code: s.code,
        reviewNumber: s.review_number,
        reviewType: s.review_type,
        date: s.date,
        time: s.time,
        venue: s.venue,
        status: s.status,
      })),
    }, 201);
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    if (err.message === 'FORBIDDEN') {
      return apiError('FORBIDDEN', 'HOD authorization required.', 403);
    }
    console.error('Error in POST /api/v1/reviews/schedule:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}
