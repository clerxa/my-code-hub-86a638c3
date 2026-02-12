-- Supprimer la politique qui cause la récursion infinie
DROP POLICY IF EXISTS "Users can view profiles from same company" ON public.profiles;

-- Créer une fonction SECURITY DEFINER pour obtenir le company_id de l'utilisateur courant sans déclencher RLS
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Recréer la politique en utilisant la fonction
CREATE POLICY "Users can view profiles from same company"
ON public.profiles
FOR SELECT
USING (
  company_id IS NOT NULL 
  AND company_id = public.get_current_user_company_id()
);