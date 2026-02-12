import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SimulatorType = 'per' | 'espp' | 'impots' | 'optimisation_fiscale' | 'epargne_precaution' | 'lmnp' | 'capacite_emprunt' | 'pret_immobilier' | 'interets_composes';
export type ActionType = 'internal_link' | 'external_link' | 'html_script' | 'modal' | 'expert_booking';
export type ConditionOperator = '>' | '<' | '>=' | '<=' | '=' | '!=' | 'between';

export interface CTAConfig {
  id: string;
  simulator_type: SimulatorType;
  condition_key: string;
  condition_operator?: ConditionOperator;
  condition_value?: any;
  title: string;
  description?: string;
  button_text: string;
  button_color?: string;
  icon?: string;
  action_type: ActionType;
  action_value: string;
  order_num: number;
  active: boolean;
}

export interface SimulationResults {
  // PER
  tmi?: number;
  economie_impots?: number;
  effort_reel?: number;
  plafond_per_total?: number;
  plafond_per_annuel?: number;
  versement_per?: number;
  versements_per?: number;
  impot_sans_per?: number;
  impot_avec_per?: number;
  optimisation_fiscale?: number;
  horizon_annees?: number;
  capital_futur?: number;
  gain_financier?: number;
  
  // Épargne de précaution
  epargne_manquante?: number;
  nb_mois_securite?: number;
  niveau_securite?: string;
  nombre_personnes?: number;
  charges_fixes_mensuelles?: number;
  revenu_mensuel?: number;
  epargne_recommandee?: number;
  epargne_actuelle?: number;
  indice_resilience?: number;
  temps_pour_objectif?: number;
  depenses_mensuelles?: number;
  capacite_epargne?: number;
  
  // ESPP
  gain_acquisition_total?: number;
  gain_acquisition_eur?: number;
  quantite_actions?: number;
  prix_achat_final?: number;
  pru_fiscal_eur?: number;
  plus_value_brute?: number;
  impot_vente?: number;
  net_apres_impot?: number;
  nombre_lots?: number;
  
  // Impôts
  impot_net?: number;
  impot_brut?: number;
  revenu_fiscal?: number;
  quotient_familial?: number;
  nb_parts?: number;
  nb_enfants?: number;
  statut_marital?: string;
  
  // Optimisation fiscale
  economie_totale?: number;
  impot_avant?: number;
  impot_apres?: number;
  plafond_utilise?: number;
  dispositifs_selectionnes?: any[];
  plafond_per_utilise?: number;
  reduction_per?: number;
  reduction_dons?: number;
  reduction_pinel?: number;
  reduction_girardin?: number;
  nb_dispositifs?: number;
  
  // LMNP
  recettes?: number;
  total_charges?: number;
  resultat_fiscal_reel?: number;
  resultat_fiscal_micro?: number;
  meilleur_regime?: 'reel' | 'micro' | string;
  economie?: number;
  economie_regime?: number;
  fiscalite_totale_reel?: number;
  fiscalite_totale_micro?: number;
  amort_total?: number;
  amort_non_deduits?: number;
  taux_charges?: number;
  
  // Capacité d'emprunt
  capacite_emprunt?: number;
  mensualite_maximale?: number;
  montant_projet_max?: number;
  taux_endettement_actuel?: number;
  taux_endettement_futur?: number;
  reste_a_vivre?: number;
  reste_a_vivre_futur?: number;
  apport?: number;
  duree?: number;
  
  // Prêt immobilier
  mensualite_totale?: number;
  mensualite?: number;
  cout_total_interets?: number;
  cout_global_credit?: number;
  taux_endettement?: number;
  montant_emprunte?: number;
  
  // Intérêts composés - entrées (clés simples)
  versement_mensuel?: number;
  montant_initial?: number;
  duree_annees?: number;
  taux_interet?: number;
  
  // Intérêts composés - entrées (clés registre avec préfixe)
  ic_versement_mensuel_input?: number;
  ic_capital_initial_input?: number;
  ic_duree_input?: number;
  
  // Intérêts composés - résultats
  capital_final?: number;
  total_interets?: number;
  total_versements?: number;
  rendement_total?: number;
  ic_capital_final?: number;
  ic_total_interets?: number;
  ic_rendement_total?: number;
}

/**
 * Parse la valeur de condition (peut être string ou number depuis la DB)
 */
const parseConditionValue = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

/**
 * Évalue une condition numérique
 */
