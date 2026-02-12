-- Add new patrimony fields for crypto and private equity
ALTER TABLE public.user_financial_profiles
ADD COLUMN IF NOT EXISTS patrimoine_crypto numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS patrimoine_private_equity numeric DEFAULT 0;