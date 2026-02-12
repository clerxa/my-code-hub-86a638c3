-- Table pour stocker la configuration des menus latéraux
CREATE TABLE public.sidebar_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sidebar_type TEXT NOT NULL CHECK (sidebar_type IN ('company', 'employee')),
  menu_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sidebar_type)
);

-- Enable RLS
ALTER TABLE public.sidebar_configurations ENABLE ROW LEVEL SECURITY;

-- Everyone can read configurations
CREATE POLICY "Anyone can read sidebar configurations"
ON public.sidebar_configurations
FOR SELECT
USING (true);

-- Only admins can modify configurations
CREATE POLICY "Only admins can modify sidebar configurations"
ON public.sidebar_configurations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_sidebar_configurations_updated_at
BEFORE UPDATE ON public.sidebar_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();