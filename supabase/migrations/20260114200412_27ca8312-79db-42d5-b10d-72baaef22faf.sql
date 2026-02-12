-- Add is_optional column to modules table
ALTER TABLE public.modules ADD COLUMN is_optional boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.modules.is_optional IS 'Indicates if this module is optional for parcours progression';