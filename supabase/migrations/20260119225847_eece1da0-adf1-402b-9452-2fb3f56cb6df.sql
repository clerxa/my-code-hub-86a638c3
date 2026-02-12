-- Add 'financial_profile' to the allowed module types
ALTER TABLE public.modules DROP CONSTRAINT modules_type_check;

ALTER TABLE public.modules ADD CONSTRAINT modules_type_check 
CHECK (type = ANY (ARRAY['webinar'::text, 'quiz'::text, 'guide'::text, 'meeting'::text, 'video'::text, 'simulator'::text, 'financial_profile'::text]));