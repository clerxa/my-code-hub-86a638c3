-- Create documents storage bucket for tax declarations
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users can upload documents
CREATE POLICY "Users can upload tax documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can view documents in documents bucket  
CREATE POLICY "Users can view documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);

-- Policy: Admins can delete documents (via user_roles table)
CREATE POLICY "Admins can delete tax documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);