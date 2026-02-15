
-- Table to track diagnostic completion status and scores per user
CREATE TABLE public.diagnostic_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  score_percent INTEGER,
  total_score INTEGER,
  total_max INTEGER,
  section_scores JSONB,
  answers JSONB,
  elapsed_seconds INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for quick lookup
CREATE INDEX idx_diagnostic_results_user ON public.diagnostic_results(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.diagnostic_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own results
CREATE POLICY "Users can view their own diagnostic results"
ON public.diagnostic_results FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own results
CREATE POLICY "Users can insert their own diagnostic results"
ON public.diagnostic_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own results
CREATE POLICY "Users can update their own diagnostic results"
ON public.diagnostic_results FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all results
CREATE POLICY "Admins can view all diagnostic results"
ON public.diagnostic_results FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Trigger for updated_at
CREATE TRIGGER update_diagnostic_results_updated_at
BEFORE UPDATE ON public.diagnostic_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
