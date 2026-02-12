-- Créer la table de liaison parcours-entreprises (many-to-many)
CREATE TABLE public.parcours_companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parcours_id uuid NOT NULL REFERENCES public.parcours(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(parcours_id, company_id)
);

-- Activer RLS
ALTER TABLE public.parcours_companies ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour accès complet
CREATE POLICY "Allow all operations on parcours_companies"
ON public.parcours_companies
FOR ALL
USING (true)
WITH CHECK (true);

-- Index pour améliorer les performances
CREATE INDEX idx_parcours_companies_parcours ON public.parcours_companies(parcours_id);
CREATE INDEX idx_parcours_companies_company ON public.parcours_companies(company_id);

-- Migrer les données existantes de parcours.company_id vers parcours_companies
INSERT INTO public.parcours_companies (parcours_id, company_id)
SELECT id, company_id 
FROM public.parcours 
WHERE company_id IS NOT NULL;

-- Supprimer la colonne company_id de parcours (elle n'est plus nécessaire)
ALTER TABLE public.parcours DROP COLUMN company_id;