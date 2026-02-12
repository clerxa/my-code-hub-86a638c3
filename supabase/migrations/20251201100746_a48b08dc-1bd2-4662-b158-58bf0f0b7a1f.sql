-- Créer le bucket company-assets pour les images de configuration
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre à tout le monde de voir les images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

-- Politique pour permettre aux utilisateurs authentifiés d'uploader
CREATE POLICY "Authenticated users can upload company assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-assets');

-- Politique pour permettre aux utilisateurs authentifiés de mettre à jour
CREATE POLICY "Authenticated users can update company assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-assets');

-- Politique pour permettre aux utilisateurs authentifiés de supprimer
CREATE POLICY "Authenticated users can delete company assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-assets');