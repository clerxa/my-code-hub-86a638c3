-- Add rang column to companies table for expert booking prioritization
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS rang integer DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.companies.rang IS 'Company rank (1, 2, or 3) for expert booking URL prioritization';

-- Add constraint to ensure rang is between 1 and 3
ALTER TABLE public.companies 
ADD CONSTRAINT check_rang_value CHECK (rang IS NULL OR (rang >= 1 AND rang <= 3));