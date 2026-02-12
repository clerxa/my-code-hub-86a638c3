-- Table pour les CTA intelligents des simulateurs
CREATE TABLE IF NOT EXISTS public.simulator_ctas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulator_type TEXT NOT NULL CHECK (simulator_type IN ('per', 'espp', 'impots', 'optimisation_fiscale', 'epargne_precaution')),
  condition_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  button_text TEXT NOT NULL,
  button_color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'Calendar',
  action_type TEXT NOT NULL CHECK (action_type IN ('internal_link', 'external_link', 'html_script', 'modal')),
  action_value TEXT NOT NULL,
  order_num INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX idx_simulator_ctas_type_active ON public.simulator_ctas(simulator_type, active);

-- RLS
ALTER TABLE public.simulator_ctas ENABLE ROW LEVEL SECURITY;

-- Admins peuvent tout gérer
CREATE POLICY "Admins can manage simulator CTAs"
ON public.simulator_ctas
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Tous peuvent voir les CTA actifs
CREATE POLICY "Anyone can view active simulator CTAs"
ON public.simulator_ctas
FOR SELECT
USING (active = true);