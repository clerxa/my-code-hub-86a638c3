-- Ajouter la clé étrangère entre webinar_registrations et profiles
ALTER TABLE public.webinar_registrations
ADD CONSTRAINT webinar_registrations_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;