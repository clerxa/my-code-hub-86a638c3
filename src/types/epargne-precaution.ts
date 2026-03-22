export type NiveauSecurite = 'minimum' | 'confortable' | 'optimal';
export type TypeContrat = 'cdi' | 'cdd' | 'independant';

export interface ChargesDetailees {
  // 🏠 Logement et Énergie
  loyer: number;           // Loyer charges comprises (locataire)
  credit_immobilier: number; // Mensualité crédit immobilier (propriétaire)
  copropriete_taxes: number;
  energie: number;
  assurance_habitation: number;
  // 🚗 Transports et Mobilité
  transport_commun: number;
  assurance_auto: number;
  lld_loa_auto: number;
  // 📱 Communication et Services
  internet: number;
  mobile: number;
  abonnements: number;
  // 👨‍👩‍👧 Famille
  frais_scolarite: number;
  pension_alimentaire: number;
  // 💰 Crédit consommation
  credit_consommation: number;
  // 🏢 Investissements locatifs
  investissement_locatif_credits: number;
  investissement_locatif_charges: number;
  // 🧾 Impôts
  impots: number;
  // Autres
  autres: number;
}

export interface EpargnePrecautionSimulation {
  id?: string;
  user_id?: string;
  nom_simulation: string;
  
  // Charges détaillées (optional for backward compatibility)
  charges_loyer_credit?: number;
  charges_copropriete_taxes?: number;
  charges_energie?: number;
  charges_assurance_habitation?: number;
  charges_transport_commun?: number;
  charges_assurance_auto?: number;
  charges_lld_loa_auto?: number;
  charges_internet?: number;
  charges_mobile?: number;
  charges_abonnements?: number;
  charges_frais_scolarite?: number;
  charges_autres?: number;
  
  // Total charges (calculé)
  charges_fixes_mensuelles: number;
  
  // Épargne
  epargne_actuelle: number;
  capacite_epargne_mensuelle: number;
  
  // Paramètres utilisateur
  niveau_securite: NiveauSecurite;
  nb_mois_securite: number;
  type_contrat?: TypeContrat;
  type_metier?: string; // Legacy field
  coefficient_contrat?: number;
  coefficient_metier?: number; // Legacy field
  
  // Legacy fields
  revenu_mensuel?: number;
  nombre_personnes?: number;
  
  // Résultats calculés
  depenses_mensuelles: number;
  epargne_recommandee: number;
  epargne_manquante: number;
  temps_pour_objectif: number | null;
  epargne_mensuelle_optimale: number | null;
  indice_resilience: number;
  
  // Message et CTA affichés
  message_personnalise?: string;
  cta_affiche?: string;
  
  created_at?: string;
  updated_at?: string;
}

export interface SimulationInputs {
  charges_detaillees: ChargesDetailees;
  epargne_actuelle: number;
  niveau_securite: NiveauSecurite;
  capacite_epargne_mensuelle: number;
  type_contrat: TypeContrat;
}

export interface SimulationResults {
  nb_mois_securite: number;
  coefficient_contrat: number;
  depenses_mensuelles: number;
  epargne_recommandee: number;
  epargne_manquante: number;
  temps_pour_objectif: number | null;
  epargne_mensuelle_optimale: number | null;
  indice_resilience: number;
  message_personnalise: string;
  cta_condition: string;
}

export const NIVEAU_SECURITE_MOIS: Record<NiveauSecurite, number> = {
  minimum: 2,
  confortable: 4,
  optimal: 6,
};

export const COEFFICIENT_CONTRAT: Record<TypeContrat, number> = {
  cdi: 1.0,
  cdd: 1.3,
  independant: 1.5,
};

export const TYPE_CONTRAT_LABELS: Record<TypeContrat, string> = {
  cdi: 'CDI',
  cdd: 'CDD',
  independant: 'Indépendant / Freelance',
};

