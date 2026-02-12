-- Créer la table pour l'historique des demandes de partenariat
CREATE TABLE public.partnership_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  contact_role TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'in_progress', 'completed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partnership_requests ENABLE ROW LEVEL SECURITY;

-- Policies pour les utilisateurs
CREATE POLICY "Users can view their own partnership requests"
  ON public.partnership_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own partnership requests"
  ON public.partnership_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies pour les admins
CREATE POLICY "Admins can view all partnership requests"
  ON public.partnership_requests
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update partnership requests"
  ON public.partnership_requests
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete partnership requests"
  ON public.partnership_requests
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger pour updated_at
CREATE TRIGGER update_partnership_requests_updated_at
  BEFORE UPDATE ON public.partnership_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer le contenu par défaut de la page partenariat dans settings
INSERT INTO public.settings (key, value, metadata)
VALUES (
  'partnership_page_content',
  'Page Partenariat FinCare',
  jsonb_build_object(
    'hero_title', 'Devenez partenaire officiel de FinCare',
    'hero_description', 'Offrez à vos collaborateurs une expérience d''éducation financière unique et personnalisée',
    'benefits', jsonb_build_array(
      jsonb_build_object(
        'title', 'Éducation financière complète',
        'description', 'Modules de formation interactifs couvrant tous les aspects de la rémunération, l''épargne et la fiscalité',
        'icon', 'BookOpen'
      ),
      jsonb_build_object(
        'title', 'Personnalisation avancée',
        'description', 'Adaptez l''expérience à votre marque avec vos couleurs, logo et contenus spécifiques',
        'icon', 'Palette'
      ),
      jsonb_build_object(
        'title', 'Accompagnement dédié',
        'description', 'Support prioritaire et accompagnement personnalisé pour maximiser l''engagement de vos équipes',
        'icon', 'Users'
      ),
      jsonb_build_object(
        'title', 'Analytics détaillés',
        'description', 'Tableaux de bord complets pour suivre la progression et l''engagement de vos collaborateurs',
        'icon', 'BarChart'
      ),
      jsonb_build_object(
        'title', 'Webinaires exclusifs',
        'description', 'Accès à des sessions de formation en direct avec nos experts financiers',
        'icon', 'Video'
      ),
      jsonb_build_object(
        'title', 'Simulateurs avancés',
        'description', 'Outils de simulation personnalisés pour ESPP, RSU, BSPCE et autres dispositifs',
        'icon', 'Calculator'
      )
    ),
    'cta_title', 'Intéressé par un partenariat ?',
    'cta_description', 'Contactez-nous pour découvrir comment FinCare peut transformer l''expérience financière de vos collaborateurs'
  )
)
ON CONFLICT (key) DO UPDATE
SET metadata = EXCLUDED.metadata;