-- Add all missing field keys from user_financial_profiles that aren't yet in financial_profile_required_fields
-- These are fields that exist in the profile but weren't previously configurable in the admin

INSERT INTO public.financial_profile_required_fields (field_key, field_label, is_required, display_order)
VALUES
  ('nb_personnes_foyer', 'Nombre de personnes au foyer', false, 100),
  ('secteur_activite', 'Secteur d''activité', false, 101),
  ('parts_fiscales', 'Parts fiscales', false, 102),
  ('patrimoine_crypto', 'Patrimoine crypto', false, 103),
  ('patrimoine_private_equity', 'Patrimoine private equity', false, 104),
  ('has_pero', 'A un PERO', false, 105),
  ('has_epargne_autres', 'Autres dispositifs d''épargne', false, 106),
  ('has_equity_autres', 'Autres dispositifs equity', false, 107),
  ('valeur_rsu_aga', 'Valeur RSU/AGA', false, 108),
  ('valeur_espp', 'Valeur ESPP', false, 109),
  ('valeur_stock_options', 'Valeur stock-options', false, 110),
  ('valeur_bspce', 'Valeur BSPCE', false, 111),
  ('valeur_pee', 'Valeur PEE', false, 112),
  ('valeur_perco', 'Valeur PERCO', false, 113),
  ('budget_residence_principale', 'Budget résidence principale', false, 114),
  ('budget_residence_secondaire', 'Budget résidence secondaire', false, 115),
  ('budget_investissement_locatif', 'Budget investissement locatif', false, 116),
  ('revenu_mensuel_net', 'Revenu mensuel net (calculé)', false, 117)
ON CONFLICT DO NOTHING;