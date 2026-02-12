-- Tighten permissive RLS policies flagged by the linter

-- 1) hubspot_appointments: only backend (service role) should insert
DROP POLICY IF EXISTS "Service role can insert appointments" ON public.hubspot_appointments;
CREATE POLICY "Service role can insert appointments"
ON public.hubspot_appointments
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- 2) forum_activity_logs: only backend (service role) should insert
DROP POLICY IF EXISTS "System can insert activity logs" ON public.forum_activity_logs;
CREATE POLICY "System can insert activity logs"
ON public.forum_activity_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- 3) partnership_contact_requests: allow public creation but require minimal non-empty fields
DROP POLICY IF EXISTS "Anyone can create partnership contact requests" ON public.partnership_contact_requests;
CREATE POLICY "Anyone can create partnership contact requests"
ON public.partnership_contact_requests
FOR INSERT
WITH CHECK (
  email IS NOT NULL AND email <> ''
  AND first_name IS NOT NULL AND first_name <> ''
  AND last_name IS NOT NULL AND last_name <> ''
  AND company IS NOT NULL AND company <> ''
  AND company_size IS NOT NULL AND company_size <> ''
);