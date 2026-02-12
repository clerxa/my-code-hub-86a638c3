-- Create table for optimization fiscale simulations
CREATE TABLE public.optimisation_fiscale_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_simulation TEXT NOT NULL,
  
  -- Situation fiscale
  revenu_imposable NUMERIC NOT NULL,
  revenus_professionnels NUMERIC NOT NULL,
  situation_familiale TEXT NOT NULL,
  nb_enfants INTEGER NOT NULL DEFAULT 0,
  tmi NUMERIC NOT NULL,
  impot_avant NUMERIC NOT NULL,
  
  -- PER
  montant_per NUMERIC DEFAULT 0,
  plafond_per NUMERIC DEFAULT 0,
  plafond_per_report_n1 NUMERIC DEFAULT 0,
  plafond_per_report_n2 NUMERIC DEFAULT 0,
  plafond_per_report_n3 NUMERIC DEFAULT 0,
  plafond_per_total NUMERIC DEFAULT 0,
  reduction_per NUMERIC DEFAULT 0,
  plafond_per_utilise NUMERIC DEFAULT 0,
  
  -- Dons
  dons_75_montant NUMERIC DEFAULT 0,
  reduction_dons_75 NUMERIC DEFAULT 0,
  dons_66_montant NUMERIC DEFAULT 0,
  reduction_dons_66 NUMERIC DEFAULT 0,
  
  -- Aide domicile
  montant_aide_domicile NUMERIC DEFAULT 0,
  reduction_aide_domicile NUMERIC DEFAULT 0,
  
  -- Garde enfants
  montant_garde_enfant NUMERIC DEFAULT 0,
  reduction_garde_enfant NUMERIC DEFAULT 0,
  
  -- Pinel
  prix_pinel NUMERIC DEFAULT 0,
  taux_pinel NUMERIC DEFAULT 0,
  duree_pinel INTEGER DEFAULT 0,
  reduction_pinel_annuelle NUMERIC DEFAULT 0,
  
  -- Pinel Outre-mer
  prix_pinel_om NUMERIC DEFAULT 0,
  taux_pinel_om NUMERIC DEFAULT 0,
  duree_pinel_om INTEGER DEFAULT 0,
  reduction_pinel_om_annuelle NUMERIC DEFAULT 0,
  
  -- Girardin
  montant_girardin NUMERIC DEFAULT 0,
  reduction_girardin NUMERIC DEFAULT 0,
  
  -- PME/FCPI/FIP
  montant_pme NUMERIC DEFAULT 0,
  reduction_pme NUMERIC DEFAULT 0,
  
  -- ESUS
  montant_esus NUMERIC DEFAULT 0,
  reduction_esus NUMERIC DEFAULT 0,
  
  -- Dispositifs sélectionnés
  dispositifs_selectionnes JSONB DEFAULT '[]'::jsonb,
  
  -- Résultats
  impot_apres NUMERIC DEFAULT 0,
  economie_totale NUMERIC DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.optimisation_fiscale_simulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own optimisation fiscale simulations"
ON public.optimisation_fiscale_simulations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own optimisation fiscale simulations"
ON public.optimisation_fiscale_simulations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own optimisation fiscale simulations"
ON public.optimisation_fiscale_simulations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own optimisation fiscale simulations"
ON public.optimisation_fiscale_simulations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_optimisation_fiscale_simulations_user_id ON public.optimisation_fiscale_simulations(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_optimisation_fiscale_simulations_updated_at
BEFORE UPDATE ON public.optimisation_fiscale_simulations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();