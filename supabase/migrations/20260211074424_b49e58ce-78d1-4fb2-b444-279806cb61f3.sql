
-- Create storage bucket for company documents
INSERT INTO storage.buckets (id, name, public) VALUES ('company-documents', 'company-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to company-documents
CREATE POLICY "Authenticated users can upload company documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-documents');

-- Allow public read access
CREATE POLICY "Public read access for company documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-documents');

-- Allow authenticated users to update/delete
CREATE POLICY "Authenticated users can update company documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-documents');

CREATE POLICY "Authenticated users can delete company documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-documents');
