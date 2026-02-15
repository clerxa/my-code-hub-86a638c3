
-- Quotient familial rules
INSERT INTO public.global_settings (category, key, value, label, description, value_type, display_order, is_active)
VALUES
  ('fiscal_rules', 'qf_base_celibataire', '1', 'Parts de base - Célibataire/Divorcé/Séparé', 'Nombre de parts pour une personne seule', 'number', 100, true),
  ('fiscal_rules', 'qf_base_couple', '2', 'Parts de base - Marié/Pacsé', 'Nombre de parts pour un couple', 'number', 101, true),
  ('fiscal_rules', 'qf_base_veuf_avec_enfants', '1.5', 'Parts de base - Veuf avec enfants', 'Nombre de parts pour un veuf avec enfants à charge', 'number', 102, true),
  ('fiscal_rules', 'qf_enfant_1', '0.5', 'Parts - 1er enfant', 'Demi-part pour le 1er enfant', 'number', 103, true),
  ('fiscal_rules', 'qf_enfant_2', '0.5', 'Parts - 2ème enfant', 'Demi-part pour le 2ème enfant', 'number', 104, true),
  ('fiscal_rules', 'qf_enfant_suivant', '1', 'Parts - 3ème enfant et suivants', 'Part entière par enfant à partir du 3ème', 'number', 105, true),
  ('fiscal_rules', 'qf_bonus_parent_isole', '0.5', 'Bonus parent isolé', 'Demi-part supplémentaire pour parent isolé avec enfants', 'number', 106, true),
  ('fiscal_rules', 'qf_plafond_demi_part', '1759', 'Plafond par demi-part', 'Plafonnement du quotient familial par demi-part supplémentaire (€)', 'currency', 107, true);
