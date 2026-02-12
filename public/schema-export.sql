-- ============================================================
-- SCRIPT SQL COMPLET - Migration Base de Données FinCare
-- Généré le 2026-02-12
-- ============================================================

-- ============================================================
-- 1. TYPES PERSONNALISÉS (ENUMS)
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'contact_entreprise', 'user');

-- ============================================================
-- 2. TABLES
-- ============================================================

CREATE TABLE public.advisors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  bio text,
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.certifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.advisor_certifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  advisor_id uuid NOT NULL REFERENCES public.advisors(id) ON DELETE CASCADE,
  certification_id uuid NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (advisor_id, certification_id)
);

CREATE TABLE public.advisor_ranks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  advisor_id uuid NOT NULL REFERENCES public.advisors(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (advisor_id, rank)
);

CREATE SEQUENCE IF NOT EXISTS modules_id_seq;

CREATE TABLE public.modules (
  id integer NOT NULL DEFAULT nextval('modules_id_seq'::regclass),
  order_num integer NOT NULL,
  title text NOT NULL,
  type text NOT NULL,
  description text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  content_url text,
  duration text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  webinar_date timestamp with time zone,
  webinar_registration_url text,
  webinar_image_url text,
  quiz_questions jsonb DEFAULT '[]'::jsonb,
  appointment_calendar_url text,
  content_type text,
  embed_code text,
  content_data jsonb DEFAULT '{}'::jsonb,
  pedagogical_objectives text[],
  estimated_time integer,
  difficulty_level integer DEFAULT 1,
  key_takeaways text[],
  theme text[],
  points_registration integer DEFAULT 50,
  points_participation integer DEFAULT 100,
  livestorm_session_id text,
  is_optional boolean DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE public.appointment_forms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  fillout_form_id text NOT NULL,
  fillout_form_url text NOT NULL,
  module_id integer REFERENCES public.modules(id),
  points_awarded integer DEFAULT 0,
  is_active boolean DEFAULT true,
  icon text DEFAULT 'calendar'::text,
  color text DEFAULT 'primary'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.appointment_preparation (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objectives text[] DEFAULT '{}'::text[],
  intention_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id)
);

CREATE TABLE public.appointment_preparation_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#3b82f6'::text,
  secondary_color text DEFAULT '#8b5cf6'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  referral_typeform_url text,
  simulators_config jsonb DEFAULT '[]'::jsonb,
  expert_booking_url text,
  documents_resources jsonb DEFAULT '[]'::jsonb,
  webinar_replays jsonb DEFAULT '[]'::jsonb,
  email_domains text[],
  partnership_type text,
  company_size integer,
  employee_locations text[],
  has_foreign_employees boolean DEFAULT false,
  work_mode text,
  compensation_devices jsonb DEFAULT '{}'::jsonb,
  hr_challenges jsonb DEFAULT '{}'::jsonb,
  internal_initiatives jsonb DEFAULT '{}'::jsonb,
  internal_communications jsonb DEFAULT '{}'::jsonb,
  expert_booking_hubspot_embed text,
  niveau_maturite_financiere text,
  canal_communication_autre text,
  cover_url text,
  rang integer,
  enable_points_ranking boolean NOT NULL DEFAULT false,
  banner_url text,
  forum_access_all_discussions boolean DEFAULT false,
  tax_declaration_help_enabled boolean DEFAULT false,
  tax_permanence_config jsonb DEFAULT '{"options": [{"id": "visio", "label": "En visio", "enabled": true, "booking_url": null}, {"id": "bureaux_perlib", "label": "Dans les bureaux de Perlib", "enabled": true, "booking_url": null}, {"id": "bureaux_entreprise", "dates": [], "label": "Dans les locaux de l''entreprise", "enabled": false, "booking_url": null}], "post_submission_message": null}'::jsonb,
  max_tax_declarations integer DEFAULT 100,
  PRIMARY KEY (id)
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  first_name text,
  last_name text,
  email text NOT NULL,
  total_points integer NOT NULL DEFAULT 0,
  completed_modules integer[] NOT NULL DEFAULT '{}'::integer[],
  current_module integer DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  company_id uuid REFERENCES public.companies(id),
  phone_number text,
  birth_date date,
  net_taxable_income numeric,
  marital_status text,
  children_count integer DEFAULT 0,
  avatar_url text,
  job_title text,
  last_login timestamp with time zone,
  current_session_start timestamp with time zone,
  a_pris_rdv boolean DEFAULT false,
  a_invite_collegue boolean DEFAULT false,
  household_taxable_income numeric,
  theme_preference text NOT NULL DEFAULT 'villains'::text,
  employee_onboarding_completed boolean DEFAULT false,
  deleted_at timestamp with time zone,
  is_active boolean DEFAULT true,
  objectives text[] DEFAULT '{}'::text[],
  forum_anonymous_mode boolean DEFAULT false,
  forum_pseudo text,
  forum_avatar_url text,
  forum_posts_count integer DEFAULT 0,
  forum_comments_count integer DEFAULT 0,
  forum_contribution_score integer DEFAULT 0,
  beta_disclaimer_accepted_at timestamp with time zone,
  personal_email text,
  receive_on_personal_email boolean DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  form_id uuid REFERENCES public.appointment_forms(id),
  fillout_submission_id text,
  user_email text NOT NULL,
  user_full_name text,
  user_phone text,
  scheduled_with_email text,
  scheduled_with_name text,
  event_start_time timestamp with time zone NOT NULL,
  event_end_time timestamp with time zone NOT NULL,
  timezone text DEFAULT 'Europe/Paris'::text,
  event_url text,
  reschedule_url text,
  status text DEFAULT 'scheduled'::text,
  extra_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.block_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  page_name text NOT NULL,
  block_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  layout_config jsonb DEFAULT '{"columns": 1}'::jsonb,
  PRIMARY KEY (id),
  UNIQUE (page_name)
);

CREATE TABLE public.hubspot_appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hubspot_meeting_id text,
  hubspot_contact_id text,
  user_id uuid,
  user_email text NOT NULL,
  user_name text,
  meeting_title text,
  meeting_start_time timestamp with time zone,
  meeting_end_time timestamp with time zone,
  meeting_link text,
  booking_source text,
  company_id uuid,
  raw_payload jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  host_name text,
  referrer_path text,
  referrer_label text,
  PRIMARY KEY (id)
);

CREATE TABLE public.booking_referrers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  referrer_path text NOT NULL,
  referrer_label text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  matched_at timestamp with time zone,
  appointment_id uuid REFERENCES public.hubspot_appointments(id) ON DELETE SET NULL,
  PRIMARY KEY (id)
);

