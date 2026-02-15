
-- Add unique constraint on slug
ALTER TABLE public.financial_products ADD CONSTRAINT financial_products_slug_unique UNIQUE (slug);

-- Add missing columns
ALTER TABLE public.financial_products
  ADD COLUMN IF NOT EXISTS liquidity_type text,
  ADD COLUMN IF NOT EXISTS disclaimer_specific text;

-- Insert 4 products (upsert on slug)
INSERT INTO public.financial_products (name, slug, risk_level, risk_label, horizon_min_years, horizon_max_years, liquidity_type, disclaimer_specific, is_active, display_order, icon, gradient_start, gradient_end, tagline, target_return)
VALUES
  ('Livrets', 'livrets', 1, 'Très faible', 1, 40, 'Immédiate', 'Les livrets réglementés offrent une épargne disponible à tout moment avec un taux garanti par l''État. Le rendement reste modeste mais le capital est totalement sécurisé.', true, 10, 'PiggyBank', '142 71% 45%', '160 84% 39%', 'Épargne disponible et sécurisée', '3%'),
  ('Assurance Vie (Fonds Euro)', 'assurance-vie-fonds-euro', 2, 'Faible', 3, 40, '15 jours', 'L''assurance vie en fonds euros garantit le capital investi. Les rendements sont supérieurs aux livrets mais les fonds sont moins immédiatement disponibles. Fiscalité avantageuse après 8 ans.', true, 20, 'Shield', '217 91% 60%', '230 80% 50%', 'Capital garanti, fiscalité optimisée', '4%'),
  ('SCPI', 'scpi', 4, 'Modéré', 8, 40, '2 mois', 'Les SCPI permettent d''investir dans l''immobilier sans gestion directe. Le rendement est attractif mais le capital n''est pas garanti et la liquidité est limitée. Horizon recommandé : 8 ans minimum.', true, 30, 'Building2', '25 95% 53%', '15 80% 45%', 'Immobilier diversifié, rendement régulier', '5.5%'),
  ('PEA (Actions)', 'pea-actions', 6, 'Élevé', 10, 40, '48h', 'Le PEA offre une exposition aux marchés actions européens avec une fiscalité avantageuse après 5 ans. Le capital n''est pas garanti et la volatilité peut être importante à court terme.', true, 40, 'TrendingUp', '262 83% 58%', '280 75% 50%', 'Performance long terme, avantage fiscal', '7%')
ON CONFLICT (slug) DO UPDATE SET
  risk_level = EXCLUDED.risk_level,
  risk_label = EXCLUDED.risk_label,
  horizon_min_years = EXCLUDED.horizon_min_years,
  horizon_max_years = EXCLUDED.horizon_max_years,
  liquidity_type = EXCLUDED.liquidity_type,
  disclaimer_specific = EXCLUDED.disclaimer_specific,
  target_return = EXCLUDED.target_return,
  tagline = EXCLUDED.tagline;

-- Rate tiers for Livrets
INSERT INTO public.product_rate_tiers (product_id, label, horizon_min_years, horizon_max_years, annual_rate)
SELECT id, 'Tout horizon', 1, 40, 3.0 FROM financial_products WHERE slug = 'livrets';

-- Rate tiers for Assurance Vie
INSERT INTO public.product_rate_tiers (product_id, label, horizon_min_years, horizon_max_years, annual_rate)
SELECT id, 'Court terme (3-5 ans)', 3, 5, 3.5 FROM financial_products WHERE slug = 'assurance-vie-fonds-euro';
INSERT INTO public.product_rate_tiers (product_id, label, horizon_min_years, horizon_max_years, annual_rate)
SELECT id, 'Moyen terme (6-15 ans)', 6, 15, 4.0 FROM financial_products WHERE slug = 'assurance-vie-fonds-euro';
INSERT INTO public.product_rate_tiers (product_id, label, horizon_min_years, horizon_max_years, annual_rate)
SELECT id, 'Long terme (16-40 ans)', 16, 40, 4.5 FROM financial_products WHERE slug = 'assurance-vie-fonds-euro';

-- Rate tiers for SCPI
INSERT INTO public.product_rate_tiers (product_id, label, horizon_min_years, horizon_max_years, annual_rate)
SELECT id, 'Moyen terme (8-15 ans)', 8, 15, 5.0 FROM financial_products WHERE slug = 'scpi';
INSERT INTO public.product_rate_tiers (product_id, label, horizon_min_years, horizon_max_years, annual_rate)
SELECT id, 'Long terme (16-25 ans)', 16, 25, 5.5 FROM financial_products WHERE slug = 'scpi';
INSERT INTO public.product_rate_tiers (product_id, label, horizon_min_years, horizon_max_years, annual_rate)
SELECT id, 'Très long terme (26-40 ans)', 26, 40, 6.0 FROM financial_products WHERE slug = 'scpi';

-- Rate tiers for PEA
INSERT INTO public.product_rate_tiers (product_id, label, horizon_min_years, horizon_max_years, annual_rate)
SELECT id, 'Moyen terme (10-15 ans)', 10, 15, 5.0 FROM financial_products WHERE slug = 'pea-actions';
INSERT INTO public.product_rate_tiers (product_id, label, horizon_min_years, horizon_max_years, annual_rate)
SELECT id, 'Long terme (16-25 ans)', 16, 25, 7.0 FROM financial_products WHERE slug = 'pea-actions';
INSERT INTO public.product_rate_tiers (product_id, label, horizon_min_years, horizon_max_years, annual_rate)
SELECT id, 'Très long terme (26-40 ans)', 26, 40, 8.5 FROM financial_products WHERE slug = 'pea-actions';

-- Link products to objectives
INSERT INTO public.product_category_links (product_id, category_id)
SELECT fp.id, hpc.id FROM financial_products fp CROSS JOIN horizon_project_categories hpc
WHERE fp.slug = 'livrets' AND hpc.name IN ('Me constituer une épargne de précaution', 'Financer un projet personnel', 'Acheter un véhicule')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_category_links (product_id, category_id)
SELECT fp.id, hpc.id FROM financial_products fp CROSS JOIN horizon_project_categories hpc
WHERE fp.slug = 'assurance-vie-fonds-euro' AND hpc.name IN ('Préparer ma retraite', 'Financer les études de mes enfants', 'Faire fructifier son capital', 'Financer un projet personnel')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_category_links (product_id, category_id)
SELECT fp.id, hpc.id FROM financial_products fp CROSS JOIN horizon_project_categories hpc
WHERE fp.slug = 'scpi' AND hpc.name IN ('Constituer un apport pour un projet immobilier', 'Préparer ma retraite', 'Faire fructifier son capital')
ON CONFLICT DO NOTHING;

INSERT INTO public.product_category_links (product_id, category_id)
SELECT fp.id, hpc.id FROM financial_products fp CROSS JOIN horizon_project_categories hpc
WHERE fp.slug = 'pea-actions' AND hpc.name IN ('Faire fructifier son capital', 'Préparer ma retraite', 'Financer les études de mes enfants')
ON CONFLICT DO NOTHING;
