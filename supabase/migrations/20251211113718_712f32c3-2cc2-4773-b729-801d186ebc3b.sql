-- Add is_default column to parcours table
ALTER TABLE public.parcours 
ADD COLUMN is_default boolean NOT NULL DEFAULT false;

-- Add a comment to explain the column
COMMENT ON COLUMN public.parcours.is_default IS 'When true, this parcours is automatically assigned to all users on first login';