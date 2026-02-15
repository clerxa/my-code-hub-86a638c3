
-- RSU Qualifiés (AGA - Actions Gratuites Attribuées, régime fiscal favorable)
INSERT INTO public.global_settings (category, key, value, label, description, value_type, display_order, year, is_active) VALUES
-- Gain d'acquisition
('fiscal_rules', 'rsu_q_abattement_taux', '50', 'RSU qualifié - Abattement gain acquisition (%)', 'Abattement applicable sur le gain d''acquisition des AGA si durée de détention respectée', 'percentage', 300, 2025, true),
('fiscal_rules', 'rsu_q_abattement_seuil', '300000', 'RSU qualifié - Seuil abattement (€)', 'Seuil annuel du gain d''acquisition en dessous duquel l''abattement s''applique', 'currency', 301, 2025, true),
('fiscal_rules', 'rsu_q_duree_acquisition_min', '1', 'RSU qualifié - Durée acquisition min (années)', 'Durée minimale de la période d''acquisition pour bénéficier du régime qualifié', 'number', 302, 2025, true),
('fiscal_rules', 'rsu_q_duree_conservation_min', '0', 'RSU qualifié - Durée conservation min (années)', 'Durée minimale de conservation post-acquisition (0 si acquisition >= 2 ans)', 'number', 303, 2025, true),
('fiscal_rules', 'rsu_q_duree_detention_totale_min', '2', 'RSU qualifié - Durée détention totale min (années)', 'Durée totale minimale (acquisition + conservation) pour bénéficier de l''abattement', 'number', 304, 2025, true),
-- Contributions et charges RSU qualifiés
('fiscal_rules', 'rsu_q_contribution_patronale', '30', 'RSU qualifié - Contribution patronale (%)', 'Contribution patronale spécifique sur le gain d''acquisition des AGA', 'percentage', 305, 2025, true),
('fiscal_rules', 'rsu_q_csg_crds_rate', '9.7', 'RSU qualifié - CSG + CRDS (%)', 'Taux de CSG (9.2%) + CRDS (0.5%) sur le gain d''acquisition', 'percentage', 306, 2025, true),
('fiscal_rules', 'rsu_q_csg_deductible', '6.8', 'RSU qualifié - CSG déductible (%)', 'Part de la CSG déductible du revenu imposable', 'percentage', 307, 2025, true),
-- Excédent au-delà du seuil (traité comme salaire)
('fiscal_rules', 'rsu_q_contribution_salariale_excedent', '10', 'RSU qualifié - Contribution salariale excédent (%)', 'Contribution salariale sur la fraction du gain d''acquisition excédant le seuil de 300 000 €', 'percentage', 308, 2025, true),

-- RSU Non Qualifiés (traités comme traitements et salaires)
('fiscal_rules', 'rsu_nq_charges_sociales_salarie', '22', 'RSU non qualifié - Charges sociales salarié (%)', 'Taux global de charges sociales salariales sur le gain d''acquisition (traité comme salaire)', 'percentage', 320, 2025, true),
('fiscal_rules', 'rsu_nq_charges_sociales_employeur', '45', 'RSU non qualifié - Charges sociales employeur (%)', 'Taux global de charges sociales patronales sur le gain d''acquisition', 'percentage', 321, 2025, true),

-- Plus-value de cession (commun aux deux régimes)
('fiscal_rules', 'rsu_pv_cession_pfu_ir', '12.8', 'RSU PV cession - Taux IR PFU (%)', 'Taux d''IR au titre du PFU sur la plus-value de cession', 'percentage', 330, 2025, true),
('fiscal_rules', 'rsu_pv_cession_ps', '17.2', 'RSU PV cession - Prélèvements sociaux (%)', 'Taux de prélèvements sociaux sur la plus-value de cession', 'percentage', 331, 2025, true),
-- Abattement pour durée de détention (option barème)
('fiscal_rules', 'rsu_pv_abattement_2ans', '50', 'RSU PV cession - Abattement 2-8 ans (%)', 'Abattement pour durée de détention entre 2 et 8 ans (option barème uniquement)', 'percentage', 332, 2025, true),
('fiscal_rules', 'rsu_pv_abattement_8ans', '65', 'RSU PV cession - Abattement > 8 ans (%)', 'Abattement pour durée de détention supérieure à 8 ans (option barème uniquement)', 'percentage', 333, 2025, true);
