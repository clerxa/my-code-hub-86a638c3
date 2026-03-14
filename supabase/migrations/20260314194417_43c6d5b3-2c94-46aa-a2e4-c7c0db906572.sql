
-- Add PER ceiling columns
ALTER TABLE public.ocr_avis_imposition_analyses
  ADD COLUMN IF NOT EXISTS plafond_per_declarant_1 NUMERIC,
  ADD COLUMN IF NOT EXISTS plafond_per_declarant_2 NUMERIC,
  ADD COLUMN IF NOT EXISTS plafond_per_verse NUMERIC,
  ADD COLUMN IF NOT EXISTS plafond_per_restant NUMERIC,
  ADD COLUMN IF NOT EXISTS per_analyse_personnalisee TEXT;
