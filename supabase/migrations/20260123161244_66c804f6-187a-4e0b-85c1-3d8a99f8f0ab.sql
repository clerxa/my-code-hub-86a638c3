-- Add new columns to non_partner_welcome_settings for quota and simulator config
ALTER TABLE public.non_partner_welcome_settings
ADD COLUMN IF NOT EXISTS max_simulations integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS allowed_simulators text[] DEFAULT ARRAY['simulateur_pret_immobilier', 'simulateur_epargne_precaution', 'simulateur_impots', 'simulateur_espp', 'simulateur_interets_composes', 'optimisation_fiscale', 'simulateur_capacite_emprunt', 'simulateur_lmnp', 'simulateur_per']::text[],
ADD COLUMN IF NOT EXISTS quota_banner_label text DEFAULT 'Analyses gratuites';

-- Update existing row with defaults
UPDATE public.non_partner_welcome_settings 
SET 
  max_simulations = COALESCE(max_simulations, 10),
  allowed_simulators = COALESCE(allowed_simulators, ARRAY['simulateur_pret_immobilier', 'simulateur_epargne_precaution', 'simulateur_impots', 'simulateur_espp', 'simulateur_interets_composes', 'optimisation_fiscale', 'simulateur_capacite_emprunt', 'simulateur_lmnp', 'simulateur_per']::text[]),
  quota_banner_label = COALESCE(quota_banner_label, 'Analyses gratuites')
WHERE id IS NOT NULL;