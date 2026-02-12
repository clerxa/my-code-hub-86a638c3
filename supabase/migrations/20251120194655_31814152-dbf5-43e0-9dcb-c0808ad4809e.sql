-- Créer une table pour suivre les inscriptions aux webinars
CREATE TABLE IF NOT EXISTS public.webinar_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  livestorm_participant_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leurs propres inscriptions
CREATE POLICY "Users can view their own webinar registrations"
ON public.webinar_registrations
FOR SELECT
USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent s'inscrire
CREATE POLICY "Users can register for webinars"
ON public.webinar_registrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Politique : Les admins peuvent tout voir
CREATE POLICY "Admins can view all webinar registrations"
ON public.webinar_registrations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Politique : Les admins peuvent tout gérer
CREATE POLICY "Admins can manage all webinar registrations"
ON public.webinar_registrations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger pour updated_at
CREATE TRIGGER update_webinar_registrations_updated_at
BEFORE UPDATE ON public.webinar_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_webinar_registrations_user_id ON public.webinar_registrations(user_id);
CREATE INDEX idx_webinar_registrations_module_id ON public.webinar_registrations(module_id);
CREATE INDEX idx_webinar_registrations_email ON public.webinar_registrations(email);