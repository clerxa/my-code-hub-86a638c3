-- Table pour stocker les demandes d'aide à la déclaration fiscale
CREATE TABLE public.tax_declaration_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Étape 1: Informations générales
  entreprise TEXT NOT NULL,
  intitule_poste TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  is_perlib_client BOOLEAN DEFAULT false,
  conseiller_dedie TEXT,
  
  -- Étape 2: Situation fiscale
  situation_maritale TEXT,
  nombre_enfants INTEGER DEFAULT 0,
  revenu_imposable_precedent NUMERIC,
  tmi TEXT,
  
  -- Étape 3: Revenus 2025
  revenus_types JSONB DEFAULT '[]'::jsonb,
  
  -- Étape 4: Optimisation
  optimisation_types JSONB DEFAULT '[]'::jsonb,
  
  -- Étape 5: Intervenants
  expertise_avocat JSONB DEFAULT '[]'::jsonb,
  delegation_complete BOOLEAN DEFAULT false,
  
  -- Étape 6: Documents & RDV
  avis_imposition_url TEXT,
  autres_justificatifs_urls JSONB DEFAULT '[]'::jsonb,
  type_rdv TEXT,
  commentaires TEXT,
  
  -- Metadata
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ajouter le champ pour activer la fonctionnalité par entreprise
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS tax_declaration_help_enabled BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.tax_declaration_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests
CREATE POLICY "Users can view their own tax requests"
ON public.tax_declaration_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create their own requests
CREATE POLICY "Users can create their own tax requests"
ON public.tax_declaration_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own requests
CREATE POLICY "Users can update their own tax requests"
ON public.tax_declaration_requests
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Admins can view all requests
CREATE POLICY "Admins can view all tax requests"
ON public.tax_declaration_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can update all requests
CREATE POLICY "Admins can update all tax requests"
ON public.tax_declaration_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Policy: Company contacts can view their company requests
CREATE POLICY "Company contacts can view company tax requests"
ON public.tax_declaration_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid() 
    AND ur.role = 'contact_entreprise'::app_role
    AND p.company_id = tax_declaration_requests.company_id
  )
);

-- Trigger pour updated_at
CREATE TRIGGER update_tax_declaration_requests_updated_at
BEFORE UPDATE ON public.tax_declaration_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour les recherches
CREATE INDEX idx_tax_declaration_requests_user_id ON public.tax_declaration_requests(user_id);
CREATE INDEX idx_tax_declaration_requests_company_id ON public.tax_declaration_requests(company_id);
CREATE INDEX idx_tax_declaration_requests_status ON public.tax_declaration_requests(status);