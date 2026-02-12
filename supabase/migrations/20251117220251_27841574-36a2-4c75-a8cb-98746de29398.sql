-- Ajouter un champ pour la description "À propos" de l'entreprise
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS about_description TEXT;

-- Ajouter un champ pour stocker la disposition des blocs (1 ou 2 colonnes)
ALTER TABLE public.block_orders 
ADD COLUMN IF NOT EXISTS layout_config JSONB DEFAULT '{"columns": 1}'::jsonb;