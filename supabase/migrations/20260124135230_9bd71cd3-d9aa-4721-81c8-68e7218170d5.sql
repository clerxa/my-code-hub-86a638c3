-- Add new point categories for appointments and financial profile
INSERT INTO public.points_configuration (category, points, description, is_active)
VALUES 
  ('appointment_booking', 75, 'Points attribués lors de la prise d''un rendez-vous', true),
  ('financial_profile_completion', 100, 'Points attribués pour le remplissage complet du profil financier', true)
ON CONFLICT (category) DO NOTHING;

-- Create a table to track points already awarded to prevent duplicates
CREATE TABLE IF NOT EXISTS public.points_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  reference_id TEXT, -- Optional: module_id, appointment_id, etc.
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, reference_id)
);

-- Enable RLS
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own history
CREATE POLICY "Users can view own points history"
  ON public.points_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own points history
CREATE POLICY "Users can insert own points history"
  ON public.points_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all points history"
  ON public.points_history
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_points_history_user_category 
  ON public.points_history(user_id, category, reference_id);