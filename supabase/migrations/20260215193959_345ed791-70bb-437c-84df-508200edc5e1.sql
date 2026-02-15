
-- Table pour tracker le guide d'onboarding interactif
CREATE TABLE public.user_onboarding_guide (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  current_step INTEGER DEFAULT 0,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_onboarding_guide ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own guide" ON public.user_onboarding_guide FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own guide" ON public.user_onboarding_guide FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own guide" ON public.user_onboarding_guide FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_onboarding_guide_updated_at
  BEFORE UPDATE ON public.user_onboarding_guide
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
