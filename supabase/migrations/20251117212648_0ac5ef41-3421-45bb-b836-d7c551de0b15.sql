-- Ajouter les nouveaux champs à la table companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS niveau_maturite_financiere text,
ADD COLUMN IF NOT EXISTS canaux_communication jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS canal_communication_autre text;

-- Créer la table contacts_entreprise
CREATE TABLE IF NOT EXISTS public.company_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nom text NOT NULL,
  email text NOT NULL,
  telephone text,
  role_contact text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Créer la table onboarding_entreprise
CREATE TABLE IF NOT EXISTS public.company_onboarding (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  etape_actuelle integer NOT NULL DEFAULT 1,
  onboarding_termine boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour company_contacts
CREATE POLICY "Admins can view all company contacts"
  ON public.company_contacts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert company contacts"
  ON public.company_contacts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update company contacts"
  ON public.company_contacts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete company contacts"
  ON public.company_contacts FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies pour company_onboarding
CREATE POLICY "Admins can view all onboarding"
  ON public.company_onboarding FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert onboarding"
  ON public.company_onboarding FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update onboarding"
  ON public.company_onboarding FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete onboarding"
  ON public.company_onboarding FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger pour updated_at
CREATE TRIGGER update_company_onboarding_updated_at
  BEFORE UPDATE ON public.company_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();