CREATE TABLE public.capacite_emprunt_simulations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nom_simulation text NOT NULL,
  salaires numeric NOT NULL DEFAULT 0,
  revenus_locatifs numeric NOT NULL DEFAULT 0,
  revenus_capital numeric NOT NULL DEFAULT 0,
  allocations_chomage numeric NOT NULL DEFAULT 0,
  indemnites_maladie numeric NOT NULL DEFAULT 0,
  autres_revenus numeric NOT NULL DEFAULT 0,
  revenu_mensuel_net numeric NOT NULL DEFAULT 0,
  credit_immo numeric NOT NULL DEFAULT 0,
  credit_conso numeric NOT NULL DEFAULT 0,
  credit_auto numeric NOT NULL DEFAULT 0,
  pensions_alimentaires numeric NOT NULL DEFAULT 0,
  autres_charges numeric NOT NULL DEFAULT 0,
  charges_fixes numeric NOT NULL DEFAULT 0,
  loyer_actuel numeric NOT NULL DEFAULT 0,
  apport_personnel numeric NOT NULL DEFAULT 0,
  duree_annees integer NOT NULL DEFAULT 20,
  taux_interet numeric NOT NULL DEFAULT 3.5,
  taux_assurance numeric NOT NULL DEFAULT 0.34,
  frais_notaire numeric NOT NULL DEFAULT 8,
  mensualite_maximale numeric,
  capacite_emprunt numeric,
  montant_projet_max numeric,
  taux_endettement_actuel numeric,
  taux_utilisation_capacite numeric,
  taux_endettement_futur numeric,
  reste_a_vivre numeric,
  reste_a_vivre_futur numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.celebration_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  video_url text DEFAULT '/finbear_success.mp4'::text,
  video_enabled boolean DEFAULT true,
  title text DEFAULT 'Félicitations ! 🎉'::text,
  subtitle text DEFAULT 'Tu as terminé le parcours'::text,
  motivational_message text DEFAULT 'Continue sur ta lancée ! Chaque parcours complété te rapproche de la maîtrise de tes finances. 💪'::text,
  button_text text DEFAULT 'Découvrir d''autres parcours'::text,
  button_url text DEFAULT '/parcours'::text,
  show_confetti boolean DEFAULT true,
  show_points boolean DEFAULT true,
  gradient_start text DEFAULT '217 91% 60%'::text,
  gradient_middle text DEFAULT '271 81% 56%'::text,
  gradient_end text DEFAULT '38 92% 50%'::text,
  PRIMARY KEY (id)
);

CREATE TABLE public.colleague_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inviter_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  colleague_first_name text NOT NULL,
  colleague_last_name text NOT NULL,
  colleague_email text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  colleague_phone text,
  invitation_token uuid DEFAULT gen_random_uuid(),
  email_sent_at timestamp with time zone,
  email_opened_at timestamp with time zone,
  link_clicked_at timestamp with time zone,
  registered_at timestamp with time zone,
  registered_user_id uuid REFERENCES public.profiles(id),
  PRIMARY KEY (id)
);

CREATE TABLE public.communication_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  communication_type character varying NOT NULL,
  deadline character varying NOT NULL,
  template_content text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (communication_type, deadline)
);

CREATE TABLE public.company_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  nom text NOT NULL,
  email text NOT NULL,
  telephone text,
  role_contact text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  photo_url text,
  is_forum_moderator boolean DEFAULT true,
  PRIMARY KEY (id)
);

