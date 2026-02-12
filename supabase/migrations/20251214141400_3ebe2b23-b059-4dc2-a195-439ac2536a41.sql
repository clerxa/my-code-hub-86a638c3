
-- Create user financial profiles table for centralized financial data
CREATE TABLE public.user_financial_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Personal Information
  age INTEGER,
  situation_familiale TEXT DEFAULT 'celibataire',
  nb_enfants INTEGER DEFAULT 0,
  nb_personnes_foyer INTEGER DEFAULT 1,
  
  -- Income
  revenu_mensuel_net NUMERIC DEFAULT 0,
  revenu_fiscal_annuel NUMERIC DEFAULT 0,
  autres_revenus_mensuels NUMERIC DEFAULT 0,
  revenus_locatifs NUMERIC DEFAULT 0,
  
  -- Expenses & Charges
  charges_fixes_mensuelles NUMERIC DEFAULT 0,
  loyer_actuel NUMERIC DEFAULT 0,
  credits_immobilier NUMERIC DEFAULT 0,
  credits_consommation NUMERIC DEFAULT 0,
  credits_auto NUMERIC DEFAULT 0,
  pensions_alimentaires NUMERIC DEFAULT 0,
  
  -- Assets & Savings
  epargne_actuelle NUMERIC DEFAULT 0,
  apport_disponible NUMERIC DEFAULT 0,
  capacite_epargne_mensuelle NUMERIC DEFAULT 0,
  
  -- Tax Information
  tmi NUMERIC DEFAULT 30,
  parts_fiscales NUMERIC DEFAULT 1,
  plafond_per_reportable NUMERIC DEFAULT 0,
  
  -- Employment
  type_contrat TEXT DEFAULT 'cdi',
  anciennete_annees INTEGER DEFAULT 0,
  secteur_activite TEXT,
  
  -- Real Estate Projects
  objectif_achat_immo BOOLEAN DEFAULT false,
  budget_achat_immo NUMERIC,
  duree_emprunt_souhaitee INTEGER DEFAULT 20,
  
  -- Metadata
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_financial_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own financial profile"
ON public.user_financial_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own financial profile"
ON public.user_financial_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial profile"
ON public.user_financial_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all financial profiles"
ON public.user_financial_profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_user_financial_profiles_updated_at
BEFORE UPDATE ON public.user_financial_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
