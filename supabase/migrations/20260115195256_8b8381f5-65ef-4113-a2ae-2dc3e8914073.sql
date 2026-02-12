-- Insert beta badge settings
INSERT INTO global_settings (category, key, label, value, value_type, description, display_order, is_active)
VALUES 
  ('branding', 'beta_badge_enabled', 'Afficher le badge Beta', 'true', 'number', 'Affiche un badge Beta dans le header (1 = oui, 0 = non)', 1, true),
  ('branding', 'beta_badge_text', 'Texte du badge Beta', '"Beta"', 'array', 'Le texte à afficher dans le badge (ex: Beta, Alpha, Preview, etc.)', 2, true);