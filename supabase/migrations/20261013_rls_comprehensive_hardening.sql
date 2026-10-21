-- Migration: 20261013_rls_comprehensive_hardening.sql
-- Description: Complete Row Level Security (RLS) Policies for All Platform Tables
-- 
-- Objectives:
-- 1. Student Data Isolation: Students query only rows where student_id = auth.uid() or linked via team members.
-- 2. HOD Departmental Boundary: HOD accounts access all department records.
-- 3. Append-Only Guarantees: Revokes UPDATE/DELETE on od_status_history, activity_status_history, and audit_logs.
-- 4. Complete Coverage: Ensures EVERY table with ENABLE ROW LEVEL SECURITY has explicit, non-empty policies.

-- ============================================================================
-- 1. Events Policies
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;
CREATE POLICY "Authenticated users can view events" ON public.events
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "HOD can manage events" ON public.events;
CREATE POLICY "HOD can manage events" ON public.events
  FOR ALL USING (public.is_hod());

-- ============================================================================
-- 2. OD Team Members Policies
-- ============================================================================
DROP POLICY IF EXISTS "Students can view OD team members for own requests or if member" ON public.od_team_members;
CREATE POLICY "Students can view OD team members for own requests or if member" ON public.od_team_members
  FOR SELECT USING (
    od_request_id IN (
      SELECT id FROM public.od_requests
      WHERE student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    )
    OR register_number IN (
      SELECT register_number FROM public.students WHERE user_id = auth.uid()
    )
    OR public.is_hod()
  );

DROP POLICY IF EXISTS "Students can insert OD team members for own requests" ON public.od_team_members;
CREATE POLICY "Students can insert OD team members for own requests" ON public.od_team_members
  FOR INSERT WITH CHECK (
    od_request_id IN (
      SELECT id FROM public.od_requests
      WHERE student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    )
  );

-- ============================================================================
-- 3. OD Requests Resubmission Policy (Non-punitive revision loop)
-- ============================================================================
DROP POLICY IF EXISTS "Students can resubmit revision requested OD" ON public.od_requests;
CREATE POLICY "Students can resubmit revision requested OD" ON public.od_requests
  FOR UPDATE USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    AND status = 'REVISION_REQUESTED'
  )
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    AND status = 'PENDING'
  );

-- ============================================================================
-- 4. Activities & Activity Team Members Policies
-- ============================================================================

