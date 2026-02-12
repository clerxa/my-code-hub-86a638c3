-- Add is_optional column to parcours_modules (module can be optional in one parcours, mandatory in another)
ALTER TABLE public.parcours_modules 
ADD COLUMN IF NOT EXISTS is_optional BOOLEAN NOT NULL DEFAULT false;