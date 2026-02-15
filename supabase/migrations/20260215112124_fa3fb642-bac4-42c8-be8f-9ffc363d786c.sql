
-- Add horizon range and rate tiers to financial_products
ALTER TABLE public.financial_products 
  ADD COLUMN IF NOT EXISTS horizon_min_years integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS horizon_max_years integer DEFAULT 40;

-- Create rate tiers table (product + horizon range = specific rate)
CREATE TABLE public.product_rate_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.financial_products(id) ON DELETE CASCADE,
  horizon_min_years integer NOT NULL DEFAULT 1,
  horizon_max_years integer NOT NULL DEFAULT 40,
  annual_rate numeric NOT NULL DEFAULT 0,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_rate_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product rate tiers are readable by authenticated users"
  ON public.product_rate_tiers FOR SELECT
  TO authenticated
  USING (true);

-- Link products to project categories (objectives)
CREATE TABLE public.product_category_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.financial_products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.horizon_project_categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, category_id)
);

ALTER TABLE public.product_category_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product category links are readable by authenticated users"
  ON public.product_category_links FOR SELECT
  TO authenticated
  USING (true);

-- Seed: link PER to Retraite category
INSERT INTO public.product_category_links (product_id, category_id)
SELECT fp.id, hpc.id
FROM public.financial_products fp, public.horizon_project_categories hpc
WHERE fp.name = 'Plan Épargne Retraite' AND hpc.name = 'Retraite'
ON CONFLICT DO NOTHING;

-- Seed rate tiers for PER
INSERT INTO public.product_rate_tiers (product_id, horizon_min_years, horizon_max_years, annual_rate, label)
SELECT fp.id, t.min_y, t.max_y, t.rate, t.label
FROM public.financial_products fp,
(VALUES 
  (1, 5, 4.0, 'Court terme (1-5 ans)'),
  (6, 10, 6.0, 'Moyen terme (6-10 ans)'),
  (11, 20, 7.5, 'Long terme (11-20 ans)'),
  (21, 40, 8.5, 'Très long terme (21-40 ans)')
) AS t(min_y, max_y, rate, label)
WHERE fp.name = 'Plan Épargne Retraite';
