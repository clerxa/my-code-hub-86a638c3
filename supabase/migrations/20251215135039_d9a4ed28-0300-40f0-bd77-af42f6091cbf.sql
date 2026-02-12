-- Add livestorm_session_id to modules table for individual webinar tracking
ALTER TABLE public.modules 
ADD COLUMN livestorm_session_id text;

-- Add index for faster lookups
CREATE INDEX idx_modules_livestorm_session_id ON public.modules(livestorm_session_id) WHERE livestorm_session_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.modules.livestorm_session_id IS 'Livestorm session/event ID to match webhook events with the correct webinar module';