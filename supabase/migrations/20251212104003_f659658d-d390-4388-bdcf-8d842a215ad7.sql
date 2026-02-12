-- Insert default expert booking embed code setting
INSERT INTO public.settings (key, value, metadata)
VALUES (
  'default_expert_booking_embed',
  '""',
  '{"description": "Code embed HubSpot par défaut pour la prise de RDV expert"}'
)
ON CONFLICT (key) DO NOTHING;