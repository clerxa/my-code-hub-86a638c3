-- Add onboarding_enabled setting
INSERT INTO public.settings (key, value, metadata)
VALUES ('employee_onboarding_enabled', 'false', '{"description": "Enable or disable employee onboarding for new users"}')
ON CONFLICT (key) DO UPDATE SET value = 'false';