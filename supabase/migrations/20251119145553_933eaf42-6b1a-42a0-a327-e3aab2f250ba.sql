-- Add RLS policy for company contacts to update their company's about_description
CREATE POLICY "Company contacts can update their company about description"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT c.id 
    FROM companies c
    INNER JOIN profiles p ON p.company_id = c.id
    INNER JOIN user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid() 
    AND ur.role = 'contact_entreprise'
  )
)
WITH CHECK (
  id IN (
    SELECT c.id 
    FROM companies c
    INNER JOIN profiles p ON p.company_id = c.id
    INNER JOIN user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid() 
    AND ur.role = 'contact_entreprise'
  )
);