-- Create global_settings table for centralized configuration
CREATE TABLE public.global_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  value_type TEXT NOT NULL DEFAULT 'number' CHECK (value_type IN ('number', 'string', 'boolean', 'percentage', 'currency', 'array', 'object')),
  validation_min NUMERIC,
  validation_max NUMERIC,
  year INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, key, year)
);

-- Enable RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can read active settings, only admins can modify
CREATE POLICY "Anyone can view active global settings" 
ON public.global_settings 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage global settings" 
ON public.global_settings 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_global_settings_updated_at
BEFORE UPDATE ON public.global_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default fiscal rules for 2024
INSERT INTO public.global_settings (category, key, value, label, description, value_type, year, display_order) VALUES
-- Tax brackets 2024
('fiscal_rules', 'tax_brackets', '[{"seuil": 0, "taux": 0}, {"seuil": 11294, "taux": 11}, {"seuil": 28797, "taux": 30}, {"seuil": 82341, "taux": 41}, {"seuil": 177106, "taux": 45}]', 'Barème progressif IR', 'Tranches du barème de l''impôt sur le revenu', 'array', 2024, 1),
('fiscal_rules', 'social_charges_rate', '17.2', 'Prélèvements sociaux', 'Taux des prélèvements sociaux sur les revenus du capital', 'percentage', 2024, 2),
('fiscal_rules', 'pfu_rate', '12.8', 'PFU (Flat Tax)', 'Taux du prélèvement forfaitaire unique', 'percentage', 2024, 3),
('fiscal_rules', 'csg_deductible_rate', '6.8', 'CSG déductible', 'Taux de CSG déductible du revenu imposable', 'percentage', 2024, 4),

-- PER limits
('fiscal_rules', 'per_ceiling_rate', '10', 'Plafond PER (%)', 'Pourcentage des revenus professionnels pour le plafond PER', 'percentage', 2024, 10),
('fiscal_rules', 'per_ceiling_min', '4399', 'Plafond PER minimum', 'Plafond minimum pour les versements PER', 'currency', 2024, 11),
('fiscal_rules', 'per_ceiling_max', '35194', 'Plafond PER maximum', 'Plafond maximum pour les versements PER', 'currency', 2024, 12),

-- Donations
('fiscal_rules', 'dons_75_rate', '75', 'Taux dons urgence', 'Taux de réduction pour les dons aux associations d''aide aux personnes', 'percentage', 2024, 20),
('fiscal_rules', 'dons_75_ceiling', '1000', 'Plafond dons 75%', 'Montant maximum éligible au taux de 75%', 'currency', 2024, 21),
('fiscal_rules', 'dons_66_rate', '66', 'Taux dons classiques', 'Taux de réduction pour les dons aux associations d''intérêt général', 'percentage', 2024, 22),
('fiscal_rules', 'dons_income_limit_rate', '20', 'Limite dons / revenu', 'Pourcentage maximum du revenu imposable pour les dons', 'percentage', 2024, 23),

-- Tax credits
('fiscal_rules', 'aide_domicile_rate', '50', 'Taux aide domicile', 'Taux du crédit d''impôt pour l''emploi à domicile', 'percentage', 2024, 30),
('fiscal_rules', 'aide_domicile_ceiling', '12000', 'Plafond aide domicile', 'Plafond annuel des dépenses pour l''aide à domicile', 'currency', 2024, 31),
('fiscal_rules', 'garde_enfant_rate', '50', 'Taux garde enfants', 'Taux du crédit d''impôt pour la garde d''enfants', 'percentage', 2024, 32),
('fiscal_rules', 'garde_enfant_ceiling', '3500', 'Plafond garde enfants', 'Plafond annuel par enfant pour les frais de garde', 'currency', 2024, 33),

-- Investment reductions
('fiscal_rules', 'pme_reduction_rate', '18', 'Taux réduction PME', 'Taux de réduction d''impôt pour investissement PME/FCPI/FIP', 'percentage', 2024, 40),
('fiscal_rules', 'pme_ceiling_single', '50000', 'Plafond PME célibataire', 'Plafond d''investissement PME pour une personne seule', 'currency', 2024, 41),
('fiscal_rules', 'pme_ceiling_couple', '100000', 'Plafond PME couple', 'Plafond d''investissement PME pour un couple', 'currency', 2024, 42),
('fiscal_rules', 'esus_reduction_rate', '18', 'Taux réduction ESUS', 'Taux de réduction d''impôt pour investissement ESUS', 'percentage', 2024, 43),
('fiscal_rules', 'esus_ceiling', '13000', 'Plafond ESUS', 'Plafond spécifique pour les réductions ESUS', 'currency', 2024, 44),

-- Tax niche ceilings
('fiscal_rules', 'niche_ceiling_base', '10000', 'Plafond niches fiscales', 'Plafond annuel global des niches fiscales', 'currency', 2024, 50),
('fiscal_rules', 'niche_ceiling_esus', '13000', 'Plafond niches + ESUS', 'Plafond avec majoration ESUS', 'currency', 2024, 51),
('fiscal_rules', 'niche_ceiling_outremer', '18000', 'Plafond niches Outre-mer', 'Plafond avec majoration Outre-mer', 'currency', 2024, 52),
('fiscal_rules', 'girardin_ceiling_part', '44', 'Part plafonnée Girardin', 'Pourcentage de la réduction Girardin soumise au plafonnement', 'percentage', 2024, 53),

-- LMNP
('fiscal_rules', 'micro_bic_abatement', '50', 'Abattement micro-BIC', 'Pourcentage d''abattement pour le régime micro-BIC', 'percentage', 2024, 60),
('fiscal_rules', 'micro_bic_threshold', '77700', 'Seuil micro-BIC', 'Seuil de recettes pour le régime micro-BIC', 'currency', 2024, 61),

