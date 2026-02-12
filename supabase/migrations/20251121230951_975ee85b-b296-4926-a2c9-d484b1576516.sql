-- Créer un bucket storage pour les images de la landing page
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-images', 'landing-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies pour le bucket landing-images
CREATE POLICY "Les admins peuvent uploader des images landing"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'landing-images' 
  AND (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ))
);

CREATE POLICY "Les admins peuvent modifier des images landing"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'landing-images'
  AND (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ))
);

CREATE POLICY "Les admins peuvent supprimer des images landing"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'landing-images'
  AND (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ))
);

CREATE POLICY "Les images landing sont publiques"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'landing-images');