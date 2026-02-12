-- Add cover_image_url column to companies table
ALTER TABLE public.companies 
ADD COLUMN cover_image_url text;

-- Create storage bucket for company covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-covers', 'company-covers', true);

-- Create RLS policies for company covers bucket
CREATE POLICY "Admins and company contacts can upload company covers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'company-covers' 
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'contact_entreprise')
    )
  )
);

CREATE POLICY "Admins and company contacts can update company covers"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'company-covers' 
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'contact_entreprise')
    )
  )
);

CREATE POLICY "Admins and company contacts can delete company covers"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'company-covers' 
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'contact_entreprise')
    )
  )
);

CREATE POLICY "Everyone can view company covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-covers');