-- Pinel rates
('fiscal_rules', 'pinel_rate_6_years', '9', 'Taux Pinel 6 ans', 'Taux de réduction Pinel pour un engagement de 6 ans', 'percentage', 2024, 70),
('fiscal_rules', 'pinel_rate_9_years', '12', 'Taux Pinel 9 ans', 'Taux de réduction Pinel pour un engagement de 9 ans', 'percentage', 2024, 71),
('fiscal_rules', 'pinel_rate_12_years', '14', 'Taux Pinel 12 ans', 'Taux de réduction Pinel pour un engagement de 12 ans', 'percentage', 2024, 72),
('fiscal_rules', 'pinel_om_rate_6_years', '23', 'Taux Pinel OM 6 ans', 'Taux de réduction Pinel Outre-mer pour 6 ans', 'percentage', 2024, 73),
('fiscal_rules', 'pinel_om_rate_9_years', '29', 'Taux Pinel OM 9 ans', 'Taux de réduction Pinel Outre-mer pour 9 ans', 'percentage', 2024, 74),
('fiscal_rules', 'pinel_om_rate_12_years', '32', 'Taux Pinel OM 12 ans', 'Taux de réduction Pinel Outre-mer pour 12 ans', 'percentage', 2024, 75),
('fiscal_rules', 'pinel_ceiling', '300000', 'Plafond investissement Pinel', 'Montant maximum pour le calcul de la réduction Pinel', 'currency', 2024, 76),

-- Lead qualification thresholds
('lead_qualification', 'rang_1_min_income', '0', 'Revenu min Rang 1', 'Revenu minimum pour être qualifié Rang 1 (Junior)', 'currency', NULL, 1),
('lead_qualification', 'rang_1_max_income', '40000', 'Revenu max Rang 1', 'Revenu maximum pour être qualifié Rang 1 (Junior)', 'currency', NULL, 2),
('lead_qualification', 'rang_2_min_income', '40001', 'Revenu min Rang 2', 'Revenu minimum pour être qualifié Rang 2 (Standard)', 'currency', NULL, 3),
('lead_qualification', 'rang_2_max_income', '80000', 'Revenu max Rang 2', 'Revenu maximum pour être qualifié Rang 2 (Standard)', 'currency', NULL, 4),
('lead_qualification', 'rang_3_min_income', '80001', 'Revenu min Rang 3', 'Revenu minimum pour être qualifié Rang 3 (Expert)', 'currency', NULL, 5),
('lead_qualification', 'rang_3_max_income', '999999999', 'Revenu max Rang 3', 'Revenu maximum pour être qualifié Rang 3 (Expert)', 'currency', NULL, 6),

-- Simulation defaults
('simulation_defaults', 'default_tmi', '30', 'TMI par défaut', 'Taux marginal d''imposition par défaut pour les simulations', 'percentage', NULL, 1),
('simulation_defaults', 'default_interest_rate', '3.2', 'Taux d''intérêt par défaut', 'Taux d''intérêt par défaut pour les simulations immobilières', 'percentage', NULL, 2),
('simulation_defaults', 'default_insurance_rate', '0.34', 'Taux assurance par défaut', 'Taux d''assurance emprunteur par défaut', 'percentage', NULL, 3),
('simulation_defaults', 'default_loan_duration', '20', 'Durée de prêt par défaut', 'Durée en années par défaut pour les simulations de prêt', 'number', NULL, 4),
('simulation_defaults', 'default_amort_duration_immo', '25', 'Durée amort. immobilier', 'Durée d''amortissement par défaut pour l''immobilier (LMNP)', 'number', NULL, 5),
('simulation_defaults', 'default_amort_duration_mobilier', '7', 'Durée amort. mobilier', 'Durée d''amortissement par défaut pour le mobilier (LMNP)', 'number', NULL, 6),

-- ESPP/RSU constants
('product_constants', 'espp_discount_rate', '15', 'Décote ESPP standard', 'Taux de décote standard pour les plans ESPP', 'percentage', NULL, 1),
('product_constants', 'expected_market_growth', '8', 'Croissance marché attendue', 'Taux de croissance annuel attendu des marchés actions', 'percentage', NULL, 2),
('product_constants', 'rsu_social_charges_employer', '50', 'Charges employeur RSU', 'Taux de charges employeur sur les RSU', 'percentage', NULL, 3),

-- Retirement projections
('product_constants', 'retirement_age_default', '64', 'Âge retraite par défaut', 'Âge de départ à la retraite par défaut', 'number', NULL, 10),
('product_constants', 'per_return_rate_low', '3', 'Rendement PER prudent', 'Taux de rendement annuel attendu pour un profil prudent', 'percentage', NULL, 11),
('product_constants', 'per_return_rate_medium', '6', 'Rendement PER équilibré', 'Taux de rendement annuel attendu pour un profil équilibré', 'percentage', NULL, 12),
('product_constants', 'per_return_rate_high', '8', 'Rendement PER dynamique', 'Taux de rendement annuel attendu pour un profil dynamique', 'percentage', NULL, 13),
('product_constants', 'per_return_rate_very_high', '10', 'Rendement PER offensif', 'Taux de rendement annuel attendu pour un profil offensif', 'percentage', NULL, 14);

-- Create index for faster lookups
CREATE INDEX idx_global_settings_category ON public.global_settings(category);
CREATE INDEX idx_global_settings_year ON public.global_settings(year);
CREATE INDEX idx_global_settings_active ON public.global_settings(is_active);