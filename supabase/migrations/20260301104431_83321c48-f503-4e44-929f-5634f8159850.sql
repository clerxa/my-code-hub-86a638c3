ALTER TABLE public.simulators ADD COLUMN IF NOT EXISTS vega_eligible BOOLEAN NOT NULL DEFAULT false;

-- Set RSU and ESPP as vega-eligible
UPDATE public.simulators SET vega_eligible = true WHERE slug IN ('simulateur-rsu', 'simulateur-espp', 'rsu', 'espp');
-- Also try matching by route
UPDATE public.simulators SET vega_eligible = true WHERE route IN ('/simulateur-rsu', '/simulateur-espp');