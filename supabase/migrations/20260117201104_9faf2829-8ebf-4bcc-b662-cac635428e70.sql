-- Create junction table for direct webinar-company assignments
CREATE TABLE public.company_webinars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, module_id)
);

-- Enable RLS
ALTER TABLE public.company_webinars ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage company webinars"
  ON public.company_webinars FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Company contacts can view their company webinars"
  ON public.company_webinars FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.id
      WHERE p.id = auth.uid() 
        AND p.company_id = company_webinars.company_id
        AND ur.role = 'contact_entreprise'
    )
  );

CREATE POLICY "Employees can view their company webinars"
  ON public.company_webinars FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.company_id = company_webinars.company_id
    )
  );

-- Add index for performance
CREATE INDEX idx_company_webinars_company ON public.company_webinars(company_id);
CREATE INDEX idx_company_webinars_module ON public.company_webinars(module_id);