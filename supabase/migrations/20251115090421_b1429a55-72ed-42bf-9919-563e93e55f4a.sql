-- Ajouter les champs pour les initiatives et communications internes
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS internal_initiatives JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS internal_communications JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.companies.internal_initiatives IS 'Initiatives déjà mises en place et niveau de satisfaction';
COMMENT ON COLUMN public.companies.internal_communications IS 'Canaux de communication et engagement des salariés';