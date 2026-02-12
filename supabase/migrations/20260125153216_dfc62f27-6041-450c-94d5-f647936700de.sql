-- Create table to track booking referrers
CREATE TABLE public.booking_referrers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  referrer_path TEXT NOT NULL,
  referrer_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  matched_at TIMESTAMP WITH TIME ZONE,
  appointment_id UUID REFERENCES public.hubspot_appointments(id) ON DELETE SET NULL
);

-- Add index for quick lookups by email
CREATE INDEX idx_booking_referrers_email ON public.booking_referrers(user_email);
CREATE INDEX idx_booking_referrers_user_id ON public.booking_referrers(user_id);

-- Enable RLS
ALTER TABLE public.booking_referrers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own referrer
CREATE POLICY "Users can insert their own referrer"
ON public.booking_referrers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow service role full access (for webhook)
CREATE POLICY "Service role can do everything"
ON public.booking_referrers
FOR ALL
USING (true)
WITH CHECK (true);

-- Add referrer_page column to hubspot_appointments
ALTER TABLE public.hubspot_appointments 
ADD COLUMN IF NOT EXISTS referrer_path TEXT,
ADD COLUMN IF NOT EXISTS referrer_label TEXT;