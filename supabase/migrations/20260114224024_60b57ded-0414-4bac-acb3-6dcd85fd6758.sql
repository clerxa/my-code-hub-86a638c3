-- Add new fields to user_financial_profiles for enhanced income tracking
ALTER TABLE public.user_financial_profiles
ADD COLUMN IF NOT EXISTS revenu_annuel_conjoint NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_equity_income_this_year BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS equity_income_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS revenus_dividendes NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS revenus_ventes_actions NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS revenus_capital_autres NUMERIC DEFAULT 0;

-- Add objectives field to profiles table to store onboarding objectives
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS objectives TEXT[] DEFAULT '{}';