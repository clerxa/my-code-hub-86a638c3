ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS partnership_details text DEFAULT NULL;