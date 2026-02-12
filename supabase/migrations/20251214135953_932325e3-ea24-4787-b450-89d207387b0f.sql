-- Create footer settings table
CREATE TABLE public.footer_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_text TEXT DEFAULT 'FinCare',
  copyright_text TEXT DEFAULT '© 2024 FinCare. Tous droits réservés.',
  legal_mentions TEXT,
  privacy_policy_url TEXT,
  terms_url TEXT,
  contact_email TEXT,
  social_links JSONB DEFAULT '[]'::jsonb,
  show_powered_by BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read footer settings
CREATE POLICY "Anyone can view footer settings"
  ON public.footer_settings FOR SELECT
  USING (true);

-- Only admins can update footer settings
CREATE POLICY "Admins can manage footer settings"
  ON public.footer_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.footer_settings (id, company_text, copyright_text, legal_mentions)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'FinCare',
  '© 2024 FinCare. Tous droits réservés.',
  'Les informations fournies sur cette plateforme sont à titre indicatif et ne constituent pas un conseil financier personnalisé.'
);

-- Trigger for updated_at
CREATE TRIGGER update_footer_settings_updated_at
  BEFORE UPDATE ON public.footer_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();