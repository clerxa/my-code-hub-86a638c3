
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS info_sections_config jsonb DEFAULT '{"stock_price": true, "general_info": true, "partnership": true, "hr_devices": true, "description": true}'::jsonb;

COMMENT ON COLUMN public.companies.info_sections_config IS 'Configuration of visible sections on the company Informations page';
