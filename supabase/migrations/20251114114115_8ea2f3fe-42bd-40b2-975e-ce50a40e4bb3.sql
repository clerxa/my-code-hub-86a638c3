-- Supprimer TOUTES les politiques existantes sur storage.objects pour le bucket avatars
DO $$ 
DECLARE 
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND policyname LIKE '%avatar%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Politique pour permettre à tout le monde de voir les avatars (bucket public)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Politique pour permettre aux utilisateurs d'uploader leur propre avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour permettre aux admins d'uploader n'importe quel avatar
CREATE POLICY "Admins can upload any avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Politique pour permettre aux utilisateurs de mettre à jour leur propre avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour permettre aux admins de mettre à jour n'importe quel avatar
CREATE POLICY "Admins can update any avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Politique pour permettre aux utilisateurs de supprimer leur propre avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour permettre aux admins de supprimer n'importe quel avatar
CREATE POLICY "Admins can delete any avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND public.has_role(auth.uid(), 'admin')
);