-- Ajouter une politique RLS pour permettre aux utilisateurs de voir les profils de leur entreprise
CREATE POLICY "Users can view profiles from same company"
ON public.profiles
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);