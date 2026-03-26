CREATE TABLE public.webinar_reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.webinar_sessions(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.company_contacts(id) ON DELETE CASCADE,
  reminder_type text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, session_id, contact_id, reminder_type)
);

ALTER TABLE public.webinar_reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON public.webinar_reminder_logs
  FOR SELECT TO authenticated USING (true);