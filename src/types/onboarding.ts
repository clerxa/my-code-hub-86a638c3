export interface CompanyContact {
  nom: string;
  email: string;
  telephone: string;
  role_contact: string;
}

export interface OnboardingData {
  // Étape 1 - Informations générales et contexte
  nomEntreprise: string;
  domaineEmail: string;
  effectif: number;
  partnershipType?: string;
  partnershipTypeOther?: string;
  selectedPlan?: 'origin' | 'hero' | 'legend';
  workMode?: string;
  employeeLocations?: string[];
  hasForeignEmployees?: boolean;
  
  // Étape 2 - Contacts
  contacts: CompanyContact[];
  
  // Étape 3 - Branding
  logo: string | File | null;
  primaryColor?: string;
  
  // Étape 4 - Dispositifs de rémunération
  dispositifsRemuneration: string[];
  compensationDevicesDetails?: {
    employees_ratio?: string;
    variable_compensation?: string;
  };
  
  // Étape 5 - Maturité financière et défis RH
  niveauMaturiteFinanciere: 'faible' | 'moyen' | 'eleve' | '';
  hrChallenges?: {
    salary_frustrations?: string;
    financial_anxiety?: boolean;
    understanding_gaps?: boolean;
    tax_optimization_interest?: boolean;
    recurring_declaration_errors?: boolean;
  };
  
  // Étape 6 - Communication et initiatives internes
  canauxCommunication: string[];
  canalCommunicationAutre?: string;
  internalInitiatives?: {
    financial_education_service?: boolean;
    internal_webinars?: boolean;
    pee_perco_rsu_program?: boolean;
    satisfaction_level?: string;
    missing_elements?: string;
  };
  communicationDetails?: {
    employee_engagement_level?: string;
    communication_capacity?: string;
  };
}

export const DISPOSITIFS_OPTIONS = [
  { value: 'RSU', label: 'RSU', icon: 'TrendingUp' },
  { value: 'ESPP', label: 'ESPP', icon: 'Percent' },
  { value: 'PERO', label: 'PERO', icon: 'PiggyBank' },
  { value: 'PEE', label: 'PEE', icon: 'Wallet' },
  { value: 'PERCO', label: 'PERCO', icon: 'Building2' },
  { value: 'BSPCE', label: 'BSPCE', icon: 'Rocket' },
  { value: 'StockOptions', label: 'Stock Options', icon: 'Sparkles' },
  { value: 'Aucun', label: 'Aucun', icon: 'X' }
];

export const CANAUX_OPTIONS = [
  { value: 'slack', label: 'Slack', icon: 'Hash' },
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'teams', label: 'Teams', icon: 'Users' },
  { value: 'intranet', label: 'Intranet', icon: 'Globe' },
  { value: 'autre', label: 'Autre', icon: 'Plus' }
];

export const PARTNERSHIP_ENTITY_OPTIONS = [
  { value: 'cse', label: 'CSE' },
  { value: 'departement_rh', label: 'Département RH' },
  { value: 'departement_communication', label: 'Département Communication' },
  { value: 'departement_rse', label: 'Département RSE' },
  { value: 'departement_financier', label: 'Département Financier' },
  { value: 'direction_generale', label: 'Direction Générale' },
  { value: 'autre', label: 'Autre' },
  { value: 'aucun', label: 'Aucun' }
];

// Alias pour rétrocompatibilité
export const PARTNERSHIP_OPTIONS = PARTNERSHIP_ENTITY_OPTIONS;

export const WORK_MODE_OPTIONS = [
  { value: 'presentiel', label: 'Présentiel' },
  { value: 'hybride', label: 'Hybride' },
  { value: 'remote', label: 'Full Remote' }
];

export const LOCATION_OPTIONS = [
  'France',
  'Europe',
  'Amérique du Nord',
  'Amérique du Sud',
  'Asie',
  'Afrique',
  'Océanie'
];
