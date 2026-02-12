-- Table simple pour les inscriptions sans compte
CREATE TABLE IF NOT EXISTS public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS minimales
-- Autoriser l'insertion par les utilisateurs anonymes (formulaire public)
CREATE POLICY "Anon can insert registrations" ON public.registrations
FOR INSERT TO anon
WITH CHECK (true);

-- Interdire la lecture publique: aucune policy SELECT pour anon
-- Autoriser uniquement les admins à voir toutes les inscriptions
CREATE POLICY "Admins can view registrations" ON public.registrations
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