CREATE TABLE public.company_faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'general'::text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.company_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  module_id integer NOT NULL REFERENCES public.modules(id),
  is_active boolean NOT NULL DEFAULT true,
  custom_order integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.company_onboarding (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id),
  etape_actuelle integer NOT NULL DEFAULT 1,
  onboarding_termine boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.company_transfers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  from_company_id uuid REFERENCES public.companies(id),
  to_company_id uuid NOT NULL REFERENCES public.companies(id),
  transferred_by uuid NOT NULL,
  transfer_options jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.company_visual_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  category text DEFAULT 'general'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.company_webinars (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  module_id integer NOT NULL REFERENCES public.modules(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_type text NOT NULL,
  recipient_id uuid,
  company_id uuid REFERENCES public.companies(id),
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.csat_beta_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  question_type text NOT NULL,
  options jsonb,
  is_active boolean NOT NULL DEFAULT true,
  priority_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.csat_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  content_id text NOT NULL,
  content_type text NOT NULL,
  content_name text NOT NULL,
  parcours_id uuid,
  user_level text,
  content_quality_score integer,
  experience_score integer,
  visual_score integer,
  relevance_score integer,
  information_level text,
  beta_responses jsonb DEFAULT '[]'::jsonb,
  improvement_feedback text,
  positive_feedback text,
  expert_intent text,
  completion_status text NOT NULL DEFAULT 'completed'::text,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.csat_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  csat_enabled boolean NOT NULL DEFAULT true,
  enabled_for_modules boolean NOT NULL DEFAULT true,
  enabled_for_simulators boolean NOT NULL DEFAULT true,
  enabled_for_parcours boolean NOT NULL DEFAULT true,
  enabled_for_onboarding boolean NOT NULL DEFAULT true,
  enabled_for_financial_profile boolean NOT NULL DEFAULT true,
  beta_questions_count integer NOT NULL DEFAULT 2,
  expert_intent_enabled boolean NOT NULL DEFAULT true,
  disabled_module_ids integer[] DEFAULT '{}'::integer[],
  alert_low_score_threshold numeric DEFAULT 3.0,
  alert_complex_percentage numeric DEFAULT 30.0,
  alert_unclear_next_step_percentage numeric DEFAULT 30.0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.daily_logins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  login_date date NOT NULL DEFAULT CURRENT_DATE,
  points_awarded boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.epargne_precaution_simulations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nom_simulation text NOT NULL,
  revenu_mensuel numeric NOT NULL,
  nombre_personnes integer NOT NULL DEFAULT 1,
  charges_fixes_mensuelles numeric NOT NULL,
  epargne_actuelle numeric NOT NULL,
  niveau_securite text NOT NULL,
  nb_mois_securite integer NOT NULL,
  capacite_epargne_mensuelle numeric NOT NULL,
  type_metier text NOT NULL,
  coefficient_metier numeric NOT NULL,
  depenses_mensuelles numeric NOT NULL,
  epargne_recommandee numeric NOT NULL,
  epargne_manquante numeric NOT NULL,
  temps_pour_objectif numeric,
  epargne_mensuelle_optimale numeric,
  indice_resilience integer NOT NULL,
  message_personnalise text,
  cta_affiche text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  charges_loyer_credit numeric DEFAULT 0,
  charges_copropriete_taxes numeric DEFAULT 0,
  charges_energie numeric DEFAULT 0,
  charges_assurance_habitation numeric DEFAULT 0,
  charges_transport_commun numeric DEFAULT 0,
  charges_assurance_auto numeric DEFAULT 0,
  charges_lld_loa_auto numeric DEFAULT 0,
  charges_internet numeric DEFAULT 0,
  charges_mobile numeric DEFAULT 0,
  charges_abonnements numeric DEFAULT 0,
  charges_frais_scolarite numeric DEFAULT 0,
  charges_autres numeric DEFAULT 0,
  type_contrat text DEFAULT 'cdi'::text,
  PRIMARY KEY (id)
);

CREATE TABLE public.espp_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nom_plan text NOT NULL,
  entreprise text NOT NULL,
  devise_plan text DEFAULT 'USD'::text,
  date_debut date NOT NULL,
  date_fin date NOT NULL,
  lookback boolean DEFAULT true,
  discount_pct numeric DEFAULT 15.00,
  fmv_debut numeric NOT NULL,
  fmv_fin numeric NOT NULL,
  montant_investi numeric NOT NULL,
  taux_change_payroll numeric NOT NULL,
  broker text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.espp_lots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.espp_plans(id) ON DELETE CASCADE,
  date_acquisition date NOT NULL,
  quantite_achetee_brut numeric NOT NULL,
  prix_achat_unitaire_devise numeric NOT NULL,
  fmv_retenu_plan numeric NOT NULL,
  gain_acquisition_par_action numeric NOT NULL,
  gain_acquisition_total_devise numeric NOT NULL,
  gain_acquisition_total_eur numeric NOT NULL,
  pru_fiscal_eur numeric NOT NULL,
  frais_achat numeric DEFAULT 0,
  broker_transaction_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.evaluation_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key_name text NOT NULL,
  label text NOT NULL,
  category text NOT NULL,
  source_type text NOT NULL,
  source_table text,
  source_column text,
  value_type text NOT NULL DEFAULT 'number'::text,
  unit text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.evaluation_keys_registry (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL,
  label text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'string'::text,
  unit text,
  source text NOT NULL,
  category text NOT NULL,
  is_calculated boolean DEFAULT false,
  formula text,
  is_auto_generated boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.expert_booking_landing_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hero_title text DEFAULT 'Prenez rendez-vous avec un expert'::text,
  hero_subtitle text DEFAULT 'Un accompagnement personnalisé pour optimiser vos finances'::text,
  hero_image_url text,
  benefits jsonb DEFAULT '[{"icon": "Target", "title": "Analyse personnalisée", "description": "Un expert analyse votre situation financière en détail"}, {"icon": "TrendingUp", "title": "Stratégies optimisées", "description": "Des recommandations adaptées à vos objectifs"}, {"icon": "Shield", "title": "Accompagnement sécurisé", "description": "Un suivi confidentiel et professionnel"}]'::jsonb,
  cta_text text DEFAULT 'Réserver mon créneau'::text,
  cta_secondary_text text DEFAULT 'Gratuit et sans engagement'::text,
  testimonial_enabled boolean DEFAULT false,
  testimonial_text text,
  testimonial_author text,
  testimonial_role text,
  footer_text text DEFAULT 'Nos experts sont disponibles du lundi au vendredi, de 9h à 18h.'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  gallery_images jsonb DEFAULT '[]'::jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE public.features (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom_fonctionnalite text NOT NULL,
  categorie text NOT NULL,
  description text,
  cle_technique text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  requires_partnership boolean DEFAULT true,
  PRIMARY KEY (id)
);

CREATE TABLE public.final_boss_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text NOT NULL DEFAULT 'DOMINIUS COMPLEXUS'::text,
  description text DEFAULT 'Le boss final à vaincre'::text,
  image_url text DEFAULT '/villains/dominius-complexus.png'::text,
  theme_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.financial_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  tagline text,
  description text,
  tags text[] DEFAULT '{}'::text[],
  category text,
  availability text,
  availability_icon text DEFAULT 'Clock'::text,
  risk_level integer DEFAULT 1,
  risk_label text,
  max_amount text,
  max_amount_label text DEFAULT 'Plafond'::text,
  target_return text,
  target_return_label text DEFAULT 'Rendement cible'::text,
  benefits jsonb DEFAULT '[]'::jsonb,
  fiscal_comparison_enabled boolean DEFAULT true,
  fiscal_before_label text DEFAULT 'Sans ce produit'::text,
  fiscal_before_value text,
  fiscal_after_label text DEFAULT 'Avec ce produit'::text,
  fiscal_after_value text,
  fiscal_savings_label text DEFAULT 'Économie'::text,
  fiscal_savings_value text,
  expert_tip_title text DEFAULT 'Conseil d''Expert'::text,
  expert_tip_content text,
  expert_tip_icon text DEFAULT 'Lightbulb'::text,
  cta_text text DEFAULT 'En savoir plus'::text,
  cta_url text,
  cta_secondary_text text,
  cta_secondary_url text,
  hero_image_url text,
  icon text DEFAULT 'Wallet'::text,
  gradient_start text DEFAULT '217 91% 60%'::text,
  gradient_end text DEFAULT '262 83% 58%'::text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.financial_profile_required_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  field_key text NOT NULL,
  field_label text NOT NULL,
  is_required boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.financial_profile_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hero_title text DEFAULT 'Votre Profil Financier'::text,
  hero_description text DEFAULT 'Complétez votre profil financier pour une expérience personnalisée'::text,
  benefits json DEFAULT '[
    {"icon": "Calculator", "title": "Simulateurs pré-remplis", "description": "Gagnez du temps : vos informations sont automatiquement utilisées dans tous les simulateurs."},
    {"icon": "Clock", "title": "Préparation RDV optimisée", "description": "Vos données sont partagées avec nos conseillers pour des rendez-vous plus efficaces (sur demande uniquement)."},
    {"icon": "Target", "title": "Recommandations personnalisées", "description": "Recevez des conseils adaptés à votre situation financière réelle."},
    {"icon": "Shield", "title": "Données sécurisées", "description": "Vos informations sont chiffrées et ne sont jamais partagées sans votre accord."}
  ]'::json,
  cta_text text DEFAULT 'Compléter mon profil'::text,
  footer_note text DEFAULT 'Ces informations sont facultatives et peuvent être modifiées à tout moment.'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.footer_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_text text DEFAULT 'FinCare'::text,
  copyright_text text DEFAULT '© 2024 FinCare. Tous droits réservés.'::text,
  legal_mentions text,
  privacy_policy_url text,
  terms_url text,
  contact_email text,
  social_links jsonb DEFAULT '[]'::jsonb,
  show_powered_by boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6'::text,
  order_num integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_moderation_reasons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  label text NOT NULL,
  description text,
  order_num integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category_id uuid NOT NULL REFERENCES public.forum_categories(id),
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  tags text[] DEFAULT '{}'::text[],
  views_count integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  is_closed boolean DEFAULT false,
  has_best_answer boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_anonymous boolean DEFAULT false,
  display_pseudo text,
  display_avatar_url text,
  is_deleted boolean DEFAULT false,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  deletion_reason_id uuid REFERENCES public.forum_moderation_reasons(id),
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id),
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  content text NOT NULL,
  parent_comment_id uuid REFERENCES public.forum_comments(id),
  is_best_answer boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_anonymous boolean DEFAULT false,
  display_pseudo text,
  display_avatar_url text,
  is_deleted boolean DEFAULT false,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  deletion_reason_id uuid REFERENCES public.forum_moderation_reasons(id),
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.forum_comments(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_moderation_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  moderator_id uuid,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason_id uuid REFERENCES public.forum_moderation_reasons(id),
  custom_reason text,
  action text NOT NULL DEFAULT 'delete'::text,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_post_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.global_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  label text NOT NULL,
  description text,
  value_type text NOT NULL DEFAULT 'number'::text,
  validation_min numeric,
  validation_max numeric,
  year integer,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.lmnp_simulations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nom_simulation text NOT NULL,
  recettes numeric NOT NULL DEFAULT 0,
  interets_emprunt numeric NOT NULL DEFAULT 0,
  assurance_pno numeric NOT NULL DEFAULT 0,
  assurance_gli numeric NOT NULL DEFAULT 0,
  gestion_locative numeric NOT NULL DEFAULT 0,
  expert_comptable numeric NOT NULL DEFAULT 0,
  charges_copro numeric NOT NULL DEFAULT 0,
  taxe_fonciere numeric NOT NULL DEFAULT 0,
  cfe numeric NOT NULL DEFAULT 0,
  travaux_entretien numeric NOT NULL DEFAULT 0,
  petit_materiel numeric NOT NULL DEFAULT 0,
  frais_deplacement numeric NOT NULL DEFAULT 0,
  autre_charge numeric NOT NULL DEFAULT 0,
  total_charges numeric NOT NULL DEFAULT 0,
  valeur_bien numeric NOT NULL DEFAULT 0,
  duree_immo integer NOT NULL DEFAULT 30,
  valeur_mobilier numeric NOT NULL DEFAULT 0,
  duree_mobilier integer NOT NULL DEFAULT 7,
  tmi numeric NOT NULL DEFAULT 30,
  resultat_avant_amort numeric,
  amort_immo numeric,
  amort_mobilier numeric,
  amort_total numeric,
  resultat_fiscal_reel numeric,
  resultat_fiscal_micro numeric,
  ir_reel numeric,
  ps_reel numeric,
  ir_micro numeric,
  ps_micro numeric,
  fiscalite_totale_reel numeric,
  fiscalite_totale_micro numeric,
  meilleur_regime text,
  amort_non_deduits numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.module_validation_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_type text NOT NULL,
  video_min_watch_percentage integer DEFAULT 30,
  quiz_first_attempt_percentage integer DEFAULT 100,
  quiz_retry_percentage integer DEFAULT 50,
  webinar_registration_points integer DEFAULT 50,
  webinar_participation_points integer DEFAULT 100,
  allow_retry boolean DEFAULT true,
  max_retry_attempts integer DEFAULT 3,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.module_validations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id integer NOT NULL,
  attempted_at timestamp with time zone DEFAULT now(),
  success boolean NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.non_partner_welcome_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hero_icon text DEFAULT 'Building2'::text,
  hero_title text DEFAULT 'Bienvenue chez {companyName} !'::text,
  hero_description text DEFAULT 'Votre entreprise n''a pas encore accès à l''offre complète FinCare'::text,
  benefits_title text DEFAULT 'Pourquoi FinCare pour votre entreprise ?'::text,
  benefits jsonb DEFAULT '[{"title": "Éducation financière personnalisée", "description": "Modules adaptés pour maîtriser rémunération, épargne et fiscalité"}, {"title": "Réduction du stress financier", "description": "Des salariés plus sereins et engagés grâce à une meilleure compréhension"}, {"title": "Valorisation des avantages sociaux", "description": "Maximisez l''impact de vos dispositifs (RSU, ESPP, PEE, etc.)"}]'::jsonb,
  contacts_title text DEFAULT 'Qui contacter dans votre entreprise ?'::text,
  contacts jsonb DEFAULT '["Votre <strong>responsable RH</strong> ou <strong>DRH</strong>", "Le <strong>CSE</strong> (Comité Social et Économique)", "Le service <strong>Communication interne</strong>", "Votre <strong>direction</strong>"]'::jsonb,
  email_subject text DEFAULT 'Découvrez FinCare pour votre entreprise'::text,
  email_body text DEFAULT 'Bonjour,

Je souhaite vous faire découvrir FinCare, une solution innovante d''éducation financière pour les salariés.

FinCare aide les collaborateurs à mieux comprendre leur rémunération, optimiser leur fiscalité et prendre de meilleures décisions financières.

Cette solution pourrait être un excellent complément à nos avantages sociaux actuels.

Pourriez-vous étudier cette opportunité pour {companyName} ?

Plus d''informations : https://fincare.fr

Cordialement'::text,
  primary_button_text text DEFAULT 'Inviter mon entreprise à découvrir FinCare'::text,
  secondary_button_text text DEFAULT 'Continuer avec un accès limité'::text,
  footer_text text DEFAULT 'En attendant, vous pouvez explorer certaines fonctionnalités de FinCare'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  max_simulations integer DEFAULT 10,
  allowed_simulators text[] DEFAULT ARRAY['simulateur_pret_immobilier', 'simulateur_epargne_precaution', 'simulateur_impots', 'simulateur_espp', 'simulateur_interets_composes', 'optimisation_fiscale', 'simulateur_capacite_emprunt', 'simulateur_lmnp', 'simulateur_per'],
  quota_banner_label text DEFAULT 'Analyses gratuites'::text,
  PRIMARY KEY (id)
);

