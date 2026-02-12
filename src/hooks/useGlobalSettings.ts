import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  GlobalSetting, 
  GlobalSettingsState, 
  FiscalRules, 
  LeadQualification, 
  SimulationDefaults, 
  ProductConstants,
  RecommendationThresholds,
  TaxBracket 
} from '@/types/global-settings';

// Default fallback values (used if database is unavailable)
const DEFAULT_FISCAL_RULES: FiscalRules = {
  tax_brackets: [
    { seuil: 0, taux: 0 },
    { seuil: 11294, taux: 11 },
    { seuil: 28797, taux: 30 },
    { seuil: 82341, taux: 41 },
    { seuil: 177106, taux: 45 },
  ],
  social_charges_rate: 17.2,
  pfu_rate: 12.8,
  csg_deductible_rate: 6.8,
  per_ceiling_rate: 10,
  per_ceiling_min: 4399,
  per_ceiling_max: 35194,
  dons_75_rate: 75,
  dons_75_ceiling: 1000,
  dons_66_rate: 66,
  dons_income_limit_rate: 20,
  aide_domicile_rate: 50,
  aide_domicile_ceiling: 12000,
  garde_enfant_rate: 50,
  garde_enfant_ceiling: 3500,
  pme_reduction_rate: 18,
  pme_ceiling_single: 50000,
  pme_ceiling_couple: 100000,
  esus_reduction_rate: 18,
  esus_ceiling: 13000,
  niche_ceiling_base: 10000,
  niche_ceiling_esus: 13000,
  niche_ceiling_outremer: 18000,
  girardin_ceiling_part: 44,
  girardin_rate_t1: 125,
  girardin_rate_t2: 120,
  girardin_rate_t3: 117,
  girardin_rate_t4: 112,
  micro_bic_abatement: 50,
  micro_bic_threshold: 77700,
  pinel_rate_6_years: 9,
  pinel_rate_9_years: 12,
  pinel_rate_12_years: 14,
  pinel_om_rate_6_years: 23,
  pinel_om_rate_9_years: 29,
  pinel_om_rate_12_years: 32,
  pinel_ceiling: 300000,
};

const DEFAULT_LEAD_QUALIFICATION: LeadQualification = {
  rang_1_min_income: 0,
  rang_1_max_income: 40000,
  rang_2_min_income: 40001,
  rang_2_max_income: 80000,
  rang_3_min_income: 80001,
  rang_3_max_income: 999999999,
};

const DEFAULT_SIMULATION_DEFAULTS: SimulationDefaults = {
  default_tmi: 30,
  default_interest_rate: 3.2,
  default_insurance_rate: 0.34,
  default_loan_duration: 20,
  default_amort_duration_immo: 25,
  default_amort_duration_mobilier: 7,
  max_debt_ratio: 35,
  min_living_remainder_adult: 400,
  min_living_remainder_child: 300,
  // Épargne de précaution
  epargne_niveau_minimum_mois: 2,
  epargne_niveau_confortable_mois: 4,
  epargne_niveau_optimal_mois: 6,
  epargne_coef_cdi_tech: 1.0,
  epargne_coef_cdi_non_tech: 1.2,
  epargne_coef_independant: 1.5,
  epargne_coef_variable: 1.5,
  epargne_seuil_charges_bon: 0.3,
  epargne_seuil_charges_moyen: 0.5,
  epargne_seuil_charges_eleve: 0.6,
  epargne_objectif_mois: 12,
};

const DEFAULT_PRODUCT_CONSTANTS: ProductConstants = {
  espp_discount_rate: 15,
  expected_market_growth: 8,
  rsu_social_charges_employer: 50,
  retirement_age_default: 64,
  return_rate_short: 3,
  return_rate_medium: 6,
  return_rate_long: 8,
  return_rate_very_long: 10,
};

