-- Add email domains and partnership type to companies table
ALTER TABLE public.companies
ADD COLUMN email_domains TEXT[] DEFAULT NULL,
ADD COLUMN partnership_type TEXT DEFAULT NULL;