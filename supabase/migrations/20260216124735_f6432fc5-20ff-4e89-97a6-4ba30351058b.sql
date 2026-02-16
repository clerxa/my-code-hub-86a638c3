
-- Unified client logos table
CREATE TABLE public.client_logos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_logos ENABLE ROW LEVEL SECURITY;

-- Public read for all (logos displayed on public landing pages)
CREATE POLICY "Client logos are publicly readable"
  ON public.client_logos FOR SELECT
  USING (true);

-- Admin-only write
CREATE POLICY "Admins can manage client logos"
  ON public.client_logos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Timestamp trigger
CREATE TRIGGER update_client_logos_updated_at
  BEFORE UPDATE ON public.client_logos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with existing logos
INSERT INTO public.client_logos (name, logo_url, display_order) VALUES
  ('Palantir', 'https://mftrggltywyfsvlckhad.supabase.co/storage/v1/object/public/avatars/0.13603219857893978.png', 1),
  ('Salesforce', 'https://www.numm.fr/wp-content/uploads/2019/03/logo-salesforce-200x200.png', 2),
  ('Hubspot', 'https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/168_Hubspot_logo_logos-512.png', 3),
  ('Perlib', 'https://www.retraite.com/images/Logo_couleur.png', 4);
