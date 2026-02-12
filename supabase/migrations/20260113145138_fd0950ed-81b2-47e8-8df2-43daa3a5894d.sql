-- Ajouter la colonne is_pinned à parcours_companies
ALTER TABLE public.parcours_companies
ADD COLUMN is_pinned boolean DEFAULT false;