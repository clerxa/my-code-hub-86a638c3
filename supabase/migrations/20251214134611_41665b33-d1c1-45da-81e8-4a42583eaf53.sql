-- Create table for capacité d'emprunt simulations
CREATE TABLE public.capacite_emprunt_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nom_simulation text NOT NULL,
  
  -- Revenus détaillés
  salaires numeric NOT NULL DEFAULT 0,
  revenus_locatifs numeric NOT NULL DEFAULT 0,
  revenus_capital numeric NOT NULL DEFAULT 0,
  allocations_chomage numeric NOT NULL DEFAULT 0,
  indemnites_maladie numeric NOT NULL DEFAULT 0,
  autres_revenus numeric NOT NULL DEFAULT 0,
  revenu_mensuel_net numeric NOT NULL DEFAULT 0,
  
  -- Charges détaillées
  credit_immo numeric NOT NULL DEFAULT 0,
  credit_conso numeric NOT NULL DEFAULT 0,
  credit_auto numeric NOT NULL DEFAULT 0,
  pensions_alimentaires numeric NOT NULL DEFAULT 0,
  autres_charges numeric NOT NULL DEFAULT 0,
  charges_fixes numeric NOT NULL DEFAULT 0,
  loyer_actuel numeric NOT NULL DEFAULT 0,
  
  -- Paramètres du prêt
  apport_personnel numeric NOT NULL DEFAULT 0,
  duree_annees integer NOT NULL DEFAULT 20,
  taux_interet numeric NOT NULL DEFAULT 3.5,
  taux_assurance numeric NOT NULL DEFAULT 0.34,
  frais_notaire numeric NOT NULL DEFAULT 8,
  
  -- Résultats calculés
  mensualite_maximale numeric,
  capacite_emprunt numeric,
  montant_projet_max numeric,
  taux_endettement_actuel numeric,
  taux_utilisation_capacite numeric,
  taux_endettement_futur numeric,
  reste_a_vivre numeric,
  reste_a_vivre_futur numeric,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.capacite_emprunt_simulations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own capacite emprunt simulations"
ON public.capacite_emprunt_simulations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own capacite emprunt simulations"
ON public.capacite_emprunt_simulations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own capacite emprunt simulations"
ON public.capacite_emprunt_simulations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own capacite emprunt simulations"
ON public.capacite_emprunt_simulations
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_capacite_emprunt_simulations_updated_at
BEFORE UPDATE ON public.capacite_emprunt_simulations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();