-- Create table for plan unlock configuration
CREATE TABLE IF NOT EXISTS public.plan_unlock_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  points_per_employee INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_id)
);

-- Enable RLS
ALTER TABLE public.plan_unlock_config ENABLE ROW LEVEL SECURITY;

-- Policies for plan_unlock_config
CREATE POLICY "Admins can manage plan unlock config"
ON public.plan_unlock_config
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view plan unlock config"
ON public.plan_unlock_config
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_plan_unlock_config_updated_at
BEFORE UPDATE ON public.plan_unlock_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configurations for Hero and Legend plans
INSERT INTO public.plan_unlock_config (plan_id, points_per_employee)
SELECT id, 
  CASE 
    WHEN niveau = 'hero' THEN 1000
    WHEN niveau = 'legend' THEN 2000
    ELSE 1000
  END
FROM public.plans
WHERE niveau IN ('hero', 'legend')
ON CONFLICT (plan_id) DO NOTHING;