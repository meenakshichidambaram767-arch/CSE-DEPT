-- SIET CSE Department Platform - Development Seed Data
-- Safe, repeatable test accounts for Meena independent foundation testing

-- 1. Insert Auth Users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at
) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'hod.cse@siet.ac.in', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Dr. Priya Kumar","role":"HOD"}', 'authenticated', 'authenticated', NOW(), NOW()),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'meena.23cse@siet.ac.in', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Meena C","role":"STUDENT"}', 'authenticated', 'authenticated', NOW(), NOW()),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'karthik.23cse@siet.ac.in', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Karthik P","role":"STUDENT"}', 'authenticated', 'authenticated', NOW(), NOW()),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'rahul.23cse@siet.ac.in', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Rahul S","role":"STUDENT"}', 'authenticated', 'authenticated', NOW(), NOW()),
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'ananya.24cse@siet.ac.in', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Ananya S","role":"STUDENT"}', 'authenticated', 'authenticated', NOW(), NOW()),
('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', 'preeti.22cse@siet.ac.in', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Preeti R","role":"STUDENT"}', 'authenticated', 'authenticated', NOW(), NOW()),
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007', 'aswin.22cse@siet.ac.in', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Aswin K","role":"STUDENT"}', 'authenticated', 'authenticated', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Insert public.users
INSERT INTO public.users (id, email, name, role) VALUES
('00000000-0000-0000-0000-000000000001', 'hod.cse@siet.ac.in', 'Dr. Priya Kumar', 'HOD'),
('00000000-0000-0000-0000-000000000002', 'meena.23cse@siet.ac.in', 'Meena C', 'STUDENT'),
('00000000-0000-0000-0000-000000000003', 'karthik.23cse@siet.ac.in', 'Karthik P', 'STUDENT'),
('00000000-0000-0000-0000-000000000004', 'rahul.23cse@siet.ac.in', 'Rahul S', 'STUDENT'),
('00000000-0000-0000-0000-000000000005', 'ananya.24cse@siet.ac.in', 'Ananya S', 'STUDENT'),
('00000000-0000-0000-0000-000000000006', 'preeti.22cse@siet.ac.in', 'Preeti R', 'STUDENT'),
('00000000-0000-0000-0000-000000000007', 'aswin.22cse@siet.ac.in', 'Aswin K', 'STUDENT')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

-- 3. Insert public.hods
INSERT INTO public.hods (user_id, name, designation, department) VALUES
('00000000-0000-0000-0000-000000000001', 'Dr. Priya Kumar', 'Professor & Head of Department', 'CSE')
ON CONFLICT (user_id) DO NOTHING;

-- 4. Insert public.students
INSERT INTO public.students (user_id, register_number, name, department, year, section, email) VALUES
('00000000-0000-0000-0000-000000000002', '714023104088', 'Meena C', 'CSE', 'II', 'A', 'meena.23cse@siet.ac.in'),
('00000000-0000-0000-0000-000000000003', '714023104068', 'Karthik P', 'CSE', 'II', 'A', 'karthik.23cse@siet.ac.in'),
('00000000-0000-0000-0000-000000000004', '714023104112', 'Rahul S', 'CSE', 'II', 'B', 'rahul.23cse@siet.ac.in'),
('00000000-0000-0000-0000-000000000005', '714024104012', 'Ananya S', 'CSE', 'I', 'A', 'ananya.24cse@siet.ac.in'),
('00000000-0000-0000-0000-000000000006', '714022104165', 'Preeti R', 'CSE', 'III', 'A', 'preeti.22cse@siet.ac.in'),
('00000000-0000-0000-0000-000000000007', '714022104032', 'Aswin K', 'CSE', 'IV', 'A', 'aswin.22cse@siet.ac.in')
ON CONFLICT (user_id) DO NOTHING;