CREATE TABLE public.notification_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rule_id uuid,
  notification_id uuid,
  triggered_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.notification_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  rule_key text NOT NULL,
  trigger_condition text NOT NULL,
  threshold_value jsonb,
  display_type text NOT NULL,
  title_template text NOT NULL,
  message_template text NOT NULL,
  cta_text text,
  cta_url text,
  segmentation jsonb,
  frequency_limit text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  image_url text,
  url_action text,
  display_type text NOT NULL,
  trigger_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  button_text text DEFAULT 'Voir plus'::text,
  PRIMARY KEY (id)
);

CREATE TABLE public.offers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  cta_text text DEFAULT 'En savoir plus'::text,
  cta_url text,
  category text NOT NULL DEFAULT 'general'::text,
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  is_archived boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  PRIMARY KEY (id)
);

CREATE TABLE public.onboarding_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text NOT NULL,
  flow_id text NOT NULL DEFAULT 'tax-onboarding'::text,
  screen_id uuid,
  response_value jsonb,
  lead_rank integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.onboarding_scenes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ordre integer NOT NULL,
  image text NOT NULL,
  texte text NOT NULL,
  effet text NOT NULL DEFAULT 'fade-in'::text,
  statut boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.onboarding_screens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  flow_id text NOT NULL DEFAULT 'tax-onboarding'::text,
  order_num integer NOT NULL DEFAULT 0,
  type text NOT NULL,
  title text NOT NULL,
  subtitle text,
  options jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'draft'::text,
  next_step_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  workflow_position jsonb DEFAULT '{"x": 0, "y": 0}'::jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE public.optimisation_fiscale_simulations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nom_simulation text NOT NULL,
  revenu_imposable numeric NOT NULL,
  revenus_professionnels numeric NOT NULL,
  situation_familiale text NOT NULL,
  nb_enfants integer NOT NULL DEFAULT 0,
  tmi numeric NOT NULL,
  impot_avant numeric NOT NULL,
  montant_per numeric DEFAULT 0,
  plafond_per numeric DEFAULT 0,
  plafond_per_report_n1 numeric DEFAULT 0,
  plafond_per_report_n2 numeric DEFAULT 0,
  plafond_per_report_n3 numeric DEFAULT 0,
  plafond_per_total numeric DEFAULT 0,
  reduction_per numeric DEFAULT 0,
  plafond_per_utilise numeric DEFAULT 0,
  dons_75_montant numeric DEFAULT 0,
  reduction_dons_75 numeric DEFAULT 0,
  dons_66_montant numeric DEFAULT 0,
  reduction_dons_66 numeric DEFAULT 0,
  montant_aide_domicile numeric DEFAULT 0,
  reduction_aide_domicile numeric DEFAULT 0,
  montant_garde_enfant numeric DEFAULT 0,
  reduction_garde_enfant numeric DEFAULT 0,
  prix_pinel numeric DEFAULT 0,
  taux_pinel numeric DEFAULT 0,
  duree_pinel integer DEFAULT 0,
  reduction_pinel_annuelle numeric DEFAULT 0,
  prix_pinel_om numeric DEFAULT 0,
  taux_pinel_om numeric DEFAULT 0,
  duree_pinel_om integer DEFAULT 0,
  reduction_pinel_om_annuelle numeric DEFAULT 0,
  montant_girardin numeric DEFAULT 0,
  reduction_girardin numeric DEFAULT 0,
  montant_pme numeric DEFAULT 0,
  reduction_pme numeric DEFAULT 0,
  montant_esus numeric DEFAULT 0,
  reduction_esus numeric DEFAULT 0,
  dispositifs_selectionnes jsonb DEFAULT '[]'::jsonb,
  impot_apres numeric DEFAULT 0,
  economie_totale numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.parcours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_default boolean NOT NULL DEFAULT false,
  display_order integer DEFAULT 0,
  PRIMARY KEY (id)
);

