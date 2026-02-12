-- Add new fields to user_financial_profiles table
ALTER TABLE public.user_financial_profiles 
ADD COLUMN IF NOT EXISTS has_pero boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_epargne_autres boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_equity_autres boolean DEFAULT false;