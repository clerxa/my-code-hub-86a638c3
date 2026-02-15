
-- =============================================
-- MISE À JOUR CMS : Features manquantes
-- =============================================

-- Simulateur Intérêts Composés
INSERT INTO public.features (cle_technique, nom_fonctionnalite, categorie, description, active, requires_partnership)
VALUES 
  ('simulateur_interets_composes', 'Simulateur Intérêts Composés', 'Simulateurs', 'Découvrez la puissance de l''effet boule de neige sur votre épargne', true, false),
  ('simulateur_pret_immobilier', 'Simulateur de Financement Ultime', 'Simulateurs', 'Calculez vos mensualités et le coût total de votre crédit immobilier', true, false),
  ('simulateur_capacite_emprunt', 'Simulateur Capacité d''Emprunt', 'Simulateurs', 'Évaluez votre capacité d''emprunt et votre taux d''endettement', true, false),
  ('simulateur_gestion_pilotee', 'Simulateur Gestion Pilotée', 'Simulateurs', 'Comparez les stratégies Assurance Vie et PER en gestion pilotée', true, false),
  ('simulateur_pvi', 'Simulateur Plus-Value Immobilière', 'Simulateurs', 'Estimez l''imposition sur la plus-value lors de la vente d''un bien immobilier', true, false),
  ('horizon_patrimonial', 'Horizon Patrimonial', 'Patrimoine', 'Pilotez vos projets patrimoniaux avec des projections et une stratégie globale', true, true),
  ('diagnostic_myfincare', 'Diagnostic MyFinCare', 'Formation', 'Évaluez votre niveau de connaissances financières avec un diagnostic complet', true, false),
  ('profil_risque', 'Profil de Risque', 'Gestion', 'Déterminez votre profil d''investisseur pour des recommandations adaptées', true, false),
  ('profil_financier', 'Profil Financier', 'Gestion', 'Renseignez votre situation financière pour personnaliser votre expérience', true, false),
  ('invitations_collegues', 'Invitations Collègues', 'Communauté', 'Invitez vos collègues à rejoindre MyFinCare', true, true),
  ('declaration_fiscale', 'Aide Déclaration Fiscale', 'Formation', 'Accompagnement pour remplir votre déclaration de revenus', true, true)
ON CONFLICT DO NOTHING;

-- =============================================
-- MISE À JOUR CMS : Evaluation Keys manquantes
-- =============================================

-- Résultats simulateur prêt immobilier
INSERT INTO public.evaluation_keys (key_name, label, category, source_type, source_table, source_column, is_active, display_order)
VALUES
  ('pret_immo_mensualite', 'Mensualité crédit immobilier', 'simulation_result', 'database', 'pret_immobilier_simulations', 'mensualite_totale', true, 30),
  ('pret_immo_cout_total', 'Coût total du crédit', 'simulation_result', 'database', 'pret_immobilier_simulations', 'cout_global_credit', true, 31),
  ('pret_immo_taux_endettement', 'Taux d''endettement (prêt)', 'simulation_result', 'database', 'pret_immobilier_simulations', 'taux_endettement', true, 32),
  -- Diagnostic
  ('diagnostic_score', 'Score diagnostic (%)', 'user_progress', 'database', 'diagnostic_results', 'score_percent', true, 30),
  ('diagnostic_status', 'Statut du diagnostic', 'profile_status', 'database', 'diagnostic_results', 'status', true, 40),
  -- Horizon
  ('horizon_projects_count', 'Nombre de projets Horizon', 'user_progress', 'computed', null, null, true, 40),
  ('horizon_capital_alloue', 'Capital alloué Horizon', 'user_progress', 'computed', null, null, true, 41),
  -- Profil de risque
  ('risk_profile_type', 'Type de profil de risque', 'profile_status', 'database', 'risk_profiles', 'profile_type', true, 50),
  ('risk_profile_score', 'Score profil de risque', 'profile_status', 'database', 'risk_profiles', 'total_weighted_score', true, 51),
  -- Métriques engagement
  ('daily_logins_count', 'Nombre de connexions', 'user_progress', 'computed', null, null, true, 50),
  ('forum_posts_count', 'Posts dans le forum', 'user_progress', 'computed', null, null, true, 51),
  ('appointments_count', 'Rendez-vous experts', 'user_progress', 'computed', null, null, true, 52),
  ('invitations_sent_count', 'Invitations envoyées', 'user_progress', 'computed', null, null, true, 53)
ON CONFLICT DO NOTHING;
