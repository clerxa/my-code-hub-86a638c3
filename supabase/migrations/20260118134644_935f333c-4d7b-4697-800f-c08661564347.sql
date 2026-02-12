-- Table for external webinar registrations (people without an account)
CREATE TABLE public.webinar_external_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  livestorm_registrant_id TEXT,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  registered_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  attendance_duration_seconds INTEGER DEFAULT 0,
  registration_status TEXT DEFAULT 'registered',
  livestorm_session_id TEXT,
  livestorm_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(module_id, email)
);

-- Enable RLS
ALTER TABLE public.webinar_external_registrations ENABLE ROW LEVEL SECURITY;

-- Only admins can view external registrations
CREATE POLICY "Admins can view external registrations"
ON public.webinar_external_registrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Only system can insert/update (via service role in edge function)
CREATE POLICY "Service role can manage external registrations"
ON public.webinar_external_registrations
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_webinar_external_registrations_email ON public.webinar_external_registrations(email);
CREATE INDEX idx_webinar_external_registrations_module ON public.webinar_external_registrations(module_id);

-- Add trigger for updated_at
CREATE TRIGGER update_webinar_external_registrations_updated_at
BEFORE UPDATE ON public.webinar_external_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();