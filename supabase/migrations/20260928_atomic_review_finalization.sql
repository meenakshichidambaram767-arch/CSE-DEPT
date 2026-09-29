-- Migration: 20260928_atomic_review_finalization.sql
-- Description: Minimal review_type column addition and atomic stored procedure exec_hod_finalize_review

-- 1. Add review_type column if not exists
ALTER TABLE public.review_sessions
  ADD COLUMN IF NOT EXISTS review_type TEXT DEFAULT 'PROJECT_WEEKLY'
  CHECK (review_type IN ('PROJECT_WEEKLY', 'HACKATHON_POST', 'INTERNSHIP_MID', 'INTERNSHIP_FINAL'));

-- 2. Atomic Stored Procedure for Review Finalization
CREATE OR REPLACE FUNCTION public.exec_hod_finalize_review(
  p_session_id UUID,
  p_actor_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_next_goal TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role TEXT;
  v_session RECORD;
  v_act RECORD;
  v_now TIMESTAMPTZ := NOW();
  v_result JSONB;
BEGIN
  -- 1. Authorization check: verify actor is HOD
  SELECT role INTO v_actor_role
  FROM public.users
  WHERE id = p_actor_id;

  IF v_actor_role IS NULL OR v_actor_role <> 'HOD' THEN
    RAISE EXCEPTION 'FORBIDDEN: Only authorized HOD can finalize review sessions.'
      USING ERRCODE = 'P0001';
  END IF;

  -- 2. Lock & Re-read Review Session row (FOR UPDATE)
  SELECT rs.*
  INTO v_session
  FROM public.review_sessions rs
  WHERE rs.id = p_session_id
  FOR UPDATE OF rs;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Review session not found.'
      USING ERRCODE = 'P0005';
  END IF;

  -- 3. Precondition check: verify status is SCHEDULED
  IF v_session.status <> 'SCHEDULED' THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Cannot finalize review session in % status. Only SCHEDULED sessions can be finalized.', v_session.status
      USING ERRCODE = 'P0006';
  END IF;

  -- Read target activity info
  SELECT * INTO v_act FROM public.activities WHERE id = v_session.activity_id;

  -- 4. Atomically update review_sessions
  UPDATE public.review_sessions
  SET
    status = 'COMPLETED',
    meeting_notes = NULLIF(TRIM(p_notes), ''),
    next_week_goal = NULLIF(TRIM(p_next_goal), '')
  WHERE id = p_session_id;

  -- 5. Atomically insert audit log
  INSERT INTO public.audit_logs (
    actor_id,
    actor_role,
    action_title,
    details,
    target_id,
    created_at
  ) VALUES (
    p_actor_id,
    'HOD',
    'Review Finalized: ' || v_session.code,
    'HOD finalized review session ' || v_session.code || ' for activity ' || COALESCE(v_act.title, 'Activity') || '. Notes: "' || COALESCE(TRIM(p_notes), 'None') || '".',
    p_session_id,
    v_now
  );

  -- 6. Atomically notify applicant student
  IF v_act.student_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      is_read,
      link_url,
      created_at
    )
    SELECT
      s.user_id,
      'Review Finalized: ' || COALESCE(v_act.title, 'Activity'),
      'HOD completed review session ' || v_session.code || '. Meeting notes & next goals recorded.',
      'REVIEW_REMINDER',
      FALSE,
      '/student/reviews',
      v_now
    FROM public.students s
    WHERE s.id = v_act.student_id AND s.user_id IS NOT NULL;
  END IF;

  -- 7. Return json payload matching API Contract v2.0
  SELECT jsonb_build_object(
    'id', rs.id,
    'code', rs.code,
    'activityId', rs.activity_id,
    'reviewNumber', rs.review_number,
    'reviewType', rs.review_type,
    'date', rs.date,
    'status', rs.status,
    'meetingNotes', rs.meeting_notes,
    'nextWeekGoal', rs.next_week_goal
  ) INTO v_result
  FROM public.review_sessions rs
  WHERE rs.id = p_session_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.exec_hod_finalize_review(UUID, UUID, TEXT, TEXT) TO authenticated, service_role;
