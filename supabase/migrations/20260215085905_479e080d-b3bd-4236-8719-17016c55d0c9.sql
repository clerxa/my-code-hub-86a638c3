
-- Add columns for external invitation workflow
ALTER TABLE public.colleague_invitations 
  ADD COLUMN IF NOT EXISTS is_external boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_company_name text;
