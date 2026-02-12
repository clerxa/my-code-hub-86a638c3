export interface TaxDeclarationRequest {
  id: string;
  user_id: string;
  company_id: string;
  
  // Étape 1: Informations générales
  entreprise: string;
  intitule_poste: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  is_perlib_client: boolean;
  conseiller_dedie?: string;
  
  // Étape 2: Situation fiscale
  situation_maritale?: string;
  nombre_enfants: number;
  revenu_imposable_precedent?: number;
  tmi?: string;
  
  // Étape 3: Revenus 2025
  revenus_types: string[];
  
  // Étape 4: Optimisation
  optimisation_types: string[];
  
  // Étape 5: Intervenants
  expertise_avocat: string[];
  delegation_complete: boolean;
  
  // Étape 6: Documents & RDV
  avis_imposition_url?: string;
  autres_justificatifs_urls: string[];
  type_rdv?: string;
  commentaires?: string;
  
  // Metadata
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface TaxDeclarationFormData {
  // Étape 1
  entreprise: string;
  intitule_poste: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  is_perlib_client: boolean;
  conseiller_dedie: string;
  
  // Étape 2
  situation_maritale: string;
  nombre_enfants: number;
  revenu_imposable_precedent: number;
  tmi: string;
  
  // Pre-fill tracking
  prefilled_from_profile: {
    situation_maritale?: boolean;
    nombre_enfants?: boolean;
    revenu_imposable_precedent?: boolean;
    tmi_auto_calculated?: boolean;
  };
  
  // Étape 3
  revenus_types: string[];
  
  // Étape 4
  optimisation_types: string[];
  optimisation_autres: string[];
  
  // Étape 5
  expertise_avocat: string[];
  delegation_complete: boolean;
  
  // Étape 6
  avis_imposition_url: string;
  autres_justificatifs_urls: string[];
  type_rdv: string;
  commentaires: string;
}

export interface TaxPermanenceOption {
  id: string;
  label: string;
  enabled: boolean;
  booking_url?: string | null;
  dates?: string[];
}

export interface TaxPermanenceConfig {
  options: TaxPermanenceOption[];
  post_submission_message?: string | null;
}

export const SITUATION_MARITALE_OPTIONS = [
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'marie', label: 'Marié(e)' },
  { value: 'pacse', label: 'Pacsé(e)' },
  { value: 'divorce', label: 'Divorcé(e)' },
  { value: 'veuf', label: 'Veuf/Veuve' },
];

export const TMI_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '11', label: '11%' },
  { value: '30', label: '30%' },
  { value: '41', label: '41%' },
  { value: '45', label: '45%' },
];

export const REVENUS_ACTIVITE = [
  { id: 'salaires', label: 'Salaires & traitements' },
  { id: 'independants', label: 'Revenus des indépendants' },
];

export const REVENUS_CAPITAL = [
  { id: 'location_nue', label: 'Location nue' },
  { id: 'location_meublee', label: 'Location meublée' },
  { id: 'dividendes', label: 'Dividendes' },
  { id: 'assurance_vie', label: 'Assurance vie' },
  { id: 'scpi_opci', label: 'SCPI/OPCI' },
  { id: 'pinel', label: 'Investissements Pinel' },
];

export const REVENUS_PLUS_VALUES = [
  { id: 'pv_immobilieres', label: 'Plus-values immobilières' },
  { id: 'pv_mobilieres', label: 'Plus-values mobilières (actions)' },
];

export const OPTIMISATION_OPTIONS = [
  { id: 'per', label: 'Versements sur un PER' },
  { id: 'girardin', label: 'Girardin Industriel' },
  { id: 'groupements_forestiers', label: 'Groupements forestiers' },
  { id: 'malraux', label: 'Malraux' },
  { id: 'de_robien', label: 'de Robien' },
  { id: 'scellier', label: 'Scellier' },
  { id: 'duflot', label: 'Duflot' },
  { id: 'denormandie', label: 'Denormandie' },
];

export const EXPERTISE_AVOCAT_OPTIONS = [
  { id: 'revenus_etrangers', label: 'Revenus étrangers' },
  { id: 'regime_impatries', label: 'Régime des impatriés' },
  { id: 'pv_complexes', label: 'Plus-values complexes' },
  { id: 'stock_options_espp_rsu', label: 'Stock-options/ESPP/RSU' },
  { id: 'residence_fiscale', label: 'Résidence fiscale internationale' },
];

export const TYPE_RDV_OPTIONS = [
  { value: 'visio', label: 'Visio' },
  { value: 'bureaux_perlib', label: 'Bureaux Perlib' },
  { value: 'bureaux_societe', label: 'Bureaux de la société' },
];
