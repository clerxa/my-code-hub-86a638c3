
-- =============================================
-- PVI (Plus-Value Immobilière) constants
-- =============================================
INSERT INTO public.global_settings (category, key, value, label, description, value_type, validation_min, validation_max, year, is_active, display_order)
VALUES
  ('fiscal_rules', 'pvi_taux_ir', '19', 'Taux IR sur PV immobilière', 'Taux d''imposition sur les plus-values immobilières (Art. 200 B CGI)', 'percentage', 0, 100, NULL, true, 200),
  ('fiscal_rules', 'pvi_taux_ps', '17.2', 'Prélèvements sociaux PVI', 'Taux des prélèvements sociaux sur les plus-values immobilières', 'percentage', 0, 100, NULL, true, 201),
  ('fiscal_rules', 'pvi_forfait_frais_acquisition', '7.5', 'Forfait frais d''acquisition PVI', 'Taux forfaitaire pour les frais d''acquisition (notaire)', 'percentage', 0, 100, NULL, true, 202),
  ('fiscal_rules', 'pvi_forfait_travaux', '15', 'Forfait travaux PVI', 'Taux forfaitaire pour les travaux (si détention > 5 ans)', 'percentage', 0, 100, NULL, true, 203),
  -- Abattement IR PVI
  ('fiscal_rules', 'pvi_abattement_ir_taux_annuel', '6', 'Abattement IR PVI - taux annuel', 'Taux d''abattement IR par année de détention (6e à 21e année)', 'percentage', 0, 100, NULL, true, 204),
  ('fiscal_rules', 'pvi_abattement_ir_taux_22e', '4', 'Abattement IR PVI - 22e année', 'Taux d''abattement IR pour la 22e année de détention', 'percentage', 0, 100, NULL, true, 205),
  ('fiscal_rules', 'pvi_abattement_ir_debut_annee', '6', 'Abattement IR PVI - début', 'Année de début de l''abattement IR pour durée de détention', 'number', 1, 30, NULL, true, 206),
  ('fiscal_rules', 'pvi_abattement_ir_exoneration_annee', '22', 'Exonération IR PVI - année', 'Année d''exonération totale IR', 'number', 1, 50, NULL, true, 207),
  -- Abattement PS PVI
  ('fiscal_rules', 'pvi_abattement_ps_phase1_rate', '1.65', 'Abattement PS PVI - phase 1', 'Taux d''abattement PS par an, années 6 à 21', 'percentage', 0, 100, NULL, true, 208),
  ('fiscal_rules', 'pvi_abattement_ps_phase2_rate', '1.60', 'Abattement PS PVI - phase 2', 'Taux d''abattement PS pour la 22e année', 'percentage', 0, 100, NULL, true, 209),
  ('fiscal_rules', 'pvi_abattement_ps_phase3_rate', '9', 'Abattement PS PVI - phase 3', 'Taux d''abattement PS par an, années 23 à 30', 'percentage', 0, 100, NULL, true, 210),
  ('fiscal_rules', 'pvi_abattement_ps_exoneration_annee', '30', 'Exonération PS PVI - année', 'Année d''exonération totale PS', 'number', 1, 50, NULL, true, 211),
  -- Surtaxe PVI
  ('fiscal_rules', 'pvi_surtaxe_brackets', '[{"seuil":50000,"taux":2},{"seuil":100000,"taux":3},{"seuil":150000,"taux":4},{"seuil":200000,"taux":5},{"seuil":250000,"taux":6}]', 'Barème surtaxe PVI', 'Tranches de surtaxe sur les hautes plus-values immobilières (Art. 1609 nonies G CGI)', 'array', NULL, NULL, NULL, true, 212),

-- =============================================
-- Simulateur Capacité d'épargne
-- =============================================
  ('simulation_defaults', 'brut_net_ratio', '78', 'Ratio brut → net (%)', 'Ratio approximatif de conversion du salaire brut en net', 'percentage', 50, 100, NULL, true, 200),
  ('simulation_defaults', 'optimisation_reduction_rate', '10', 'Réduction "Et si ?" (%)', 'Pourcentage de réduction des envies dans le scénario d''optimisation', 'percentage', 0, 50, NULL, true, 201),
  ('simulation_defaults', 'budget_rule_besoins', '50', 'Règle 50/30/20 - Besoins (%)', 'Pourcentage idéal pour les besoins (règle 50/30/20)', 'percentage', 0, 100, NULL, true, 202),
  ('simulation_defaults', 'budget_rule_envies', '30', 'Règle 50/30/20 - Envies (%)', 'Pourcentage idéal pour les envies (règle 50/30/20)', 'percentage', 0, 100, NULL, true, 203),
  ('simulation_defaults', 'budget_rule_epargne', '20', 'Règle 50/30/20 - Épargne (%)', 'Pourcentage idéal pour l''épargne (règle 50/30/20)', 'percentage', 0, 100, NULL, true, 204),

-- =============================================
-- Seuils endettement (pour les simulateurs prêt/emprunt)
-- =============================================
  ('simulation_defaults', 'endettement_excellent', '30', 'Endettement - Seuil excellent (%)', 'Seuil en-dessous duquel le taux d''endettement est considéré excellent', 'percentage', 0, 100, NULL, true, 210),
  ('simulation_defaults', 'endettement_bon', '33', 'Endettement - Seuil bon (%)', 'Seuil en-dessous duquel le taux d''endettement est considéré bon', 'percentage', 0, 100, NULL, true, 211),
  ('simulation_defaults', 'endettement_limite', '35', 'Endettement - Seuil limite (%)', 'Seuil au-delà duquel le taux d''endettement est trop élevé', 'percentage', 0, 100, NULL, true, 212),

-- =============================================
-- Défauts simulateur PER
-- =============================================
  ('simulation_defaults', 'default_age_actuel', '35', 'Âge actuel par défaut', 'Âge actuel pré-rempli par défaut dans le simulateur PER', 'number', 18, 70, NULL, true, 220),
  ('simulation_defaults', 'default_versement_per', '5000', 'Versement PER par défaut (€)', 'Montant de versement PER pré-rempli par défaut', 'currency', 0, 100000, NULL, true, 221)
ON CONFLICT DO NOTHING;
