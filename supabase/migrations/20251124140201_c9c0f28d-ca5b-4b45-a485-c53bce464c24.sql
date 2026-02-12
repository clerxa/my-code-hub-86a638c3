
-- Ajouter la colonne cover_url dans la table companies (si elle n'existe pas déjà)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'companies' 
    AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN cover_url TEXT;
  END IF;
END $$;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Anyone can view company covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins and company contacts can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins and company contacts can update covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins and company contacts can delete covers" ON storage.objects;

-- Policies pour le bucket company-covers
CREATE POLICY "Anyone can view company covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-covers');

CREATE POLICY "Admins and company contacts can upload covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-covers' 
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'contact_entreprise')
    )
  )
);

CREATE POLICY "Admins and company contacts can update covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-covers'
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'contact_entreprise')
    )
  )
);

CREATE POLICY "Admins and company contacts can delete covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-covers'
  AND (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'contact_entreprise')
    )
  )
);
