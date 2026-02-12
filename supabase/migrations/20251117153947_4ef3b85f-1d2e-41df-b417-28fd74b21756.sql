-- Create user_fiscal_profile table
CREATE TABLE IF NOT EXISTS public.user_fiscal_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  residence_fiscal TEXT DEFAULT 'France',
  tmi INTEGER DEFAULT 30 CHECK (tmi IN (0, 11, 30, 41, 45)),
  mode_imposition_plus_value TEXT DEFAULT 'PFU' CHECK (mode_imposition_plus_value IN ('PFU', 'Barème')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create espp_plans table
CREATE TABLE IF NOT EXISTS public.espp_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_plan TEXT NOT NULL,
  entreprise TEXT NOT NULL,
  devise_plan TEXT DEFAULT 'USD',
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  lookback BOOLEAN DEFAULT true,
  discount_pct NUMERIC(5,2) DEFAULT 15.00,
  fmv_debut NUMERIC(10,2) NOT NULL,
  fmv_fin NUMERIC(10,2) NOT NULL,
  montant_investi NUMERIC(10,2) NOT NULL,
  taux_change_payroll NUMERIC(10,4) NOT NULL,
  broker TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create espp_lots table
CREATE TABLE IF NOT EXISTS public.espp_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.espp_plans(id) ON DELETE CASCADE,
  date_acquisition DATE NOT NULL,
  quantite_achetee_brut NUMERIC(10,4) NOT NULL,
  prix_achat_unitaire_devise NUMERIC(10,4) NOT NULL,
  fmv_retenu_plan NUMERIC(10,4) NOT NULL,
  gain_acquisition_par_action NUMERIC(10,4) NOT NULL,
  gain_acquisition_total_devise NUMERIC(10,2) NOT NULL,
  gain_acquisition_total_eur NUMERIC(10,2) NOT NULL,
  pru_fiscal_eur NUMERIC(10,4) NOT NULL,
  frais_achat NUMERIC(10,2) DEFAULT 0,
  broker_transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sell_to_cover table
CREATE TABLE IF NOT EXISTS public.sell_to_cover (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.espp_lots(id) ON DELETE CASCADE,
  is_sell_to_cover BOOLEAN DEFAULT true,
  quantite_vendue NUMERIC(10,4) NOT NULL,
  prix_vente_devise NUMERIC(10,4) NOT NULL,
  date_sell_to_cover DATE NOT NULL,
  taux_change NUMERIC(10,4) NOT NULL,
  frais NUMERIC(10,2) DEFAULT 0,
  taxes_prelevees NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ventes_espp table
CREATE TABLE IF NOT EXISTS public.ventes_espp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES public.espp_lots(id) ON DELETE CASCADE,
  quantite_vendue NUMERIC(10,4) NOT NULL,
  prix_vente_devise NUMERIC(10,4) NOT NULL,
  date_vente DATE NOT NULL,
  taux_change NUMERIC(10,4) NOT NULL,
  frais_vente NUMERIC(10,2) DEFAULT 0,
  devise TEXT DEFAULT 'USD',
  plus_value_brute_devise NUMERIC(10,2),
  plus_value_eur NUMERIC(10,2),
  impot_calcule NUMERIC(10,2),
  prelevements_sociaux NUMERIC(10,2),
  net_apres_impot NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_fiscal_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espp_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espp_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sell_to_cover ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventes_espp ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_fiscal_profile
CREATE POLICY "Users can view their own fiscal profile"
  ON public.user_fiscal_profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fiscal profile"
  ON public.user_fiscal_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fiscal profile"
  ON public.user_fiscal_profile FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for espp_plans
CREATE POLICY "Users can view their own ESPP plans"
  ON public.espp_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ESPP plans"
  ON public.espp_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ESPP plans"
  ON public.espp_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ESPP plans"
  ON public.espp_plans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for espp_lots
CREATE POLICY "Users can view their own ESPP lots"
  ON public.espp_lots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.espp_plans
      WHERE espp_plans.id = espp_lots.plan_id
      AND espp_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own ESPP lots"
  ON public.espp_lots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.espp_plans
      WHERE espp_plans.id = plan_id
      AND espp_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own ESPP lots"
  ON public.espp_lots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.espp_plans
      WHERE espp_plans.id = espp_lots.plan_id
      AND espp_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own ESPP lots"
  ON public.espp_lots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.espp_plans
      WHERE espp_plans.id = espp_lots.plan_id
      AND espp_plans.user_id = auth.uid()
    )
  );

-- RLS Policies for sell_to_cover
CREATE POLICY "Users can view their own sell-to-cover"
  ON public.sell_to_cover FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.espp_lots
      JOIN public.espp_plans ON espp_lots.plan_id = espp_plans.id
      WHERE espp_lots.id = sell_to_cover.lot_id
      AND espp_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own sell-to-cover"
  ON public.sell_to_cover FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.espp_lots
      JOIN public.espp_plans ON espp_lots.plan_id = espp_plans.id
      WHERE espp_lots.id = lot_id
      AND espp_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own sell-to-cover"
  ON public.sell_to_cover FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.espp_lots
      JOIN public.espp_plans ON espp_lots.plan_id = espp_plans.id
      WHERE espp_lots.id = sell_to_cover.lot_id
      AND espp_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own sell-to-cover"
  ON public.sell_to_cover FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.espp_lots
      JOIN public.espp_plans ON espp_lots.plan_id = espp_plans.id
      WHERE espp_lots.id = sell_to_cover.lot_id
      AND espp_plans.user_id = auth.uid()
    )
  );

-- RLS Policies for ventes_espp
CREATE POLICY "Users can view their own ESPP sales"
  ON public.ventes_espp FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.espp_lots
      JOIN public.espp_plans ON espp_lots.plan_id = espp_plans.id
      WHERE espp_lots.id = ventes_espp.lot_id
      AND espp_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own ESPP sales"
  ON public.ventes_espp FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.espp_lots
      JOIN public.espp_plans ON espp_lots.plan_id = espp_plans.id
      WHERE espp_lots.id = lot_id
      AND espp_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own ESPP sales"
  ON public.ventes_espp FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.espp_lots
      JOIN public.espp_plans ON espp_lots.plan_id = espp_plans.id
      WHERE espp_lots.id = ventes_espp.lot_id
      AND espp_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own ESPP sales"
  ON public.ventes_espp FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.espp_lots
      JOIN public.espp_plans ON espp_lots.plan_id = espp_plans.id
      WHERE espp_lots.id = ventes_espp.lot_id
      AND espp_plans.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_espp_plans_user_id ON public.espp_plans(user_id);
CREATE INDEX idx_espp_lots_plan_id ON public.espp_lots(plan_id);
CREATE INDEX idx_sell_to_cover_lot_id ON public.sell_to_cover(lot_id);
CREATE INDEX idx_ventes_espp_lot_id ON public.ventes_espp(lot_id);
CREATE INDEX idx_ventes_espp_date_vente ON public.ventes_espp(date_vente);