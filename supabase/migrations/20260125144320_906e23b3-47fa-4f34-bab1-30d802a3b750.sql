-- Allow admins to delete tax declaration requests
CREATE POLICY "Admins can delete all tax requests"
ON public.tax_declaration_requests
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));