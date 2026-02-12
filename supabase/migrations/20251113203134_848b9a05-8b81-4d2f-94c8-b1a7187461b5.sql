-- Permettre à tous les utilisateurs (y compris anonymes) de voir la liste des entreprises
CREATE POLICY "Anyone can view companies list"
ON public.companies
FOR SELECT
TO public
USING (true);