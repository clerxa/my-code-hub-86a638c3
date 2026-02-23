INSERT INTO global_settings (category, key, value, value_type, label, is_active)
VALUES 
  ('branding', 'beta_badge_enabled', 'true', 'boolean', 'Activer le badge Beta sur l''avatar', true),
  ('branding', 'beta_badge_text', '"Beta"', 'text', 'Texte du badge Beta', true),
  ('branding', 'beta_badge_color', '"#f59e0b"', 'text', 'Couleur du badge Beta', true)
ON CONFLICT DO NOTHING;