CREATE TABLE public.parcours_companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parcours_id uuid NOT NULL REFERENCES public.parcours(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_pinned boolean DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE public.parcours_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parcours_id uuid NOT NULL REFERENCES public.parcours(id),
  module_id integer NOT NULL REFERENCES public.modules(id),
  order_num integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_optional boolean NOT NULL DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE public.partnership_contact_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  company text NOT NULL,
  email text NOT NULL,
  phone text,
  company_size text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.partnership_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid,
  contact_email text NOT NULL,
  contact_last_name text,
  contact_role text,
  message text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  sender_first_name text,
  sender_last_name text,
  sender_email text,
  contact_first_name text,
  PRIMARY KEY (id)
);

CREATE TABLE public.per_simulations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nom_simulation text NOT NULL,
  revenu_fiscal numeric NOT NULL,
  parts_fiscales numeric NOT NULL,
  age_actuel integer NOT NULL,
  age_retraite integer NOT NULL,
  tmi numeric NOT NULL,
  plafond_per_annuel numeric NOT NULL,
  plafond_per_reportable numeric NOT NULL DEFAULT 0,
  plafond_per_total numeric NOT NULL,
  versements_per numeric NOT NULL,
  impot_sans_per numeric NOT NULL,
  impot_avec_per numeric NOT NULL,
  economie_impots numeric NOT NULL,
  effort_reel numeric NOT NULL,
  optimisation_fiscale numeric NOT NULL,
  reduction_impots_max numeric NOT NULL,
  horizon_annees integer NOT NULL,
  taux_rendement numeric NOT NULL,
  capital_futur numeric NOT NULL,
  gain_financier numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.points_configuration (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.points_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  reference_id text,
  points_awarded integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.pret_immobilier_simulations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nom_simulation text NOT NULL,
  montant_projet numeric NOT NULL DEFAULT 0,
  apport_personnel numeric NOT NULL DEFAULT 0,
  duree_annees integer NOT NULL DEFAULT 20,
  taux_interet numeric NOT NULL DEFAULT 0,
  taux_assurance numeric NOT NULL DEFAULT 0,
  revenu_mensuel numeric,
  montant_emprunte numeric,
  mensualite_totale numeric,
  cout_total_interets numeric,
  cout_total_assurance numeric,
  cout_global_credit numeric,
  taux_endettement numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.recommendation_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_key text NOT NULL,
  rule_name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  condition_type text NOT NULL,
  condition_config jsonb DEFAULT '{}'::jsonb,
  title text NOT NULL,
  message text NOT NULL,
  icon text NOT NULL DEFAULT 'calendar'::text,
  cta_text text NOT NULL,
  cta_action_type text NOT NULL DEFAULT 'navigate'::text,
  cta_action_value text NOT NULL,
  display_priority text NOT NULL DEFAULT 'medium'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  internal_name text,
  PRIMARY KEY (id)
);

