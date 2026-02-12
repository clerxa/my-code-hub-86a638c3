-- Create recommendations configuration table
CREATE TABLE public.recommendation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL UNIQUE,
  rule_name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  -- Conditions
  condition_type text NOT NULL, -- 'no_risk_profile', 'simulation_threshold', 'no_modules', 'custom'
  condition_config jsonb DEFAULT '{}',
  -- Display
  title text NOT NULL,
  message text NOT NULL,
  icon text NOT NULL DEFAULT 'calendar',
  cta_text text NOT NULL,
  cta_action_type text NOT NULL DEFAULT 'navigate', -- 'navigate', 'external_url'
  cta_action_value text NOT NULL, -- route or URL
  display_priority text NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recommendation_rules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active recommendation rules"
ON public.recommendation_rules
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage recommendation rules"
ON public.recommendation_rules
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_recommendation_rules_updated_at
BEFORE UPDATE ON public.recommendation_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default rules
INSERT INTO public.recommendation_rules (rule_key, rule_name, description, condition_type, condition_config, title, message, icon, cta_text, cta_action_type, cta_action_value, display_priority, priority) VALUES
('risk_profile', 'Profil de risque', 'Recommandation pour compléter le profil de risque', 'no_risk_profile', '{}', 'Complétez votre profil investisseur', 'Découvrez votre profil de risque pour recevoir des recommandations personnalisées adaptées à votre situation.', 'target', 'Découvrir mon profil', 'navigate', '/risk-profile', 'high', 1),
('expert_appointment', 'Rendez-vous expert', 'Recommandation pour prendre RDV avec un expert si potentiel d''optimisation', 'simulation_threshold', '{"per_threshold": 1500, "optim_threshold": 2000}', 'Un expert peut vous accompagner', 'Vous avez un potentiel d''optimisation important. Prenez rendez-vous pour concrétiser vos économies.', 'calendar', 'Prendre rendez-vous', 'navigate', '/expert-booking', 'medium', 2),
('start_parcours', 'Démarrer le parcours', 'Recommandation pour démarrer le parcours si aucun module validé', 'no_modules', '{}', 'Démarrez votre parcours', 'Commencez votre formation pour maîtriser vos finances personnelles et débloquer des avantages.', 'book', 'Commencer le parcours', 'navigate', '/parcours', 'low', 3);