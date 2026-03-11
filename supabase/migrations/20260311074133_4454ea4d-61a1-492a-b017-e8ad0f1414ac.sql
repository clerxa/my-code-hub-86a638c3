
CREATE TABLE public.webinar_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id integer NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  session_date timestamptz NOT NULL,
  registration_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webinar_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read webinar sessions"
  ON public.webinar_sessions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage webinar sessions"
  ON public.webinar_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_webinar_sessions_module_id ON public.webinar_sessions(module_id);
