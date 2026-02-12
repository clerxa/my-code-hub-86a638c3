-- Create celebration settings table for parcours completion
CREATE TABLE public.celebration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Video settings
  video_url TEXT DEFAULT '/finbear_success.mp4',
  video_enabled BOOLEAN DEFAULT true,
  
  -- Content settings
  title TEXT DEFAULT 'Félicitations ! 🎉',
  subtitle TEXT DEFAULT 'Tu as terminé le parcours',
  motivational_message TEXT DEFAULT 'Continue sur ta lancée ! Chaque parcours complété te rapproche de la maîtrise de tes finances. 💪',
  button_text TEXT DEFAULT 'Découvrir d''autres parcours',
  button_url TEXT DEFAULT '/parcours',
  
  -- Visual settings
  show_confetti BOOLEAN DEFAULT true,
  show_points BOOLEAN DEFAULT true,
  gradient_start TEXT DEFAULT '217 91% 60%',
  gradient_middle TEXT DEFAULT '271 81% 56%',
  gradient_end TEXT DEFAULT '38 92% 50%'
);

-- Enable RLS
ALTER TABLE public.celebration_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Anyone can read celebration settings" 
ON public.celebration_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can update celebration settings" 
ON public.celebration_settings 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert celebration settings" 
ON public.celebration_settings 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Insert default settings
INSERT INTO public.celebration_settings (id) VALUES ('00000000-0000-0000-0000-000000000001');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_celebration_settings_updated_at
BEFORE UPDATE ON public.celebration_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();