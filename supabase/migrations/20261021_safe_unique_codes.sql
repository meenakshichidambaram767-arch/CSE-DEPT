-- Migration: 20261021_safe_unique_codes.sql
-- Description: Collision-safe unique code generators for OD requests and activities.
-- Avoids RLS count collisions where two students concurrently generate identical codes.
-- NOTE: Unapplied to remote Supabase as per ground rules.

-- 1. Create sequences for OD and Activities if they do not exist
CREATE SEQUENCE IF NOT EXISTS public.od_request_code_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.activity_code_seq START WITH 1;

-- 2. Safe OD Request Code Generator
CREATE OR REPLACE FUNCTION public.generate_safe_od_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq_val BIGINT;
  v_code TEXT;
  v_exists BOOLEAN;
  v_year TEXT := to_char(CURRENT_DATE, 'YYYY');
BEGIN
  LOOP
    v_seq_val := nextval('public.od_request_code_seq');
    v_code := 'OD-' || v_year || '-' || lpad(v_seq_val::text, 3, '0');
    
    -- Ensure no collision with manually inserted codes
    SELECT EXISTS (
      SELECT 1 FROM public.od_requests WHERE code = v_code
    ) INTO v_exists;
    
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$;

-- 3. Safe Activity Code Generator
CREATE OR REPLACE FUNCTION public.generate_safe_activity_code(p_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix TEXT;
  v_seq_val BIGINT;
  v_code TEXT;
  v_exists BOOLEAN;
  v_year TEXT := to_char(CURRENT_DATE, 'YYYY');
BEGIN
  IF p_type = 'HACKATHON' THEN
    v_prefix := 'HAK';
  ELSIF p_type = 'INTERNSHIP' THEN
    v_prefix := 'INT';
  ELSE
    v_prefix := 'PRJ';
  END IF;

  LOOP
    v_seq_val := nextval('public.activity_code_seq');
    v_code := v_prefix || '-' || v_year || '-' || lpad(v_seq_val::text, 3, '0');
    
    -- Ensure no collision
    SELECT EXISTS (
      SELECT 1 FROM public.activities WHERE code = v_code
    ) INTO v_exists;
    
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$;

-- 4. Grant execute permissions to authenticated users and service_role
GRANT EXECUTE ON FUNCTION public.generate_safe_od_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_safe_activity_code(TEXT) TO authenticated, service_role;
