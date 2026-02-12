-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage external registrations" ON public.webinar_external_registrations;

-- No need for insert/update policies as edge functions use service role which bypasses RLS