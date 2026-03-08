
-- Drop the duplicate admin policies that already existed, then recreate cleanly
DROP POLICY IF EXISTS "Admins can upload company assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update company assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete company assets" ON storage.objects;

-- Recreate admin-only policies
CREATE POLICY "Admins can upload company assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update company assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete company assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-assets' AND public.has_role(auth.uid(), 'admin'));