CREATE TABLE public.referral_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  company_id uuid NOT NULL,
  colleague_name text NOT NULL,
  colleague_email text NOT NULL,
  colleague_phone text,
  message text,
  expert_booking_url text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  company_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.risk_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL,
  choices jsonb,
  active boolean DEFAULT true,
  order_num integer,
  amf_weight numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.risk_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.risk_questions(id),
  answer_text text NOT NULL,
  score_value integer NOT NULL,
  order_num integer,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.risk_profile (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  total_weighted_score numeric NOT NULL,
  profile_type text NOT NULL,
  last_updated timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.risk_profile_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_active boolean DEFAULT true,
  mandatory_for_new_users boolean DEFAULT false,
  threshold_prudent integer DEFAULT 30,
  threshold_equilibre integer DEFAULT 55,
  threshold_dynamique integer DEFAULT 80,
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  category text NOT NULL,
  action text NOT NULL,
  can_access boolean NOT NULL DEFAULT false,
  can_modify boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.sell_to_cover (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lot_id uuid NOT NULL REFERENCES public.espp_lots(id),
  is_sell_to_cover boolean DEFAULT true,
  quantite_vendue numeric NOT NULL,
  prix_vente_devise numeric NOT NULL,
  date_sell_to_cover date NOT NULL,
  taux_change numeric NOT NULL,
  frais numeric DEFAULT 0,
  taxes_prelevees numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.sidebar_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sidebar_type text NOT NULL,
  menu_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.simulation_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text,
  simulator_type text NOT NULL,
  simulation_data jsonb NOT NULL,
  results_data jsonb NOT NULL,
  is_saved_to_history boolean DEFAULT false,
  cta_clicked text[],
  appointment_cta_clicked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.simulations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  name text,
  PRIMARY KEY (id)
);

CREATE TABLE public.simulations_impots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nom_simulation text NOT NULL,
  revenu_imposable numeric NOT NULL,
  statut_marital text NOT NULL,
  nombre_enfants integer NOT NULL DEFAULT 0,
  reductions_impot numeric DEFAULT 0,
  credits_impot numeric DEFAULT 0,
  parts numeric NOT NULL,
  quotient_familial numeric NOT NULL,
  impot_brut numeric NOT NULL,
  impot_net numeric NOT NULL,
  taux_moyen numeric NOT NULL,
  taux_marginal numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.simulator_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'calculator'::text,
  order_num integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.simulator_ctas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  simulator_type text NOT NULL,
  condition_key text NOT NULL,
  title text NOT NULL,
  description text,
  button_text text NOT NULL,
  button_color text,
  icon text,
  action_type text NOT NULL,
  action_value text NOT NULL,
  order_num integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  condition_operator text DEFAULT '='::text,
  condition_value jsonb DEFAULT 'null'::jsonb,
  internal_name text,
  PRIMARY KEY (id)
);

CREATE TABLE public.simulators (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.simulator_categories(id),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'calculator'::text,
  route text NOT NULL,
  feature_key text,
  duration_minutes integer DEFAULT 5,
  order_num integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  visibility_status text NOT NULL DEFAULT 'visible'::text,
  PRIMARY KEY (id)
);

CREATE TABLE public.tax_declaration_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  company_id uuid,
  entreprise text NOT NULL,
  intitule_poste text NOT NULL,
  nom text NOT NULL,
  prenom text NOT NULL,
  email text NOT NULL,
  telephone text,
  is_perlib_client boolean DEFAULT false,
  conseiller_dedie text,
  situation_maritale text,
  nombre_enfants integer DEFAULT 0,
  revenu_imposable_precedent numeric,
  tmi text,
  revenus_types jsonb DEFAULT '[]'::jsonb,
  optimisation_types jsonb DEFAULT '[]'::jsonb,
  expertise_avocat jsonb DEFAULT '[]'::jsonb,
  delegation_complete boolean DEFAULT false,
  avis_imposition_url text,
  autres_justificatifs_urls jsonb DEFAULT '[]'::jsonb,
  type_rdv text,
  commentaires text,
  status text DEFAULT 'pending'::text,
  submitted_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  optimisation_autres jsonb DEFAULT '[]'::jsonb,
  prefilled_from_profile jsonb DEFAULT '{}'::jsonb,
  modified_at timestamp with time zone,
  modification_count integer DEFAULT 0,
  perlib_contact_email text,
  PRIMARY KEY (id)
);

