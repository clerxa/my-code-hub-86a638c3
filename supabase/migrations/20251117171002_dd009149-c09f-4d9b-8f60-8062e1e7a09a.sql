-- Créer la fonction pour mettre à jour updated_at si elle n'existe pas déjà
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table pour stocker les simulations d'impôts
CREATE TABLE public.simulations_impots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nom_simulation TEXT NOT NULL,
  revenu_imposable NUMERIC NOT NULL,
  statut_marital TEXT NOT NULL,
  nombre_enfants INTEGER NOT NULL DEFAULT 0,
  reductions_impot NUMERIC DEFAULT 0,
  credits_impot NUMERIC DEFAULT 0,
  parts NUMERIC NOT NULL,
  quotient_familial NUMERIC NOT NULL,
  impot_brut NUMERIC NOT NULL,
  impot_net NUMERIC NOT NULL,
  taux_moyen NUMERIC NOT NULL,
  taux_marginal NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.simulations_impots ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can view their own tax simulations"
ON public.simulations_impots
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax simulations"
ON public.simulations_impots
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax simulations"
ON public.simulations_impots
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax simulations"
ON public.simulations_impots
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_simulations_impots_updated_at
BEFORE UPDATE ON public.simulations_impots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();