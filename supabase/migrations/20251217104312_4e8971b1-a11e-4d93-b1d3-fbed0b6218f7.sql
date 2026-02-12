-- Add new fields for enhanced financial profile
ALTER TABLE public.user_financial_profiles
ADD COLUMN IF NOT EXISTS statut_residence text, -- proprietaire / locataire
ADD COLUMN IF NOT EXISTS epargne_livrets numeric DEFAULT 0, -- Livrets réglementés (Livret A, LDDS, etc.)
ADD COLUMN IF NOT EXISTS patrimoine_per numeric DEFAULT 0, -- PER
ADD COLUMN IF NOT EXISTS patrimoine_assurance_vie numeric DEFAULT 0, -- Assurance vie
ADD COLUMN IF NOT EXISTS patrimoine_scpi numeric DEFAULT 0, -- SCPI
ADD COLUMN IF NOT EXISTS patrimoine_pea numeric DEFAULT 0, -- PEA
ADD COLUMN IF NOT EXISTS patrimoine_autres numeric DEFAULT 0, -- Autres placements financiers
ADD COLUMN IF NOT EXISTS patrimoine_immo_valeur numeric DEFAULT 0, -- Valeur du bien immobilier
ADD COLUMN IF NOT EXISTS patrimoine_immo_credit_restant numeric DEFAULT 0, -- Crédit restant à rembourser
ADD COLUMN IF NOT EXISTS revenu_fiscal_foyer numeric DEFAULT 0; -- Revenu fiscal du foyer (si parts > 1)