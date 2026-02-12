-- Add display_order column to parcours table for ordering default parcours
ALTER TABLE public.parcours 
ADD COLUMN display_order integer DEFAULT 0;

-- Add an index for efficient ordering
CREATE INDEX idx_parcours_display_order ON public.parcours(display_order);

-- Initialize display_order based on created_at for existing parcours
WITH ordered_parcours AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.parcours
)
UPDATE public.parcours p
SET display_order = op.rn
FROM ordered_parcours op
WHERE p.id = op.id;