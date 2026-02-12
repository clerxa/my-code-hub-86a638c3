-- Table pour stocker les questions bêta configurables
CREATE TABLE public.csat_beta_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('rating_1_5', 'single_choice', 'yes_no')),
  options JSONB DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les paramètres CSAT
CREATE TABLE public.csat_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  csat_enabled BOOLEAN NOT NULL DEFAULT true,
  enabled_for_modules BOOLEAN NOT NULL DEFAULT true,
  enabled_for_simulators BOOLEAN NOT NULL DEFAULT true,
  enabled_for_parcours BOOLEAN NOT NULL DEFAULT true,
  enabled_for_onboarding BOOLEAN NOT NULL DEFAULT true,
  enabled_for_financial_profile BOOLEAN NOT NULL DEFAULT true,
  beta_questions_count INTEGER NOT NULL DEFAULT 2 CHECK (beta_questions_count >= 1 AND beta_questions_count <= 3),
  expert_intent_enabled BOOLEAN NOT NULL DEFAULT true,
  disabled_module_ids INTEGER[] DEFAULT '{}',
  alert_low_score_threshold NUMERIC DEFAULT 3.0,
  alert_complex_percentage NUMERIC DEFAULT 30.0,
  alert_unclear_next_step_percentage NUMERIC DEFAULT 30.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table principale pour les réponses CSAT
CREATE TABLE public.csat_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('module', 'simulator', 'parcours', 'onboarding', 'financial_profile')),
  content_name TEXT NOT NULL,
  parcours_id UUID DEFAULT NULL,
  user_level TEXT DEFAULT NULL,
  
  -- Écran 1 - Notation principale
  content_quality_score INTEGER CHECK (content_quality_score >= 1 AND content_quality_score <= 5),
  experience_score INTEGER CHECK (experience_score >= 1 AND experience_score <= 5),
  visual_score INTEGER CHECK (visual_score >= 1 AND visual_score <= 5),
  relevance_score INTEGER CHECK (relevance_score >= 1 AND relevance_score <= 5),
  information_level TEXT CHECK (information_level IN ('too_simple', 'adapted', 'too_complex')),
  
  -- Écran 2 - Questions bêta (stockées en JSONB)
  beta_responses JSONB DEFAULT '[]',
  
  -- Écran 3 - Feedback ouvert
  improvement_feedback TEXT DEFAULT NULL,
  positive_feedback TEXT DEFAULT NULL,
  
  -- Écran 4 - Intention expert
  expert_intent TEXT CHECK (expert_intent IN ('yes', 'not_now', 'no') OR expert_intent IS NULL),
  
  -- Métadonnées
  completion_status TEXT NOT NULL DEFAULT 'completed' CHECK (completion_status IN ('completed', 'skipped', 'partial')),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_csat_responses_user_content ON public.csat_responses(user_id, content_type, content_id);
CREATE INDEX idx_csat_responses_content_type ON public.csat_responses(content_type);
CREATE INDEX idx_csat_responses_completed_at ON public.csat_responses(completed_at);

-- Enable RLS
ALTER TABLE public.csat_beta_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csat_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour csat_beta_questions (lecture publique, écriture admin)
CREATE POLICY "Anyone can view active beta questions"
  ON public.csat_beta_questions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage beta questions"
  ON public.csat_beta_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies pour csat_settings (lecture publique, écriture admin)
CREATE POLICY "Anyone can view CSAT settings"
  ON public.csat_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage CSAT settings"
  ON public.csat_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies pour csat_responses
CREATE POLICY "Users can insert their own CSAT responses"
  ON public.csat_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own CSAT responses"
  ON public.csat_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all CSAT responses"
  ON public.csat_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Insérer les paramètres par défaut
INSERT INTO public.csat_settings (csat_enabled) VALUES (true);

-- Insérer les questions bêta par défaut
INSERT INTO public.csat_beta_questions (question_text, question_type, options, priority_order) VALUES
  ('J''ai mieux compris le sujet après cette étape', 'rating_1_5', NULL, 1),
  ('Cette étape m''a semblé bien équilibrée', 'single_choice', '["Trop dense", "Équilibrée", "Trop légère"]', 2),
  ('Je peux appliquer ce que je viens de voir à ma situation', 'rating_1_5', NULL, 3),
  ('Je sais clairement quelle est la prochaine étape', 'single_choice', '["Oui", "Plutôt oui", "Non"]', 4),
  ('Ce contenu m''a donné davantage confiance', 'rating_1_5', NULL, 5);

-- Trigger pour updated_at
CREATE TRIGGER update_csat_beta_questions_updated_at
  BEFORE UPDATE ON public.csat_beta_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_csat_settings_updated_at
  BEFORE UPDATE ON public.csat_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();