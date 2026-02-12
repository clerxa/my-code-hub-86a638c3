export interface UserFiscalProfile {
  id: string;
  user_id: string;
  residence_fiscal: string;
  tmi: 0 | 11 | 30 | 41 | 45;
  mode_imposition_plus_value: 'PFU' | 'Barème';
  created_at: string;
  updated_at: string;
}

export interface ESPPPlan {
  id: string;
  user_id: string;
  nom_plan: string;
  entreprise: string;
  devise_plan: string;
  date_debut: string;
  date_fin: string;
  lookback: boolean;
  discount_pct: number;
  fmv_debut: number;
  fmv_fin: number;
  montant_investi: number;
  taux_change_payroll: number;
  broker?: string;
  created_at: string;
  updated_at: string;
}

export interface ESPPLot {
  id: string;
  plan_id: string;
  date_acquisition: string;
  quantite_achetee_brut: number;
  prix_achat_unitaire_devise: number;
  fmv_retenu_plan: number;
  gain_acquisition_par_action: number;
  gain_acquisition_total_devise: number;
  gain_acquisition_total_eur: number;
  pru_fiscal_eur: number;
  frais_achat: number;
  broker_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SellToCover {
  id: string;
  lot_id: string;
  is_sell_to_cover: boolean;
  quantite_vendue: number;
  prix_vente_devise: number;
  date_sell_to_cover: string;
  taux_change: number;
  frais: number;
  taxes_prelevees: number;
  created_at: string;
  updated_at: string;
}

export interface VenteESPP {
  id: string;
  lot_id: string;
  quantite_vendue: number;
  prix_vente_devise: number;
  date_vente: string;
  taux_change: number;
  frais_vente: number;
  devise: string;
  plus_value_brute_devise?: number;
  plus_value_eur?: number;
  impot_calcule?: number;
  prelevements_sociaux?: number;
  net_apres_impot?: number;
  created_at: string;
  updated_at: string;
}

export interface CalculESPP {
  prixAchatFinal: number;
  quantiteActions: number;
  gainAcquisitionParAction: number;
  gainAcquisitionTotal: number;
  gainAcquisitionEUR: number;
  pruFiscalEUR: number;
}

export interface ResultatVente {
  plusValueBrute: number;
  plusValueEUR: number;
  impot: number;
  prelevementsSociaux: number;
  netApresImpot: number;
}

export interface ResultatAnnuel {
  annee: number;
  totalGainAcquisition: number;
  totalPlusValue: number;
  totalImpots: number;
  totalNet: number;
  nbTransactions: number;
}
