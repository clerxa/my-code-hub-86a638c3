-- Add disclaimer acceptance tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS beta_disclaimer_accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;