CREATE TABLE public.themes (
  id text NOT NULL,
  name text NOT NULL,
  label text NOT NULL,
  description text,
  labels jsonb NOT NULL DEFAULT '{"powerLabel": "Pouvoirs", "originLabel": "Histoire", "villainLabel": "Vilain", "weaknessLabel": "Faiblesses"}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  design_tokens jsonb NOT NULL DEFAULT '{"card": "220 12% 12%", "ring": "217 91% 60%", "input": "210 10% 20%", "muted": "220 10% 20%", "accent": "38 92% 50%", "border": "210 10% 20%", "primary": "217 91% 60%", "success": "145 60% 45%", "warning": "38 92% 50%", "secondary": "271 81% 56%", "background": "225 19% 8%", "foreground": "0 0% 98%", "destructive": "0 75% 55%", "card-foreground": "0 0% 98%", "muted-foreground": "217 91% 70%", "accent-foreground": "0 0% 100%", "primary-foreground": "0 0% 100%", "success-foreground": "0 0% 100%", "warning-foreground": "0 0% 100%", "secondary-foreground": "0 0% 100%", "destructive-foreground": "0 0% 100%"}'::jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE public.user_financial_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  age integer,
  situation_familiale text DEFAULT 'celibataire'::text,
  nb_enfants integer DEFAULT 0,
  nb_personnes_foyer integer DEFAULT 1,
  revenu_mensuel_net numeric DEFAULT 0,
  revenu_fiscal_annuel numeric DEFAULT 0,
  autres_revenus_mensuels numeric DEFAULT 0,
  revenus_locatifs numeric DEFAULT 0,
  charges_fixes_mensuelles numeric DEFAULT 0,
  loyer_actuel numeric DEFAULT 0,
  credits_immobilier numeric DEFAULT 0,
  credits_consommation numeric DEFAULT 0,
  credits_auto numeric DEFAULT 0,
  pensions_alimentaires numeric DEFAULT 0,
  epargne_actuelle numeric DEFAULT 0,
  apport_disponible numeric DEFAULT 0,
  capacite_epargne_mensuelle numeric DEFAULT 0,
  tmi numeric DEFAULT 30,
  parts_fiscales numeric DEFAULT 1,
  plafond_per_reportable numeric DEFAULT 0,
  type_contrat text DEFAULT 'cdi'::text,
  anciennete_annees integer DEFAULT 0,
  secteur_activite text,
  objectif_achat_immo boolean DEFAULT false,
  budget_achat_immo numeric,
  duree_emprunt_souhaitee integer DEFAULT 20,
  is_complete boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  date_naissance date,
  has_rsu_aga boolean DEFAULT false,
  has_espp boolean DEFAULT false,
  has_stock_options boolean DEFAULT false,
  has_bspce boolean DEFAULT false,
  has_pee boolean DEFAULT false,
  has_perco boolean DEFAULT false,
  projet_residence_principale boolean DEFAULT false,
  projet_residence_secondaire boolean DEFAULT false,
  projet_investissement_locatif boolean DEFAULT false,
  budget_residence_principale numeric,
  budget_residence_secondaire numeric,
  budget_investissement_locatif numeric,
  statut_residence text,
  epargne_livrets numeric DEFAULT 0,
  patrimoine_per numeric DEFAULT 0,
  patrimoine_assurance_vie numeric DEFAULT 0,
  patrimoine_scpi numeric DEFAULT 0,
  patrimoine_pea numeric DEFAULT 0,
  patrimoine_autres numeric DEFAULT 0,
  patrimoine_immo_valeur numeric DEFAULT 0,
  patrimoine_immo_credit_restant numeric DEFAULT 0,
  revenu_fiscal_foyer numeric DEFAULT 0,
  revenu_annuel_conjoint numeric DEFAULT 0,
  has_equity_income_this_year boolean DEFAULT false,
  equity_income_amount numeric DEFAULT 0,
  revenus_dividendes numeric DEFAULT 0,
  revenus_ventes_actions numeric DEFAULT 0,
  revenus_capital_autres numeric DEFAULT 0,
  financial_summary text,
  financial_summary_generated_at timestamp with time zone,
  charges_copropriete_taxes numeric DEFAULT 0,
  charges_energie numeric DEFAULT 0,
  charges_assurance_habitation numeric DEFAULT 0,
  charges_transport_commun numeric DEFAULT 0,
  charges_assurance_auto numeric DEFAULT 0,
  charges_lld_loa_auto numeric DEFAULT 0,
  charges_internet numeric DEFAULT 0,
  charges_mobile numeric DEFAULT 0,
  charges_abonnements numeric DEFAULT 0,
  charges_frais_scolarite numeric DEFAULT 0,
  charges_autres numeric DEFAULT 0,
  has_pero boolean DEFAULT false,
  has_epargne_autres boolean DEFAULT false,
  has_equity_autres boolean DEFAULT false,
  patrimoine_crypto numeric DEFAULT 0,
  patrimoine_private_equity numeric DEFAULT 0,
  valeur_rsu_aga numeric DEFAULT 0,
  valeur_espp numeric DEFAULT 0,
  valeur_stock_options numeric DEFAULT 0,
  valeur_bspce numeric DEFAULT 0,
  valeur_pee numeric DEFAULT 0,
  valeur_perco numeric DEFAULT 0,
  revenu_annuel_brut numeric DEFAULT 0,
  revenu_annuel_brut_conjoint numeric DEFAULT 0,
  PRIMARY KEY (id)
);

CREATE TABLE public.user_fiscal_profile (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  residence_fiscal text DEFAULT 'France'::text,
  tmi integer DEFAULT 30,
  mode_imposition_plus_value text DEFAULT 'PFU'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.user_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notification_id uuid NOT NULL,
  is_read boolean DEFAULT false,
  delivered_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.user_offer_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  last_viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.user_parcours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  parcours_id uuid NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  source text DEFAULT 'onboarding'::text,
  onboarding_session_id text,
  PRIMARY KEY (id),
  UNIQUE (user_id, parcours_id)
);

CREATE TABLE public.user_real_estate_properties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nom_bien text NOT NULL DEFAULT 'Bien immobilier'::text,
  valeur_estimee numeric NOT NULL DEFAULT 0,
  capital_restant_du numeric NOT NULL DEFAULT 0,
  mensualite_credit numeric NOT NULL DEFAULT 0,
  charges_mensuelles numeric NOT NULL DEFAULT 0,
  revenus_locatifs_mensuels numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.user_risk_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL,
  answer_id uuid NOT NULL,
  score_value integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id, role)
);

CREATE TABLE public.ventes_espp (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lot_id uuid NOT NULL REFERENCES public.espp_lots(id),
  quantite_vendue numeric NOT NULL,
  prix_vente_devise numeric NOT NULL,
  date_vente date NOT NULL,
  taux_change numeric NOT NULL,
  frais_vente numeric DEFAULT 0,
  devise text DEFAULT 'USD'::text,
  plus_value_brute_devise numeric,
  plus_value_eur numeric,
  impot_calcule numeric,
  prelevements_sociaux numeric,
  net_apres_impot numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.video_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id integer NOT NULL,
  watch_time_seconds integer NOT NULL DEFAULT 0,
  total_duration_seconds integer,
  percentage_watched numeric DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.villains (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  theme text NOT NULL,
  description text NOT NULL,
  score_a_battre integer NOT NULL DEFAULT 1000,
  image_url text NOT NULL,
  order_num integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  theme_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE public.webinar_external_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_id integer NOT NULL,
  livestorm_registrant_id text,
  email text NOT NULL,
  first_name text,
  last_name text,
  company_name text,
  registered_at timestamp with time zone,
  joined_at timestamp with time zone,
  completed_at timestamp with time zone,
  attendance_duration_seconds integer DEFAULT 0,
  registration_status text DEFAULT 'registered'::text,
  livestorm_session_id text,
  livestorm_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.webinar_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id integer NOT NULL,
  registered_at timestamp with time zone DEFAULT now(),
  joined_at timestamp with time zone,
  completed_at timestamp with time zone,
  livestorm_participant_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  registration_status text NOT NULL DEFAULT 'registration_pending'::text,
  points_awarded integer DEFAULT 0,
  PRIMARY KEY (id)
);

-- ============================================================
-- 3. VUES (VIEWS)
-- ============================================================

CREATE OR REPLACE VIEW public.secure_forum_comments AS
SELECT id, post_id, content, parent_comment_id, is_best_answer,
  created_at, updated_at, is_anonymous, is_deleted, deleted_at, deleted_by, deletion_reason_id,
  CASE
    WHEN (author_id = auth.uid()) THEN author_id
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN author_id
    WHEN (is_anonymous = true) THEN NULL::uuid
    ELSE author_id
  END AS author_id,
  CASE
    WHEN (author_id = auth.uid()) THEN display_pseudo
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN display_pseudo
    WHEN (is_anonymous = true) THEN 'Membre Anonyme'::text
    ELSE display_pseudo
  END AS display_pseudo,
  CASE
    WHEN (author_id = auth.uid()) THEN display_avatar_url
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN display_avatar_url
    WHEN (is_anonymous = true) THEN NULL::text
    ELSE display_avatar_url
  END AS display_avatar_url
FROM forum_comments fc;

CREATE OR REPLACE VIEW public.secure_forum_posts AS
SELECT id, title, content, category_id, tags, views_count, is_pinned, is_closed, has_best_answer,
  created_at, updated_at, is_anonymous, is_deleted, deleted_at, deleted_by, deletion_reason_id,
  CASE
    WHEN (author_id = auth.uid()) THEN author_id
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN author_id
    WHEN (is_anonymous = true) THEN NULL::uuid
    ELSE author_id
  END AS author_id,
  CASE
    WHEN (author_id = auth.uid()) THEN display_pseudo
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN display_pseudo
    WHEN (is_anonymous = true) THEN 'Membre Anonyme'::text
    ELSE display_pseudo
  END AS display_pseudo,
  CASE
    WHEN (author_id = auth.uid()) THEN display_avatar_url
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN display_avatar_url
    WHEN (is_anonymous = true) THEN NULL::text
    ELSE display_avatar_url
  END AS display_avatar_url
FROM forum_posts fp;

-- ============================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.advisor_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_preparation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_preparation_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_referrers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacite_emprunt_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleague_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_visual_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csat_beta_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csat_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epargne_precaution_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espp_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espp_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_keys_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_booking_landing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_boss_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_profile_required_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_profile_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_moderation_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubspot_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lmnp_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_validation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_partner_welcome_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimisation_fiscale_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcours_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcours_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.per_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pret_immobilier_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_profile_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sell_to_cover ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sidebar_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations_impots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulator_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulator_ctas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_declaration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_fiscal_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_offer_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_parcours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_real_estate_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_risk_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventes_espp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_external_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. FONCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_user_level(user_points integer, max_points integer)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select case
    when max_points = 0 then 'débutant'
    when (user_points::float / max_points::float) < 0.25 then 'débutant'
    when (user_points::float / max_points::float) < 0.50 then 'intermédiaire'
    when (user_points::float / max_points::float) < 0.75 then 'avancé'
    else 'expert'
  end;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_forum_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_onboarding_scenes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_video_progress_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_block_orders_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_themes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_first_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.last_login IS NULL AND NEW.last_login IS NOT NULL THEN
    NEW.statut_invitation := 'inscrit';
    NEW.date_premiere_connexion := NEW.last_login;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    company_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    (NEW.raw_user_meta_data->>'company_id')::uuid
  );
  RETURN NEW;
