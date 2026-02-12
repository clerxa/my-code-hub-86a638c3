
-- Make all asset buckets public for reading (images displayed in the app)
UPDATE storage.buckets SET public = true WHERE id IN (
  'advisor-photos', 'banners', 'company-assets', 'company-covers',
  'landing-images', 'slides'
);

-- company-documents and documents stay private (sensitive files)

-- ============================================
-- PUBLIC READ for public asset buckets
-- ============================================
CREATE POLICY "Public read advisor-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'advisor-photos');

CREATE POLICY "Public read banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Public read company-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

CREATE POLICY "Public read company-covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-covers');

CREATE POLICY "Public read landing-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'landing-images');

CREATE POLICY "Public read slides"
ON storage.objects FOR SELECT
USING (bucket_id = 'slides');

-- ============================================
-- PRIVATE READ for document buckets (authenticated only)
-- ============================================
CREATE POLICY "Authenticated read company-documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'company-documents');

CREATE POLICY "Authenticated read documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

-- ============================================
-- ADMIN WRITE policies (INSERT/UPDATE/DELETE) for all non-avatar buckets
-- Admins are identified via public.has_role(auth.uid(), 'admin')
-- ============================================

-- advisor-photos
CREATE POLICY "Admin insert advisor-photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'advisor-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update advisor-photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'advisor-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete advisor-photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'advisor-photos' AND public.has_role(auth.uid(), 'admin'));

-- banners
CREATE POLICY "Admin insert banners"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update banners"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete banners"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));

-- company-assets
CREATE POLICY "Admin insert company-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'company-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update company-assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'company-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete company-assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'company-assets' AND public.has_role(auth.uid(), 'admin'));

-- company-covers
CREATE POLICY "Admin insert company-covers"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'company-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update company-covers"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'company-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete company-covers"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'company-covers' AND public.has_role(auth.uid(), 'admin'));

-- company-documents
CREATE POLICY "Admin insert company-documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'company-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update company-documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'company-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete company-documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'company-documents' AND public.has_role(auth.uid(), 'admin'));

-- documents
CREATE POLICY "Admin insert documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));

-- landing-images
CREATE POLICY "Admin insert landing-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'landing-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update landing-images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'landing-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete landing-images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'landing-images' AND public.has_role(auth.uid(), 'admin'));

-- slides
CREATE POLICY "Admin insert slides"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'slides' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update slides"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'slides' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete slides"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'slides' AND public.has_role(auth.uid(), 'admin'));
