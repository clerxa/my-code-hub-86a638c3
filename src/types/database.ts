// Types personnalisés pour les tables manquantes dans les types auto-générés
export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  referral_typeform_url: string | null;
  simulators_config: any[] | null;
  expert_booking_url: string | null;
  expert_booking_hubspot_embed: string | null;
  documents_resources: any[] | null;
  webinar_replays: any[] | null;
  email_domains: string[] | null;
  partnership_type: string | null;
  company_size: number | null;
  employee_locations: string[] | null;
  has_foreign_employees: boolean | null;
  work_mode: string | null;
  compensation_devices: any | null;
  hr_challenges: any | null;
  internal_initiatives: any | null;
  internal_communications: any | null;
  created_at: string;
  rang: number | null;
  enable_points_ranking: boolean;
}

export interface CompanyModule {
  id: string;
  company_id: string;
  module_id: number;
  is_active: boolean;
  custom_order: number | null;
  created_at: string;
}

/**
 * Type unifié pour le profil utilisateur
 * Remplace tous les autres types Profile de l'application
 */
export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_id: string | null;
  total_points: number;
  completed_modules: number[];
  current_module: number | null;
  created_at: string;
  phone_number: string | null;
  birth_date: string | null;
  net_taxable_income: number | null;
  marital_status: string | null;
  children_count: number | null;
  avatar_url: string | null;
  job_title: string | null;
  last_login: string | null;
  current_session_start: string | null;
}

/**
 * @deprecated Utiliser UserProfile à la place
 */
export type ProfileWithCompanyId = UserProfile;

export interface Parcours {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface ParcoursCompany {
  id: string;
  parcours_id: string;
  company_id: string;
  created_at: string;
}

export interface ParcoursModule {
  id: string;
  parcours_id: string;
  module_id: number;
  order_num: number;
  created_at: string;
}
