-- Create risk_questions table
CREATE TABLE IF NOT EXISTS public.risk_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('choice', 'scale', 'numeric')),
  choices JSONB,
  active BOOLEAN DEFAULT true,
  order_num INTEGER,
  amf_weight DECIMAL(3,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create risk_answers table
CREATE TABLE IF NOT EXISTS public.risk_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.risk_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  score_value INTEGER NOT NULL,
  order_num INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_risk_responses table
CREATE TABLE IF NOT EXISTS public.user_risk_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.risk_questions(id) ON DELETE CASCADE,
  answer_id UUID NOT NULL REFERENCES public.risk_answers(id) ON DELETE CASCADE,
  score_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Create risk_profile table
CREATE TABLE IF NOT EXISTS public.risk_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_weighted_score DECIMAL(6,2) NOT NULL,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('Prudent', 'Équilibré', 'Dynamique', 'Audacieux')),
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Create risk_profile_settings table
CREATE TABLE IF NOT EXISTS public.risk_profile_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_active BOOLEAN DEFAULT true,
  mandatory_for_new_users BOOLEAN DEFAULT false,
  threshold_prudent INTEGER DEFAULT 30,
  threshold_equilibre INTEGER DEFAULT 55,
  threshold_dynamique INTEGER DEFAULT 80,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings
INSERT INTO public.risk_profile_settings (module_active, mandatory_for_new_users) 
VALUES (true, false)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.risk_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_risk_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_profile_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Questions viewable by all" ON public.risk_questions FOR SELECT USING (active = true);
CREATE POLICY "Answers viewable by all" ON public.risk_answers FOR SELECT USING (true);
CREATE POLICY "Users view own responses" ON public.user_risk_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own responses" ON public.user_risk_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own responses" ON public.user_risk_responses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users view own profile" ON public.risk_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.risk_profile FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.risk_profile FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Settings viewable by all" ON public.risk_profile_settings FOR SELECT USING (true);