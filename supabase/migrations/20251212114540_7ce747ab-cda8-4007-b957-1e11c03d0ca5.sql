-- Create table for expert booking landing page settings
CREATE TABLE public.expert_booking_landing_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hero_title TEXT DEFAULT 'Prenez rendez-vous avec un expert',
  hero_subtitle TEXT DEFAULT 'Un accompagnement personnalisé pour optimiser vos finances',
  hero_image_url TEXT,
  benefits JSONB DEFAULT '[
    {"icon": "Target", "title": "Analyse personnalisée", "description": "Un expert analyse votre situation financière en détail"},
    {"icon": "TrendingUp", "title": "Stratégies optimisées", "description": "Des recommandations adaptées à vos objectifs"},
    {"icon": "Shield", "title": "Accompagnement sécurisé", "description": "Un suivi confidentiel et professionnel"}
  ]'::jsonb,
  cta_text TEXT DEFAULT 'Réserver mon créneau',
  cta_secondary_text TEXT DEFAULT 'Gratuit et sans engagement',
  testimonial_enabled BOOLEAN DEFAULT false,
  testimonial_text TEXT,
  testimonial_author TEXT,
  testimonial_role TEXT,
  footer_text TEXT DEFAULT 'Nos experts sont disponibles du lundi au vendredi, de 9h à 18h.',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expert_booking_landing_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read (public landing page)
CREATE POLICY "Anyone can view expert booking landing settings"
ON public.expert_booking_landing_settings
FOR SELECT
USING (true);

-- Only authenticated users can update (admin check will be in app)
CREATE POLICY "Authenticated users can update expert booking landing settings"
ON public.expert_booking_landing_settings
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert expert booking landing settings"
ON public.expert_booking_landing_settings
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Insert default settings
INSERT INTO public.expert_booking_landing_settings (id) VALUES (gen_random_uuid());