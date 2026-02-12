-- Table pour les simulations d'épargne de précaution
CREATE TABLE public.epargne_precaution_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nom_simulation TEXT NOT NULL,
  
  -- Données du profil (pré-remplies)
  revenu_mensuel NUMERIC NOT NULL,
  nombre_personnes INTEGER NOT NULL DEFAULT 1,
  charges_fixes_mensuelles NUMERIC NOT NULL,
  epargne_actuelle NUMERIC NOT NULL,
  
  -- Paramètres utilisateur
  niveau_securite TEXT NOT NULL CHECK (niveau_securite IN ('minimum', 'confortable', 'optimal')),
  nb_mois_securite INTEGER NOT NULL,
  capacite_epargne_mensuelle NUMERIC NOT NULL,
  type_metier TEXT NOT NULL CHECK (type_metier IN ('cdi_tech', 'cdi_non_tech', 'independant', 'variable')),
  coefficient_metier NUMERIC NOT NULL,
  
  -- Résultats calculés
  depenses_mensuelles NUMERIC NOT NULL,
  epargne_recommandee NUMERIC NOT NULL,
  epargne_manquante NUMERIC NOT NULL,
  temps_pour_objectif NUMERIC,
  epargne_mensuelle_optimale NUMERIC,
  indice_resilience INTEGER NOT NULL CHECK (indice_resilience >= 0 AND indice_resilience <= 100),
  
  -- Message et CTA affichés
  message_personnalise TEXT,
  cta_affiche TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes utilisateur
CREATE INDEX idx_epargne_precaution_user_id ON public.epargne_precaution_simulations(user_id);

-- RLS policies
ALTER TABLE public.epargne_precaution_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own epargne precaution simulations"
  ON public.epargne_precaution_simulations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own epargne precaution simulations"
  ON public.epargne_precaution_simulations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own epargne precaution simulations"
  ON public.epargne_precaution_simulations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own epargne precaution simulations"
  ON public.epargne_precaution_simulations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE TRIGGER update_epargne_precaution_simulations_updated_at
  BEFORE UPDATE ON public.epargne_precaution_simulations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table pour gérer les CTA de tous les simulateurs (admin)
CREATE TABLE public.simulator_ctas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulator_type TEXT NOT NULL CHECK (simulator_type IN ('per', 'espp', 'impots', 'optimisation_fiscale', 'epargne_precaution')),
  condition_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  button_text TEXT NOT NULL,
  button_color TEXT,
  icon TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('internal_link', 'external_link', 'html_script', 'modal')),
  action_value TEXT NOT NULL,
  order_num INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes par simulateur
CREATE INDEX idx_simulator_ctas_type ON public.simulator_ctas(simulator_type);

-- RLS policies pour les CTA (admin only)
ALTER TABLE public.simulator_ctas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active CTAs"
  ON public.simulator_ctas
  FOR SELECT
  USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert CTAs"
  ON public.simulator_ctas
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update CTAs"
  ON public.simulator_ctas
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete CTAs"
  ON public.simulator_ctas
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger pour updated_at
CREATE TRIGGER update_simulator_ctas_updated_at
  BEFORE UPDATE ON public.simulator_ctas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();