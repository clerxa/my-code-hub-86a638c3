-- Add max_tax_declarations quota per company
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS max_tax_declarations INTEGER DEFAULT 100;

-- Add modification tracking to tax_declaration_requests
ALTER TABLE public.tax_declaration_requests ADD COLUMN IF NOT EXISTS modified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.tax_declaration_requests ADD COLUMN IF NOT EXISTS modification_count INTEGER DEFAULT 0;

-- Add perlib_contact_email for clients who don't know their advisor
ALTER TABLE public.tax_declaration_requests ADD COLUMN IF NOT EXISTS perlib_contact_email TEXT DEFAULT NULL;