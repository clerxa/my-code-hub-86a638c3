-- Make company-documents bucket private (it currently stores potentially sensitive business documents)
UPDATE storage.buckets SET public = false WHERE id = 'company-documents';