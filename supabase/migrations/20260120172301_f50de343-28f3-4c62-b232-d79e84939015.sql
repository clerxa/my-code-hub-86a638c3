-- Add visibility_status column to simulators table
-- Values: 'visible' (accessible), 'disabled' (non accessible, shows "en cours de développement"), 'hidden' (non visible)
ALTER TABLE public.simulators 
ADD COLUMN IF NOT EXISTS visibility_status TEXT NOT NULL DEFAULT 'visible';

-- Add check constraint for valid values
ALTER TABLE public.simulators 
ADD CONSTRAINT simulators_visibility_status_check 
CHECK (visibility_status IN ('visible', 'disabled', 'hidden'));

COMMENT ON COLUMN public.simulators.visibility_status IS 'Simulator visibility: visible (accessible), disabled (shows coming soon), hidden (not displayed)';