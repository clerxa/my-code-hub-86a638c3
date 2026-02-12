-- Supprimer l'ancien check constraint sur niveau
ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_niveau_check;

-- Ajouter un nouveau check constraint incluant 'fantastic'
ALTER TABLE public.plans 
  ADD CONSTRAINT plans_niveau_check 
  CHECK (niveau IN ('origin', 'hero', 'legend', 'fantastic'));

-- Création de la table pivot pour la relation many-to-many entre plans et features
CREATE TABLE IF NOT EXISTS public.plan_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, feature_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id ON public.plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_feature_id ON public.plan_features(feature_id);

-- Activer RLS
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

-- Policies pour plan_features
CREATE POLICY "Anyone can view plan_features"
  ON public.plan_features
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert plan_features"
  ON public.plan_features
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete plan_features"
  ON public.plan_features
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Modifier la table features pour ajouter un champ active
ALTER TABLE public.features 
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Insertion des 4 plans dans l'ordre (si ils n'existent pas déjà)
INSERT INTO public.plans (nom_plan, niveau, ordre_affichage, description, icone)
VALUES 
  ('FinCare Origin', 'origin', 1, 'Plan par défaut pour toute nouvelle entreprise', 'Rocket'),
  ('FinCare Hero', 'hero', 2, 'Plan intermédiaire avec plus de fonctionnalités', 'Zap'),
  ('FinCare Legend', 'legend', 3, 'Plan avancé avec toutes les fonctionnalités', 'Crown'),
  ('FinCare Fantastic', 'fantastic', 4, 'Plan personnalisé hors hiérarchie', 'Sparkles')
ON CONFLICT (niveau) DO UPDATE SET
  nom_plan = EXCLUDED.nom_plan,
  ordre_affichage = EXCLUDED.ordre_affichage,
  description = EXCLUDED.description,
  icone = EXCLUDED.icone;

-- Insertion des features par catégorie
-- Forum
INSERT INTO public.features (nom_fonctionnalite, categorie, cle_technique, description) VALUES
  ('Forum et toutes ses fonctionnalités', 'Forum', 'forum_complet', 'Accès au forum communautaire avec toutes ses fonctionnalités')
ON CONFLICT (cle_technique) DO UPDATE SET
  nom_fonctionnalite = EXCLUDED.nom_fonctionnalite,
  categorie = EXCLUDED.categorie,
  description = EXCLUDED.description;

-- Entreprise
INSERT INTO public.features (nom_fonctionnalite, categorie, cle_technique, description) VALUES
  ('Espace entreprise', 'Entreprise', 'espace_entreprise', 'Accès à l''espace dédié entreprise'),
  ('Classement entreprise', 'Entreprise', 'classement_entreprise', 'Visualisation du classement inter-entreprises'),
  ('Communication interne', 'Entreprise', 'communication_interne', 'Outils de communication interne')
ON CONFLICT (cle_technique) DO UPDATE SET
  nom_fonctionnalite = EXCLUDED.nom_fonctionnalite,
  categorie = EXCLUDED.categorie,
  description = EXCLUDED.description;

-- Formation
INSERT INTO public.features (nom_fonctionnalite, categorie, cle_technique, description) VALUES
  ('Modules pédagogiques', 'Formation', 'modules_pedagogiques', 'Accès aux modules de formation'),
  ('Parcours de formation', 'Formation', 'parcours_formation', 'Parcours structurés de formation'),
  ('Webinars en direct', 'Formation', 'webinars_direct', 'Participation aux webinars en direct'),
  ('Rendez-vous expert', 'Formation', 'rdv_expert', 'Prise de rendez-vous avec un expert')
ON CONFLICT (cle_technique) DO UPDATE SET
  nom_fonctionnalite = EXCLUDED.nom_fonctionnalite,
  categorie = EXCLUDED.categorie,
  description = EXCLUDED.description;

-- Gestion / Admin
INSERT INTO public.features (nom_fonctionnalite, categorie, cle_technique, description) VALUES
  ('Export des données', 'Gestion / Admin', 'export_donnees', 'Export des données de l''entreprise'),
  ('Gestion des profils', 'Gestion / Admin', 'gestion_profils', 'Gestion avancée des profils employés')
ON CONFLICT (cle_technique) DO UPDATE SET
  nom_fonctionnalite = EXCLUDED.nom_fonctionnalite,
  categorie = EXCLUDED.categorie,
  description = EXCLUDED.description;

-- Simulateurs
INSERT INTO public.features (nom_fonctionnalite, categorie, cle_technique, description) VALUES
  ('Optimisation fiscale', 'Simulateurs', 'optimisation_fiscale', 'Simulateur d''optimisation fiscale'),
  ('Simulateur ESPP', 'Simulateurs', 'simulateur_espp', 'Simulateur de plans d''actionnariat salarié'),
  ('Simulateur d''impôts', 'Simulateurs', 'simulateur_impots', 'Simulateur de calcul d''impôts'),
  ('Historique des simulations', 'Simulateurs', 'historique_simulations', 'Accès à l''historique des simulations')
ON CONFLICT (cle_technique) DO UPDATE SET
  nom_fonctionnalite = EXCLUDED.nom_fonctionnalite,
  categorie = EXCLUDED.categorie,
  description = EXCLUDED.description;