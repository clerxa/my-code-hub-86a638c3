-- Add domaine_email to companies table for automatic company detection
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS domaine_email TEXT UNIQUE;

-- Create index for faster domain lookups
CREATE INDEX IF NOT EXISTS idx_companies_domaine_email 
ON public.companies(domaine_email);

-- Add comment
COMMENT ON COLUMN public.companies.domaine_email IS 'Email domain used to automatically associate users with their company';