-- Migration: 20260928_atomic_activity_decision.sql
-- Description: Atomic PostgreSQL RPC function for HOD activity decisions (PROJECT, HACKATHON, INTERNSHIP)
-- Enforces ACID transactional updates across activities, activity_status_history, audit_logs, and notifications.

CREATE OR REPLACE FUNCTION public.exec_hod_activity_decision(
  p_activity_id UUID,
  p_actor_id UUID,
  p_decision TEXT,
  p_remarks TEXT DEFAULT NULL,
  p_rejection_reason TEXT DEFAULT NULL,
  p_revision_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role TEXT;
  v_act RECORD;
  v_student_user_id UUID;
  v_now TIMESTAMPTZ := NOW();
  v_final_note TEXT;
  v_notif_title TEXT;
  v_notif_message TEXT;
  v_result JSONB;
BEGIN
  -- 1. Authorization check: verify actor is HOD
  SELECT role INTO v_actor_role
  FROM public.users
  WHERE id = p_actor_id;

  IF v_actor_role IS NULL OR v_actor_role <> 'HOD' THEN
    RAISE EXCEPTION 'FORBIDDEN: Only authorized HOD can execute activity decisions.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Standardize 'APPROVED' to 'ACTIVE' for activity status machine
  IF p_decision = 'APPROVED' THEN
    p_decision := 'ACTIVE';
  END IF;

  -- 2. Validate decision enum
  IF p_decision NOT IN ('ACTIVE', 'REJECTED', 'REVISION_REQUESTED') THEN
    RAISE EXCEPTION 'INVALID_DECISION: Decision must be ACTIVE, REJECTED, or REVISION_REQUESTED.'
      USING ERRCODE = 'P0002';
  END IF;

  -- 3. Validate mandatory fields
  IF p_decision = 'REJECTED' AND (p_rejection_reason IS NULL OR TRIM(p_rejection_reason) = '') THEN
    RAISE EXCEPTION 'REJECTION_REASON_REQUIRED: Rejection reason must be provided.'
      USING ERRCODE = 'P0003';
  END IF;

  IF p_decision = 'REVISION_REQUESTED' AND (p_revision_notes IS NULL OR TRIM(p_revision_notes) = '') THEN
    RAISE EXCEPTION 'REVISION_NOTES_REQUIRED: Revision notes must be provided.'
      USING ERRCODE = 'P0004';
  END IF;

  -- 4. Lock & Re-read Activity row (FOR UPDATE)
  SELECT a.*, s.user_id AS student_user_id, s.name AS student_name
  INTO v_act
  FROM public.activities a
  JOIN public.students s ON s.id = a.student_id
  WHERE a.id = p_activity_id
  FOR UPDATE OF a;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Activity proposal not found.'
      USING ERRCODE = 'P0005';
  END IF;

  -- 5. Validate current status (State Machine check)
  IF v_act.status <> 'SUBMITTED' THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Cannot execute decision on activity in % status. Only SUBMITTED activities can be decided.', v_act.status
      USING ERRCODE = 'P0006';
  END IF;

  -- Determine final note
  IF p_decision = 'ACTIVE' THEN
    v_final_note := COALESCE(NULLIF(TRIM(p_remarks), ''), 'Approved & set to ACTIVE by HOD.');
  ELSIF p_decision = 'REJECTED' THEN
    v_final_note := TRIM(p_rejection_reason);
  ELSE
    v_final_note := TRIM(p_revision_notes);
  END IF;

  -- 6. Atomically update activities
  UPDATE public.activities
  SET
    status = p_decision,
    rejection_reason = CASE WHEN p_decision = 'REJECTED' THEN TRIM(p_rejection_reason) ELSE NULL END,
    revision_notes = CASE WHEN p_decision = 'REVISION_REQUESTED' THEN TRIM(p_revision_notes) ELSE NULL END,
    updated_at = v_now
  WHERE id = p_activity_id;

  -- 7. Atomically insert activity status history
  INSERT INTO public.activity_status_history (
    activity_id,
    old_status,
    new_status,
    note,
    changed_by,
    changed_at
  ) VALUES (
    p_activity_id,
    'SUBMITTED',
    p_decision,
    v_final_note,
    p_actor_id,
    v_now
  );

  -- 8. Atomically insert audit log
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
    'Activity ' || p_decision,
    'HOD executed decision ''' || p_decision || ''' for ' || v_act.type || ' proposal ' || v_act.code || ' (' || v_act.title || '). Note: "' || v_final_note || '".',
    p_activity_id,
    v_now
  );

  -- 9. Atomically insert student notification
  v_student_user_id := v_act.student_user_id;
  IF v_student_user_id IS NOT NULL THEN
    IF p_decision = 'ACTIVE' THEN
      v_notif_title := v_act.type || ' Approved: ' || v_act.title;
      v_notif_message := 'Your ' || LOWER(v_act.type) || ' proposal "' || v_act.title || '" has been approved by HOD and set to ACTIVE.';
    ELSIF p_decision = 'REJECTED' THEN
      v_notif_title := v_act.type || ' Proposal Rejected: ' || v_act.title;
      v_notif_message := 'HOD Reason: "' || TRIM(p_rejection_reason) || '".';
    ELSE
      v_notif_title := v_act.type || ' Revision Requested: ' || v_act.title;
      v_notif_message := 'HOD Directive: "' || TRIM(p_revision_notes) || '". Please update and resubmit.';
    END IF;

    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      is_read,
      link_url,
      created_at
    ) VALUES (
      v_student_user_id,
      v_notif_title,
      v_notif_message,
      'SUBMISSION_UPDATE',
      FALSE,
      '/student/activities/' || p_activity_id,
      v_now
    );
  END IF;

  -- 10. Return json payload matching API Contract v2.0
  SELECT jsonb_build_object(
    'id', a.id,
    'code', a.code,
    'studentId', a.student_id,
    'studentName', v_act.student_name,
    'type', a.type,
    'title', a.title,
    'status', a.status,
    'rejectionReason', a.rejection_reason,
    'revisionNotes', a.revision_notes,
    'updatedAt', a.updated_at
  ) INTO v_result
  FROM public.activities a
  WHERE a.id = p_activity_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.exec_hod_activity_decision(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
