-- Add gallery_images column to expert_booking_landing_settings
ALTER TABLE public.expert_booking_landing_settings 
ADD COLUMN gallery_images JSONB DEFAULT '[]'::jsonb;