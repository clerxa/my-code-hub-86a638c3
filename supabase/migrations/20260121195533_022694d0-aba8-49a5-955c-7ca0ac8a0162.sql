-- Ajout des champs pour les valeurs estimées des dispositifs professionnels
ALTER TABLE public.user_financial_profiles
ADD COLUMN IF NOT EXISTS valeur_rsu_aga numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS valeur_espp numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS valeur_stock_options numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS valeur_bspce numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS valeur_pee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS valeur_perco numeric DEFAULT 0;