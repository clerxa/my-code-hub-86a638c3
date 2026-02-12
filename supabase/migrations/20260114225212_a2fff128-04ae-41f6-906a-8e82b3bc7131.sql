-- Add financial_summary column to store the generated AI synthesis
ALTER TABLE public.user_financial_profiles
ADD COLUMN IF NOT EXISTS financial_summary TEXT;

-- Add financial_summary_generated_at to track when the summary was generated
ALTER TABLE public.user_financial_profiles
ADD COLUMN IF NOT EXISTS financial_summary_generated_at TIMESTAMP WITH TIME ZONE;