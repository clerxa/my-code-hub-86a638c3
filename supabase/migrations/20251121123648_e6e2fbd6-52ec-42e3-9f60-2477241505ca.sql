-- Améliorer la politique RLS pour les entreprises
-- Séparer en deux politiques distinctes pour plus de clarté

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Users can view their own company data" ON public.companies;

-- Créer une politique spécifique pour les admins
CREATE POLICY "Admins can view all companies"
ON public.companies
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Créer une politique pour les utilisateurs standards
CREATE POLICY "Users can view their company"
ON public.companies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT company_id
    FROM profiles
    WHERE id = auth.uid()
  )
);