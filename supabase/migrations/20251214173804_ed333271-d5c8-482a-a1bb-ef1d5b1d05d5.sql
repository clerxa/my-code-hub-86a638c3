-- Supprimer la colonne validation_code de la table modules
ALTER TABLE public.modules DROP COLUMN IF EXISTS validation_code;