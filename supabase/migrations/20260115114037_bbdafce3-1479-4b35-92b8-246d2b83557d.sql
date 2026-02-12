-- Table pour stocker les clés d'évaluation personnalisées
CREATE TABLE public.evaluation_keys_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'string',
  unit TEXT,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  is_calculated BOOLEAN DEFAULT false,
  formula TEXT,
  is_auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX idx_evaluation_keys_source ON public.evaluation_keys_registry(source);
CREATE INDEX idx_evaluation_keys_category ON public.evaluation_keys_registry(category);

-- Activer RLS
ALTER TABLE public.evaluation_keys_registry ENABLE ROW LEVEL SECURITY;

-- Politique : lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can view evaluation keys"
ON public.evaluation_keys_registry
FOR SELECT
TO authenticated
USING (true);

-- Politique : modification pour tous les utilisateurs authentifiés (admin géré côté app)
CREATE POLICY "Authenticated users can manage evaluation keys"
ON public.evaluation_keys_registry
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger pour mise à jour automatique de updated_at
CREATE TRIGGER update_evaluation_keys_registry_updated_at
BEFORE UPDATE ON public.evaluation_keys_registry
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();