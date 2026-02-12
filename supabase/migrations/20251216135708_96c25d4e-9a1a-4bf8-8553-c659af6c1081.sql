-- Table des certifications (globales, réutilisables)
CREATE TABLE public.certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des conseillers
CREATE TABLE public.advisors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table de liaison conseillers <-> certifications (many-to-many)
CREATE TABLE public.advisor_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advisor_id UUID NOT NULL REFERENCES public.advisors(id) ON DELETE CASCADE,
  certification_id UUID NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(advisor_id, certification_id)
);

-- Table de liaison conseillers <-> rangs d'entreprise (many-to-many)
CREATE TABLE public.advisor_ranks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advisor_id UUID NOT NULL REFERENCES public.advisors(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(advisor_id, rank)
);

-- Enable RLS
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_ranks ENABLE ROW LEVEL SECURITY;

-- RLS policies for certifications
CREATE POLICY "Anyone can view certifications" ON public.certifications FOR SELECT USING (true);
CREATE POLICY "Admins can manage certifications" ON public.certifications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for advisors
CREATE POLICY "Anyone can view active advisors" ON public.advisors FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage advisors" ON public.advisors FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for advisor_certifications
CREATE POLICY "Anyone can view advisor certifications" ON public.advisor_certifications FOR SELECT USING (true);
CREATE POLICY "Admins can manage advisor certifications" ON public.advisor_certifications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for advisor_ranks
CREATE POLICY "Anyone can view advisor ranks" ON public.advisor_ranks FOR SELECT USING (true);
CREATE POLICY "Admins can manage advisor ranks" ON public.advisor_ranks FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON public.certifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_advisors_updated_at BEFORE UPDATE ON public.advisors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for advisor photos
INSERT INTO storage.buckets (id, name, public) VALUES ('advisor-photos', 'advisor-photos', true);

-- Storage policies for advisor photos
CREATE POLICY "Anyone can view advisor photos" ON storage.objects FOR SELECT USING (bucket_id = 'advisor-photos');
CREATE POLICY "Admins can upload advisor photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'advisor-photos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update advisor photos" ON storage.objects FOR UPDATE USING (bucket_id = 'advisor-photos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete advisor photos" ON storage.objects FOR DELETE USING (bucket_id = 'advisor-photos' AND has_role(auth.uid(), 'admin'::app_role));