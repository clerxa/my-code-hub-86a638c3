-- Table pour configurer les différents formulaires FillOut
CREATE TABLE public.appointment_forms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  fillout_form_id text NOT NULL,
  fillout_form_url text NOT NULL,
  module_id integer REFERENCES public.modules(id),
  points_awarded integer DEFAULT 0,
  is_active boolean DEFAULT true,
  icon text DEFAULT 'calendar',
  color text DEFAULT 'primary',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table pour stocker les rendez-vous pris
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  form_id uuid REFERENCES public.appointment_forms(id),
  fillout_submission_id text,
  user_email text NOT NULL,
  user_full_name text,
  user_phone text,
  scheduled_with_email text,
  scheduled_with_name text,
  event_start_time timestamp with time zone NOT NULL,
  event_end_time timestamp with time zone NOT NULL,
  timezone text DEFAULT 'Europe/Paris',
  event_url text,
  reschedule_url text,
  status text DEFAULT 'scheduled',
  extra_data jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointment_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Policies for appointment_forms (admin manages, everyone can view active)
CREATE POLICY "Admins can manage appointment forms"
  ON public.appointment_forms FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active appointment forms"
  ON public.appointment_forms FOR SELECT
  USING (is_active = true);

-- Policies for appointments
CREATE POLICY "Admins can view all appointments"
  ON public.appointments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all appointments"
  ON public.appointments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_appointment_forms_updated_at
  BEFORE UPDATE ON public.appointment_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_event_start_time ON public.appointments(event_start_time);
CREATE INDEX idx_appointments_status ON public.appointments(status);