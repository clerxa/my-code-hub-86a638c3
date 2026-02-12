-- Create onboarding_screens table for the dynamic onboarding CMS
CREATE TABLE public.onboarding_screens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id TEXT NOT NULL DEFAULT 'tax-onboarding',
  order_num INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('WELCOME', 'SINGLE_CHOICE', 'MULTI_CHOICE', 'SLIDER', 'TOGGLE', 'CALCULATION_RESULT', 'TEXT_INPUT')),
  title TEXT NOT NULL,
  subtitle TEXT,
  options JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  next_step_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_screens ENABLE ROW LEVEL SECURITY;

-- Create policy for read access (all authenticated users can read active screens)
CREATE POLICY "Anyone can read active onboarding screens"
ON public.onboarding_screens
FOR SELECT
USING (is_active = true);

-- Create policy for admin access (full CRUD)
CREATE POLICY "Admins can manage onboarding screens"
ON public.onboarding_screens
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_onboarding_screens_updated_at
BEFORE UPDATE ON public.onboarding_screens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create onboarding_responses table to store user responses
CREATE TABLE public.onboarding_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  flow_id TEXT NOT NULL DEFAULT 'tax-onboarding',
  screen_id UUID REFERENCES public.onboarding_screens(id) ON DELETE SET NULL,
  response_value JSONB,
  lead_rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for responses
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Users can only see their own responses
CREATE POLICY "Users can read own onboarding responses"
ON public.onboarding_responses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding responses"
ON public.onboarding_responses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can see all responses
CREATE POLICY "Admins can read all onboarding responses"
ON public.onboarding_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Insert default screens for tax onboarding
INSERT INTO public.onboarding_screens (flow_id, order_num, type, title, subtitle, options, metadata, status, is_active) VALUES
('tax-onboarding', 0, 'WELCOME', 'Bienvenue sur FinCare', 'Découvrez votre potentiel d''optimisation fiscale en quelques clics', '[]', '{"icon": "Sparkles", "buttonText": "Commencer"}', 'active', true),
('tax-onboarding', 1, 'SINGLE_CHOICE', 'Quel est votre objectif principal ?', 'Sélectionnez ce qui compte le plus pour vous', '[{"label": "Réduire mes impôts", "value": "reduce_taxes", "icon": "TrendingDown", "description": "Optimiser ma fiscalité et payer moins d''impôts", "leadRankImpact": 1}, {"label": "Optimiser mes actions (RSU/ESPP)", "value": "optimize_equity", "icon": "Briefcase", "description": "Gérer efficacement mes participations employeur", "leadRankImpact": 1}, {"label": "Préparer ma retraite", "value": "retirement", "icon": "PiggyBank", "description": "Constituer un capital pour l''avenir", "leadRankImpact": 2}]', '{}', 'active', true),
('tax-onboarding', 2, 'SLIDER', 'Quel est votre revenu annuel brut ?', 'Cette information nous aide à personnaliser votre analyse', '[]', '{"min": 30000, "max": 250000, "step": 5000, "unit": "€", "defaultValue": 80000}', 'active', true),
('tax-onboarding', 3, 'TOGGLE', 'Avez-vous des actions d''entreprise ?', 'RSU, ESPP, stock-options ou autres participations', '[{"label": "Non", "value": false, "leadRankImpact": 3}, {"label": "Oui", "value": true, "leadRankImpact": 1}]', '{}', 'active', true),
('tax-onboarding', 4, 'CALCULATION_RESULT', 'Votre potentiel d''économies', 'Basé sur votre profil et vos objectifs', '[]', '{"calculationType": "tax_savings", "loadingText": "Analyse en cours...", "loadingSubtext": "Nous calculons votre potentiel d''optimisation", "resultLabel": "Économies estimées par an", "buttonText": "Découvrir mes opportunités", "redirectUrl": "/employee"}', 'active', true);