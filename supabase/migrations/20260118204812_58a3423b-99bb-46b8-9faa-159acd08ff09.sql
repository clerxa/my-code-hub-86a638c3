-- Table de configuration des points (centralisée)
CREATE TABLE public.points_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  points INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.points_configuration ENABLE ROW LEVEL SECURITY;

-- Policies - admins can manage, all authenticated can read
CREATE POLICY "Anyone can view points configuration"
ON public.points_configuration FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage points configuration"
ON public.points_configuration FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default configurations
INSERT INTO public.points_configuration (category, points, description) VALUES
  ('module_completion', 50, 'Points pour la complétion d''un module de formation'),
  ('guide_completion', 30, 'Points pour la lecture d''un guide'),
  ('video_completion', 25, 'Points pour le visionnage d''une vidéo'),
  ('quiz_completion', 40, 'Points pour la complétion d''un quiz'),
  ('simulator_completion', 35, 'Points pour l''utilisation d''un simulateur'),
  ('webinar_registration', 20, 'Points pour l''inscription à un webinar'),
  ('daily_login', 5, 'Points pour la connexion quotidienne'),
  ('forum_create_post', 15, 'Points pour la création d''un post dans le forum'),
  ('forum_create_comment', 10, 'Points pour un commentaire dans le forum'),
  ('forum_receive_like', 5, 'Points quand quelqu''un aime votre contenu'),
  ('forum_give_like', 2, 'Points pour donner un like');

-- Table pour tracker les connexions quotidiennes
CREATE TABLE public.daily_logins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  points_awarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, login_date)
);

-- Enable RLS
ALTER TABLE public.daily_logins ENABLE ROW LEVEL SECURITY;

-- Users can only see their own logins
CREATE POLICY "Users can view their own logins"
ON public.daily_logins FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logins"
ON public.daily_logins FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update logins"
ON public.daily_logins FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at on points_configuration
CREATE TRIGGER update_points_configuration_updated_at
BEFORE UPDATE ON public.points_configuration
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();