-- Create table for storing OCR tax notice analyses
CREATE TABLE public.ocr_avis_imposition_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  annee_revenus INTEGER,
  annee_imposition INTEGER,
  prenom TEXT,
  nom TEXT,
  revenu_fiscal_reference NUMERIC,
  impot_net_total NUMERIC,
  taux_moyen_pct NUMERIC,
  solde NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ocr_avis_imposition_analyses ENABLE ROW LEVEL SECURITY;

-- Users can only see their own analyses
CREATE POLICY "Users can view their own analyses"
  ON public.ocr_avis_imposition_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
  ON public.ocr_avis_imposition_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
  ON public.ocr_avis_imposition_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_ocr_avis_analyses_updated_at
  BEFORE UPDATE ON public.ocr_avis_imposition_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast user lookups
CREATE INDEX idx_ocr_avis_analyses_user_id ON public.ocr_avis_imposition_analyses(user_id);
CREATE INDEX idx_ocr_avis_analyses_annee ON public.ocr_avis_imposition_analyses(annee_revenus DESC);