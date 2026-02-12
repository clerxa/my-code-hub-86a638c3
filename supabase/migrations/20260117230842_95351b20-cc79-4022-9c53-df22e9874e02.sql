-- Table pour les fiches produits financiers
CREATE TABLE public.financial_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  
  -- Tags et catégorisation
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  
  -- Section Snapshot (Bento Grid)
  availability TEXT,
  availability_icon TEXT DEFAULT 'Clock',
  risk_level INTEGER DEFAULT 1 CHECK (risk_level >= 1 AND risk_level <= 5),
  risk_label TEXT,
  max_amount TEXT,
  max_amount_label TEXT DEFAULT 'Plafond',
  target_return TEXT,
  target_return_label TEXT DEFAULT 'Rendement cible',
  
  -- Section Bénéfices
  benefits JSONB DEFAULT '[]',
  
  -- Section Match Fiscal
  fiscal_comparison_enabled BOOLEAN DEFAULT true,
  fiscal_before_label TEXT DEFAULT 'Sans ce produit',
  fiscal_before_value TEXT,
  fiscal_after_label TEXT DEFAULT 'Avec ce produit',
  fiscal_after_value TEXT,
  fiscal_savings_label TEXT DEFAULT 'Économie',
  fiscal_savings_value TEXT,
  
  -- Conseil Expert
  expert_tip_title TEXT DEFAULT 'Conseil d''Expert',
  expert_tip_content TEXT,
  expert_tip_icon TEXT DEFAULT 'Lightbulb',
  
  -- CTA
  cta_text TEXT DEFAULT 'En savoir plus',
  cta_url TEXT,
  cta_secondary_text TEXT,
  cta_secondary_url TEXT,
  
  -- Visuels
  hero_image_url TEXT,
  icon TEXT DEFAULT 'Wallet',
  gradient_start TEXT DEFAULT '217 91% 60%',
  gradient_end TEXT DEFAULT '262 83% 58%',
  
  -- Métadonnées
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_products ENABLE ROW LEVEL SECURITY;

-- Policies - Lecture publique pour les produits actifs
CREATE POLICY "Financial products are viewable by everyone" 
ON public.financial_products 
FOR SELECT 
USING (is_active = true);

-- Policy pour les admins (CRUD complet)
CREATE POLICY "Admins can manage financial products" 
ON public.financial_products 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Trigger pour updated_at
CREATE TRIGGER update_financial_products_updated_at
BEFORE UPDATE ON public.financial_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour les recherches
CREATE INDEX idx_financial_products_slug ON public.financial_products(slug);
CREATE INDEX idx_financial_products_category ON public.financial_products(category);
CREATE INDEX idx_financial_products_active ON public.financial_products(is_active);
CREATE INDEX idx_financial_products_order ON public.financial_products(display_order);