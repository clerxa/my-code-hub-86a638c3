/**
 * Types pour le Simulateur Plus-Value Immobilière (PVI)
 * Calcul de l'impôt sur la plus-value immobilière selon CGI Art. 150 VB/VC
 */

export type NatureBien = 'residence_principale' | 'residence_secondaire' | 'investissement_locatif' | 'terrain_batir';
export type ModeAcquisition = 'reel' | 'forfait';
export type ModeTravaux = 'reel' | 'forfait_15';

export interface PVIFormInputs {
  // Section A: Le Bien et les Dates
  nature_bien: NatureBien;
  date_acquisition: string; // ISO date
  date_cession: string; // ISO date
  
  // Section B: Les Prix
  prix_cession: number;
  prix_acquisition: number;
  
  // Section C: Majorations du Prix d'Acquisition
  mode_frais_acquisition: ModeAcquisition;
  frais_acquisition_reel?: number;
  
  mode_travaux: ModeTravaux;
  travaux_reel?: number;
}

export interface PVICalculationResult {
  // Données de base
  duree_detention_annees: number;
  duree_detention_exacte: { years: number; months: number; days: number };
  
  // Calcul du prix d'acquisition majoré
  frais_acquisition: number;
  travaux: number;
  prix_acquisition_majore: number;
  
  // Plus-value brute
  plus_value_brute: number;
  
  // Abattements
  abattement_ir_pct: number;
  abattement_ps_pct: number;
  abattement_ir_montant: number;
  abattement_ps_montant: number;
  
  // Assiettes nettes après abattements
  assiette_ir_nette: number;
  assiette_ps_nette: number;
  
  // Impôts de base
  impot_revenu: number; // 19%
  prelevements_sociaux: number; // 17.2%
  
  // Surtaxe (Art. 1609 nonies G CGI)
  surtaxe_applicable: boolean;
  surtaxe_montant: number;
  surtaxe_taux: number;
  
  // Totaux
  impot_total: number;
  net_vendeur: number;
  
  // Données pour graphique
  repartition: {
    part_exoneree: number;
    impot_revenu: number;
    prelevements_sociaux: number;
    surtaxe: number;
  };
}

export interface PVIAbattementDetail {
  annee: number;
  taux_ir: number;
  taux_ps: number;
  cumul_ir: number;
  cumul_ps: number;
}
