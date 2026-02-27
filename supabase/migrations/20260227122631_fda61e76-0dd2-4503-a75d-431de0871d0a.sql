-- Insert RSU simulator
INSERT INTO simulators (name, slug, description, icon, route, feature_key, category_id, duration_minutes, order_num, is_active)
VALUES (
  'Simulateur RSU',
  'rsu',
  'Calculez la fiscalité de vos actions gratuites (RSU) à la cession',
  'award',
  '/simulateur-rsu',
  'simulateur_rsu',
  '3bffb8b5-8fbf-4da5-b4bb-68aea220eb4a',
  10,
  3,
  true
);

-- Insert feature flag for RSU
INSERT INTO features (cle_technique, nom_fonctionnalite, categorie, description, active, requires_partnership)
VALUES (
  'simulateur_rsu',
  'Simulateur RSU',
  'simulateur',
  'Simulateur de fiscalité des actions gratuites (RSU)',
  true,
  true
);