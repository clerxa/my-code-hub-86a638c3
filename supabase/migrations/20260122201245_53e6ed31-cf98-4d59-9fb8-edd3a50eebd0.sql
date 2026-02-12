-- ESPP_LOTS - Accès via plan (personnel)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.espp_lots;
DROP POLICY IF EXISTS "Users can view own espp lots" ON public.espp_lots;

CREATE POLICY "Users can view own espp lots"
ON public.espp_lots FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.espp_plans 
    WHERE espp_plans.id = espp_lots.plan_id 
    AND (espp_plans.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- VENTES_ESPP - Accès via lot puis plan
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ventes_espp;
DROP POLICY IF EXISTS "Users can view own ventes espp" ON public.ventes_espp;

CREATE POLICY "Users can view own ventes espp"
ON public.ventes_espp FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.espp_lots 
    JOIN public.espp_plans ON espp_plans.id = espp_lots.plan_id
    WHERE espp_lots.id = ventes_espp.lot_id 
    AND (espp_plans.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- SELL_TO_COVER - Accès via lot puis plan
DROP POLICY IF EXISTS "Enable read access for all users" ON public.sell_to_cover;
DROP POLICY IF EXISTS "Users can view own sell to cover" ON public.sell_to_cover;

CREATE POLICY "Users can view own sell to cover"
ON public.sell_to_cover FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.espp_lots 
    JOIN public.espp_plans ON espp_plans.id = espp_lots.plan_id
    WHERE espp_lots.id = sell_to_cover.lot_id 
    AND (espp_plans.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);