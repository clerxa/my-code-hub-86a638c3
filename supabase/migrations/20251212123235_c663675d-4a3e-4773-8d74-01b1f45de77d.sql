-- Create table for non-partner welcome page settings
CREATE TABLE public.non_partner_welcome_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_icon text DEFAULT 'Building2',
  hero_title text DEFAULT 'Bienvenue chez {companyName} !',
  hero_description text DEFAULT 'Votre entreprise n''a pas encore accès à l''offre complète FinCare',
  benefits_title text DEFAULT 'Pourquoi FinCare pour votre entreprise ?',
  benefits jsonb DEFAULT '[
    {"title": "Éducation financière personnalisée", "description": "Modules adaptés pour maîtriser rémunération, épargne et fiscalité"},
    {"title": "Réduction du stress financier", "description": "Des salariés plus sereins et engagés grâce à une meilleure compréhension"},
    {"title": "Valorisation des avantages sociaux", "description": "Maximisez l''impact de vos dispositifs (RSU, ESPP, PEE, etc.)"}
  ]'::jsonb,
  contacts_title text DEFAULT 'Qui contacter dans votre entreprise ?',
  contacts jsonb DEFAULT '[
    "Votre <strong>responsable RH</strong> ou <strong>DRH</strong>",
    "Le <strong>CSE</strong> (Comité Social et Économique)",
    "Le service <strong>Communication interne</strong>",
    "Votre <strong>direction</strong>"
  ]'::jsonb,
  email_subject text DEFAULT 'Découvrez FinCare pour votre entreprise',
  email_body text DEFAULT 'Bonjour,

Je souhaite vous faire découvrir FinCare, une solution innovante d''éducation financière pour les salariés.

FinCare aide les collaborateurs à mieux comprendre leur rémunération, optimiser leur fiscalité et prendre de meilleures décisions financières.

Cette solution pourrait être un excellent complément à nos avantages sociaux actuels.

Pourriez-vous étudier cette opportunité pour {companyName} ?

Plus d''informations : https://fincare.fr

Cordialement',
  primary_button_text text DEFAULT 'Inviter mon entreprise à découvrir FinCare',
  secondary_button_text text DEFAULT 'Continuer avec un accès limité',
  footer_text text DEFAULT 'En attendant, vous pouvez explorer certaines fonctionnalités de FinCare',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.non_partner_welcome_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings
CREATE POLICY "Anyone can view non_partner_welcome_settings"
ON public.non_partner_welcome_settings
FOR SELECT
USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage non_partner_welcome_settings"
ON public.non_partner_welcome_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.non_partner_welcome_settings (id) VALUES (gen_random_uuid());

-- Add trigger for updated_at
CREATE TRIGGER update_non_partner_welcome_settings_updated_at
BEFORE UPDATE ON public.non_partner_welcome_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();