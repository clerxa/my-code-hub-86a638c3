-- Create module validation settings table
CREATE TABLE IF NOT EXISTS public.module_validation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_type TEXT NOT NULL UNIQUE CHECK (module_type IN ('video', 'quiz', 'webinar', 'guide', 'meeting')),
  
  -- Video settings
  video_min_watch_percentage INTEGER DEFAULT 30 CHECK (video_min_watch_percentage >= 0 AND video_min_watch_percentage <= 100),
  
  -- Quiz settings
  quiz_first_attempt_percentage INTEGER DEFAULT 100 CHECK (quiz_first_attempt_percentage >= 0 AND quiz_first_attempt_percentage <= 100),
  quiz_retry_percentage INTEGER DEFAULT 50 CHECK (quiz_retry_percentage >= 0 AND quiz_retry_percentage <= 100),
  
  -- Webinar settings
  webinar_registration_points INTEGER DEFAULT 50 CHECK (webinar_registration_points >= 0),
  webinar_participation_points INTEGER DEFAULT 100 CHECK (webinar_participation_points >= 0),
  
  -- General settings
  allow_retry BOOLEAN DEFAULT true,
  max_retry_attempts INTEGER DEFAULT 3 CHECK (max_retry_attempts >= 0),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default validation settings for each module type
INSERT INTO public.module_validation_settings (module_type, video_min_watch_percentage, quiz_first_attempt_percentage, quiz_retry_percentage, webinar_registration_points, webinar_participation_points, allow_retry, max_retry_attempts)
VALUES 
  ('video', 30, 100, 50, 50, 100, true, 3),
  ('quiz', 30, 100, 50, 50, 100, true, 3),
  ('webinar', 30, 100, 50, 50, 100, true, 3),
  ('guide', 30, 100, 50, 50, 100, true, 3),
  ('meeting', 30, 100, 50, 50, 100, true, 3)
ON CONFLICT (module_type) DO NOTHING;

-- Enable RLS
ALTER TABLE public.module_validation_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view validation settings"
  ON public.module_validation_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can update validation settings"
  ON public.module_validation_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_module_validation_settings_updated_at
  BEFORE UPDATE ON public.module_validation_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();