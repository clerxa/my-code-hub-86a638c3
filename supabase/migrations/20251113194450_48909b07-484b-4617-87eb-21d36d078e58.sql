-- Allow users to view profiles from their own company
CREATE POLICY "Users can view profiles from their company" 
ON public.profiles 
FOR SELECT 
USING (
  company_id IS NOT NULL 
  AND company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);