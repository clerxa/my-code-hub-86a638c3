ALTER TABLE public.expert_booking_landing_settings
ADD COLUMN expertises jsonb DEFAULT '[]'::jsonb;