-- Fix company data exposure by restricting SELECT to user's own company
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;

-- Create a new policy that restricts users to viewing only their own company's data
CREATE POLICY "Users can view their own company data"
ON public.companies
FOR SELECT
TO authenticated
USING (
  id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);