export interface OptimisationFiscaleSimulation {
  id?: string;
  user_id?: string;
  nom_simulation: string;
  
  // Situation fiscale
  revenu_imposable: number;
  revenus_professionnels: number;
  situation_familiale: 'celibataire' | 'marie' | 'pacse' | 'divorce' | 'veuf';
  nb_enfants: number;
  tmi: number;
  impot_avant: number;
  
  // PER
  montant_per: number;
  plafond_per: number;
  plafond_per_report_n1: number;
  plafond_per_report_n2: number;
  plafond_per_report_n3: number;
  plafond_per_total: number;
  reduction_per: number;
  plafond_per_utilise: number;
  
  // Dons
  dons_75_montant: number;
  reduction_dons_75: number;
  dons_66_montant: number;
  reduction_dons_66: number;
  
  // Aide domicile
  montant_aide_domicile: number;
  reduction_aide_domicile: number;
  
  // Garde enfants
  montant_garde_enfant: number;
  reduction_garde_enfant: number;
  
  // Pinel
  prix_pinel: number;
  taux_pinel: number;
  duree_pinel: number;
  reduction_pinel_annuelle: number;
  
  // Pinel Outre-mer
  prix_pinel_om: number;
  taux_pinel_om: number;
  duree_pinel_om: number;
  reduction_pinel_om_annuelle: number;
  
  // Girardin
  montant_girardin: number;
  taux_girardin: number;
  reduction_girardin: number;
  
  // PME/FCPI/FIP
  montant_pme: number;
  reduction_pme: number;
  
  // ESUS
  montant_esus: number;
  reduction_esus: number;
  
  // Dispositifs sélectionnés
  dispositifs_selectionnes: string[];
  
  // Résultats
  impot_apres: number;
  economie_totale: number;
  
  created_at?: string;
  updated_at?: string;
}

export interface DispositifInfo {
  id: string;
  nom: string;
  icon: string;
  description: string;
  explication: string;
  categorie: 'reduction' | 'deduction' | 'credit';
}

export interface PlafondInfo {
  nom: string;
  utilise: number;
  maximum: number;
  pourcentage: number;
  couleur: 'success' | 'warning' | 'destructive';
}

export interface PlafondDetail {
  plafondBase: number;
  plafondApplicable: number;
  totalUtilise: number;
  pourcentage: number;
  isDepasse: boolean;
  repartition: {
    dispositifId: string;
    nom: string;
    montantPlafonnable: number;
    pourcentagePlafond: number;
  }[];
  raison: string;
}
