-- Table pour configurer les champs requis du profil financier
CREATE TABLE public.financial_profile_required_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_key TEXT NOT NULL UNIQUE,
  field_label TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_profile_required_fields ENABLE ROW LEVEL SECURITY;

-- Anyone can read (for progress calculation)
CREATE POLICY "Anyone can read required fields config"
ON public.financial_profile_required_fields
FOR SELECT
USING (true);

-- Admins can manage (using user_roles table)
CREATE POLICY "Admins can manage required fields config"
ON public.financial_profile_required_fields
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default configuration
INSERT INTO public.financial_profile_required_fields (field_key, field_label, is_required, display_order) VALUES
  ('revenu_mensuel_net', 'Revenu mensuel net', true, 1),
  ('revenu_fiscal_annuel', 'Revenu imposable annuel', true, 2),
  ('charges_fixes_mensuelles', 'Charges fixes mensuelles', true, 3),
  ('epargne_livrets', 'Épargne sur livrets', true, 4),
  ('type_contrat', 'Type de contrat', true, 5),
  ('date_naissance', 'Date de naissance', false, 6),
  ('situation_familiale', 'Situation familiale', false, 7),
  ('nb_enfants', 'Nombre d''enfants', false, 8),
  ('capacite_epargne_mensuelle', 'Capacité d''épargne mensuelle', false, 9),
  ('tmi', 'Tranche marginale d''imposition', false, 10),
  ('statut_residence', 'Statut de résidence', false, 11),
  ('apport_disponible', 'Apport disponible', false, 12);

-- Trigger for updated_at
CREATE TRIGGER update_financial_profile_required_fields_updated_at
BEFORE UPDATE ON public.financial_profile_required_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();