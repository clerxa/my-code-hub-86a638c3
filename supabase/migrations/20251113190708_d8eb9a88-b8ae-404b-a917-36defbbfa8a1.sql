-- Create companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#3b82f6',
  secondary_color text DEFAULT '#8b5cf6',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Add company_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;

-- Create company_modules junction table (links companies to custom module paths)
CREATE TABLE public.company_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_id integer NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  custom_order integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, module_id)
);

-- Enable RLS on company_modules
ALTER TABLE public.company_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Admins can manage all companies"
ON public.companies
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own company"
ON public.companies
FOR SELECT
USING (
  id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- RLS Policies for company_modules
CREATE POLICY "Admins can manage company modules"
ON public.company_modules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their company modules"
ON public.company_modules
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Add index for better performance
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_company_modules_company_id ON public.company_modules(company_id);