/**
 * Types pour le simulateur ESPP v2 — Architecture alignée sur RSU
 */

export type ESPPDevise = 'EUR' | 'USD';

export interface ESPPPeriod {
  id: string;
  entreprise_nom: string;
  entreprise_ticker: string;
  entreprise_devise: ESPPDevise;
  taux_rabais: number; // 1–15%
  date_debut_offre: string;
  date_achat: string;
  cours_debut_offre_devise: number;
  cours_achat_devise: number;
  taux_change_achat: number; // 1 si EUR
  nb_actions_achetees: number;
  // Cession (optionnel)
  has_sold: boolean;
  date_cession: string;
  prix_cession_devise: number;
  taux_change_cession: number; // 1 si EUR
}

export interface ESPPCalculIntermediaire {
  cours_reference_devise: number;
  prix_achat_effectif_devise: number;
  prix_achat_effectif_eur: number;
  valeur_marche_achat_eur: number;
  total_paye_eur: number;
  rabais_eur: number;
}

export interface ESPPSimulationResult {
  periodes: ESPPPeriodResult[];
  // Totaux consolidés
  rabais_brut_total: number;
  ir_rabais_total: number;
  ps_rabais_total: number;
  gain_net_rabais_total: number;
  pv_brute_total: number;
  pfu_total: number;
  gain_net_pv_total: number;
  gain_brut_total: number;
  total_impots: number;
  gain_net_total: number;
  taux_effectif: number;
}

export interface ESPPPeriodResult {
  period_id: string;
  entreprise_nom: string;
  nb_actions: number;
  // Rabais
  rabais_brut: number;
  ir_rabais: number;
  ps_rabais: number;
  gain_net_rabais: number;
  // PV cession
  has_sold: boolean;
  pv_brute: number;
  ir_pv: number;
  ps_pv: number;
  pfu: number;
  gain_net_pv: number;
  is_moins_value: boolean;
  // Totaux
  gain_brut: number;
  total_impots: number;
  gain_net: number;
}

export const TMI_OPTIONS = [
  { value: 11, label: '11%' },
  { value: 30, label: '30%' },
  { value: 41, label: '41%' },
  { value: 45, label: '45%' },
];
