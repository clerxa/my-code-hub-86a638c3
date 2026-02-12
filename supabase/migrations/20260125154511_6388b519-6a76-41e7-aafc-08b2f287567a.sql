-- Add DELETE policy for admins on hubspot_appointments
CREATE POLICY "Admins can delete appointments"
ON public.hubspot_appointments
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));