-- Update modules.type check constraint to allow new type 'guide' and use 'meeting' (not 'appointment')
ALTER TABLE public.modules DROP CONSTRAINT IF EXISTS modules_type_check;
ALTER TABLE public.modules
ADD CONSTRAINT modules_type_check CHECK (type IN ('webinar','quiz','meeting','guide'));

COMMENT ON CONSTRAINT modules_type_check ON public.modules IS 'Restricts modules.type to known values: webinar, quiz, meeting, guide';