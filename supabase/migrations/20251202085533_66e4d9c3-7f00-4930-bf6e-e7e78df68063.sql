-- Create LMNP simulations table
CREATE TABLE public.lmnp_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nom_simulation TEXT NOT NULL,
  
  -- Revenus
  recettes NUMERIC NOT NULL DEFAULT 0,
  
  -- Charges déductibles
  interets_emprunt NUMERIC NOT NULL DEFAULT 0,
  assurance_pno NUMERIC NOT NULL DEFAULT 0,
  assurance_gli NUMERIC NOT NULL DEFAULT 0,
  gestion_locative NUMERIC NOT NULL DEFAULT 0,
  expert_comptable NUMERIC NOT NULL DEFAULT 0,
  charges_copro NUMERIC NOT NULL DEFAULT 0,
  taxe_fonciere NUMERIC NOT NULL DEFAULT 0,
  cfe NUMERIC NOT NULL DEFAULT 0,
  travaux_entretien NUMERIC NOT NULL DEFAULT 0,
  petit_materiel NUMERIC NOT NULL DEFAULT 0,
  frais_deplacement NUMERIC NOT NULL DEFAULT 0,
  autre_charge NUMERIC NOT NULL DEFAULT 0,
  total_charges NUMERIC NOT NULL DEFAULT 0,
  
  -- Amortissements
  valeur_bien NUMERIC NOT NULL DEFAULT 0,
  duree_immo INTEGER NOT NULL DEFAULT 30,
  valeur_mobilier NUMERIC NOT NULL DEFAULT 0,
  duree_mobilier INTEGER NOT NULL DEFAULT 7,
  
  -- Fiscalité
  tmi NUMERIC NOT NULL DEFAULT 30,
  
  -- Résultats calculés
  resultat_avant_amort NUMERIC,
  amort_immo NUMERIC,
  amort_mobilier NUMERIC,
  amort_total NUMERIC,
  resultat_fiscal_reel NUMERIC,
  resultat_fiscal_micro NUMERIC,
  ir_reel NUMERIC,
  ps_reel NUMERIC,
  ir_micro NUMERIC,
  ps_micro NUMERIC,
  fiscalite_totale_reel NUMERIC,
  fiscalite_totale_micro NUMERIC,
  meilleur_regime TEXT,
  amort_non_deduits NUMERIC,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lmnp_simulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own LMNP simulations"
ON public.lmnp_simulations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own LMNP simulations"
ON public.lmnp_simulations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own LMNP simulations"
ON public.lmnp_simulations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own LMNP simulations"
ON public.lmnp_simulations FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_lmnp_simulations_updated_at
BEFORE UPDATE ON public.lmnp_simulations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();