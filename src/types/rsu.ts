/**
 * Types pour le simulateur RSU multi-plans
 */

export type RSURegime = 'R1' | 'R2' | 'R3';
export type RSUDevise = 'EUR' | 'USD';

export interface VestingLine {
  id: string;
  date: string;
  nb_rsu: number;
  cours: number; // en devise du plan
  taux_change: number; // €/$ (1 si EUR)
  gain_eur: number; // calculé automatiquement
}

export interface RSUPlan {
  id: string;
  nom: string;
  ticker?: string; // symbole boursier (ex: CRM, GOOGL)
  entreprise_nom?: string; // nom affiché (ex: Salesforce Inc.)
  annee_attribution: number;
  regime: RSURegime;
  devise: RSUDevise;
  date_fin_conservation?: string; // YYYY-MM-DD — fin de période d'acquisition/conservation (plans qualifiés)
  vestings: VestingLine[];
  gain_acquisition_total: number; // calculé
}

export interface RSUCessionParams {
  prix_vente: number; // en devise
  taux_change_vente: number; // €/$ au jour de la vente
  tmi: number; // 11, 30, 41, 45
  date_cession: string; // YYYY-MM-DD
  tmi_from_profile?: boolean; // whether TMI was loaded from financial profile
}

// Résultat par plan
export interface RSUPlanResult {
  plan_id: string;
  plan_nom: string;
  regime: RSURegime;
  devise: RSUDevise;
  nb_actions_total: number;
  gain_acquisition_eur: number;
  pv_cession_eur: number;
  // Abattement appliqué (0, 0.50, 0.65)
  abattement_duree_detention: number;
  // Détail impôts gain acquisition
  ir_gain_acquisition: number;
  ps_gain_acquisition: number;
  contribution_salariale: number;
  csg_crds: number;
  // Détail impôts PV cession
  ir_pv_cession: number;
  ps_pv_cession: number;
  // Totaux
  total_impots: number;
  gain_net: number;
}

// Résultat consolidé
export interface RSUSimulationResult {
  plans: RSUPlanResult[];
  // Totaux consolidés
  gain_brut_total: number;
  total_impots: number;
  gain_net_total: number;
  taux_effectif: number;
  // Seuil 300k
  seuil_300k_applique: boolean;
  // Détail par poste
  total_ir: number;
  total_ps: number;
  total_contribution_salariale: number;
  total_csg_crds: number;
}

export const REGIME_LABELS: Record<RSURegime, string> = {
  R1: 'Qualifié (post 30/12/2016)',
  R2: 'Qualifié (08/2015 - 12/2016)',
  R3: 'Non qualifié',
};

export const REGIME_COLORS: Record<RSURegime, string> = {
  R1: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  R2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  R3: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

export const TMI_OPTIONS = [
  { value: 11, label: '11%' },
  { value: 30, label: '30%' },
  { value: 41, label: '41%' },
  { value: 45, label: '45%' },
];
