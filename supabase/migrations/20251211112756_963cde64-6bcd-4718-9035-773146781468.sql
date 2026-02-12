-- Drop existing policies on company_contacts
DROP POLICY IF EXISTS "Admins can view all company contacts" ON public.company_contacts;
DROP POLICY IF EXISTS "Admins can insert company contacts" ON public.company_contacts;
DROP POLICY IF EXISTS "Admins can update company contacts" ON public.company_contacts;
DROP POLICY IF EXISTS "Admins can delete company contacts" ON public.company_contacts;

-- Create new policies that allow both admins and contact_entreprise users
CREATE POLICY "Users can view company contacts" 
ON public.company_contacts 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    has_role(auth.uid(), 'contact_entreprise'::app_role) 
    AND company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can insert company contacts" 
ON public.company_contacts 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    has_role(auth.uid(), 'contact_entreprise'::app_role) 
    AND company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can update company contacts" 
ON public.company_contacts 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    has_role(auth.uid(), 'contact_entreprise'::app_role) 
    AND company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "Users can delete company contacts" 
ON public.company_contacts 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    has_role(auth.uid(), 'contact_entreprise'::app_role) 
    AND company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  )
);