-- Suppression des contraintes de clé étrangère vers plans
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_id_fkey;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS plan_id;
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_plan_id_fkey;
ALTER TABLE public.companies DROP COLUMN IF EXISTS plan_id;
ALTER TABLE public.companies DROP COLUMN IF EXISTS superpowers_enabled;

-- Suppression de la table plan_features
DROP TABLE IF EXISTS public.plan_features;

-- Suppression de la table plan_unlock_config
DROP TABLE IF EXISTS public.plan_unlock_config;

-- Suppression de la table plans
DROP TABLE IF EXISTS public.plans;