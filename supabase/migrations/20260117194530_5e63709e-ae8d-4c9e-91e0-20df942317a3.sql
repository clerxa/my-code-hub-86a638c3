-- Create storage bucket for banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for banners bucket
CREATE POLICY "Anyone can view banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Admins can upload banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'banners' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'contact_entreprise')
  )
);

CREATE POLICY "Admins can update banners"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'banners' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'contact_entreprise')
  )
);

CREATE POLICY "Admins can delete banners"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'banners' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'contact_entreprise')
  )
);

-- Add banner_url column to companies table for company-specific overrides
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS banner_url TEXT;