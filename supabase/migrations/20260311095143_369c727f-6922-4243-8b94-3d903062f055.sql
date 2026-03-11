
CREATE TABLE public.company_webinar_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_id integer NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.webinar_sessions(id) ON DELETE CASCADE,
  selected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, module_id)
);

ALTER TABLE public.company_webinar_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company contacts can view their selections"
  ON public.company_webinar_selections
  FOR SELECT
  TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Company contacts can insert selections"
  ON public.company_webinar_selections
  FOR INSERT
  TO authenticated
  WITH CHECK (company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage all selections"
  ON public.company_webinar_selections
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
