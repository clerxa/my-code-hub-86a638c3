-- Créer la table des parcours
CREATE TABLE public.parcours (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Créer la table de liaison parcours-modules avec ordre
CREATE TABLE public.parcours_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parcours_id uuid NOT NULL REFERENCES public.parcours(id) ON DELETE CASCADE,
  module_id integer NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  order_num integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(parcours_id, module_id),
  UNIQUE(parcours_id, order_num)
);

-- Activer RLS sur les deux tables
ALTER TABLE public.parcours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcours_modules ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour accès complet (comme les autres tables)
CREATE POLICY "Allow all operations on parcours"
ON public.parcours
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on parcours_modules"
ON public.parcours_modules
FOR ALL
USING (true)
WITH CHECK (true);

-- Index pour améliorer les performances
CREATE INDEX idx_parcours_company ON public.parcours(company_id);
CREATE INDEX idx_parcours_modules_parcours ON public.parcours_modules(parcours_id);
CREATE INDEX idx_parcours_modules_order ON public.parcours_modules(parcours_id, order_num);