const DEFAULT_RECOMMENDATION_THRESHOLDS: RecommendationThresholds = {
  cta_tmi_high_threshold: 30,
  cta_tmi_very_high_threshold: 41,
  cta_per_eligible_min_tmi: 30,
  cta_per_optimal_min_tmi: 41,
  cta_epargne_insuffisante_mois: 2,
  cta_epargne_ok_mois: 4,
  cta_epargne_excedent_mois: 6,
  cta_capacite_emprunt_bon: 25,
  cta_capacite_emprunt_attention: 33,
  cta_capacite_emprunt_danger: 40,
  cta_reste_a_vivre_min_adulte: 400,
  cta_reste_a_vivre_min_enfant: 300,
  cta_lmnp_min_recettes: 15000,
  cta_lmnp_charges_threshold: 0.5,
  cta_espp_gain_min_percent: 15,
  cta_espp_vente_immediat_threshold: 50,
  cta_girardin_min_ir: 5000,
  cta_pme_min_ir: 3000,
  lead_patrimoine_min_premium: 100000,
  lead_revenu_min_priority: 80000,
};

function parseSettingValue(setting: GlobalSetting): number | string | boolean | TaxBracket[] | Record<string, unknown> {
  const rawValue = setting.value;
  
  if (setting.value_type === 'array' || setting.value_type === 'object') {
    if (typeof rawValue === 'string') {
      try {
        return JSON.parse(rawValue);
      } catch {
        return rawValue;
      }
    }
    return rawValue as TaxBracket[] | Record<string, unknown>;
  }
  
  if (setting.value_type === 'boolean') {
    if (typeof rawValue === 'boolean') return rawValue;
    return rawValue === 'true' || rawValue === '1';
  }
  
  if (setting.value_type === 'number' || setting.value_type === 'percentage' || setting.value_type === 'currency') {
    if (typeof rawValue === 'number') return rawValue;
    return parseFloat(String(rawValue)) || 0;
  }
  
  return String(rawValue);
}

function mapSettingsToCategory<T>(
  settings: GlobalSetting[], 
  category: string,
  defaults: T,
  targetYear: number
): T {
  const result = { ...defaults } as T;
  
  // Group settings by key, prioritizing the target year over null year
  const settingsByKey = new Map<string, GlobalSetting>();
  
  settings
    .filter(s => s.category === category)
    .forEach(setting => {
      const existingSetting = settingsByKey.get(setting.key);
      
      // If no existing setting, or the new one matches the target year better
      if (!existingSetting) {
        settingsByKey.set(setting.key, setting);
      } else if (setting.year === targetYear && existingSetting.year !== targetYear) {
        // Prefer year-specific setting over null year
        settingsByKey.set(setting.key, setting);
      }
      // If existing is already target year, keep it
    });
  
  settingsByKey.forEach(setting => {
    const key = setting.key as keyof T;
    if (key in (result as object)) {
      (result as Record<string, unknown>)[key as string] = parseSettingValue(setting);
    }
  });
  
  return result;
}

