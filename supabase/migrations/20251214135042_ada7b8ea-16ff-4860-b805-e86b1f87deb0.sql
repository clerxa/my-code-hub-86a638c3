-- Create simulator categories table
CREATE TABLE public.simulator_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text NOT NULL DEFAULT 'calculator',
  order_num integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create simulators table
CREATE TABLE public.simulators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.simulator_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text NOT NULL DEFAULT 'calculator',
  route text NOT NULL,
  feature_key text,
  duration_minutes integer DEFAULT 5,
  order_num integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.simulator_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulators ENABLE ROW LEVEL SECURITY;

-- RLS policies for categories
CREATE POLICY "Anyone can view active categories"
ON public.simulator_categories
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage categories"
ON public.simulator_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for simulators
CREATE POLICY "Anyone can view active simulators"
ON public.simulators
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage simulators"
ON public.simulators
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_simulator_categories_updated_at
BEFORE UPDATE ON public.simulator_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_simulators_updated_at
BEFORE UPDATE ON public.simulators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.simulator_categories (name, slug, description, icon, order_num) VALUES
('Fiscalité', 'fiscalite', 'Simulateurs liés à l''optimisation fiscale et aux impôts', 'receipt', 1),
('Fondamentaux', 'fondamentaux', 'Les bases de la gestion financière personnelle', 'shield', 2),
('Immobilier', 'immobilier', 'Simulateurs pour vos projets immobiliers', 'home', 3);

-- Insert default simulators
INSERT INTO public.simulators (category_id, name, slug, description, icon, route, feature_key, duration_minutes, order_num) VALUES
-- Fiscalité
((SELECT id FROM public.simulator_categories WHERE slug = 'fiscalite'), 'Simulateur d''Impôts', 'impots', 'Estimez votre impôt sur le revenu selon votre situation', 'calculator', '/simulateur-impots', 'simulateur_impots', 5, 1),
((SELECT id FROM public.simulator_categories WHERE slug = 'fiscalite'), 'Optimisation Fiscale', 'optimisation', 'Trouvez les meilleures stratégies pour réduire vos impôts', 'pie-chart', '/optimisation-fiscale', 'optimisation_fiscale', 15, 2),
((SELECT id FROM public.simulator_categories WHERE slug = 'fiscalite'), 'Simulateur PER', 'per', 'Optimisez votre épargne retraite et réduisez vos impôts', 'wallet', '/simulateur-per', 'simulateur_per', 10, 3),
-- Fondamentaux
((SELECT id FROM public.simulator_categories WHERE slug = 'fondamentaux'), 'Épargne de Précaution', 'epargne-precaution', 'Calculez le montant idéal de votre épargne de sécurité', 'shield', '/simulateur-epargne-precaution', 'simulateur_epargne_precaution', 5, 1),
((SELECT id FROM public.simulator_categories WHERE slug = 'fondamentaux'), 'Simulateur ESPP', 'espp', 'Estimez la rentabilité de votre plan d''achat d''actions', 'trending-up', '/simulateur-espp', 'simulateur_espp', 10, 2),
-- Immobilier
((SELECT id FROM public.simulator_categories WHERE slug = 'immobilier'), 'Prêt Immobilier', 'pret-immobilier', 'Calculez vos mensualités et le coût total de votre prêt', 'building-2', '/simulateur-pret-immobilier', 'simulateur_pret_immobilier', 5, 1),
((SELECT id FROM public.simulator_categories WHERE slug = 'immobilier'), 'Capacité d''Emprunt', 'capacite-emprunt', 'Découvrez votre capacité d''emprunt maximale', 'landmark', '/simulateur-capacite-emprunt', 'simulateur_capacite_emprunt', 5, 2),
((SELECT id FROM public.simulator_categories WHERE slug = 'immobilier'), 'Simulateur LMNP', 'lmnp', 'Comparez les régimes fiscaux pour votre location meublée', 'home', '/simulateur-lmnp', 'simulateur_lmnp', 10, 3);