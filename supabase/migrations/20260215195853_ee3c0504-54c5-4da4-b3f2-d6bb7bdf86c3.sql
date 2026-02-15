
-- Table for configurable onboarding guide steps
CREATE TABLE public.onboarding_guide_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Sparkles',
  order_num INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_guide_steps ENABLE ROW LEVEL SECURITY;

-- Admins can manage, everyone can read
CREATE POLICY "Anyone can read guide steps"
  ON public.onboarding_guide_steps FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert guide steps"
  ON public.onboarding_guide_steps FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update guide steps"
  ON public.onboarding_guide_steps FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete guide steps"
  ON public.onboarding_guide_steps FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_onboarding_guide_steps_updated_at
  BEFORE UPDATE ON public.onboarding_guide_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with the current hardcoded steps
INSERT INTO public.onboarding_guide_steps (title, description, icon, order_num) VALUES
  ('Bienvenue sur FinCare ! 🎉', 'Votre plateforme de bien-être financier personnalisée. Découvrons ensemble les fonctionnalités clés pour vous aider à prendre les meilleures décisions financières.', 'Sparkles', 0),
  ('Parcours de formation', 'Accédez à des modules éducatifs sur l''épargne, la fiscalité, l''investissement et bien plus. Complétez-les pour gagner des points et progresser !', 'BookOpen', 1),
  ('Simulateurs financiers', 'Simulez votre capacité d''emprunt, votre épargne de précaution, optimisez votre fiscalité… Des outils puissants pour éclairer vos choix.', 'Calculator', 2),
  ('Votre profil financier', 'Complétez votre profil pour recevoir des recommandations personnalisées adaptées à votre situation. Plus votre profil est complet, plus les conseils sont pertinents.', 'User', 3),
  ('Rendez-vous expert', 'Prenez rendez-vous avec un conseiller financier certifié pour un accompagnement personnalisé et gratuit dans le cadre de votre entreprise.', 'Calendar', 4),
  ('Horizon — Votre stratégie', 'Planifiez vos projets patrimoniaux, définissez vos objectifs et visualisez votre stratégie d''épargne globale avec notre outil de planification avancé.', 'Compass', 5);
