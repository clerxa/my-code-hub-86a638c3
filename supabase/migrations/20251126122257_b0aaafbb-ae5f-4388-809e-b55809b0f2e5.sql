-- ============================================
-- Migration: Système Multi-Thèmes FinCare (Correction)
-- Description: Ajoute la gestion complète des thèmes personnalisables
-- ============================================

-- Créer la table des thèmes disponibles
CREATE TABLE IF NOT EXISTS public.themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  colors JSONB NOT NULL DEFAULT '{
    "primary": "217 91% 60%",
    "secondary": "280 89% 70%",
    "background": "225 19% 8%",
    "accent": "340 82% 52%"
  }'::jsonb,
  labels JSONB NOT NULL DEFAULT '{
    "villainLabel": "Vilain",
    "weaknessLabel": "Faiblesses",
    "powerLabel": "Pouvoirs",
    "originLabel": "Histoire"
  }'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter la colonne theme_data à la table villains
ALTER TABLE public.villains 
ADD COLUMN IF NOT EXISTS theme_data JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Ajouter la colonne theme_preference à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme_preference TEXT NOT NULL DEFAULT 'villains';

-- Insérer les thèmes par défaut
INSERT INTO public.themes (id, name, label, description, colors, labels) VALUES
('villains', 'Vilains Financiers', 'Vilains', 'Le thème classique avec des vilains à combattre', '{
  "primary": "217 91% 60%",
  "secondary": "280 89% 70%",
  "background": "225 19% 8%",
  "accent": "340 82% 52%"
}'::jsonb, '{
  "villainLabel": "Vilain",
  "villainLabelPlural": "Vilains",
  "weaknessLabel": "Faiblesses",
  "powerLabel": "Pouvoirs",
  "originLabel": "Histoire",
  "defeatLabel": "Battre",
  "defeatedLabel": "Battu"
}'::jsonb),
('obstacles', 'Obstacles Financiers', 'Obstacles', 'Surmonter des obstacles sur votre chemin financier', '{
  "primary": "30 90% 55%",
  "secondary": "45 95% 60%",
  "background": "220 15% 12%",
  "accent": "15 85% 50%"
}'::jsonb, '{
  "villainLabel": "Obstacle",
  "villainLabelPlural": "Obstacles",
  "weaknessLabel": "Solutions",
  "powerLabel": "Défis",
  "originLabel": "Contexte",
  "defeatLabel": "Surmonter",
  "defeatedLabel": "Surmonté"
}'::jsonb),
('challenges', 'Défis Financiers', 'Défis', 'Relevez des défis pour améliorer vos finances', '{
  "primary": "142 76% 45%",
  "secondary": "160 84% 39%",
  "background": "215 20% 10%",
  "accent": "110 70% 50%"
}'::jsonb, '{
  "villainLabel": "Défi",
  "villainLabelPlural": "Défis",
  "weaknessLabel": "Clés",
  "powerLabel": "Enjeux",
  "originLabel": "Description",
  "defeatLabel": "Relever",
  "defeatedLabel": "Relevé"
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Migrer les données existantes des vilains vers le nouveau format theme_data
-- On crée une structure de base avec le thème "villains" pour chaque vilain existant
UPDATE public.villains
SET theme_data = jsonb_build_object(
  'villains', jsonb_build_object(
    'nom', nom,
    'theme', theme,
    'description', description,
    'score_a_battre', score_a_battre,
    'image_url', image_url,
    'origine', '',
    'pouvoirs', '[]'::jsonb,
    'faiblesses', '[]'::jsonb
  )
)
WHERE theme_data = '{}'::jsonb;

-- Créer un index sur theme_preference pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_profiles_theme_preference ON public.profiles(theme_preference);

-- Créer un index sur theme_data pour optimiser les requêtes JSON
CREATE INDEX IF NOT EXISTS idx_villains_theme_data ON public.villains USING GIN (theme_data);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS update_themes_updated_at_trigger ON public.themes;
CREATE TRIGGER update_themes_updated_at_trigger
  BEFORE UPDATE ON public.themes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_themes_updated_at();

-- RLS Policies pour themes
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les thèmes actifs
CREATE POLICY "Anyone can view active themes"
  ON public.themes
  FOR SELECT
  USING (is_active = true);

-- Les admins peuvent tout gérer
CREATE POLICY "Admins can manage themes"
  ON public.themes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policy pour permettre aux users de mettre à jour leur theme_preference
CREATE POLICY "Users can update their own theme preference"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Créer le bucket storage pour les images de vilains par thème
INSERT INTO storage.buckets (id, name, public)
VALUES ('villain-themes', 'villain-themes', true)
ON CONFLICT (id) DO NOTHING;

-- RLS pour le bucket villain-themes
CREATE POLICY "Public can view villain theme images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'villain-themes');

CREATE POLICY "Admins can upload villain theme images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'villain-themes' 
    AND has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update villain theme images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'villain-themes' 
    AND has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete villain theme images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'villain-themes' 
    AND has_role(auth.uid(), 'admin')
  );