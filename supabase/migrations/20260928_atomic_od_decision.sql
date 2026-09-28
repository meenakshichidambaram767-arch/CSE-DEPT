-- Migration: 20260928_atomic_od_decision.sql
-- Description: Atomic PostgreSQL RPC function for HOD OD decisions
-- Enforces ACID transactional updates across od_requests, od_status_history, audit_logs, and notifications.

CREATE OR REPLACE FUNCTION public.exec_hod_od_decision(
  p_od_id UUID,
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
  v_od RECORD;
  v_student_user_id UUID;
  v_now TIMESTAMPTZ := NOW();
  v_approved_date TIMESTAMPTZ := NULL;
  v_final_note TEXT;
  v_notif_title TEXT;
  v_notif_message TEXT;
  v_result JSONB;
BEGIN
  -- 1. Authorization check: verify actor exists and is HOD
  SELECT role INTO v_actor_role
  FROM public.users
  WHERE id = p_actor_id;

  IF v_actor_role IS NULL OR v_actor_role <> 'HOD' THEN
    RAISE EXCEPTION 'FORBIDDEN: Only authorized HOD can execute decisions.'
      USING ERRCODE = 'P0001';
  END IF;

  -- 2. Validate decision enum
  IF p_decision NOT IN ('APPROVED', 'REJECTED', 'REVISION_REQUESTED') THEN
    RAISE EXCEPTION 'INVALID_DECISION: Decision must be APPROVED, REJECTED, or REVISION_REQUESTED.'
      USING ERRCODE = 'P0002';
  END IF;

  -- 3. Validate mandatory fields per API Contract v2.0
  IF p_decision = 'REJECTED' AND (p_rejection_reason IS NULL OR TRIM(p_rejection_reason) = '') THEN
    RAISE EXCEPTION 'REJECTION_REASON_REQUIRED: Rejection reason must be provided.'
      USING ERRCODE = 'P0003';
  END IF;

  IF p_decision = 'REVISION_REQUESTED' AND (p_revision_notes IS NULL OR TRIM(p_revision_notes) = '') THEN
    RAISE EXCEPTION 'REVISION_NOTES_REQUIRED: Revision notes must be provided.'
      USING ERRCODE = 'P0004';
  END IF;

  -- 4. Lock & Re-read OD request row to handle concurrent decisions safely (FOR UPDATE)
  SELECT od.*, s.user_id AS student_user_id, s.name AS student_name
  INTO v_od
  FROM public.od_requests od
  JOIN public.students s ON s.id = od.student_id
  WHERE od.id = p_od_id
  FOR UPDATE OF od;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: OD request not found.'
      USING ERRCODE = 'P0005';
  END IF;

  -- 5. Validate current status (State Machine check)
  IF v_od.status <> 'PENDING' THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Cannot execute decision on request in % status. Only PENDING requests can be decided.', v_od.status
      USING ERRCODE = 'P0006';
  END IF;

  -- Determine approved_date & final note
  IF p_decision = 'APPROVED' THEN
    v_approved_date := v_now;
    v_final_note := COALESCE(NULLIF(TRIM(p_remarks), ''), 'Approved by HOD.');
  ELSIF p_decision = 'REJECTED' THEN
    v_final_note := TRIM(p_rejection_reason);
  ELSE
    v_final_note := TRIM(p_revision_notes);
  END IF;

  -- 6. Atomically update od_requests
  UPDATE public.od_requests
  SET
    status = p_decision,
    remarks = NULLIF(TRIM(p_remarks), ''),
    rejection_reason = CASE WHEN p_decision = 'REJECTED' THEN TRIM(p_rejection_reason) ELSE NULL END,
    revision_notes = CASE WHEN p_decision = 'REVISION_REQUESTED' THEN TRIM(p_revision_notes) ELSE NULL END,
    approved_date = v_approved_date,
    updated_at = v_now
  WHERE id = p_od_id;

  -- 7. Atomically insert status history
  INSERT INTO public.od_status_history (
    od_request_id,
    old_status,
    new_status,
    note,
    changed_by,
    changed_at
  ) VALUES (
    p_od_id,
    'PENDING',
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
    'OD Request ' || p_decision,
    'HOD executed decision ''' || p_decision || ''' for request ' || v_od.code || ' (' || v_od.event_name || '). Note: "' || v_final_note || '".',
    p_od_id,
    v_now
  );

  -- 9. Atomically insert student notification
  v_student_user_id := v_od.student_user_id;
  IF v_student_user_id IS NOT NULL THEN
    IF p_decision = 'APPROVED' THEN
      v_notif_title := 'OD Request Approved: ' || v_od.event_name;
      v_notif_message := 'Your OD request for "' || v_od.event_name || '" has been approved by HOD.';
    ELSIF p_decision = 'REJECTED' THEN
      v_notif_title := 'OD Request Rejected: ' || v_od.event_name;
      v_notif_message := 'HOD Reason: "' || TRIM(p_rejection_reason) || '".';
    ELSE
      v_notif_title := 'OD Revision Requested: ' || v_od.event_name;
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
      'OD_UPDATE',
      FALSE,
      '/student/od-requests/' || p_od_id,
      v_now
    );
  END IF;

  -- 10. Return json payload matching API Contract v2.0
  SELECT jsonb_build_object(
    'id', od.id,
    'code', od.code,
    'studentId', od.student_id,
    'studentName', v_od.student_name,
    'eventName', od.event_name,
    'status', od.status,
    'remarks', od.remarks,
    'rejectionReason', od.rejection_reason,
    'revisionNotes', od.revision_notes,
    'approvedDate', od.approved_date
  ) INTO v_result
  FROM public.od_requests od
  WHERE od.id = p_od_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.exec_hod_od_decision(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
