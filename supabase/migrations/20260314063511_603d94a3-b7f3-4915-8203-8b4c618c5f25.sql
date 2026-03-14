
CREATE TABLE public.payslip_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Metadata
  periode_mois INT,
  periode_annee INT,
  has_equity BOOLEAN NOT NULL DEFAULT false,
  employeur_nom TEXT,
  
  -- Analyses
  analyse_simple JSONB,
  analyse_avancee JSONB,
  
  -- File
  pdf_file_name TEXT,
  
  -- Usage tracking
  simple_tokens_used INT,
  simple_cost_usd NUMERIC(8,4),
  advanced_tokens_used INT,
  advanced_cost_usd NUMERIC(8,4)
);

-- RLS
ALTER TABLE public.payslip_analyses ENABLE ROW LEVEL SECURITY;

-- Users can only see their own analyses
CREATE POLICY "Users can view own payslip analyses"
  ON public.payslip_analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payslip analyses"
  ON public.payslip_analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payslip analyses"
  ON public.payslip_analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins full access payslip analyses"
  ON public.payslip_analyses FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Index
CREATE INDEX idx_payslip_analyses_user_periode ON public.payslip_analyses (user_id, periode_annee, periode_mois);

-- Updated_at trigger
CREATE TRIGGER update_payslip_analyses_updated_at
  BEFORE UPDATE ON public.payslip_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
