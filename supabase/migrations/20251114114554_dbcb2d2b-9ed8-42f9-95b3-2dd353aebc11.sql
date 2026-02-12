-- Supprimer toutes les politiques avatar existantes
DO $$ 
DECLARE 
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
  LOOP
    IF pol.policyname LIKE '%avatar%' OR pol.policyname LIKE '%Avatar%' THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END IF;
  END LOOP;
END $$;

-- Politique SELECT: Tout le monde peut voir les avatars (bucket public)
CREATE POLICY "avatar_select_policy"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'avatars');

-- Politique INSERT: Utilisateurs peuvent uploader leur propre avatar
CREATE POLICY "avatar_insert_user_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique INSERT: Admins peuvent uploader n'importe quel avatar
CREATE POLICY "avatar_insert_admin_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Politique UPDATE: Utilisateurs peuvent mettre à jour leur propre avatar
CREATE POLICY "avatar_update_user_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique UPDATE: Admins peuvent mettre à jour n'importe quel avatar
CREATE POLICY "avatar_update_admin_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Politique DELETE: Utilisateurs peuvent supprimer leur propre avatar
CREATE POLICY "avatar_delete_user_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique DELETE: Admins peuvent supprimer n'importe quel avatar
CREATE POLICY "avatar_delete_admin_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND public.has_role(auth.uid(), 'admin')
);