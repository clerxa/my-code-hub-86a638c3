ALTER TABLE public.user_financial_profiles 
ADD COLUMN IF NOT EXISTS charges_impot_mensuel numeric DEFAULT 0;