export interface PERSimulation {
  id?: string;
  user_id?: string;
  nom_simulation: string;
  
  // Situation fiscale
  revenu_fiscal: number;
  parts_fiscales: number;
  age_actuel: number;
  age_retraite: number;
  tmi: number;
  
  // Plafonds PER
  plafond_per_annuel: number;
  plafond_per_reportable: number;
  plafond_per_total: number;
  
  // Versements
  versements_per: number;
  
  // Résultats fiscaux
  impot_sans_per: number;
  impot_avec_per: number;
  economie_impots: number;
  effort_reel: number;
  optimisation_fiscale: number;
  reduction_impots_max: number;
  
  // Projection retraite
  horizon_annees: number;
  taux_rendement: number;
  capital_futur: number;
  gain_financier: number;
  
  created_at?: string;
  updated_at?: string;
}

export interface BaremeFiscal {
  seuil: number;
  taux: number;
}

export const BAREME_2025: BaremeFiscal[] = [
  { seuil: 0, taux: 0 },
  { seuil: 11294, taux: 0.11 },
  { seuil: 28797, taux: 0.30 },
  { seuil: 82341, taux: 0.41 },
  { seuil: 177106, taux: 0.45 },
];

export const PLAFOND_PER_MIN = 4114;
export const PLAFOND_PER_MAX = 35194;
