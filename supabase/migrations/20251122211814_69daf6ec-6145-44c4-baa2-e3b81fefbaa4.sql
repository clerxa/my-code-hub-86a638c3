-- Add 'video' as a valid module type
ALTER TABLE public.modules DROP CONSTRAINT IF EXISTS modules_type_check;

ALTER TABLE public.modules ADD CONSTRAINT modules_type_check 
CHECK (type IN ('webinar', 'quiz', 'guide', 'meeting', 'video'));