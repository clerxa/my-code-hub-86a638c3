-- Create table for financial profile page settings (editable from backoffice)
CREATE TABLE public.financial_profile_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hero_title TEXT DEFAULT 'Votre Profil Financier',
  hero_description TEXT DEFAULT 'Complétez votre profil financier pour une expérience personnalisée',
  benefits JSON DEFAULT '[
    {"icon": "Calculator", "title": "Simulateurs pré-remplis", "description": "Gagnez du temps : vos informations sont automatiquement utilisées dans tous les simulateurs."},
    {"icon": "Clock", "title": "Préparation RDV optimisée", "description": "Vos données sont partagées avec nos conseillers pour des rendez-vous plus efficaces (sur demande uniquement)."},
    {"icon": "Target", "title": "Recommandations personnalisées", "description": "Recevez des conseils adaptés à votre situation financière réelle."},
    {"icon": "Shield", "title": "Données sécurisées", "description": "Vos informations sont chiffrées et ne sont jamais partagées sans votre accord."}
  ]'::json,
  cta_text TEXT DEFAULT 'Compléter mon profil',
  footer_note TEXT DEFAULT 'Ces informations sont facultatives et peuvent être modifiées à tout moment.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_profile_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (public page content)
CREATE POLICY "Anyone can view financial profile settings" 
ON public.financial_profile_settings 
FOR SELECT 
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update financial profile settings" 
ON public.financial_profile_settings 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert financial profile settings" 
ON public.financial_profile_settings 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_financial_profile_settings_updated_at
BEFORE UPDATE ON public.financial_profile_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default row
INSERT INTO public.financial_profile_settings (id) VALUES (gen_random_uuid());