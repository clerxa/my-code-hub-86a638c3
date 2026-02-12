export interface GlobalSetting {
  id: string;
  category: string;
  key: string;
  value: string | number | boolean | TaxBracket[] | Record<string, unknown>;
  label: string;
  description: string | null;
  value_type: 'number' | 'string' | 'boolean' | 'percentage' | 'currency' | 'array' | 'object';
  validation_min: number | null;
  validation_max: number | null;
  year: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaxBracket {
  seuil: number;
  taux: number;
}

export interface FiscalRules {
  // Tax brackets
  tax_brackets: TaxBracket[];
  social_charges_rate: number;
  pfu_rate: number;
  csg_deductible_rate: number;
  
  // PER
  per_ceiling_rate: number;
  per_ceiling_min: number;
  per_ceiling_max: number;
  
  // Donations
  dons_75_rate: number;
  dons_75_ceiling: number;
  dons_66_rate: number;
  dons_income_limit_rate: number;
  
  // Tax credits
  aide_domicile_rate: number;
  aide_domicile_ceiling: number;
  garde_enfant_rate: number;
  garde_enfant_ceiling: number;
  
  // Investment reductions
  pme_reduction_rate: number;
  pme_ceiling_single: number;
  pme_ceiling_couple: number;
  esus_reduction_rate: number;
  esus_ceiling: number;
  
  // Tax niche ceilings
  niche_ceiling_base: number;
  niche_ceiling_esus: number;
  niche_ceiling_outremer: number;
  girardin_ceiling_part: number;
  girardin_rate_t1: number;
  girardin_rate_t2: number;
  girardin_rate_t3: number;
  girardin_rate_t4: number;
  
  // LMNP
  micro_bic_abatement: number;
  micro_bic_threshold: number;
  
  // Pinel
  pinel_rate_6_years: number;
  pinel_rate_9_years: number;
  pinel_rate_12_years: number;
  pinel_om_rate_6_years: number;
  pinel_om_rate_9_years: number;
  pinel_om_rate_12_years: number;
  pinel_ceiling: number;
}

export interface LeadQualification {
  rang_1_min_income: number;
  rang_1_max_income: number;
  rang_2_min_income: number;
  rang_2_max_income: number;
  rang_3_min_income: number;
  rang_3_max_income: number;
}

export interface SimulationDefaults {
  default_tmi: number;
  default_interest_rate: number;
  default_insurance_rate: number;
  default_loan_duration: number;
  default_amort_duration_immo: number;
  default_amort_duration_mobilier: number;
  // Capacité d'emprunt
  max_debt_ratio: number;
  min_living_remainder_adult: number;
  min_living_remainder_child: number;
  // Épargne de précaution
  epargne_niveau_minimum_mois: number;
  epargne_niveau_confortable_mois: number;
  epargne_niveau_optimal_mois: number;
  epargne_coef_cdi_tech: number;
  epargne_coef_cdi_non_tech: number;
  epargne_coef_independant: number;
  epargne_coef_variable: number;
  epargne_seuil_charges_bon: number;
  epargne_seuil_charges_moyen: number;
  epargne_seuil_charges_eleve: number;
  epargne_objectif_mois: number;
}

export interface ProductConstants {
  espp_discount_rate: number;
  expected_market_growth: number;
  rsu_social_charges_employer: number;
  retirement_age_default: number;
  // Taux de rendement PER par horizon
  return_rate_short: number;
  return_rate_medium: number;
  return_rate_long: number;
  return_rate_very_long: number;
}

export interface GlobalSettingsState {
  fiscalRules: FiscalRules;
  leadQualification: LeadQualification;
  simulationDefaults: SimulationDefaults;
  productConstants: ProductConstants;
  recommendationThresholds: RecommendationThresholds;
  isLoading: boolean;
  error: string | null;
  year: number;
}

export const SETTING_CATEGORIES = {
  fiscal_rules: 'Règles fiscales',
  recommendation_thresholds: 'Seuils recommandations',
  simulation_defaults: 'Valeurs par défaut',
  product_constants: 'Constantes produits',
  lead_qualification: 'Qualification leads',
} as const;

export type SettingCategory = keyof typeof SETTING_CATEGORIES;

// Interface pour les seuils de recommandations
export interface RecommendationThresholds {
  cta_tmi_high_threshold: number;
  cta_tmi_very_high_threshold: number;
  cta_per_eligible_min_tmi: number;
  cta_per_optimal_min_tmi: number;
  cta_epargne_insuffisante_mois: number;
  cta_epargne_ok_mois: number;
  cta_epargne_excedent_mois: number;
  cta_capacite_emprunt_bon: number;
  cta_capacite_emprunt_attention: number;
  cta_capacite_emprunt_danger: number;
  cta_reste_a_vivre_min_adulte: number;
  cta_reste_a_vivre_min_enfant: number;
  cta_lmnp_min_recettes: number;
  cta_lmnp_charges_threshold: number;
  cta_espp_gain_min_percent: number;
  cta_espp_vente_immediat_threshold: number;
  cta_girardin_min_ir: number;
  cta_pme_min_ir: number;
  lead_patrimoine_min_premium: number;
  lead_revenu_min_priority: number;
}