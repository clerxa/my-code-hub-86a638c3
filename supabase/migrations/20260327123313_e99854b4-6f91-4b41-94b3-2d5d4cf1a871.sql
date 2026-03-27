-- Add email verification columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verification_token text,
  ADD COLUMN IF NOT EXISTS email_verification_sent_at timestamptz;

-- Mark all existing users as verified (they're already in the system)
UPDATE public.profiles SET email_verified = true WHERE email_verified IS NULL OR email_verified = false;