export const CHARGES_CATEGORIES = {
  logement: {
    icon: '🏠',
    label: 'Charges mensuelles Logement et Énergie',
    fields: [
      { key: 'loyer', label: 'Loyer charges comprises (locataire)', placeholder: 'Ex: 1 200', group: 'locataire' },
      { key: 'credit_immobilier', label: 'Mensualité crédit immobilier (propriétaire)', placeholder: 'Ex: 1 500', group: 'proprietaire' },
      { key: 'copropriete_taxes', label: 'Charges de copropriété / taxes foncières', placeholder: 'Ex: 150', group: 'proprietaire' },
      { key: 'energie', label: 'Électricité, gaz, eau', placeholder: 'Ex: 120' },
      { key: 'assurance_habitation', label: 'Assurance habitation', placeholder: 'Ex: 30' },
    ],
  },
  transport: {
    icon: '🚗',
    label: 'Charges mensuelles Transports et Mobilité',
    fields: [
      { key: 'transport_commun', label: 'Abonnement transports en commun', placeholder: 'Ex: 84' },
      { key: 'assurance_auto', label: 'Assurance automobile', placeholder: 'Ex: 60' },
      { key: 'lld_loa_auto', label: 'LLD/LOA ou crédit auto', placeholder: 'Ex: 350' },
    ],
  },
  communication: {
    icon: '📱',
    label: 'Charges mensuelles Communication et Services',
    fields: [
      { key: 'internet', label: 'Abonnement Internet (Box)', placeholder: 'Ex: 35' },
      { key: 'mobile', label: 'Forfait mobile', placeholder: 'Ex: 20' },
      { key: 'abonnements', label: 'Streaming, sport, presse', placeholder: 'Ex: 50' },
    ],
  },
  famille: {
    icon: '👨‍👩‍👧',
    label: 'Charges mensuelles Famille',
    fields: [
      { key: 'frais_scolarite', label: 'Frais de scolarité, crèche, garde d\'enfants', placeholder: 'Ex: 200' },
      { key: 'pension_alimentaire', label: 'Pension alimentaire', placeholder: 'Ex: 0' },
    ],
  },
  credit: {
    icon: '💰',
    label: 'Crédit consommation',
    fields: [
      { key: 'credit_consommation', label: 'Mensualité crédit consommation', placeholder: 'Ex: 200' },
    ],
  },
  investissement_locatif: {
    icon: '🏢',
    label: 'Investissements locatifs',
    fields: [
      { key: 'investissement_locatif_credits', label: 'Crédits immobiliers locatifs (mensualités)', placeholder: 'Ex: 800' },
      { key: 'investissement_locatif_charges', label: 'Charges d\'exploitation (copro, taxes, assurance...)', placeholder: 'Ex: 200' },
    ],
  },
  impots: {
    icon: '🧾',
    label: 'Impôts',
    fields: [
      { key: 'impots', label: 'Impôt sur le revenu (mensuel)', placeholder: 'Ex: 500' },
    ],
  },
  autres: {
    icon: '💳',
    label: 'Autres charges mensuelles',
    fields: [
      { key: 'autres', label: 'Autres charges fixes (mutuelle, prévoyance...)', placeholder: 'Ex: 100' },
    ],
  },
} as const;

export const getEmptyChargesDetailees = (): ChargesDetailees => ({
  loyer: 0,
  credit_immobilier: 0,
  copropriete_taxes: 0,
  energie: 0,
  assurance_habitation: 0,
  transport_commun: 0,
  assurance_auto: 0,
  lld_loa_auto: 0,
  internet: 0,
  mobile: 0,
  abonnements: 0,
  frais_scolarite: 0,
  pension_alimentaire: 0,
  credit_consommation: 0,
  autres: 0,
});

export const calculateTotalCharges = (charges: ChargesDetailees): number => {
  return Object.values(charges).reduce((sum, val) => sum + (val || 0), 0);
};
