-- Create table for pret_immobilier_simulations
CREATE TABLE public.pret_immobilier_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nom_simulation TEXT NOT NULL,
  montant_projet NUMERIC NOT NULL DEFAULT 0,
  apport_personnel NUMERIC NOT NULL DEFAULT 0,
  duree_annees INTEGER NOT NULL DEFAULT 20,
  taux_interet NUMERIC NOT NULL DEFAULT 0,
  taux_assurance NUMERIC NOT NULL DEFAULT 0,
  revenu_mensuel NUMERIC DEFAULT NULL,
  montant_emprunte NUMERIC DEFAULT NULL,
  mensualite_totale NUMERIC DEFAULT NULL,
  cout_total_interets NUMERIC DEFAULT NULL,
  cout_total_assurance NUMERIC DEFAULT NULL,
  cout_global_credit NUMERIC DEFAULT NULL,
  taux_endettement NUMERIC DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pret_immobilier_simulations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own simulations"
ON public.pret_immobilier_simulations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own simulations"
ON public.pret_immobilier_simulations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own simulations"
ON public.pret_immobilier_simulations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own simulations"
ON public.pret_immobilier_simulations
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_pret_immobilier_simulations_updated_at
BEFORE UPDATE ON public.pret_immobilier_simulations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();