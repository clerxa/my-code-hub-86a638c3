-- Create slides bucket for PDF and image storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('slides', 'slides', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Slides are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'slides');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload slides"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'slides' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete slides"
ON storage.objects FOR DELETE
USING (bucket_id = 'slides' AND auth.role() = 'authenticated');