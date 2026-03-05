
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS ticker text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS company_description text DEFAULT NULL;

COMMENT ON COLUMN public.companies.ticker IS 'Stock ticker symbol (e.g. AAPL, MSFT) for listed companies';
COMMENT ON COLUMN public.companies.company_description IS 'Free-form company description editable by admin';
