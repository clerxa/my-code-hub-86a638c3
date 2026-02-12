-- Table pour les ressources visuelles de communication
CREATE TABLE public.company_visual_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_visual_resources ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage visual resources"
ON public.company_visual_resources
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Company contacts can view their company resources"
ON public.company_visual_resources
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = company_visual_resources.company_id
  )
);

-- Table pour les FAQ entreprise
CREATE TABLE public.company_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_faqs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage FAQs"
ON public.company_faqs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Company employees can view their company FAQs"
ON public.company_faqs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = company_faqs.company_id
  )
);

-- Trigger pour updated_at
CREATE TRIGGER update_company_visual_resources_updated_at
BEFORE UPDATE ON public.company_visual_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_faqs_updated_at
BEFORE UPDATE ON public.company_faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();