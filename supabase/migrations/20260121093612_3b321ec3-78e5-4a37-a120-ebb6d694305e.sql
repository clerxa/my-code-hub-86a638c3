-- Créer une table pour le registre des clés d'évaluation
-- Ces clés peuvent être utilisées par les recommandations, CTAs et notifications
CREATE TABLE public.evaluation_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  category TEXT NOT NULL, -- 'financial_profile', 'simulation_result', 'user_progress', 'profile_status'
  source_type TEXT NOT NULL, -- 'database', 'computed', 'realtime'
  source_table TEXT, -- table source pour database type
  source_column TEXT, -- colonne source
  value_type TEXT NOT NULL DEFAULT 'number', -- 'number', 'boolean', 'string', 'percentage'
  unit TEXT, -- '€', '%', 'mois', 'ans', etc.
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.evaluation_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read
CREATE POLICY "Anyone can read evaluation_keys"
  ON public.evaluation_keys
  FOR SELECT
  USING (true);

-- Policy: Only admins can modify
CREATE POLICY "Admins can manage evaluation_keys"
  ON public.evaluation_keys
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_evaluation_keys_updated_at
  BEFORE UPDATE ON public.evaluation_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les clés par défaut
INSERT INTO public.evaluation_keys (key_name, label, category, source_type, source_table, source_column, value_type, unit, description, display_order) VALUES
-- Profil financier
('revenu_mensuel_net', 'Revenu mensuel net', 'financial_profile', 'database', 'user_financial_profiles', 'revenu_mensuel_net', 'number', '€', 'Revenu mensuel net de l''utilisateur', 1),
('revenu_fiscal_annuel', 'Revenu fiscal annuel', 'financial_profile', 'database', 'user_financial_profiles', 'revenu_fiscal_annuel', 'number', '€', 'Revenu fiscal de référence annuel', 2),
('charges_fixes_mensuelles', 'Charges fixes mensuelles', 'financial_profile', 'database', 'user_financial_profiles', 'charges_fixes_mensuelles', 'number', '€', 'Total des charges fixes mensuelles', 3),
('epargne_livrets', 'Épargne sur livrets', 'financial_profile', 'database', 'user_financial_profiles', 'epargne_livrets', 'number', '€', 'Montant total sur livrets d''épargne', 4),
('tmi', 'Tranche Marginale d''Imposition', 'financial_profile', 'database', 'user_financial_profiles', 'tmi', 'percentage', '%', 'TMI de l''utilisateur', 5),
('patrimoine_total', 'Patrimoine total', 'financial_profile', 'computed', NULL, NULL, 'number', '€', 'Somme de tous les actifs', 6),

-- Statut du profil
('financial_profile_completeness', 'Complétude profil financier', 'profile_status', 'computed', NULL, NULL, 'percentage', '%', 'Pourcentage de complétion du profil financier', 10),
('has_risk_profile', 'A un profil de risque', 'profile_status', 'computed', NULL, NULL, 'boolean', NULL, 'L''utilisateur a complété son profil de risque', 11),
('has_company', 'Appartient à une entreprise', 'profile_status', 'computed', NULL, NULL, 'boolean', NULL, 'L''utilisateur est rattaché à une entreprise', 12),

-- Progression utilisateur
('completed_modules_count', 'Modules complétés', 'user_progress', 'computed', NULL, NULL, 'number', NULL, 'Nombre de modules validés', 20),
('total_points', 'Points totaux', 'user_progress', 'database', 'profiles', 'total_points', 'number', 'pts', 'Points accumulés par l''utilisateur', 21),
('simulations_count', 'Simulations réalisées', 'user_progress', 'computed', NULL, NULL, 'number', NULL, 'Nombre total de simulations effectuées', 22),

-- Résultats de simulation - PER
('per_economie_impots', 'Économie impôts PER', 'simulation_result', 'database', 'per_simulations', 'economie_impots', 'number', '€', 'Économie d''impôts calculée sur simulateur PER', 30),
('per_capital_futur', 'Capital futur PER', 'simulation_result', 'database', 'per_simulations', 'capital_futur', 'number', '€', 'Capital futur estimé à la retraite', 31),

-- Résultats de simulation - Optimisation fiscale
('optim_economie_totale', 'Économie totale optimisation', 'simulation_result', 'database', 'optimisation_fiscale_simulations', 'economie_totale', 'number', '€', 'Économie totale via optimisation fiscale', 32),

-- Résultats de simulation - Capacité d'emprunt
('capacite_emprunt', 'Capacité d''emprunt', 'simulation_result', 'database', 'capacite_emprunt_simulations', 'capacite_emprunt', 'number', '€', 'Capacité d''emprunt calculée', 33),
('taux_endettement', 'Taux d''endettement', 'simulation_result', 'database', 'capacite_emprunt_simulations', 'taux_endettement_futur', 'percentage', '%', 'Taux d''endettement projeté', 34),

-- Résultats de simulation - Épargne précaution
('nb_mois_securite', 'Mois de sécurité', 'simulation_result', 'database', 'epargne_precaution_simulations', 'nb_mois_securite', 'number', 'mois', 'Nombre de mois de sécurité financière', 35),
('epargne_manquante', 'Épargne manquante', 'simulation_result', 'database', 'epargne_precaution_simulations', 'epargne_manquante', 'number', '€', 'Montant d''épargne à constituer', 36),

-- Résultats de simulation - LMNP
('lmnp_rendement_net', 'Rendement net LMNP', 'simulation_result', 'database', 'lmnp_simulations', 'rendement_net', 'percentage', '%', 'Rendement net du projet LMNP', 37),
('lmnp_cash_flow_mensuel', 'Cash-flow mensuel LMNP', 'simulation_result', 'database', 'lmnp_simulations', 'cash_flow_mensuel', 'number', '€', 'Cash-flow mensuel du projet LMNP', 38)
ON CONFLICT (key_name) DO NOTHING;