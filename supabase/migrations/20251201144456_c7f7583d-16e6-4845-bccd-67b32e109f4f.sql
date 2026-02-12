-- Add employee onboarding completed flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS employee_onboarding_completed BOOLEAN DEFAULT false;