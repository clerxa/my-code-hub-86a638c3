-- Add superpowers_enabled column to companies table
ALTER TABLE public.companies 
ADD COLUMN superpowers_enabled BOOLEAN DEFAULT true;