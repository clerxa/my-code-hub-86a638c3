-- Add anonymous forum settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS forum_anonymous_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS forum_pseudo TEXT,
ADD COLUMN IF NOT EXISTS forum_avatar_url TEXT;

-- Create unique constraint for pseudo within company
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pseudo_per_company 
ON public.profiles (company_id, forum_pseudo) 
WHERE forum_pseudo IS NOT NULL AND forum_pseudo != '';

-- Create forum_settings table for admin configuration
CREATE TABLE IF NOT EXISTS public.forum_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_settings ENABLE ROW LEVEL SECURITY;

-- Policies for forum_settings (admin only for write, public read)
CREATE POLICY "Anyone can view forum settings" 
ON public.forum_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage forum settings" 
ON public.forum_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Insert default settings
INSERT INTO public.forum_settings (key, value, description) VALUES
('trending_rules', '{"min_views": 10, "min_likes": 3, "time_window_hours": 48, "weight_views": 1, "weight_likes": 2, "weight_comments": 3}', 'Règles pour définir les sujets tendance'),
('moderation', '{"auto_flag_keywords": [], "require_approval": false, "max_posts_per_day": 10}', 'Paramètres de modération')
ON CONFLICT (key) DO NOTHING;

-- Create forum_activity_logs table for tracking
CREATE TABLE IF NOT EXISTS public.forum_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies for forum_activity_logs
CREATE POLICY "Admins can view all activity logs" 
ON public.forum_activity_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "System can insert activity logs" 
ON public.forum_activity_logs 
FOR INSERT 
WITH CHECK (true);

-- Add columns to forum_posts for anonymous tracking
ALTER TABLE public.forum_posts 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_pseudo TEXT,
ADD COLUMN IF NOT EXISTS display_avatar_url TEXT;

-- Trigger to update forum_settings updated_at
CREATE TRIGGER update_forum_settings_updated_at
BEFORE UPDATE ON public.forum_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();