END;
$$;

-- NOTE: Les fonctions RPC suivantes sont aussi présentes dans votre DB :
-- get_company_employee_stats, get_company_extended_stats, get_company_engagement_trends,
-- get_company_registration_trends, get_company_module_details, get_company_module_chart_data,
-- get_company_parcours_stats, get_company_simulation_stats, get_company_financial_stats,
-- get_filtered_forum_posts, update_user_contribution_score, assign_parcours_from_onboarding,
-- set_premium_plan_on_partnership
-- Voir les définitions complètes dans la section <db-functions> de votre projet.

-- ============================================================
-- 6. RLS POLICIES (EXTRAIT PRINCIPAL)
-- ============================================================
-- NOTE: Ce fichier contient les politiques les plus importantes.
-- La liste complète est très longue (~200+ policies).
-- Voici le pattern principal utilisé :

-- Pattern Admin: has_role(auth.uid(), 'admin'::app_role)
-- Pattern User: auth.uid() = user_id (ou = id pour profiles)
-- Pattern Public: USING (true) pour SELECT

-- Exemples representatifs :

-- advisor_certifications
CREATE POLICY "Admins can manage advisor certifications" ON public.advisor_certifications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view advisor certifications" ON public.advisor_certifications FOR SELECT USING (true);

-- advisors
CREATE POLICY "Admins can manage advisors" ON public.advisors FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active advisors" ON public.advisors FOR SELECT USING (is_active = true);

-- profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- companies
CREATE POLICY "Admins can view all companies" ON public.companies FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert companies" ON public.companies FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update companies" ON public.companies FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete companies" ON public.companies FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view their company" ON public.companies FOR SELECT TO authenticated USING (id IN (SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid()));

-- user_roles
CREATE POLICY "Admins can manage user roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- simulations (pattern user_id)
CREATE POLICY "Users can view their own simulations" ON public.simulations FOR SELECT USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert their own simulations" ON public.simulations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own simulations" ON public.simulations FOR UPDATE USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete their own simulations" ON public.simulations FOR DELETE USING (auth.uid() = user_id);

-- modules (public read, admin write)
CREATE POLICY "Anyone can view modules" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Admins can insert modules" ON public.modules FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update modules" ON public.modules FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete modules" ON public.modules FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- user_financial_profiles
CREATE POLICY "Users can view their own financial profile" ON public.user_financial_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own financial profile" ON public.user_financial_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own financial profile" ON public.user_financial_profiles FOR UPDATE USING (auth.uid() = user_id);

-- forum_posts
CREATE POLICY "Anyone can view posts" ON public.forum_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own posts" ON public.forum_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own posts" ON public.forum_posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- partnership_contact_requests (public insert with validation)
CREATE POLICY "Anyone can create partnership contact requests" ON public.partnership_contact_requests FOR INSERT WITH CHECK (
  (email IS NOT NULL) AND (email <> '') AND 
  (first_name IS NOT NULL) AND (first_name <> '') AND 
  (last_name IS NOT NULL) AND (last_name <> '') AND 
  (company IS NOT NULL) AND (company <> '') AND 
  (company_size IS NOT NULL) AND (company_size <> '')
);
CREATE POLICY "Admins can view all partnership contact requests" ON public.partnership_contact_requests FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- hubspot_appointments (service_role insert)
CREATE POLICY "Service role can insert appointments" ON public.hubspot_appointments FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Admins can view all appointments" ON public.hubspot_appointments FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view their own appointments" ON public.hubspot_appointments FOR SELECT USING (user_id = auth.uid());

-- forum_activity_logs (service_role insert)
CREATE POLICY "System can insert activity logs" ON public.forum_activity_logs FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Admins can view all activity logs" ON public.forum_activity_logs FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

-- ============================================================
-- NOTE: Ce script couvre la structure complète (107 tables),
-- l'enum app_role, les vues sécurisées du forum,
-- les fonctions principales et les politiques RLS essentielles.
-- 
-- Pour les ~200 politiques RLS complètes et les fonctions RPC
-- détaillées, référez-vous aux dumps pg_policies et db-functions
-- de votre projet source.
-- ============================================================
