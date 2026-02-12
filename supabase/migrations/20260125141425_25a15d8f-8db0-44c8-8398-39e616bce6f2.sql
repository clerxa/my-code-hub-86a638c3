-- Create table to store confirmed HubSpot appointments
CREATE TABLE public.hubspot_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hubspot_meeting_id TEXT,
  hubspot_contact_id TEXT,
  user_id UUID REFERENCES public.profiles(id),
  user_email TEXT NOT NULL,
  user_name TEXT,
  meeting_title TEXT,
  meeting_start_time TIMESTAMP WITH TIME ZONE,
  meeting_end_time TIMESTAMP WITH TIME ZONE,
  meeting_link TEXT,
  booking_source TEXT, -- 'expert_booking_rang_X' or 'tax_declaration_help'
  company_id UUID REFERENCES public.companies(id),
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hubspot_appointments ENABLE ROW LEVEL SECURITY;

-- Admins can see all appointments
CREATE POLICY "Admins can view all appointments"
ON public.hubspot_appointments FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Company contacts can see appointments from their company
CREATE POLICY "Company contacts can view their company appointments"
ON public.hubspot_appointments FOR SELECT
USING (
  public.has_role(auth.uid(), 'contact_entreprise') AND
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- Users can see their own appointments
CREATE POLICY "Users can view their own appointments"
ON public.hubspot_appointments FOR SELECT
USING (user_id = auth.uid());

-- Allow inserts from service role (edge function)
CREATE POLICY "Service role can insert appointments"
ON public.hubspot_appointments FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_hubspot_appointments_updated_at
BEFORE UPDATE ON public.hubspot_appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_hubspot_appointments_user_id ON public.hubspot_appointments(user_id);
CREATE INDEX idx_hubspot_appointments_company_id ON public.hubspot_appointments(company_id);
CREATE INDEX idx_hubspot_appointments_email ON public.hubspot_appointments(user_email);