const evaluateNumericCondition = (
  actualValue: number | undefined,
  operator: ConditionOperator,
  conditionValue: any
): boolean => {
  if (actualValue === undefined || actualValue === null) return false;
  
  switch (operator) {
    case '>':
      const gtVal = parseConditionValue(conditionValue);
      return gtVal !== null && actualValue > gtVal;
    case '<':
      const ltVal = parseConditionValue(conditionValue);
      return ltVal !== null && actualValue < ltVal;
    case '>=':
      const gteVal = parseConditionValue(conditionValue);
      return gteVal !== null && actualValue >= gteVal;
    case '<=':
      const lteVal = parseConditionValue(conditionValue);
      return lteVal !== null && actualValue <= lteVal;
    case '=':
      const eqVal = parseConditionValue(conditionValue);
      return eqVal !== null && actualValue === eqVal;
    case '!=':
      const neqVal = parseConditionValue(conditionValue);
      return neqVal !== null && actualValue !== neqVal;
    case 'between':
      if (typeof conditionValue === 'object' && conditionValue.min !== undefined && conditionValue.max !== undefined) {
        const minVal = parseConditionValue(conditionValue.min);
        const maxVal = parseConditionValue(conditionValue.max);
        return minVal !== null && maxVal !== null && actualValue >= minVal && actualValue <= maxVal;
      }
      return false;
    default:
      return false;
  }
};

/**
 * Évalue une condition sur une chaîne de caractères
 */
const evaluateStringCondition = (
  actualValue: string | undefined,
  operator: ConditionOperator,
  conditionValue: any
): boolean => {
  if (actualValue === undefined || actualValue === null) return false;
  
  switch (operator) {
    case '=':
      return actualValue === conditionValue;
    case '!=':
      return actualValue !== conditionValue;
    default:
      return false;
  }
};

/**
 * Moteur de règles générique pour évaluer les conditions des CTA
 */
const evaluateCondition = (
  cta: CTAConfig,
  results: SimulationResults
): boolean => {
  const { condition_key, condition_operator = '=', condition_value } = cta;
  
  // Condition "always" = toujours afficher
  if (condition_key === 'always') {
    return true;
  }
  
  // Si pas de valeur de condition définie, on n'affiche pas
  if (condition_value === null || condition_value === undefined) {
    return false;
  }
  
  // Récupérer la valeur actuelle du résultat
  const actualValue = (results as any)[condition_key];
  
  // Déterminer si c'est une comparaison numérique ou string
  if (typeof actualValue === 'number') {
    return evaluateNumericCondition(actualValue, condition_operator, condition_value);
  } else if (typeof actualValue === 'string') {
    return evaluateStringCondition(actualValue, condition_operator, condition_value);
  }
  
  return false;
};

/**
 * Hook principal du moteur de règles CTA
 */
export const useCTARulesEngine = (
  simulatorType: SimulatorType,
  simulationResults: SimulationResults
) => {
  const { data: allCTAs, isLoading, error } = useQuery({
    queryKey: ['simulator_ctas', simulatorType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulator_ctas')
        .select('*')
        .eq('simulator_type', simulatorType)
        .eq('active', true)
        .order('order_num', { ascending: true });

      if (error) throw error;
      return data as CTAConfig[];
    },
  });

  // Évaluer les conditions et trouver le PREMIER CTA applicable (par ordre de priorité)
  const sortedCTAs = (allCTAs || []).sort((a, b) => (a.order_num || 0) - (b.order_num || 0));
  
  let firstApplicableCTA: CTAConfig | null = null;
  
  for (const cta of sortedCTAs) {
    try {
      const result = evaluateCondition(cta, simulationResults);
      console.log(`[CTA Engine] Evaluating CTA "${cta.title}" (order: ${cta.order_num}):`, {
        condition_key: cta.condition_key,
        condition_operator: cta.condition_operator,
        condition_value: cta.condition_value,
        actual_value: (simulationResults as any)[cta.condition_key],
        result
      });
      
      if (result) {
        firstApplicableCTA = cta;
        console.log(`[CTA Engine] Selected CTA: "${cta.title}"`);
        break; // On prend le premier applicable et on s'arrête
      }
    } catch (error) {
      console.error(`Error evaluating condition for CTA ${cta.id}:`, error);
    }
  }

  // CTA fallback générique si aucun CTA n'est applicable
  const fallbackCTA: Partial<CTAConfig> = {
    id: 'fallback-expert-booking',
    title: 'Besoin de conseils personnalisés ?',
    description: 'Échangez avec un expert pour optimiser votre situation',
    button_text: 'Prendre rendez-vous',
    icon: 'Calendar',
    action_type: 'expert_booking',
    action_value: '/employee/rdv-expert',
    order_num: 0,
    active: true,
  };

  // CTA obligatoire "Enregistrer"
  const mandatorySaveCTA: Partial<CTAConfig> = {
    id: 'mandatory-save',
    title: 'Enregistrer ma simulation',
    button_text: 'Enregistrer',
    icon: 'Save',
    action_type: 'internal_link',
    action_value: 'save',
    order_num: -1,
    active: true,
  };

  // Construire la liste finale : Save + (premier CTA applicable OU fallback)
  const dynamicCTA = firstApplicableCTA || fallbackCTA;
  const finalCTAs: Partial<CTAConfig>[] = [mandatorySaveCTA, dynamicCTA];

  return {
    ctas: finalCTAs,
    isLoading,
    error,
    hasDynamicCTAs: firstApplicableCTA !== null,
  };
};
