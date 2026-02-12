-- Add personal email and communication preference fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS personal_email text,
ADD COLUMN IF NOT EXISTS receive_on_personal_email boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.personal_email IS 'Adresse email personnelle de l''utilisateur pour les communications optionnelles';
COMMENT ON COLUMN public.profiles.receive_on_personal_email IS 'Si true, l''utilisateur souhaite recevoir les communications sur son email personnel';