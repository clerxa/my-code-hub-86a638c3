-- Drop the existing check constraint on modules.type
ALTER TABLE public.modules DROP CONSTRAINT IF EXISTS modules_type_check;

-- Add new check constraint that includes all existing types plus 'videos'
ALTER TABLE public.modules ADD CONSTRAINT modules_type_check 
CHECK (type IN ('formation', 'quiz', 'webinar', 'guide', 'appointment', 'meeting', 'videos'));