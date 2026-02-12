-- Créer la table villains
CREATE TABLE public.villains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  theme TEXT NOT NULL,
  description TEXT NOT NULL,
  score_a_battre INTEGER NOT NULL DEFAULT 1000,
  image_url TEXT NOT NULL,
  order_num INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS pour villains
ALTER TABLE public.villains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view villains"
  ON public.villains FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert villains"
  ON public.villains FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update villains"
  ON public.villains FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete villains"
  ON public.villains FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Ajouter le champ theme aux modules existants
ALTER TABLE public.modules ADD COLUMN theme TEXT;

-- Insérer les 3 vilains initiaux
INSERT INTO public.villains (nom, theme, description, score_a_battre, image_url, order_num) VALUES
  ('Panikra', 'Les bases financières', 'Le maître du chaos financier, celui qui sème la panique dans les budgets mal préparés.', 1000, '/villains/panikra.png', 1),
  ('Lord Taxon', 'Fiscalité personnelle', 'Le seigneur des impôts, gardien impitoyable des règles fiscales les plus obscures.', 1500, '/villains/lord-taxon.png', 2),
  ('Dr. Obscurus', 'Optimisation fiscale', 'Le docteur des ténèbres fiscales, expert en stratégies d''optimisation les plus complexes.', 2000, '/villains/dr-obscurus.png', 3);