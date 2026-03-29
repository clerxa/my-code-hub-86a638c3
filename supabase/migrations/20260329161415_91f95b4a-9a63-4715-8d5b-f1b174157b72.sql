
CREATE TABLE public.webinar_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL DEFAULT 45,
  category text NOT NULL DEFAULT 'a_la_demande',
  visual_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webinar_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read catalog"
  ON public.webinar_catalog FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage catalog"
  ON public.webinar_catalog FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_webinar_catalog_updated_at
  BEFORE UPDATE ON public.webinar_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add catalog_id reference to modules table
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS catalog_id uuid REFERENCES public.webinar_catalog(id) ON DELETE SET NULL;
