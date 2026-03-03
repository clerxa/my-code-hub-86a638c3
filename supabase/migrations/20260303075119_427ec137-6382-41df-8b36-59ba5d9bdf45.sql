
-- Prospect presentations table
CREATE TABLE public.prospect_presentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  prospect_name text NOT NULL DEFAULT '',
  prospect_logo_url text,
  prospect_sector text DEFAULT 'other', -- 'tech', 'other'
  
  -- Selected stats (checkbox IDs: stat_1, stat_2, stat_3)
  selected_stats text[] DEFAULT '{}',
  
  -- Selected key figures (max 4)
  selected_key_figures text[] DEFAULT '{}',
  
  -- Selected client logo IDs
  selected_client_logos text[] DEFAULT '{}',
  
  -- Selected testimonial IDs (max 2)
  selected_testimonials text[] DEFAULT '{}',
  
  -- Selected modules for the prospect
  selected_modules jsonb DEFAULT '[]',
  
  -- Custom challenge text
  challenge_text text,
  
  -- Contact info override
  contact_name text DEFAULT 'Xavier Clermont',
  contact_role text DEFAULT 'Associé & Directeur de l''offre FinCare',
  contact_phone text DEFAULT '06 59 84 42 59',
  contact_email text DEFAULT 'xavier.clermont@perlib.fr',
  contact_booking_url text,
  
  -- Metadata
  status text DEFAULT 'draft', -- draft, published
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prospect_presentations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage presentations
CREATE POLICY "Admins can manage presentations"
  ON public.prospect_presentations
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public read via share_token (for shared presentations)
CREATE POLICY "Public can view shared presentations"
  ON public.prospect_presentations
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Update timestamp trigger
CREATE TRIGGER update_prospect_presentations_updated_at
  BEFORE UPDATE ON public.prospect_presentations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
