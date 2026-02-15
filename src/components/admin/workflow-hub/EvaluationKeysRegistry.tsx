/**
 * Registre centralisé des clés d'évaluation disponibles
 * Ce fichier définit toutes les clés utilisables dans les conditions des workflows
 * Les clés peuvent être statiques (définies ici) ou dynamiques (stockées en DB)
 */

import { supabase } from "@/integrations/supabase/client";

export type DataSource = 
  | 'user_financial_profiles'
  | 'per_simulations'
  | 'optimisation_fiscale_simulations'
  | 'epargne_precaution_simulations'
  | 'lmnp_simulations'
  | 'capacite_emprunt_simulations'
  | 'espp_lots'
  | 'risk_profile'
  | 'module_validations'
  | 'appointments'
  | 'onboarding_responses'
  | 'global_settings'
  | 'diagnostic_results';

export type ValueType = 'number' | 'string' | 'boolean' | 'date' | 'percentage' | 'currency';

export interface EvaluationKey {
  key: string;
  label: string;
  description?: string;
  type: ValueType;
  unit?: string;
  source: DataSource;
  category: string;
  isCalculated?: boolean;
  formula?: string;
  isFromDb?: boolean;
}

export interface KeyCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  keys: EvaluationKey[];
}

// ============================================
// CLÉS DU PROFIL FINANCIER
// ============================================
export const FINANCIAL_PROFILE_KEYS: EvaluationKey[] = [
  // Revenus
  { key: 'revenu_mensuel_net', label: 'Revenu mensuel net', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Revenus' },
  { key: 'revenu_fiscal_annuel', label: 'Revenu fiscal annuel', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Revenus' },
  { key: 'revenu_fiscal_foyer', label: 'Revenu fiscal du foyer', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Revenus' },
  { key: 'revenu_annuel_conjoint', label: 'Revenu annuel du conjoint', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Revenus' },
  { key: 'autres_revenus_mensuels', label: 'Autres revenus mensuels', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Revenus' },
  { key: 'revenus_locatifs', label: 'Revenus locatifs', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Revenus' },
  { key: 'revenus_dividendes', label: 'Revenus de dividendes', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Revenus' },
  { key: 'revenus_ventes_actions', label: 'Revenus de ventes d\'actions', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Revenus' },
  { key: 'revenus_capital_autres', label: 'Autres revenus du capital', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Revenus' },
  { key: 'equity_income_amount', label: 'Revenus equity de l\'année', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Revenus' },
  
  // Fiscal
  { key: 'tmi', label: 'Tranche Marginale d\'Imposition', type: 'percentage', unit: '%', source: 'user_financial_profiles', category: 'Fiscal' },
  { key: 'parts_fiscales', label: 'Nombre de parts fiscales', type: 'number', source: 'user_financial_profiles', category: 'Fiscal' },
  { key: 'plafond_per_reportable', label: 'Plafond PER reportable', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Fiscal' },
  
  // Charges
  { key: 'charges_fixes_mensuelles', label: 'Charges fixes mensuelles', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Charges' },
  { key: 'loyer_actuel', label: 'Loyer actuel', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Charges' },
  { key: 'credits_immobilier', label: 'Crédits immobiliers', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Charges' },
  { key: 'credits_consommation', label: 'Crédits à la consommation', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Charges' },
  { key: 'credits_auto', label: 'Crédits auto', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Charges' },
  { key: 'pensions_alimentaires', label: 'Pensions alimentaires', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Charges' },
  
  // Épargne & Patrimoine
  { key: 'epargne_actuelle', label: 'Épargne actuelle', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Épargne' },
  { key: 'epargne_livrets', label: 'Épargne sur livrets', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Épargne' },
  { key: 'apport_disponible', label: 'Apport disponible', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Épargne' },
  { key: 'capacite_epargne_mensuelle', label: 'Capacité d\'épargne mensuelle', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Épargne' },
  { key: 'patrimoine_per', label: 'Patrimoine PER', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Patrimoine' },
  { key: 'patrimoine_assurance_vie', label: 'Assurance vie', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Patrimoine' },
  { key: 'patrimoine_scpi', label: 'Patrimoine SCPI', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Patrimoine' },
  { key: 'patrimoine_pea', label: 'Patrimoine PEA', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Patrimoine' },
  { key: 'patrimoine_autres', label: 'Autres placements', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Patrimoine' },
  { key: 'patrimoine_immo_valeur', label: 'Valeur immobilier', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Patrimoine' },
  { key: 'patrimoine_immo_credit_restant', label: 'Crédit immobilier restant', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Patrimoine' },
  
  // Situation personnelle
  { key: 'age', label: 'Âge', type: 'number', unit: 'ans', source: 'user_financial_profiles', category: 'Situation' },
  { key: 'situation_familiale', label: 'Situation familiale', type: 'string', source: 'user_financial_profiles', category: 'Situation' },
  { key: 'nb_enfants', label: 'Nombre d\'enfants', type: 'number', source: 'user_financial_profiles', category: 'Situation' },
  { key: 'nb_personnes_foyer', label: 'Personnes dans le foyer', type: 'number', source: 'user_financial_profiles', category: 'Situation' },
  { key: 'type_contrat', label: 'Type de contrat', type: 'string', source: 'user_financial_profiles', category: 'Situation' },
  { key: 'anciennete_annees', label: 'Ancienneté', type: 'number', unit: 'ans', source: 'user_financial_profiles', category: 'Situation' },
  { key: 'secteur_activite', label: 'Secteur d\'activité', type: 'string', source: 'user_financial_profiles', category: 'Situation' },
  { key: 'statut_residence', label: 'Statut de résidence', type: 'string', source: 'user_financial_profiles', category: 'Situation' },
  
  // Equity
  { key: 'has_rsu_aga', label: 'Possède RSU/AGA', type: 'boolean', source: 'user_financial_profiles', category: 'Equity' },
  { key: 'has_espp', label: 'Possède ESPP', type: 'boolean', source: 'user_financial_profiles', category: 'Equity' },
  { key: 'has_stock_options', label: 'Possède stock-options', type: 'boolean', source: 'user_financial_profiles', category: 'Equity' },
  { key: 'has_bspce', label: 'Possède BSPCE', type: 'boolean', source: 'user_financial_profiles', category: 'Equity' },
  { key: 'has_pee', label: 'Possède PEE', type: 'boolean', source: 'user_financial_profiles', category: 'Equity' },
  { key: 'has_perco', label: 'Possède PERCO', type: 'boolean', source: 'user_financial_profiles', category: 'Equity' },
  { key: 'has_equity_income_this_year', label: 'A des revenus equity cette année', type: 'boolean', source: 'user_financial_profiles', category: 'Equity' },
  
  // Projets immobiliers
  { key: 'objectif_achat_immo', label: 'Projet d\'achat immobilier', type: 'boolean', source: 'user_financial_profiles', category: 'Projets' },
  { key: 'projet_residence_principale', label: 'Projet résidence principale', type: 'boolean', source: 'user_financial_profiles', category: 'Projets' },
  { key: 'projet_residence_secondaire', label: 'Projet résidence secondaire', type: 'boolean', source: 'user_financial_profiles', category: 'Projets' },
  { key: 'projet_investissement_locatif', label: 'Projet investissement locatif', type: 'boolean', source: 'user_financial_profiles', category: 'Projets' },
  { key: 'budget_achat_immo', label: 'Budget achat immobilier', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Projets' },
  { key: 'budget_residence_principale', label: 'Budget résidence principale', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Projets' },
  { key: 'budget_investissement_locatif', label: 'Budget investissement locatif', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Projets' },
  { key: 'duree_emprunt_souhaitee', label: 'Durée d\'emprunt souhaitée', type: 'number', unit: 'ans', source: 'user_financial_profiles', category: 'Projets' },
  
  // Profil complet
  { key: 'is_complete', label: 'Profil complet', type: 'boolean', source: 'user_financial_profiles', category: 'Statut' },
];

// ============================================
// CLÉS DES SIMULATIONS PER
// ============================================
export const PER_SIMULATION_KEYS: EvaluationKey[] = [
  // Résultats calculés
  { key: 'per_tmi', label: '📊 TMI (résultat PER)', type: 'percentage', unit: '%', source: 'per_simulations', category: 'Résultats PER' },
  { key: 'per_economie_impots', label: '📊 Économie d\'impôts', type: 'currency', unit: '€', source: 'per_simulations', category: 'Résultats PER' },
  { key: 'per_effort_reel', label: '📊 Effort réel après économie', type: 'currency', unit: '€', source: 'per_simulations', category: 'Résultats PER' },
  { key: 'per_impot_sans', label: '📊 Impôt sans PER', type: 'currency', unit: '€', source: 'per_simulations', category: 'Résultats PER' },
  { key: 'per_impot_avec', label: '📊 Impôt avec PER', type: 'currency', unit: '€', source: 'per_simulations', category: 'Résultats PER' },
  { key: 'per_capital_futur', label: '📊 Capital futur estimé', type: 'currency', unit: '€', source: 'per_simulations', category: 'Résultats PER' },
  // Inputs utilisateur
  { key: 'per_versement', label: '✏️ Versement PER (input)', type: 'currency', unit: '€', source: 'per_simulations', category: 'Résultats PER' },
  { key: 'per_plafond', label: '✏️ Plafond PER (input)', type: 'currency', unit: '€', source: 'per_simulations', category: 'Résultats PER' },
  { key: 'per_horizon_annees', label: '✏️ Horizon retraite (input)', type: 'number', unit: 'ans', source: 'per_simulations', category: 'Résultats PER' },
];

// ============================================
// CLÉS DES SIMULATIONS ESPP
// ============================================
export const ESPP_SIMULATION_KEYS: EvaluationKey[] = [
  // Résultats calculés
  { key: 'espp_gain_acquisition', label: '📊 Gain d\'acquisition total', type: 'currency', unit: '€', source: 'espp_lots', category: 'Résultats ESPP' },
  { key: 'espp_quantite_actions', label: '📊 Nombre d\'actions achetées', type: 'number', source: 'espp_lots', category: 'Résultats ESPP' },
  { key: 'espp_pru_fiscal', label: '📊 PRU fiscal', type: 'currency', unit: '€', source: 'espp_lots', category: 'Résultats ESPP' },
  { key: 'espp_plus_value_brute', label: '📊 Plus-value brute vente', type: 'currency', unit: '€', source: 'espp_lots', category: 'Résultats ESPP' },
  { key: 'espp_impot_vente', label: '📊 Impôt sur la vente', type: 'currency', unit: '€', source: 'espp_lots', category: 'Résultats ESPP' },
  // Inputs
  { key: 'espp_montant_investi', label: '✏️ Montant investi (input)', type: 'currency', unit: '€', source: 'espp_lots', category: 'Résultats ESPP' },
];

// ============================================
// CLÉS DES SIMULATIONS IMPÔTS
// ============================================
export const IMPOTS_SIMULATION_KEYS: EvaluationKey[] = [
  { key: 'impots_tmi', label: '📊 TMI (résultat)', type: 'percentage', unit: '%', source: 'user_financial_profiles', category: 'Résultats Impôts' },
  { key: 'impots_brut', label: '📊 Impôt brut', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Résultats Impôts' },
  { key: 'impots_net', label: '📊 Impôt net à payer', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Résultats Impôts' },
  { key: 'impots_quotient_familial', label: '📊 Quotient familial', type: 'number', source: 'user_financial_profiles', category: 'Résultats Impôts' },
];

// ============================================
// CLÉS DES SIMULATIONS OPTIMISATION FISCALE
// ============================================
export const OPTIM_FISCALE_KEYS: EvaluationKey[] = [
  { key: 'optim_economie_totale', label: '📊 Économie totale', type: 'currency', unit: '€', source: 'optimisation_fiscale_simulations', category: 'Résultats Optimisation' },
  { key: 'optim_impot_avant', label: '📊 Impôt avant optimisation', type: 'currency', unit: '€', source: 'optimisation_fiscale_simulations', category: 'Résultats Optimisation' },
  { key: 'optim_impot_apres', label: '📊 Impôt après optimisation', type: 'currency', unit: '€', source: 'optimisation_fiscale_simulations', category: 'Résultats Optimisation' },
  { key: 'optim_tmi', label: '📊 TMI', type: 'percentage', unit: '%', source: 'optimisation_fiscale_simulations', category: 'Résultats Optimisation' },
  { key: 'optim_plafond_niche', label: '📊 Plafond niche fiscale utilisé', type: 'percentage', unit: '%', source: 'optimisation_fiscale_simulations', category: 'Résultats Optimisation' },
  { key: 'optim_nb_dispositifs', label: '📊 Nombre de dispositifs', type: 'number', source: 'optimisation_fiscale_simulations', category: 'Résultats Optimisation' },
];

// ============================================
// CLÉS DES SIMULATIONS ÉPARGNE DE PRÉCAUTION
// ============================================
export const EPARGNE_PRECAUTION_KEYS: EvaluationKey[] = [
  { key: 'epargne_nb_mois_securite', label: '📊 Mois de sécurité', type: 'number', unit: 'mois', source: 'epargne_precaution_simulations', category: 'Résultats Épargne' },
  { key: 'epargne_recommandee', label: '📊 Épargne recommandée', type: 'currency', unit: '€', source: 'epargne_precaution_simulations', category: 'Résultats Épargne' },
  { key: 'epargne_manquante', label: '📊 Épargne manquante', type: 'currency', unit: '€', source: 'epargne_precaution_simulations', category: 'Résultats Épargne' },
  { key: 'epargne_indice_resilience', label: '📊 Indice de résilience', type: 'percentage', unit: '%', source: 'epargne_precaution_simulations', category: 'Résultats Épargne' },
  { key: 'epargne_temps_objectif', label: '📊 Temps pour objectif', type: 'number', unit: 'mois', source: 'epargne_precaution_simulations', category: 'Résultats Épargne' },
  // Inputs
  { key: 'epargne_actuelle_input', label: '✏️ Épargne actuelle (input)', type: 'currency', unit: '€', source: 'epargne_precaution_simulations', category: 'Résultats Épargne' },
  { key: 'epargne_capacite_input', label: '✏️ Capacité d\'épargne mensuelle (input)', type: 'currency', unit: '€', source: 'epargne_precaution_simulations', category: 'Résultats Épargne' },
];

// ============================================
// CLÉS DES SIMULATIONS LMNP
// ============================================
export const LMNP_KEYS: EvaluationKey[] = [
  { key: 'lmnp_meilleur_regime', label: '📊 Meilleur régime fiscal', type: 'string', source: 'lmnp_simulations', category: 'Résultats LMNP' },
  { key: 'lmnp_resultat_reel', label: '📊 Résultat fiscal réel', type: 'currency', unit: '€', source: 'lmnp_simulations', category: 'Résultats LMNP' },
  { key: 'lmnp_resultat_micro', label: '📊 Résultat fiscal micro', type: 'currency', unit: '€', source: 'lmnp_simulations', category: 'Résultats LMNP' },
  { key: 'lmnp_fiscalite_reel', label: '📊 Fiscalité totale réel', type: 'currency', unit: '€', source: 'lmnp_simulations', category: 'Résultats LMNP' },
  { key: 'lmnp_fiscalite_micro', label: '📊 Fiscalité totale micro', type: 'currency', unit: '€', source: 'lmnp_simulations', category: 'Résultats LMNP' },
  { key: 'lmnp_amort_total', label: '📊 Amortissements totaux', type: 'currency', unit: '€', source: 'lmnp_simulations', category: 'Résultats LMNP' },
  // Inputs
  { key: 'lmnp_recettes', label: '✏️ Recettes annuelles (input)', type: 'currency', unit: '€', source: 'lmnp_simulations', category: 'Résultats LMNP' },
  { key: 'lmnp_charges', label: '✏️ Total des charges (input)', type: 'currency', unit: '€', source: 'lmnp_simulations', category: 'Résultats LMNP' },
];

// ============================================
// CLÉS DES SIMULATIONS CAPACITÉ D'EMPRUNT
// ============================================
export const CAPACITE_EMPRUNT_KEYS: EvaluationKey[] = [
  { key: 'emprunt_capacite', label: '📊 Capacité d\'emprunt', type: 'currency', unit: '€', source: 'capacite_emprunt_simulations', category: 'Résultats Emprunt' },
  { key: 'emprunt_mensualite_max', label: '📊 Mensualité maximale', type: 'currency', unit: '€', source: 'capacite_emprunt_simulations', category: 'Résultats Emprunt' },
  { key: 'emprunt_projet_max', label: '📊 Montant projet max', type: 'currency', unit: '€', source: 'capacite_emprunt_simulations', category: 'Résultats Emprunt' },
  { key: 'emprunt_taux_actuel', label: '📊 Taux d\'endettement actuel', type: 'percentage', unit: '%', source: 'capacite_emprunt_simulations', category: 'Résultats Emprunt' },
  { key: 'emprunt_taux_futur', label: '📊 Taux d\'endettement futur', type: 'percentage', unit: '%', source: 'capacite_emprunt_simulations', category: 'Résultats Emprunt' },
  { key: 'emprunt_reste_vivre', label: '📊 Reste à vivre', type: 'currency', unit: '€', source: 'capacite_emprunt_simulations', category: 'Résultats Emprunt' },
  // Inputs
  { key: 'emprunt_revenu_input', label: '✏️ Revenu mensuel net (input)', type: 'currency', unit: '€', source: 'capacite_emprunt_simulations', category: 'Résultats Emprunt' },
  { key: 'emprunt_apport_input', label: '✏️ Apport personnel (input)', type: 'currency', unit: '€', source: 'capacite_emprunt_simulations', category: 'Résultats Emprunt' },
  { key: 'emprunt_duree_input', label: '✏️ Durée en années (input)', type: 'number', unit: 'ans', source: 'capacite_emprunt_simulations', category: 'Résultats Emprunt' },
];

// ============================================
// CLÉS DES SIMULATIONS PRÊT IMMOBILIER
// ============================================
export const PRET_IMMO_KEYS: EvaluationKey[] = [
  { key: 'pret_mensualite', label: '📊 Mensualité totale', type: 'currency', unit: '€', source: 'capacite_emprunt_simulations', category: 'Résultats Prêt' },
  { key: 'pret_cout_interets', label: '📊 Coût total des intérêts', type: 'currency', unit: '€', source: 'capacite_emprunt_simulations', category: 'Résultats Prêt' },
  { key: 'pret_cout_global', label: '📊 Coût global du crédit', type: 'currency', unit: '€', source: 'capacite_emprunt_simulations', category: 'Résultats Prêt' },
  { key: 'pret_taux_endettement', label: '📊 Taux d\'endettement', type: 'percentage', unit: '%', source: 'capacite_emprunt_simulations', category: 'Résultats Prêt' },
  // Inputs
  { key: 'pret_montant_input', label: '✏️ Montant emprunté (input)', type: 'currency', unit: '€', source: 'capacite_emprunt_simulations', category: 'Résultats Prêt' },
  { key: 'pret_taux_input', label: '✏️ Taux d\'intérêt (input)', type: 'percentage', unit: '%', source: 'capacite_emprunt_simulations', category: 'Résultats Prêt' },
  { key: 'pret_duree_input', label: '✏️ Durée du prêt (input)', type: 'number', unit: 'ans', source: 'capacite_emprunt_simulations', category: 'Résultats Prêt' },
];

// ============================================
// CLÉS DES SIMULATIONS INTÉRÊTS COMPOSÉS
// ============================================
export const INTERETS_COMPOSES_KEYS: EvaluationKey[] = [
  { key: 'ic_capital_final', label: '📊 Capital final', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Résultats Intérêts' },
  { key: 'ic_total_interets', label: '📊 Total des intérêts', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Résultats Intérêts' },
  { key: 'ic_rendement_total', label: '📊 Rendement total', type: 'percentage', unit: '%', source: 'user_financial_profiles', category: 'Résultats Intérêts' },
  // Inputs
  { key: 'ic_capital_initial_input', label: '✏️ Capital initial (input)', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Résultats Intérêts' },
  { key: 'ic_versement_mensuel_input', label: '✏️ Versement mensuel (input)', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Résultats Intérêts' },
  { key: 'ic_duree_input', label: '✏️ Durée (input)', type: 'number', unit: 'ans', source: 'user_financial_profiles', category: 'Résultats Intérêts' },
];

// ============================================
// CLÉS CALCULÉES / DÉRIVÉES
// ============================================
export const CALCULATED_KEYS: EvaluationKey[] = [
  { key: 'patrimoine_total', label: 'Patrimoine total', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Calculé', isCalculated: true, formula: 'patrimoine_per + patrimoine_assurance_vie + patrimoine_scpi + patrimoine_pea + patrimoine_autres + epargne_livrets + patrimoine_immo_valeur - patrimoine_immo_credit_restant' },
  { key: 'taux_epargne', label: 'Taux d\'épargne', type: 'percentage', unit: '%', source: 'user_financial_profiles', category: 'Calculé', isCalculated: true, formula: '(capacite_epargne_mensuelle / revenu_mensuel_net) * 100' },
  { key: 'charges_totales', label: 'Charges totales mensuelles', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Calculé', isCalculated: true, formula: 'charges_fixes_mensuelles + loyer_actuel + credits_immobilier + credits_consommation + credits_auto + pensions_alimentaires' },
  { key: 'reste_a_vivre_actuel', label: 'Reste à vivre actuel', type: 'currency', unit: '€', source: 'user_financial_profiles', category: 'Calculé', isCalculated: true, formula: 'revenu_mensuel_net - charges_totales' },
  { key: 'ratio_endettement', label: 'Ratio d\'endettement', type: 'percentage', unit: '%', source: 'user_financial_profiles', category: 'Calculé', isCalculated: true, formula: '(credits_immobilier + credits_consommation + credits_auto) / revenu_mensuel_net * 100' },
  { key: 'mois_epargne_disponible', label: 'Mois d\'épargne disponible', type: 'number', unit: 'mois', source: 'user_financial_profiles', category: 'Calculé', isCalculated: true, formula: 'epargne_actuelle / charges_fixes_mensuelles' },
];

// ============================================
// CLÉS DE PROGRESSION
// ============================================
export const PROGRESS_KEYS: EvaluationKey[] = [
  { key: 'modules_valides_count', label: 'Modules validés', type: 'number', source: 'module_validations', category: 'Progression' },
  { key: 'has_risk_profile', label: 'Profil de risque complété', type: 'boolean', source: 'risk_profile', category: 'Progression' },
  { key: 'has_appointments', label: 'A des rendez-vous', type: 'boolean', source: 'appointments', category: 'Progression' },
  { key: 'financial_profile_completion', label: 'Complétion du profil financier', type: 'percentage', unit: '%', source: 'user_financial_profiles', category: 'Progression', isCalculated: true },
  { key: 'diagnostic_not_started', label: 'Diagnostic non réalisé', type: 'boolean', source: 'diagnostic_results', category: 'Diagnostic', description: 'L\'utilisateur n\'a jamais commencé le diagnostic' },
  { key: 'diagnostic_in_progress', label: 'Diagnostic en cours', type: 'boolean', source: 'diagnostic_results', category: 'Diagnostic', description: 'L\'utilisateur a commencé mais pas terminé le diagnostic' },
  { key: 'diagnostic_completed', label: 'Diagnostic terminé', type: 'boolean', source: 'diagnostic_results', category: 'Diagnostic', description: 'L\'utilisateur a terminé le diagnostic' },
  { key: 'diagnostic_score_percent', label: 'Score du diagnostic (%)', type: 'percentage', unit: '%', source: 'diagnostic_results', category: 'Diagnostic', description: 'Score obtenu au diagnostic financier' },
];

// ============================================
// CLÉS SPÉCIALES
// ============================================
export const SPECIAL_KEYS: EvaluationKey[] = [
  { key: 'always', label: 'Toujours afficher', type: 'boolean', source: 'global_settings', category: 'Spécial', description: 'Condition toujours vraie' },
  { key: 'never', label: 'Ne jamais afficher', type: 'boolean', source: 'global_settings', category: 'Spécial', description: 'Condition toujours fausse' },
];

// ============================================
// REGISTRE STATIQUE COMPLET
// ============================================
export const STATIC_EVALUATION_KEYS: EvaluationKey[] = [
  ...SPECIAL_KEYS,
  ...FINANCIAL_PROFILE_KEYS,
  ...PER_SIMULATION_KEYS,
  ...ESPP_SIMULATION_KEYS,
  ...IMPOTS_SIMULATION_KEYS,
  ...OPTIM_FISCALE_KEYS,
  ...EPARGNE_PRECAUTION_KEYS,
  ...LMNP_KEYS,
  ...CAPACITE_EMPRUNT_KEYS,
  ...PRET_IMMO_KEYS,
  ...INTERETS_COMPOSES_KEYS,
  ...CALCULATED_KEYS,
  ...PROGRESS_KEYS,
];

// Variable pour stocker les clés dynamiques (chargées depuis la DB)
let dynamicKeys: EvaluationKey[] = [];
let keysLoaded = false;

// Charger les clés depuis la base de données
export async function loadDynamicKeys(): Promise<EvaluationKey[]> {
  try {
    const { data, error } = await supabase
      .from('evaluation_keys_registry')
      .select('*')
      .order('category', { ascending: true });
    
    if (error) {
      console.error('Error loading dynamic keys:', error);
      return [];
    }
    
    dynamicKeys = (data || []).map(row => ({
      key: row.key,
      label: row.label,
      description: row.description || undefined,
      type: row.type as ValueType,
      unit: row.unit || undefined,
      source: row.source as DataSource,
      category: row.category,
      isCalculated: row.is_calculated || false,
      formula: row.formula || undefined,
      isFromDb: true,
    }));
    
    keysLoaded = true;
    return dynamicKeys;
  } catch (err) {
    console.error('Error loading dynamic keys:', err);
    return [];
  }
}

// Ajouter des clés à la base de données
export async function addKeysToRegistry(keys: Omit<EvaluationKey, 'isFromDb'>[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Dédupliquer les clés par leur identifiant pour éviter l'erreur
    // "ON CONFLICT DO UPDATE command cannot affect a row a second time"
    const uniqueKeysMap = new Map<string, Omit<EvaluationKey, 'isFromDb'>>();
    keys.forEach(key => {
      if (!uniqueKeysMap.has(key.key)) {
        uniqueKeysMap.set(key.key, key);
      }
    });
    
    const insertData = Array.from(uniqueKeysMap.values()).map(key => ({
      key: key.key,
      label: key.label,
      description: key.description || null,
      type: key.type,
      unit: key.unit || null,
      source: key.source,
      category: key.category,
      is_calculated: key.isCalculated || false,
      formula: key.formula || null,
      is_auto_generated: true,
    }));
    
    const { data, error } = await supabase
      .from('evaluation_keys_registry')
      .upsert(insertData, { onConflict: 'key' })
      .select();
    
    if (error) {
      console.error('Error adding keys:', error);
      return { success: false, count: 0, error: error.message };
    }
    
    // Recharger les clés dynamiques
    await loadDynamicKeys();
    
    return { success: true, count: data?.length || 0 };
  } catch (err) {
    console.error('Error adding keys:', err);
    return { success: false, count: 0, error: String(err) };
  }
}

// Supprimer une clé du registre
export async function removeKeyFromRegistry(key: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('evaluation_keys_registry')
      .delete()
      .eq('key', key);
    
    if (error) {
      console.error('Error removing key:', error);
      return false;
    }
    
    // Recharger les clés dynamiques
    await loadDynamicKeys();
    return true;
  } catch (err) {
    console.error('Error removing key:', err);
    return false;
  }
}

// Obtenir toutes les clés (statiques + dynamiques)
export function getAllEvaluationKeys(): EvaluationKey[] {
  // Fusionner les clés statiques et dynamiques, en évitant les doublons
  const allKeys = [...STATIC_EVALUATION_KEYS];
  
  dynamicKeys.forEach(dynKey => {
    if (!allKeys.some(k => k.key === dynKey.key)) {
      allKeys.push(dynKey);
    }
  });
  
  return allKeys;
}

// Alias pour compatibilité avec le code existant
export const ALL_EVALUATION_KEYS = STATIC_EVALUATION_KEYS;

// Grouper par catégorie
export function getKeysByCategory(): Record<string, EvaluationKey[]> {
  return getAllEvaluationKeys().reduce((acc, key) => {
    if (!acc[key.category]) {
      acc[key.category] = [];
    }
    acc[key.category].push(key);
    return acc;
  }, {} as Record<string, EvaluationKey[]>);
}

// Grouper par source
export function getKeysBySource(): Record<DataSource, EvaluationKey[]> {
  return getAllEvaluationKeys().reduce((acc, key) => {
    if (!acc[key.source]) {
      acc[key.source] = [];
    }
    acc[key.source].push(key);
    return acc;
  }, {} as Record<DataSource, EvaluationKey[]>);
}

// Trouver une clé par son identifiant
export function getKeyByName(keyName: string): EvaluationKey | undefined {
  return getAllEvaluationKeys().find(k => k.key === keyName);
}

// Filtrer par type de valeur
export function getKeysByType(type: ValueType): EvaluationKey[] {
  return getAllEvaluationKeys().filter(k => k.type === type);
}

// Configuration des catégories avec métadonnées visuelles
export const KEY_CATEGORIES: KeyCategory[] = [
  { id: 'Spécial', label: 'Conditions spéciales', icon: 'Zap', color: 'text-purple-600', keys: SPECIAL_KEYS },
  { id: 'Revenus', label: 'Revenus', icon: 'DollarSign', color: 'text-emerald-600', keys: FINANCIAL_PROFILE_KEYS.filter(k => k.category === 'Revenus') },
  { id: 'Fiscal', label: 'Données fiscales', icon: 'FileText', color: 'text-blue-600', keys: FINANCIAL_PROFILE_KEYS.filter(k => k.category === 'Fiscal') },
  { id: 'Charges', label: 'Charges', icon: 'CreditCard', color: 'text-red-600', keys: FINANCIAL_PROFILE_KEYS.filter(k => k.category === 'Charges') },
  { id: 'Épargne', label: 'Épargne', icon: 'PiggyBank', color: 'text-amber-600', keys: FINANCIAL_PROFILE_KEYS.filter(k => k.category === 'Épargne') },
  { id: 'Patrimoine', label: 'Patrimoine', icon: 'Building', color: 'text-indigo-600', keys: FINANCIAL_PROFILE_KEYS.filter(k => k.category === 'Patrimoine') },
  { id: 'Situation', label: 'Situation personnelle', icon: 'User', color: 'text-gray-600', keys: FINANCIAL_PROFILE_KEYS.filter(k => k.category === 'Situation') },
  { id: 'Equity', label: 'Dispositifs equity', icon: 'TrendingUp', color: 'text-cyan-600', keys: FINANCIAL_PROFILE_KEYS.filter(k => k.category === 'Equity') },
  { id: 'Projets', label: 'Projets immobiliers', icon: 'Home', color: 'text-orange-600', keys: FINANCIAL_PROFILE_KEYS.filter(k => k.category === 'Projets') },
  { id: 'Résultats PER', label: 'Simulations PER', icon: 'Calculator', color: 'text-primary', keys: PER_SIMULATION_KEYS },
  { id: 'Résultats ESPP', label: 'Simulations ESPP', icon: 'TrendingUp', color: 'text-primary', keys: ESPP_SIMULATION_KEYS },
  { id: 'Résultats Impôts', label: 'Simulations Impôts', icon: 'FileText', color: 'text-primary', keys: IMPOTS_SIMULATION_KEYS },
  { id: 'Résultats Optimisation', label: 'Optimisation fiscale', icon: 'Target', color: 'text-primary', keys: OPTIM_FISCALE_KEYS },
  { id: 'Résultats Épargne', label: 'Épargne de précaution', icon: 'Shield', color: 'text-primary', keys: EPARGNE_PRECAUTION_KEYS },
  { id: 'Résultats LMNP', label: 'Simulations LMNP', icon: 'Building2', color: 'text-primary', keys: LMNP_KEYS },
  { id: 'Résultats Emprunt', label: 'Capacité d\'emprunt', icon: 'Landmark', color: 'text-primary', keys: CAPACITE_EMPRUNT_KEYS },
  { id: 'Résultats Prêt', label: 'Prêt immobilier', icon: 'Home', color: 'text-primary', keys: PRET_IMMO_KEYS },
  { id: 'Résultats Intérêts', label: 'Intérêts composés', icon: 'TrendingUp', color: 'text-primary', keys: INTERETS_COMPOSES_KEYS },
  { id: 'Calculé', label: 'Valeurs calculées', icon: 'Function', color: 'text-violet-600', keys: CALCULATED_KEYS },
  { id: 'Progression', label: 'Progression utilisateur', icon: 'Activity', color: 'text-teal-600', keys: PROGRESS_KEYS },
];

// Export les opérateurs disponibles
export const CONDITION_OPERATORS = [
  { value: '>', label: 'Supérieur à (>)', types: ['number', 'currency', 'percentage'] },
  { value: '>=', label: 'Supérieur ou égal (≥)', types: ['number', 'currency', 'percentage'] },
  { value: '<', label: 'Inférieur à (<)', types: ['number', 'currency', 'percentage'] },
  { value: '<=', label: 'Inférieur ou égal (≤)', types: ['number', 'currency', 'percentage'] },
  { value: '=', label: 'Égal à (=)', types: ['number', 'currency', 'percentage', 'string', 'boolean'] },
  { value: '!=', label: 'Différent de (≠)', types: ['number', 'currency', 'percentage', 'string', 'boolean'] },
  { value: 'between', label: 'Entre (intervalle)', types: ['number', 'currency', 'percentage'] },
  { value: 'contains', label: 'Contient', types: ['string'] },
  { value: 'starts_with', label: 'Commence par', types: ['string'] },
  { value: 'is_empty', label: 'Est vide', types: ['string', 'number'] },
  { value: 'is_not_empty', label: 'N\'est pas vide', types: ['string', 'number'] },
];

// Obtenir les opérateurs valides pour un type de valeur
export function getOperatorsForType(type: ValueType): typeof CONDITION_OPERATORS {
  return CONDITION_OPERATORS.filter(op => op.types.includes(type));
}
