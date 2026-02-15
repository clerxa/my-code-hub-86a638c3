
-- Table pour stocker la configuration du diagnostic
CREATE TABLE public.diagnostic_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'default',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diagnostic_configs ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage diagnostic configs"
ON public.diagnostic_configs
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- All authenticated users can read active configs
CREATE POLICY "Authenticated users can read active diagnostic configs"
ON public.diagnostic_configs
FOR SELECT
TO authenticated
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_diagnostic_configs_updated_at
BEFORE UPDATE ON public.diagnostic_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
