-- Add admin response fields to feedbacks
ALTER TABLE public.feedbacks ADD COLUMN admin_response TEXT;
ALTER TABLE public.feedbacks ADD COLUMN responded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.feedbacks ADD COLUMN responded_by UUID REFERENCES auth.users(id);