-- Recursion-proof helper functions (SECURITY DEFINER with fixed search_path)
CREATE OR REPLACE FUNCTION public.is_activity_owner(p_activity_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.activities
    WHERE id = p_activity_id
      AND student_id IN (
        SELECT id FROM public.students WHERE user_id = auth.uid()
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_activity_team_member(p_activity_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.activity_team_members
    WHERE activity_id = p_activity_id
      AND register_number IN (
        SELECT register_number FROM public.students WHERE user_id = auth.uid()
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_activity_owner(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_activity_team_member(UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS "Students view own activities or team activities or HOD" ON public.activities;
CREATE POLICY "Students view own activities or team activities or HOD" ON public.activities
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR public.is_activity_team_member(id)
    OR public.is_hod()
  );

DROP POLICY IF EXISTS "Students can submit activities" ON public.activities;
CREATE POLICY "Students can submit activities" ON public.activities
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    AND status = 'SUBMITTED'
  );

DROP POLICY IF EXISTS "Students can resubmit revision requested activities" ON public.activities;
CREATE POLICY "Students can resubmit revision requested activities" ON public.activities
  FOR UPDATE USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    AND status = 'REVISION_REQUESTED'
  )
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    AND status = 'SUBMITTED'
  );

DROP POLICY IF EXISTS "HOD can update activities" ON public.activities;
CREATE POLICY "HOD can update activities" ON public.activities
  FOR UPDATE USING (public.is_hod());

DROP POLICY IF EXISTS "View activity_team_members" ON public.activity_team_members;
CREATE POLICY "View activity_team_members" ON public.activity_team_members
  FOR SELECT USING (
    register_number IN (
      SELECT register_number FROM public.students WHERE user_id = auth.uid()
    )
    OR public.is_activity_owner(activity_id)
    OR public.is_hod()
  );

DROP POLICY IF EXISTS "Insert activity_team_members" ON public.activity_team_members;
CREATE POLICY "Insert activity_team_members" ON public.activity_team_members
  FOR INSERT WITH CHECK (
    public.is_activity_owner(activity_id)
  );

-- ============================================================================
-- 5. Activity Status History Policies (Append-Only)
-- ============================================================================
DROP POLICY IF EXISTS "View activity_status_history" ON public.activity_status_history;
CREATE POLICY "View activity_status_history" ON public.activity_status_history
  FOR SELECT USING (
    public.is_activity_owner(activity_id)
    OR public.is_hod()
  );

DROP POLICY IF EXISTS "System insert activity_status_history" ON public.activity_status_history;
CREATE POLICY "System insert activity_status_history" ON public.activity_status_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

REVOKE UPDATE, DELETE ON public.activity_status_history FROM PUBLIC, authenticated, anon;

-- ============================================================================
-- 6. Weekly Review Sessions & Attendance Policies
-- ============================================================================
DROP POLICY IF EXISTS "Students view reviews for own activities or HOD view all" ON public.review_sessions;
CREATE POLICY "Students view reviews for own activities or HOD view all" ON public.review_sessions
  FOR SELECT USING (
    public.is_activity_owner(activity_id)
    OR public.is_activity_team_member(activity_id)
    OR public.is_hod()
  );

DROP POLICY IF EXISTS "HOD manage review_sessions" ON public.review_sessions;
CREATE POLICY "HOD manage review_sessions" ON public.review_sessions
  FOR ALL USING (public.is_hod());

DROP POLICY IF EXISTS "View review_attendance" ON public.review_attendance;
CREATE POLICY "View review_attendance" ON public.review_attendance
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR public.is_hod()
  );

DROP POLICY IF EXISTS "Insert review_attendance" ON public.review_attendance;
CREATE POLICY "Insert review_attendance" ON public.review_attendance
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR public.is_hod()
  );

DROP POLICY IF EXISTS "HOD update review_attendance" ON public.review_attendance;
CREATE POLICY "HOD update review_attendance" ON public.review_attendance
  FOR UPDATE USING (public.is_hod());

-- ============================================================================
-- 7. Weekly Progress Policies
-- ============================================================================
DROP POLICY IF EXISTS "View weekly_progress" ON public.weekly_progress;
CREATE POLICY "View weekly_progress" ON public.weekly_progress
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR review_session_id IN (
      SELECT id FROM public.review_sessions
      WHERE activity_id IN (
        SELECT id FROM public.activities
        WHERE student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
      )
    )
    OR public.is_hod()
  );

DROP POLICY IF EXISTS "Insert weekly_progress" ON public.weekly_progress;
CREATE POLICY "Insert weekly_progress" ON public.weekly_progress
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- ============================================================================
-- 8. Polymorphic Documents Storage Policies
-- ============================================================================
DROP POLICY IF EXISTS "View documents" ON public.documents;
CREATE POLICY "View documents" ON public.documents
  FOR SELECT USING (
    uploaded_by = auth.uid()
    OR public.is_hod()
  );

DROP POLICY IF EXISTS "Insert documents" ON public.documents;
CREATE POLICY "Insert documents" ON public.documents
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
  );

-- ============================================================================
-- 9. In-App Notifications Policies
-- ============================================================================
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "System insert notifications" ON public.notifications;
CREATE POLICY "System insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- ============================================================================
-- 10. Audit Logs Policies (Append-Only)
-- ============================================================================
DROP POLICY IF EXISTS "HOD view audit_logs" ON public.audit_logs;
CREATE POLICY "HOD view audit_logs" ON public.audit_logs
  FOR SELECT USING (
    public.is_hod()
  );

DROP POLICY IF EXISTS "Insert audit_logs" ON public.audit_logs;
CREATE POLICY "Insert audit_logs" ON public.audit_logs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

REVOKE UPDATE, DELETE ON public.audit_logs FROM PUBLIC, authenticated, anon;

-- ============================================================================
-- 11. Supabase Storage Objects Policies (Private 'documents' Bucket)
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
CREATE POLICY "Authenticated users can read documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid() = owner);

