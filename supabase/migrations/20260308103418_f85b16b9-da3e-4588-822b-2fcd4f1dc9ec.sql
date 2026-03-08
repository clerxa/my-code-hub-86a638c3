
-- Create bspce_simulations table
CREATE TABLE public.bspce_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mode text NOT NULL CHECK (mode IN ('simulation', 'fiscal')),
  nb_bspce integer NOT NULL,
  prix_exercice numeric NOT NULL,
  prix_cession numeric,
  date_entree_societe date NOT NULL,
  date_cession date,
  tmi numeric NOT NULL DEFAULT 30,
  anciennete_mois integer,
  regime_applicable text CHECK (regime_applicable IN ('pfu', 'bareme')),
  gain_brut numeric,
  gain_net_pfu numeric,
  gain_net_bareme numeric,
  nom_simulation text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bspce_simulations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own simulations
CREATE POLICY "Users can view own bspce simulations"
ON public.bspce_simulations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own simulations
CREATE POLICY "Users can insert own bspce simulations"
ON public.bspce_simulations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own simulations
CREATE POLICY "Users can update own bspce simulations"
ON public.bspce_simulations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own simulations
CREATE POLICY "Users can delete own bspce simulations"
ON public.bspce_simulations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can see all
CREATE POLICY "Admins can view all bspce simulations"
ON public.bspce_simulations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
