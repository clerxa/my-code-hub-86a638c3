ALTER TABLE public.user_financial_profiles 
ADD COLUMN IF NOT EXISTS buffer_depenses_imprevues_pct integer NOT NULL DEFAULT 0;