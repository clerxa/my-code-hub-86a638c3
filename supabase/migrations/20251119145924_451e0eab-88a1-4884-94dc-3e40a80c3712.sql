-- Drop the problematic policy
DROP POLICY IF EXISTS "Company contacts can update their company about description" ON public.companies;

-- Create a corrected policy without recursion
CREATE POLICY "Company contacts can update their company"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  -- Check if user is contact_entreprise for this company
  EXISTS (
    SELECT 1 
    FROM profiles p
    INNER JOIN user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid() 
    AND p.company_id = companies.id
    AND ur.role = 'contact_entreprise'
  )
)
WITH CHECK (
  -- Same check for WITH CHECK
  EXISTS (
    SELECT 1 
    FROM profiles p
    INNER JOIN user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid() 
    AND p.company_id = companies.id
    AND ur.role = 'contact_entreprise'
  )
);