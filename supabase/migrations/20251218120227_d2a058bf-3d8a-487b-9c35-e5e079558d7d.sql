-- Table pour configurer le boss final
CREATE TABLE public.final_boss_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom text NOT NULL DEFAULT 'DOMINIUS COMPLEXUS',
  description text DEFAULT 'Le boss final à vaincre',
  image_url text DEFAULT '/villains/dominius-complexus.png',
  theme_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.final_boss_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view final boss settings" 
ON public.final_boss_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage final boss settings" 
ON public.final_boss_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default data
INSERT INTO public.final_boss_settings (nom, description, image_url)
VALUES ('DOMINIUS COMPLEXUS', 'Le maître de la complexité financière', '/villains/dominius-complexus.png');