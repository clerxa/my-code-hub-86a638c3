
-- ============================================
-- 1. Table de tracking des pages visitées et événements CTA
-- ============================================
CREATE TABLE public.user_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'page_view', 'cta_click'
  event_name TEXT NOT NULL, -- 'expert_booking_page', 'offers_page', 'rdv_cta_dashboard', etc.
  event_data JSONB DEFAULT '{}',
  page_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour requêtes rapides par user et type
CREATE INDEX idx_user_events_user_id ON public.user_events(user_id);
CREATE INDEX idx_user_events_type_name ON public.user_events(event_type, event_name);
CREATE INDEX idx_user_events_created_at ON public.user_events(created_at DESC);

-- RLS
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own events"
ON public.user_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own events"
ON public.user_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all events"
ON public.user_events FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 2. Table de configuration des poids du scoring d'intention
-- ============================================
CREATE TABLE public.intention_score_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_key TEXT NOT NULL UNIQUE, -- 'daily_login', 'simulation_completed', 'module_completed', etc.
  signal_label TEXT NOT NULL,
  signal_category TEXT NOT NULL, -- 'engagement', 'intent_rdv', 'profile_maturity'
  points_per_unit NUMERIC NOT NULL DEFAULT 1,
  max_points NUMERIC DEFAULT NULL, -- plafond optionnel
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intention_score_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage intention score config"
ON public.intention_score_config FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read intention score config"
ON public.intention_score_config FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger updated_at
CREATE TRIGGER update_intention_score_config_updated_at
BEFORE UPDATE ON public.intention_score_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3. Seed des poids par défaut
-- ============================================
INSERT INTO public.intention_score_config (signal_key, signal_label, signal_category, points_per_unit, max_points, description, display_order) VALUES
  ('daily_login', 'Connexion quotidienne', 'engagement', 1, 15, 'Points par jour de connexion unique', 1),
  ('simulation_completed', 'Simulation réalisée', 'engagement', 3, 30, 'Points par simulation complétée (tous types)', 2),
  ('module_completed', 'Module/parcours complété', 'engagement', 5, 25, 'Points par module ou parcours validé', 3),
  ('financial_profile_filled', 'Profil financier rempli', 'profile_maturity', 15, 15, 'Bonus unique si le profil financier est complété', 4),
  ('horizon_completed', 'Horizon réalisé', 'profile_maturity', 15, 15, 'Bonus unique si au moins un projet Horizon existe', 5),
  ('diagnostic_completed', 'Diagnostic complété', 'profile_maturity', 10, 10, 'Bonus unique si le diagnostic est terminé', 6),
  ('expert_booking_page_view', 'Visite page RDV expert', 'intent_rdv', 5, 25, 'Points par visite sur la page de prise de RDV', 7),
  ('offers_page_view', 'Visite page Offres', 'intent_rdv', 3, 15, 'Points par visite sur la page Offres du moment', 8),
  ('rdv_cta_click_no_conversion', 'Clic CTA RDV sans conversion', 'intent_rdv', 8, 40, 'Points par clic sur un CTA de RDV sans prise de RDV effective', 9),
  ('rdv_cta_click_from_simulator', 'Clic CTA RDV depuis simulateur', 'intent_rdv', 6, 30, 'Points par clic CTA RDV dans un simulateur', 10);
