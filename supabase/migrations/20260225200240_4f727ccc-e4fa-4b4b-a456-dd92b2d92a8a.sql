
-- Add signup_slug column for company-specific signup URLs
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS signup_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_beta BOOLEAN NOT NULL DEFAULT false;

-- Generate slugs for existing companies based on name
UPDATE public.companies SET signup_slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE signup_slug IS NULL;

-- Mark Beta Entreprise as beta
UPDATE public.companies SET is_beta = true WHERE id = 'ca9e865e-d30c-4cfc-9f52-1ceb8886d0e2';

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_companies_signup_slug ON public.companies(signup_slug);
