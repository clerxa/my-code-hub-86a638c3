-- Create onboarding_scenes table
CREATE TABLE IF NOT EXISTS public.onboarding_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordre INTEGER NOT NULL,
  image TEXT NOT NULL,
  texte TEXT NOT NULL,
  effet TEXT NOT NULL DEFAULT 'fade-in',
  statut BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_scenes ENABLE ROW LEVEL SECURITY;

-- Anyone can view active scenes
CREATE POLICY "Anyone can view active onboarding scenes"
ON public.onboarding_scenes
FOR SELECT
USING (statut = true);

-- Admins can manage all scenes
CREATE POLICY "Admins can manage onboarding scenes"
ON public.onboarding_scenes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default scenes
INSERT INTO public.onboarding_scenes (ordre, image, texte, effet) VALUES
(1, '/onboarding/onb1.png', 'Le monde financier semble clair… mais derrière chaque décision se cache une forêt d''ombres et de confusion.', 'fade-in'),
(2, '/onboarding/onb2.png', 'Au cœur des ombres, un jeune ours remarqua ce que les autres ne voyaient pas : l''origine du chaos.', 'spotlight'),
(3, '/onboarding/onb3.png', 'Panikra, Lord Taxon, Dr Obscurus… Ces Vilains se nourrissaient du doute des salariés.', 'pulsation'),
(4, '/onboarding/onb4.png', 'Alors FinBear fit un choix : ramener la clarté là où régnait l''obscurité.', 'motion-upward'),
(5, '/onboarding/onb5.png', 'Au centre du chaos règne Dominius Complexus. Pour le vaincre, il te faudra affronter chaque Vilain.', 'zoom-in'),
(6, '/onboarding/onb6.png', 'Aujourd''hui, FinBear partage sa lumière avec toi. Ta quête commence maintenant.', 'glow');

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_onboarding_scenes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_onboarding_scenes_updated_at
BEFORE UPDATE ON public.onboarding_scenes
FOR EACH ROW
EXECUTE FUNCTION public.update_onboarding_scenes_updated_at();