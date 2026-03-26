
-- Beta module interests table
CREATE TABLE IF NOT EXISTS public.beta_module_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  module_key text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.beta_module_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own interest"
  ON public.beta_module_interests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can read their own interests"
  ON public.beta_module_interests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all interests"
  ON public.beta_module_interests
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert beta_mode settings into global_settings
INSERT INTO public.global_settings (category, key, label, value, value_type)
VALUES 
  ('beta', 'beta_mode_enabled', 'Mode Beta activé', 'true', 'boolean'),
  ('beta', 'beta_locked_modules', 'Modules verrouillés en beta', '["vega", "atlas", "horizon", "zenith"]', 'json')
ON CONFLICT DO NOTHING;
