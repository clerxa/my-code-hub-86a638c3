-- Add brut income columns for user and spouse
ALTER TABLE public.user_financial_profiles 
  ADD COLUMN IF NOT EXISTS revenu_annuel_brut numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenu_annuel_brut_conjoint numeric DEFAULT 0;