-- Add new fields to user_financial_profiles for equity, savings, and real estate project types
ALTER TABLE public.user_financial_profiles
ADD COLUMN IF NOT EXISTS date_naissance DATE,
ADD COLUMN IF NOT EXISTS has_rsu_aga BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_espp BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_stock_options BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_bspce BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_pee BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_perco BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS projet_residence_principale BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS projet_residence_secondaire BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS projet_investissement_locatif BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS budget_residence_principale NUMERIC,
ADD COLUMN IF NOT EXISTS budget_residence_secondaire NUMERIC,
ADD COLUMN IF NOT EXISTS budget_investissement_locatif NUMERIC;