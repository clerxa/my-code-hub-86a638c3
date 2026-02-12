-- Table des plans (offres)
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_plan text NOT NULL,
  description text,
  niveau text NOT NULL CHECK (niveau IN ('origin', 'hero', 'legend')),
  icone text,
  ordre_affichage integer NOT NULL,
  texte_marketing text,
  prix_mensuel numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(niveau)
);

-- Table des fonctionnalités
CREATE TABLE IF NOT EXISTS public.features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_fonctionnalite text NOT NULL,
  categorie text NOT NULL,
  description text,
  plan_minimum_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  cle_technique text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Ajouter colonne plan dans profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

-- Policies pour plans
CREATE POLICY "Anyone can view plans" ON public.plans
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert plans" ON public.plans
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update plans" ON public.plans
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete plans" ON public.plans
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Policies pour features
CREATE POLICY "Anyone can view features" ON public.features
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert features" ON public.features
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update features" ON public.features
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete features" ON public.features
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Index pour améliorer les performances
CREATE INDEX idx_features_plan_minimum ON public.features(plan_minimum_id);
CREATE INDEX idx_features_cle_technique ON public.features(cle_technique);
CREATE INDEX idx_profiles_plan ON public.profiles(plan_id);
CREATE INDEX idx_plans_niveau ON public.plans(niveau);

-- Triggers pour updated_at
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_features_updated_at
  BEFORE UPDATE ON public.features
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les 3 plans par défaut
INSERT INTO public.plans (nom_plan, description, niveau, ordre_affichage, prix_mensuel, texte_marketing, icone) VALUES
  ('FinCare Origin', 'L''essentiel pour démarrer votre parcours financier', 'origin', 1, 0, 'Parfait pour découvrir FinCare', 'Shield'),
  ('FinCare Hero', 'Pour les utilisateurs qui veulent aller plus loin', 'hero', 2, 29.90, 'Accédez à toutes les fonctionnalités avancées', 'Zap'),
  ('FinCare Legend', 'L''expérience FinCare ultime', 'legend', 3, 99.90, 'Accompagnement personnalisé et outils experts', 'Crown')
ON CONFLICT (niveau) DO NOTHING;