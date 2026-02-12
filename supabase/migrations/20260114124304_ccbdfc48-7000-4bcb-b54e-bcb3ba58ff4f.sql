-- Add position field for workflow visualizer node positions
ALTER TABLE public.onboarding_screens 
ADD COLUMN IF NOT EXISTS workflow_position JSONB DEFAULT '{"x": 0, "y": 0}'::jsonb;

-- Add a comment to explain the field
COMMENT ON COLUMN public.onboarding_screens.workflow_position IS 'Stores x/y position for the visual workflow editor';