ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view landing pages"
  ON public.landing_pages
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage landing pages"
  ON public.landing_pages
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
