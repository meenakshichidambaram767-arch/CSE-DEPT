-- Migration: 20261021_allow_draft_documents.sql
-- Description: Allow draft document uploads prior to OD or Activity creation,
-- and support linking documents via document_ids on insert/resubmit.
-- NOTE: Unapplied to remote Supabase as per ground rules.

-- 1. Relax NOT NULL constraints on owner and owner_id to support initial draft uploads
ALTER TABLE public.documents ALTER COLUMN owner DROP NOT NULL;
ALTER TABLE public.documents ALTER COLUMN owner_id DROP NOT NULL;

-- 2. Allow 'draft' as valid owner or permit NULL
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_owner_check;
ALTER TABLE public.documents ADD CONSTRAINT documents_owner_check CHECK (owner IS NULL OR owner IN ('od_request', 'activity', 'event', 'draft'));

-- 3. Index owner and owner_id for efficient polymorphic document queries
CREATE INDEX IF NOT EXISTS idx_documents_owner ON public.documents(owner, owner_id);
