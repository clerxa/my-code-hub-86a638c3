/**
 * Types pour le simulateur RSU multi-plans
 * 6 régimes fiscaux basés sur la date d'attribution
 */

export type RSURegime = 'AGA_PRE2012' | 'AGA_2012_2015' | 'AGA_2015_2016' | 'AGA_2017' | 'AGA_POST2018' | 'NON_QUALIFIE';
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
  ticker?: string;
  entreprise_nom?: string;
  annee_attribution: number;
  regime: RSURegime;
  devise: RSUDevise;
  date_fin_conservation?: string; // YYYY-MM-DD — obligatoire pour AGA_2015_2016, AGA_2017, AGA_POST2018
  vestings: VestingLine[];
  gain_acquisition_total: number;
}

export interface RSUCessionParams {
  mode: 'simple' | 'avance';
  prix_vente: number;
  taux_change_vente: number;
  tmi: number; // 11, 30, 41, 45
  date_cession: string; // mode simple — date globale
  dates_cession_par_plan?: Record<string, string>; // mode avancé — une date par plan
  tmi_from_profile?: boolean;
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

// Résultat par année fiscale (mode avancé)
export interface RSUResultatAnnuel {
  annee: number;
  plans: RSUPlanResult[];
  gain_brut: number;
  total_ir: number;
  total_ps: number;
  total_contrib: number;
  total_impots: number;
  cash_recu: number;
  impact_bulletin: number;
  seuil_300k_applique: boolean;
}

// Résultat consolidé
export interface RSUSimulationResult {
  plans: RSUPlanResult[];
  gain_brut_total: number;
  total_impots: number;
  gain_net_total: number;
  taux_effectif: number;
  seuil_300k_applique: boolean;
  total_ir: number;
  total_ps: number;
  total_contribution_salariale: number;
  total_csg_crds: number;
  mode: 'simple' | 'avance';
  resultats_par_annee?: RSUResultatAnnuel[];
}

export const REGIME_LABELS: Record<RSURegime, string> = {
  AGA_PRE2012: 'AGA avant 2012 — taux forfaitaire 30%, PS 17,2%, contrib 10%',
  AGA_2012_2015: 'AGA 2012-2015 — barème IR, PS 9,7%, contrib 10%',
  AGA_2015_2016: 'AGA 08/2015-12/2016 — abattement durée détention',
  AGA_2017: 'AGA 2017 — abattement + seuil 300k€',
  AGA_POST2018: 'AGA post-2018 — abattement 50% fixe sous 300k€',
  NON_QUALIFIE: 'Non qualifié — imposé comme salaire',
};

export const REGIME_SHORT_LABELS: Record<RSURegime, string> = {
  AGA_PRE2012: 'AGA pré-2012',
  AGA_2012_2015: 'AGA 2012-2015',
  AGA_2015_2016: 'AGA 2015-2016',
  AGA_2017: 'AGA 2017',
  AGA_POST2018: 'AGA post-2018',
  NON_QUALIFIE: 'Non qualifié',
};

export const REGIME_COLORS: Record<RSURegime, string> = {
  AGA_PRE2012: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
  AGA_2012_2015: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  AGA_2015_2016: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  AGA_2017: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  AGA_POST2018: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  NON_QUALIFIE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

export const TMI_OPTIONS = [
  { value: 11, label: '11%' },
  { value: 30, label: '30%' },
  { value: 41, label: '41%' },
  { value: 45, label: '45%' },
];

/** Déduit le régime fiscal à partir de la date d'attribution */
export function inferRegimeFromYear(year: number): RSURegime {
  if (year >= 2018) return 'AGA_POST2018';
  if (year === 2017) return 'AGA_2017';
  if (year >= 2015) return 'AGA_2015_2016';
  if (year >= 2012) return 'AGA_2012_2015';
  return 'AGA_PRE2012';
}

/** Vérifie si le régime nécessite une date de fin de conservation */
export function regimeNeedsConservationDate(regime: RSURegime): boolean {
  return regime === 'AGA_2015_2016' || regime === 'AGA_2017' || regime === 'AGA_POST2018';
}

/** Vérifie si le régime est qualifié (AGA) */
export function isQualifiedRegime(regime: RSURegime): boolean {
  return regime !== 'NON_QUALIFIE';
}

/** Migration helper: convertit les anciens codes R1/R2/R3 */
export function migrateOldRegime(regime: string): RSURegime {
  switch (regime) {
    case 'R1': return 'AGA_POST2018';
    case 'R2': return 'AGA_2015_2016';
    case 'R3': return 'NON_QUALIFIE';
    default: return regime as RSURegime;
  }
}
