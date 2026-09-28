-- SIET CSE Department Platform - Development Seed Data
-- Safe, repeatable test accounts for Meena independent foundation testing

-- Clear existing test data
TRUNCATE TABLE public.weekly_progress, public.review_attendance, public.review_sessions,
  public.activity_team_members, public.activities, public.od_team_members, public.od_requests,
  public.events, public.documents, public.notifications, public.audit_logs,
  public.students, public.hods, public.users CASCADE;

-- 1. Insert HOD User & Profile
WITH hod_auth AS (
  INSERT INTO public.users (id, email, name, role)
  VALUES ('00000000-0000-0000-0000-000000000001', 'hod.cse@siet.ac.in', 'Dr. Priya Kumar', 'HOD')
  RETURNING id
)
INSERT INTO public.hods (user_id, name, designation, department)
SELECT id, 'Dr. Priya Kumar', 'Professor & Head of Department', 'CSE' FROM hod_auth;

-- 2. Insert Student A (Meena C - II Year Sec A)
WITH student_a_user AS (
  INSERT INTO public.users (id, email, name, role)
  VALUES ('00000000-0000-0000-0000-000000000002', 'meena.23cse@siet.ac.in', 'Meena C', 'STUDENT')
  RETURNING id
)
INSERT INTO public.students (user_id, register_number, name, department, year, section, email)
SELECT id, '714023104088', 'Meena C', 'CSE', 'II', 'A', 'meena.23cse@siet.ac.in' FROM student_a_user;

-- 3. Insert Student B (Karthik P - II Year Sec A)
WITH student_b_user AS (
  INSERT INTO public.users (id, email, name, role)
  VALUES ('00000000-0000-0000-0000-000000000003', 'karthik.23cse@siet.ac.in', 'Karthik P', 'STUDENT')
  RETURNING id
)
INSERT INTO public.students (user_id, register_number, name, department, year, section, email)
SELECT id, '714023104068', 'Karthik P', 'CSE', 'II', 'A', 'karthik.23cse@siet.ac.in' FROM student_b_user;

-- 4. Insert Student C (Rahul S - II Year Sec B)
WITH student_c_user AS (
  INSERT INTO public.users (id, email, name, role)
  VALUES ('00000000-0000-0000-0000-000000000004', 'rahul.23cse@siet.ac.in', 'Rahul S', 'STUDENT')
  RETURNING id
)
INSERT INTO public.students (user_id, register_number, name, department, year, section, email)
SELECT id, '714023104112', 'Rahul S', 'CSE', 'II', 'B', 'rahul.23cse@siet.ac.in' FROM student_c_user;

-- 5. Insert Student D (Ananya S - I Year Sec A)
WITH student_d_user AS (
  INSERT INTO public.users (id, email, name, role)
  VALUES ('00000000-0000-0000-0000-000000000005', 'ananya.24cse@siet.ac.in', 'Ananya S', 'STUDENT')
  RETURNING id
)
INSERT INTO public.students (user_id, register_number, name, department, year, section, email)
SELECT id, '714024104012', 'Ananya S', 'CSE', 'I', 'A', 'ananya.24cse@siet.ac.in' FROM student_d_user;

-- 6. Insert Student E (Preeti R - III Year Sec A)
WITH student_e_user AS (
  INSERT INTO public.users (id, email, name, role)
  VALUES ('00000000-0000-0000-0000-000000000006', 'preeti.22cse@siet.ac.in', 'Preeti R', 'STUDENT')
  RETURNING id
)
INSERT INTO public.students (user_id, register_number, name, department, year, section, email)
SELECT id, '714022104165', 'Preeti R', 'CSE', 'III', 'A', 'preeti.22cse@siet.ac.in' FROM student_e_user;

-- 7. Insert Student F (Aswin K - IV Year Sec A)
WITH student_f_user AS (
  INSERT INTO public.users (id, email, name, role)
  VALUES ('00000000-0000-0000-0000-000000000007', 'aswin.22cse@siet.ac.in', 'Aswin K', 'STUDENT')
  RETURNING id
)
INSERT INTO public.students (user_id, register_number, name, department, year, section, email)
SELECT id, '714022104032', 'Aswin K', 'CSE', 'IV', 'A', 'aswin.22cse@siet.ac.in' FROM student_f_user;