export const useGlobalSettings = (year: number = new Date().getFullYear()) => {
  const [state, setState] = useState<GlobalSettingsState>({
    fiscalRules: DEFAULT_FISCAL_RULES,
    leadQualification: DEFAULT_LEAD_QUALIFICATION,
    simulationDefaults: DEFAULT_SIMULATION_DEFAULTS,
    productConstants: DEFAULT_PRODUCT_CONSTANTS,
    recommendationThresholds: DEFAULT_RECOMMENDATION_THRESHOLDS,
    isLoading: true,
    error: null,
    year,
  });

  const fetchSettings = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { data, error } = await supabase
        .from('global_settings')
        .select('*')
        .eq('is_active', true)
        .or(`year.eq.${year},year.is.null`)
        .order('display_order');

      if (error) throw error;

      const settings = (data || []) as unknown as GlobalSetting[];

      setState({
        fiscalRules: mapSettingsToCategory<FiscalRules>(settings, 'fiscal_rules', DEFAULT_FISCAL_RULES, year),
        leadQualification: mapSettingsToCategory<LeadQualification>(settings, 'lead_qualification', DEFAULT_LEAD_QUALIFICATION, year),
        simulationDefaults: mapSettingsToCategory<SimulationDefaults>(settings, 'simulation_defaults', DEFAULT_SIMULATION_DEFAULTS, year),
        productConstants: mapSettingsToCategory<ProductConstants>(settings, 'product_constants', DEFAULT_PRODUCT_CONSTANTS, year),
        recommendationThresholds: mapSettingsToCategory<RecommendationThresholds>(settings, 'recommendation_thresholds', DEFAULT_RECOMMENDATION_THRESHOLDS, year),
        isLoading: false,
        error: null,
        year,
      });
    } catch (err) {
      console.error('Error fetching global settings:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch settings',
      }));
    }
  }, [year]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = async (id: string, value: string | number | boolean | object) => {
    try {
      const jsonValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      const { error } = await supabase
        .from('global_settings')
        .update({ value: jsonValue })
        .eq('id', id);

      if (error) throw error;
      
      await fetchSettings();
      return { success: true };
    } catch (err) {
      console.error('Error updating setting:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
    }
  };

  const getSetting = <T>(category: string, key: string, defaultValue: T): T => {
    const categoryMap: Record<string, FiscalRules | LeadQualification | SimulationDefaults | ProductConstants> = {
      fiscal_rules: state.fiscalRules,
      lead_qualification: state.leadQualification,
      simulation_defaults: state.simulationDefaults,
      product_constants: state.productConstants,
    };

    const categoryData = categoryMap[category];
    if (!categoryData) return defaultValue;
    
    return (categoryData[key] as T) ?? defaultValue;
  };

  return {
    ...state,
    fetchSettings,
    updateSetting,
    getSetting,
  };
};

// Export a singleton instance for use outside of React components
let cachedSettings: GlobalSettingsState | null = null;

export const getGlobalSettings = async (year: number = new Date().getFullYear()): Promise<GlobalSettingsState> => {
  if (cachedSettings && cachedSettings.year === year) {
    return cachedSettings;
  }

  try {
    const { data, error } = await supabase
      .from('global_settings')
      .select('*')
      .eq('is_active', true)
      .or(`year.eq.${year},year.is.null`)
      .order('display_order');

    if (error) throw error;

    const settings = (data || []) as unknown as GlobalSetting[];

    cachedSettings = {
      fiscalRules: mapSettingsToCategory<FiscalRules>(settings, 'fiscal_rules', DEFAULT_FISCAL_RULES, year),
      leadQualification: mapSettingsToCategory<LeadQualification>(settings, 'lead_qualification', DEFAULT_LEAD_QUALIFICATION, year),
      simulationDefaults: mapSettingsToCategory<SimulationDefaults>(settings, 'simulation_defaults', DEFAULT_SIMULATION_DEFAULTS, year),
      productConstants: mapSettingsToCategory<ProductConstants>(settings, 'product_constants', DEFAULT_PRODUCT_CONSTANTS, year),
      recommendationThresholds: mapSettingsToCategory<RecommendationThresholds>(settings, 'recommendation_thresholds', DEFAULT_RECOMMENDATION_THRESHOLDS, year),
      isLoading: false,
      error: null,
      year,
    };

    return cachedSettings;
  } catch {
    return {
      fiscalRules: DEFAULT_FISCAL_RULES,
      leadQualification: DEFAULT_LEAD_QUALIFICATION,
      simulationDefaults: DEFAULT_SIMULATION_DEFAULTS,
      productConstants: DEFAULT_PRODUCT_CONSTANTS,
      recommendationThresholds: DEFAULT_RECOMMENDATION_THRESHOLDS,
      isLoading: false,
      error: 'Failed to fetch settings',
      year,
    };
  }
};

export const invalidateSettingsCache = () => {
  cachedSettings = null;
};
