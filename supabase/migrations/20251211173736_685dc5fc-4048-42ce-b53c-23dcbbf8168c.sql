-- Set default value for superpowers_enabled to false for new companies
ALTER TABLE public.companies 
ALTER COLUMN superpowers_enabled SET DEFAULT false;

-- Update all existing companies to have superpowers disabled by default
UPDATE public.companies 
SET superpowers_enabled = false 
WHERE superpowers_enabled IS NULL OR superpowers_enabled = true;