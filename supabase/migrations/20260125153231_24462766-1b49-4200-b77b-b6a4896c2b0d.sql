-- Fix overly permissive RLS policy - replace with proper restrictions
DROP POLICY IF EXISTS "Service role can do everything" ON public.booking_referrers;

-- Allow admins to read all referrers
CREATE POLICY "Admins can read all referrers"
ON public.booking_referrers
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update referrers
CREATE POLICY "Admins can update referrers"
ON public.booking_referrers
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete referrers
CREATE POLICY "Admins can delete referrers"
ON public.booking_referrers
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));