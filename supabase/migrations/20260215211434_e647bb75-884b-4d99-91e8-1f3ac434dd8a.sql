
-- CEHR (Contribution Exceptionnelle sur les Hauts Revenus)
INSERT INTO public.global_settings (category, key, value, label, description, value_type, display_order, year, is_active) VALUES
('fiscal_rules', 'cehr_taux_1', '3', 'CEHR - Taux tranche 1 (%)', 'Taux de la première tranche de la CEHR', 'percentage', 200, 2025, true),
('fiscal_rules', 'cehr_taux_2', '4', 'CEHR - Taux tranche 2 (%)', 'Taux de la deuxième tranche de la CEHR', 'percentage', 201, 2025, true),
('fiscal_rules', 'cehr_seuil_1_celibataire', '250000', 'CEHR - Seuil tranche 1 célibataire (€)', 'Seuil RFR déclenchant la tranche 1 pour un célibataire', 'currency', 202, 2025, true),
('fiscal_rules', 'cehr_seuil_2_celibataire', '500000', 'CEHR - Seuil tranche 2 célibataire (€)', 'Seuil RFR déclenchant la tranche 2 pour un célibataire', 'currency', 203, 2025, true),
('fiscal_rules', 'cehr_seuil_1_couple', '500000', 'CEHR - Seuil tranche 1 couple (€)', 'Seuil RFR déclenchant la tranche 1 pour un couple (marié/pacsé)', 'currency', 204, 2025, true),
('fiscal_rules', 'cehr_seuil_2_couple', '1000000', 'CEHR - Seuil tranche 2 couple (€)', 'Seuil RFR déclenchant la tranche 2 pour un couple (marié/pacsé)', 'currency', 205, 2025, true),

-- CDHR (Contribution Différentielle sur les Hauts Revenus) - Loi de finances 2025
('fiscal_rules', 'cdhr_taux_minimum', '20', 'CDHR - Taux effectif minimum (%)', 'Taux minimum d''imposition effectif garanti par la CDHR', 'percentage', 210, 2025, true),
('fiscal_rules', 'cdhr_seuil_celibataire', '250000', 'CDHR - Seuil RFR célibataire (€)', 'Seuil de RFR déclenchant la CDHR pour un célibataire', 'currency', 211, 2025, true),
('fiscal_rules', 'cdhr_seuil_couple', '500000', 'CDHR - Seuil RFR couple (€)', 'Seuil de RFR déclenchant la CDHR pour un couple (marié/pacsé)', 'currency', 212, 2025, true);
