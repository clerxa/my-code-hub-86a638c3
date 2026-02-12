-- Ajouter le nom interne aux CTAs simulateurs
ALTER TABLE public.simulator_ctas
ADD COLUMN internal_name TEXT;

-- Ajouter le nom interne aux règles de recommandation  
ALTER TABLE public.recommendation_rules
ADD COLUMN internal_name TEXT;

-- Mettre à jour les CTAs existants avec un nom généré
UPDATE public.simulator_ctas 
SET internal_name = simulator_type || '_' || LOWER(REPLACE(REPLACE(condition_key, ' ', '_'), '''', '')) || '_' || order_num
WHERE internal_name IS NULL;

-- Mettre à jour les recommandations existantes
UPDATE public.recommendation_rules
SET internal_name = rule_key
WHERE internal_name IS NULL;