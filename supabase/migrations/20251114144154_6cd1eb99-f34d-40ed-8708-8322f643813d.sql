-- Ajouter les colonnes pour le suivi des connexions
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login timestamp with time zone,
ADD COLUMN IF NOT EXISTS total_time_connected integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_session_start timestamp with time zone;