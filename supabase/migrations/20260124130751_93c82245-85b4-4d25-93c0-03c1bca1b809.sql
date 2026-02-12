-- Allow users without partnership to update their company name
CREATE POLICY "Users without partnership can update their company name"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  -- User must be linked to this company
  id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND (
    -- Company has no partnership (null or empty)
    partnership_type IS NULL 
    OR partnership_type = '' 
    OR LOWER(partnership_type) = 'aucun'
  )
)
WITH CHECK (
  -- User must be linked to this company  
  id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  AND (
    -- Company has no partnership
    partnership_type IS NULL 
    OR partnership_type = '' 
    OR LOWER(partnership_type) = 'aucun'
  )
);