-- Create table for PER simulations
CREATE TABLE IF NOT EXISTS public.per_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nom_simulation TEXT NOT NULL,
  
  -- Situation fiscale
  revenu_fiscal NUMERIC NOT NULL,
  parts_fiscales NUMERIC NOT NULL,
  age_actuel INTEGER NOT NULL,
  age_retraite INTEGER NOT NULL,
  tmi NUMERIC NOT NULL,
  
  -- Plafonds PER
  plafond_per_annuel NUMERIC NOT NULL,
  plafond_per_reportable NUMERIC NOT NULL DEFAULT 0,
  plafond_per_total NUMERIC NOT NULL,
  
  -- Versements
  versements_per NUMERIC NOT NULL,
  
  -- Résultats fiscaux
  impot_sans_per NUMERIC NOT NULL,
  impot_avec_per NUMERIC NOT NULL,
  economie_impots NUMERIC NOT NULL,
  effort_reel NUMERIC NOT NULL,
  optimisation_fiscale NUMERIC NOT NULL,
  reduction_impots_max NUMERIC NOT NULL,
  
  -- Projection retraite
  horizon_annees INTEGER NOT NULL,
  taux_rendement NUMERIC NOT NULL,
  capital_futur NUMERIC NOT NULL,
  gain_financier NUMERIC NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.per_simulations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own PER simulations"
  ON public.per_simulations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PER simulations"
  ON public.per_simulations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PER simulations"
  ON public.per_simulations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PER simulations"
  ON public.per_simulations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_per_simulations_updated_at
  BEFORE UPDATE ON public.per_simulations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();