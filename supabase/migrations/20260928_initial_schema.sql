-- SIET CSE Department Platform - Initial PostgreSQL Schema & RLS Policies
-- Aligned to PRD v2.0 and API Contract v2.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Core Auth Profile)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('STUDENT', 'HOD')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  register_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'CSE',
  year TEXT NOT NULL CHECK (year IN ('I', 'II', 'III', 'IV')),
  section TEXT NOT NULL CHECK (section IN ('A', 'B', 'C', 'D', 'E')),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HODs Table
CREATE TABLE IF NOT EXISTS public.hods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  designation TEXT NOT NULL DEFAULT 'Professor & Head of Department',
  department TEXT NOT NULL DEFAULT 'CSE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  purpose TEXT NOT NULL,
  date DATE NOT NULL,
  end_date DATE,
  venue TEXT NOT NULL,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'ONGOING', 'COMPLETED', 'CLOSED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. OD Requests Table
CREATE TABLE IF NOT EXISTS public.od_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  activity_id UUID, -- Foreign key added after activities table creation
  purpose TEXT NOT NULL,
  event_name TEXT NOT NULL,
  organization TEXT,
  reason TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  from_time TIME,
  to_time TIME,
  slot_type TEXT CHECK (slot_type IN ('FULL_DAY', 'FORENOON', 'AFTERNOON', 'CUSTOM_PERIODS')),
  total_days INT NOT NULL DEFAULT 1,
  venue TEXT NOT NULL,
  registration_id TEXT,
  company_name TEXT,
  company_role TEXT,
  company_location TEXT,
  additional_notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED')),
  remarks TEXT,
  rejection_reason TEXT,
  revision_notes TEXT,
  submitted_date TIMESTAMPTZ DEFAULT NOW(),
  approved_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. OD Team Members Table
CREATE TABLE IF NOT EXISTS public.od_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  od_request_id UUID NOT NULL REFERENCES public.od_requests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  register_number TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'MEMBER'
);

-- 7. Activities Table (Projects, Hackathons, Internships)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('PROJECT', 'INTERNSHIP', 'HACKATHON')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  technologies TEXT[],
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  organization TEXT,
  company_name TEXT,
  github_url TEXT,
  demo_url TEXT,
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'ACTIVE', 'REJECTED', 'REVISION_REQUESTED', 'COMPLETED')),
  rejection_reason TEXT,
  revision_notes TEXT,
  od_status TEXT CHECK (od_status IN ('PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED')),
  review_count INT DEFAULT 0,
  guide_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign key link from od_requests to activities
ALTER TABLE public.od_requests
  ADD CONSTRAINT fk_od_activity FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE SET NULL;

-- 8. Activity Team Members Table
CREATE TABLE IF NOT EXISTS public.activity_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  register_number TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'MEMBER'
);

-- 9. Review Sessions Table
CREATE TABLE IF NOT EXISTS public.review_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  review_number INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  venue TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
  meeting_notes TEXT,
  next_week_goal TEXT,
  qr_token TEXT,
  qr_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Review Attendance Table
CREATE TABLE IF NOT EXISTS public.review_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_session_id UUID NOT NULL REFERENCES public.review_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  attended BOOLEAN NOT NULL DEFAULT FALSE,
  check_in_time TIMESTAMPTZ,
  UNIQUE(review_session_id, student_id)
);

-- 11. Weekly Progress Table
CREATE TABLE IF NOT EXISTS public.weekly_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_session_id UUID NOT NULL REFERENCES public.review_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  completed_this_week TEXT NOT NULL,
  currently_working_on TEXT NOT NULL,
  next_week_goal TEXT NOT NULL,
  blockers TEXT NOT NULL,
  github_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_session_id, student_id)
);

-- 12. Documents Table (Polymorphic Storage Metadata)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner TEXT NOT NULL CHECK (owner IN ('od_request', 'activity', 'event')),
  owner_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size BIGINT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. OD Status History Table (Append-Only)
CREATE TABLE IF NOT EXISTS public.od_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  od_request_id UUID NOT NULL REFERENCES public.od_requests(id) ON DELETE CASCADE,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  note TEXT,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Activity Status History Table (Append-Only)
CREATE TABLE IF NOT EXISTS public.activity_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  old_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  note TEXT,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('REVIEW_REMINDER', 'PROGRESS_DUE', 'OD_UPDATE', 'SUBMISSION_UPDATE', 'SYSTEM')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Audit Logs Table (Append-Only)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES public.users(id),
  actor_role TEXT NOT NULL,
  action_title TEXT NOT NULL,
  details TEXT NOT NULL,
  target_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.od_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.od_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.od_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is HOD
CREATE OR REPLACE FUNCTION public.is_hod()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'HOD'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Users RLS
CREATE POLICY "Users can read own record or HOD can read all" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_hod());

-- Students RLS
CREATE POLICY "Students can read own profile or HOD can read all" ON public.students
  FOR SELECT USING (user_id = auth.uid() OR public.is_hod());

-- HODs RLS
CREATE POLICY "Everyone can read HOD profile" ON public.hods
  FOR SELECT USING (TRUE);

-- OD Requests RLS
CREATE POLICY "Students can view own OD requests" ON public.od_requests
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR public.is_hod()
  );

CREATE POLICY "Students can insert own OD requests" ON public.od_requests
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    AND status = 'PENDING'
  );

-- HOD can update decisions (status, remarks, rejection_reason, revision_notes)
CREATE POLICY "HOD can update OD request decision" ON public.od_requests
  FOR UPDATE USING (public.is_hod());

-- Append-Only Protection for History and Audit Tables
CREATE POLICY "Strict read on status history" ON public.od_status_history
  FOR SELECT USING (
    od_request_id IN (
      SELECT id FROM public.od_requests WHERE student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    ) OR public.is_hod()
  );

CREATE POLICY "System insert status history" ON public.od_status_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Revoke UPDATE and DELETE on history tables
REVOKE UPDATE, DELETE ON public.od_status_history FROM PUBLIC, authenticated, anon;
REVOKE UPDATE, DELETE ON public.activity_status_history FROM PUBLIC, authenticated, anon;
REVOKE UPDATE, DELETE ON public.audit_logs FROM PUBLIC, authenticated, anon;
