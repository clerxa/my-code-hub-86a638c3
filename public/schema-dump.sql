-- ============================================================
-- MYFINCARE - COMPLETE DATABASE SCHEMA DUMP
-- Generated: 2026-02-12
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'contact_entreprise', 'user');

-- ============================================================
-- 2. SEQUENCES
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS public.modules_id_seq;

-- ============================================================
-- 3. TABLES
-- ============================================================

CREATE TABLE public.advisor_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL,
  certification_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.advisor_ranks (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL,
  rank INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.advisors (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.appointment_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  fillout_form_id TEXT NOT NULL,
  fillout_form_url TEXT NOT NULL,
  module_id INTEGER,
  points_awarded INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  icon TEXT DEFAULT 'calendar'::text,
  color TEXT DEFAULT 'primary'::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.appointment_preparation (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  objectives TEXT[] DEFAULT '{}'::text[],
  intention_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.appointment_preparation_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  form_id UUID,
  fillout_submission_id TEXT,
  user_email TEXT NOT NULL,
  user_full_name TEXT,
  user_phone TEXT,
  scheduled_with_email TEXT,
  scheduled_with_name TEXT,
  event_start_time TIMESTAMPTZ NOT NULL,
  event_end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'Europe/Paris'::text,
  event_url TEXT,
  reschedule_url TEXT,
  status TEXT DEFAULT 'scheduled'::text,
  extra_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.block_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  page_name TEXT NOT NULL,
  block_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  layout_config JSONB DEFAULT '{"columns": 1}'::jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE public.booking_referrers (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT NOT NULL,
  referrer_path TEXT NOT NULL,
  referrer_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  matched_at TIMESTAMPTZ,
  appointment_id UUID,
  PRIMARY KEY (id)
);

CREATE TABLE public.capacite_emprunt_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nom_simulation TEXT NOT NULL,
  salaires NUMERIC NOT NULL DEFAULT 0,
  revenus_locatifs NUMERIC NOT NULL DEFAULT 0,
  revenus_capital NUMERIC NOT NULL DEFAULT 0,
  allocations_chomage NUMERIC NOT NULL DEFAULT 0,
  indemnites_maladie NUMERIC NOT NULL DEFAULT 0,
  autres_revenus NUMERIC NOT NULL DEFAULT 0,
  revenu_mensuel_net NUMERIC NOT NULL DEFAULT 0,
  credit_immo NUMERIC NOT NULL DEFAULT 0,
  credit_conso NUMERIC NOT NULL DEFAULT 0,
  credit_auto NUMERIC NOT NULL DEFAULT 0,
  pensions_alimentaires NUMERIC NOT NULL DEFAULT 0,
  autres_charges NUMERIC NOT NULL DEFAULT 0,
  charges_fixes NUMERIC NOT NULL DEFAULT 0,
  loyer_actuel NUMERIC NOT NULL DEFAULT 0,
  apport_personnel NUMERIC NOT NULL DEFAULT 0,
  duree_annees INTEGER NOT NULL DEFAULT 20,
  taux_interet NUMERIC NOT NULL DEFAULT 3.5,
  taux_assurance NUMERIC NOT NULL DEFAULT 0.34,
  frais_notaire NUMERIC NOT NULL DEFAULT 8,
  mensualite_maximale NUMERIC,
  capacite_emprunt NUMERIC,
  montant_projet_max NUMERIC,
  taux_endettement_actuel NUMERIC,
  taux_utilisation_capacite NUMERIC,
  taux_endettement_futur NUMERIC,
  reste_a_vivre NUMERIC,
  reste_a_vivre_futur NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.celebration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  video_url TEXT DEFAULT '/finbear_success.mp4'::text,
  video_enabled BOOLEAN DEFAULT true,
  title TEXT DEFAULT 'Félicitations ! 🎉'::text,
  subtitle TEXT DEFAULT 'Tu as terminé le parcours'::text,
  motivational_message TEXT DEFAULT 'Continue sur ta lancée ! Chaque parcours complété te rapproche de la maîtrise de tes finances. 💪'::text,
  button_text TEXT DEFAULT 'Découvrir d''autres parcours'::text,
  button_url TEXT DEFAULT '/parcours'::text,
  show_confetti BOOLEAN DEFAULT true,
  show_points BOOLEAN DEFAULT true,
  gradient_start TEXT DEFAULT '217 91% 60%'::text,
  gradient_middle TEXT DEFAULT '271 81% 56%'::text,
  gradient_end TEXT DEFAULT '38 92% 50%'::text,
  PRIMARY KEY (id)
);

CREATE TABLE public.certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.colleague_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL,
  company_id UUID NOT NULL,
  colleague_first_name TEXT NOT NULL,
  colleague_last_name TEXT NOT NULL,
  colleague_email TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  colleague_phone TEXT,
  invitation_token UUID DEFAULT gen_random_uuid(),
  email_sent_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  link_clicked_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ,
  registered_user_id UUID,
  PRIMARY KEY (id)
);

CREATE TABLE public.communication_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  communication_type VARCHAR NOT NULL,
  deadline VARCHAR NOT NULL,
  template_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6'::text,
  secondary_color TEXT DEFAULT '#8b5cf6'::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  referral_typeform_url TEXT,
  simulators_config JSONB DEFAULT '[]'::jsonb,
  expert_booking_url TEXT,
  documents_resources JSONB DEFAULT '[]'::jsonb,
  webinar_replays JSONB DEFAULT '[]'::jsonb,
  email_domains TEXT[],
  partnership_type TEXT,
  company_size INTEGER,
  employee_locations TEXT[],
  has_foreign_employees BOOLEAN DEFAULT false,
  work_mode TEXT,
  compensation_devices JSONB DEFAULT '{}'::jsonb,
  hr_challenges JSONB DEFAULT '{}'::jsonb,
  internal_initiatives JSONB DEFAULT '{}'::jsonb,
  internal_communications JSONB DEFAULT '{}'::jsonb,
  expert_booking_hubspot_embed TEXT,
  niveau_maturite_financiere TEXT,
  canal_communication_autre TEXT,
  cover_url TEXT,
  rang INTEGER,
  enable_points_ranking BOOLEAN NOT NULL DEFAULT false,
  banner_url TEXT,
  forum_access_all_discussions BOOLEAN DEFAULT false,
  tax_declaration_help_enabled BOOLEAN DEFAULT false,
  tax_permanence_config JSONB DEFAULT '{"options": []}'::jsonb,
  max_tax_declarations INTEGER DEFAULT 100,
  PRIMARY KEY (id)
);

CREATE TABLE public.company_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  role_contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  photo_url TEXT,
  is_forum_moderator BOOLEAN DEFAULT true,
  PRIMARY KEY (id)
);

CREATE TABLE public.company_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  company_id UUID,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general'::text,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.company_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  module_id INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  custom_order INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.company_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  company_id UUID,
  etape_actuelle INTEGER NOT NULL DEFAULT 1,
  onboarding_termine BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.company_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  from_company_id UUID,
  to_company_id UUID NOT NULL,
  transferred_by UUID NOT NULL,
  transfer_options JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.company_visual_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  company_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT DEFAULT 'general'::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.company_webinars (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  module_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_type TEXT NOT NULL,
  recipient_id UUID,
  company_id UUID,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.csat_beta_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  options JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.csat_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_name TEXT NOT NULL,
  parcours_id UUID,
  user_level TEXT,
  content_quality_score INTEGER,
  experience_score INTEGER,
  visual_score INTEGER,
  relevance_score INTEGER,
  information_level TEXT,
  beta_responses JSONB DEFAULT '[]'::jsonb,
  improvement_feedback TEXT,
  positive_feedback TEXT,
  expert_intent TEXT,
  completion_status TEXT NOT NULL DEFAULT 'completed'::text,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.csat_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  csat_enabled BOOLEAN NOT NULL DEFAULT true,
  enabled_for_modules BOOLEAN NOT NULL DEFAULT true,
  enabled_for_simulators BOOLEAN NOT NULL DEFAULT true,
  enabled_for_parcours BOOLEAN NOT NULL DEFAULT true,
  enabled_for_onboarding BOOLEAN NOT NULL DEFAULT true,
  enabled_for_financial_profile BOOLEAN NOT NULL DEFAULT true,
  beta_questions_count INTEGER NOT NULL DEFAULT 2,
  expert_intent_enabled BOOLEAN NOT NULL DEFAULT true,
  disabled_module_ids INTEGER[] DEFAULT '{}'::integer[],
  alert_low_score_threshold NUMERIC DEFAULT 3.0,
  alert_complex_percentage NUMERIC DEFAULT 30.0,
  alert_unclear_next_step_percentage NUMERIC DEFAULT 30.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.daily_logins (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  points_awarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.epargne_precaution_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nom_simulation TEXT NOT NULL,
  revenu_mensuel NUMERIC NOT NULL,
  nombre_personnes INTEGER NOT NULL DEFAULT 1,
  charges_fixes_mensuelles NUMERIC NOT NULL,
  epargne_actuelle NUMERIC NOT NULL,
  niveau_securite TEXT NOT NULL,
  nb_mois_securite INTEGER NOT NULL,
  capacite_epargne_mensuelle NUMERIC NOT NULL,
  type_metier TEXT NOT NULL,
  coefficient_metier NUMERIC NOT NULL,
  depenses_mensuelles NUMERIC NOT NULL,
  epargne_recommandee NUMERIC NOT NULL,
  epargne_manquante NUMERIC NOT NULL,
  temps_pour_objectif NUMERIC,
  epargne_mensuelle_optimale NUMERIC,
  indice_resilience INTEGER NOT NULL,
  message_personnalise TEXT,
  cta_affiche TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  charges_loyer_credit NUMERIC DEFAULT 0,
  charges_copropriete_taxes NUMERIC DEFAULT 0,
  charges_energie NUMERIC DEFAULT 0,
  charges_assurance_habitation NUMERIC DEFAULT 0,
  charges_transport_commun NUMERIC DEFAULT 0,
  charges_assurance_auto NUMERIC DEFAULT 0,
  charges_lld_loa_auto NUMERIC DEFAULT 0,
  charges_internet NUMERIC DEFAULT 0,
  charges_mobile NUMERIC DEFAULT 0,
  charges_abonnements NUMERIC DEFAULT 0,
  charges_frais_scolarite NUMERIC DEFAULT 0,
  charges_autres NUMERIC DEFAULT 0,
  type_contrat TEXT DEFAULT 'cdi'::text,
  PRIMARY KEY (id)
);

CREATE TABLE public.espp_lots (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL,
  date_acquisition DATE NOT NULL,
  quantite_achetee_brut NUMERIC NOT NULL,
  prix_achat_unitaire_devise NUMERIC NOT NULL,
  fmv_retenu_plan NUMERIC NOT NULL,
  gain_acquisition_par_action NUMERIC NOT NULL,
  gain_acquisition_total_devise NUMERIC NOT NULL,
  gain_acquisition_total_eur NUMERIC NOT NULL,
  pru_fiscal_eur NUMERIC NOT NULL,
  frais_achat NUMERIC DEFAULT 0,
  broker_transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.espp_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nom_plan TEXT NOT NULL,
  entreprise TEXT NOT NULL,
  devise_plan TEXT DEFAULT 'USD'::text,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  lookback BOOLEAN DEFAULT true,
  discount_pct NUMERIC DEFAULT 15.00,
  fmv_debut NUMERIC NOT NULL,
  fmv_fin NUMERIC NOT NULL,
  montant_investi NUMERIC NOT NULL,
  taux_change_payroll NUMERIC NOT NULL,
  broker TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.evaluation_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_table TEXT,
  source_column TEXT,
  value_type TEXT NOT NULL DEFAULT 'number'::text,
  unit TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.evaluation_keys_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'string'::text,
  unit TEXT,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  is_calculated BOOLEAN DEFAULT false,
  formula TEXT,
  is_auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.expert_booking_landing_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  hero_title TEXT DEFAULT 'Prenez rendez-vous avec un expert'::text,
  hero_subtitle TEXT DEFAULT 'Un accompagnement personnalisé pour optimiser vos finances'::text,
  hero_image_url TEXT,
  benefits JSONB DEFAULT '[{"icon": "Target", "title": "Analyse personnalisée", "description": "Un expert analyse votre situation financière en détail"}]'::jsonb,
  cta_text TEXT DEFAULT 'Réserver mon créneau'::text,
  cta_secondary_text TEXT DEFAULT 'Gratuit et sans engagement'::text,
  testimonial_enabled BOOLEAN DEFAULT false,
  testimonial_text TEXT,
  testimonial_author TEXT,
  testimonial_role TEXT,
  footer_text TEXT DEFAULT 'Nos experts sont disponibles du lundi au vendredi, de 9h à 18h.'::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  gallery_images JSONB DEFAULT '[]'::jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE public.features (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  nom_fonctionnalite TEXT NOT NULL,
  categorie TEXT NOT NULL,
  description TEXT,
  cle_technique TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  requires_partnership BOOLEAN DEFAULT true,
  PRIMARY KEY (id)
);

CREATE TABLE public.final_boss_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL DEFAULT 'DOMINIUS COMPLEXUS'::text,
  description TEXT DEFAULT 'Le boss final à vaincre'::text,
  image_url TEXT DEFAULT '/villains/dominius-complexus.png'::text,
  theme_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.financial_products (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  category TEXT,
  availability TEXT,
  availability_icon TEXT DEFAULT 'Clock'::text,
  risk_level INTEGER DEFAULT 1,
  risk_label TEXT,
  max_amount TEXT,
  max_amount_label TEXT DEFAULT 'Plafond'::text,
  target_return TEXT,
  target_return_label TEXT DEFAULT 'Rendement cible'::text,
  benefits JSONB DEFAULT '[]'::jsonb,
  fiscal_comparison_enabled BOOLEAN DEFAULT true,
  fiscal_before_label TEXT DEFAULT 'Sans ce produit'::text,
  fiscal_before_value TEXT,
  fiscal_after_label TEXT DEFAULT 'Avec ce produit'::text,
  fiscal_after_value TEXT,
  fiscal_savings_label TEXT DEFAULT 'Économie'::text,
  fiscal_savings_value TEXT,
  expert_tip_title TEXT DEFAULT 'Conseil d''Expert'::text,
  expert_tip_content TEXT,
  expert_tip_icon TEXT DEFAULT 'Lightbulb'::text,
  cta_text TEXT DEFAULT 'En savoir plus'::text,
  cta_url TEXT,
  cta_secondary_text TEXT,
  cta_secondary_url TEXT,
  hero_image_url TEXT,
  icon TEXT DEFAULT 'Wallet'::text,
  gradient_start TEXT DEFAULT '217 91% 60%'::text,
  gradient_end TEXT DEFAULT '262 83% 58%'::text,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.financial_profile_required_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.financial_profile_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  hero_title TEXT DEFAULT 'Votre Profil Financier'::text,
  hero_description TEXT DEFAULT 'Complétez votre profil financier pour une expérience personnalisée'::text,
  benefits JSON DEFAULT '[]'::json,
  cta_text TEXT DEFAULT 'Compléter mon profil'::text,
  footer_note TEXT DEFAULT 'Ces informations sont facultatives et peuvent être modifiées à tout moment.'::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.footer_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  company_text TEXT DEFAULT 'FinCare'::text,
  copyright_text TEXT DEFAULT '© 2024 FinCare. Tous droits réservés.'::text,
  legal_mentions TEXT,
  privacy_policy_url TEXT,
  terms_url TEXT,
  contact_email TEXT,
  social_links JSONB DEFAULT '[]'::jsonb,
  show_powered_by BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6'::text,
  order_num INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID,
  is_best_answer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_anonymous BOOLEAN DEFAULT false,
  display_pseudo TEXT,
  display_avatar_url TEXT,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  deletion_reason_id UUID,
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_moderation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  moderator_id UUID,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason_id UUID,
  custom_reason TEXT,
  action TEXT NOT NULL DEFAULT 'delete'::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_moderation_reasons (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  description TEXT,
  order_num INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id UUID NOT NULL,
  author_id UUID NOT NULL,
  tags TEXT[] DEFAULT '{}'::text[],
  views_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_closed BOOLEAN DEFAULT false,
  has_best_answer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_anonymous BOOLEAN DEFAULT false,
  display_pseudo TEXT,
  display_avatar_url TEXT,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  deletion_reason_id UUID,
  PRIMARY KEY (id)
);

CREATE TABLE public.forum_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.global_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  value_type TEXT NOT NULL DEFAULT 'number'::text,
  validation_min NUMERIC,
  validation_max NUMERIC,
  year INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.hubspot_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  hubspot_meeting_id TEXT,
  hubspot_contact_id TEXT,
  user_id UUID,
  user_email TEXT NOT NULL,
  user_name TEXT,
  meeting_title TEXT,
  meeting_start_time TIMESTAMPTZ,
  meeting_end_time TIMESTAMPTZ,
  meeting_link TEXT,
  booking_source TEXT,
  company_id UUID,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  host_name TEXT,
  referrer_path TEXT,
  referrer_label TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE public.lmnp_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nom_simulation TEXT NOT NULL,
  recettes NUMERIC NOT NULL DEFAULT 0,
  interets_emprunt NUMERIC NOT NULL DEFAULT 0,
  assurance_pno NUMERIC NOT NULL DEFAULT 0,
  assurance_gli NUMERIC NOT NULL DEFAULT 0,
  gestion_locative NUMERIC NOT NULL DEFAULT 0,
  expert_comptable NUMERIC NOT NULL DEFAULT 0,
  charges_copro NUMERIC NOT NULL DEFAULT 0,
  taxe_fonciere NUMERIC NOT NULL DEFAULT 0,
  cfe NUMERIC NOT NULL DEFAULT 0,
  travaux_entretien NUMERIC NOT NULL DEFAULT 0,
  petit_materiel NUMERIC NOT NULL DEFAULT 0,
  frais_deplacement NUMERIC NOT NULL DEFAULT 0,
  autre_charge NUMERIC NOT NULL DEFAULT 0,
  total_charges NUMERIC NOT NULL DEFAULT 0,
  valeur_bien NUMERIC NOT NULL DEFAULT 0,
  duree_immo INTEGER NOT NULL DEFAULT 30,
  valeur_mobilier NUMERIC NOT NULL DEFAULT 0,
  duree_mobilier INTEGER NOT NULL DEFAULT 7,
  tmi NUMERIC NOT NULL DEFAULT 30,
  resultat_avant_amort NUMERIC,
  amort_immo NUMERIC,
  amort_mobilier NUMERIC,
  amort_total NUMERIC,
  resultat_fiscal_reel NUMERIC,
  resultat_fiscal_micro NUMERIC,
  ir_reel NUMERIC,
  ps_reel NUMERIC,
  ir_micro NUMERIC,
  ps_micro NUMERIC,
  fiscalite_totale_reel NUMERIC,
  fiscalite_totale_micro NUMERIC,
  meilleur_regime TEXT,
  amort_non_deduits NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.module_validation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  module_type TEXT NOT NULL,
  video_min_watch_percentage INTEGER DEFAULT 30,
  quiz_first_attempt_percentage INTEGER DEFAULT 100,
  quiz_retry_percentage INTEGER DEFAULT 50,
  webinar_registration_points INTEGER DEFAULT 50,
  webinar_participation_points INTEGER DEFAULT 100,
  allow_retry BOOLEAN DEFAULT true,
  max_retry_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.module_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id INTEGER NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.modules (
  id INTEGER NOT NULL DEFAULT nextval('modules_id_seq'::regclass),
  order_num INTEGER NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  content_url TEXT,
  duration TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  webinar_date TIMESTAMPTZ,
  webinar_registration_url TEXT,
  webinar_image_url TEXT,
  quiz_questions JSONB DEFAULT '[]'::jsonb,
  appointment_calendar_url TEXT,
  content_type TEXT,
  embed_code TEXT,
  content_data JSONB DEFAULT '{}'::jsonb,
  pedagogical_objectives TEXT[],
  estimated_time INTEGER,
  difficulty_level INTEGER DEFAULT 1,
  key_takeaways TEXT[],
  theme TEXT[],
  points_registration INTEGER DEFAULT 50,
  points_participation INTEGER DEFAULT 100,
  livestorm_session_id TEXT,
  is_optional BOOLEAN DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE public.non_partner_welcome_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  hero_icon TEXT DEFAULT 'Building2'::text,
  hero_title TEXT DEFAULT 'Bienvenue chez {companyName} !'::text,
  hero_description TEXT DEFAULT 'Votre entreprise n''a pas encore accès à l''offre complète FinCare'::text,
  benefits_title TEXT DEFAULT 'Pourquoi FinCare pour votre entreprise ?'::text,
  benefits JSONB DEFAULT '[]'::jsonb,
  contacts_title TEXT DEFAULT 'Qui contacter dans votre entreprise ?'::text,
  contacts JSONB DEFAULT '[]'::jsonb,
  email_subject TEXT DEFAULT 'Découvrez FinCare pour votre entreprise'::text,
  email_body TEXT,
  primary_button_text TEXT DEFAULT 'Inviter mon entreprise à découvrir FinCare'::text,
  secondary_button_text TEXT DEFAULT 'Continuer avec un accès limité'::text,
  footer_text TEXT DEFAULT 'En attendant, vous pouvez explorer certaines fonctionnalités de FinCare'::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  max_simulations INTEGER DEFAULT 10,
  allowed_simulators TEXT[] DEFAULT ARRAY['simulateur_pret_immobilier','simulateur_epargne_precaution','simulateur_impots','simulateur_espp','simulateur_interets_composes','optimisation_fiscale','simulateur_capacite_emprunt','simulateur_lmnp','simulateur_per'],
  quota_banner_label TEXT DEFAULT 'Analyses gratuites'::text,
  PRIMARY KEY (id)
);

CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rule_id UUID,
  notification_id UUID,
  triggered_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.notification_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_key TEXT NOT NULL,
  trigger_condition TEXT NOT NULL,
  threshold_value JSONB,
  display_type TEXT NOT NULL,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  cta_text TEXT,
  cta_url TEXT,
  segmentation JSONB,
  frequency_limit TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  url_action TEXT,
  display_type TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  button_text TEXT DEFAULT 'Voir plus'::text,
  PRIMARY KEY (id)
);

CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  cta_text TEXT DEFAULT 'En savoir plus'::text,
  cta_url TEXT,
  category TEXT NOT NULL DEFAULT 'general'::text,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  PRIMARY KEY (id)
);

CREATE TABLE public.onboarding_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT NOT NULL,
  flow_id TEXT NOT NULL DEFAULT 'tax-onboarding'::text,
  screen_id UUID,
  response_value JSONB,
  lead_rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.onboarding_scenes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  ordre INTEGER NOT NULL,
  image TEXT NOT NULL,
  texte TEXT NOT NULL,
  effet TEXT NOT NULL DEFAULT 'fade-in'::text,
  statut BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.onboarding_screens (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  flow_id TEXT NOT NULL DEFAULT 'tax-onboarding'::text,
  order_num INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  options JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft'::text,
  next_step_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  workflow_position JSONB DEFAULT '{"x": 0, "y": 0}'::jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE public.optimisation_fiscale_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nom_simulation TEXT NOT NULL,
  revenu_imposable NUMERIC NOT NULL,
  revenus_professionnels NUMERIC NOT NULL,
  situation_familiale TEXT NOT NULL,
  nb_enfants INTEGER NOT NULL DEFAULT 0,
  tmi NUMERIC NOT NULL,
  impot_avant NUMERIC NOT NULL,
  montant_per NUMERIC DEFAULT 0,
  plafond_per NUMERIC DEFAULT 0,
  plafond_per_report_n1 NUMERIC DEFAULT 0,
  plafond_per_report_n2 NUMERIC DEFAULT 0,
  plafond_per_report_n3 NUMERIC DEFAULT 0,
  plafond_per_total NUMERIC DEFAULT 0,
  reduction_per NUMERIC DEFAULT 0,
  plafond_per_utilise NUMERIC DEFAULT 0,
  dons_75_montant NUMERIC DEFAULT 0,
  reduction_dons_75 NUMERIC DEFAULT 0,
  dons_66_montant NUMERIC DEFAULT 0,
  reduction_dons_66 NUMERIC DEFAULT 0,
  montant_aide_domicile NUMERIC DEFAULT 0,
  reduction_aide_domicile NUMERIC DEFAULT 0,
  montant_garde_enfant NUMERIC DEFAULT 0,
  reduction_garde_enfant NUMERIC DEFAULT 0,
  prix_pinel NUMERIC DEFAULT 0,
  taux_pinel NUMERIC DEFAULT 0,
  duree_pinel INTEGER DEFAULT 0,
  reduction_pinel_annuelle NUMERIC DEFAULT 0,
  prix_pinel_om NUMERIC DEFAULT 0,
  taux_pinel_om NUMERIC DEFAULT 0,
  duree_pinel_om INTEGER DEFAULT 0,
  reduction_pinel_om_annuelle NUMERIC DEFAULT 0,
  montant_girardin NUMERIC DEFAULT 0,
  reduction_girardin NUMERIC DEFAULT 0,
  montant_pme NUMERIC DEFAULT 0,
  reduction_pme NUMERIC DEFAULT 0,
  montant_esus NUMERIC DEFAULT 0,
  reduction_esus NUMERIC DEFAULT 0,
  dispositifs_selectionnes JSONB DEFAULT '[]'::jsonb,
  impot_apres NUMERIC DEFAULT 0,
  economie_totale NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.parcours (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_default BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER DEFAULT 0,
  PRIMARY KEY (id)
);

CREATE TABLE public.parcours_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  parcours_id UUID NOT NULL,
  company_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_pinned BOOLEAN DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE public.parcours_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  parcours_id UUID NOT NULL,
  module_id INTEGER NOT NULL,
  order_num INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_optional BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE public.partnership_contact_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_size TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.partnership_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID,
  contact_email TEXT NOT NULL,
  contact_last_name TEXT,
  contact_role TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sender_first_name TEXT,
  sender_last_name TEXT,
  sender_email TEXT,
  contact_first_name TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE public.per_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nom_simulation TEXT NOT NULL,
  revenu_fiscal NUMERIC NOT NULL,
  parts_fiscales NUMERIC NOT NULL,
  age_actuel INTEGER NOT NULL,
  age_retraite INTEGER NOT NULL,
  tmi NUMERIC NOT NULL,
  plafond_per_annuel NUMERIC NOT NULL,
  plafond_per_reportable NUMERIC NOT NULL DEFAULT 0,
  plafond_per_total NUMERIC NOT NULL,
  versements_per NUMERIC NOT NULL,
  impot_sans_per NUMERIC NOT NULL,
  impot_avec_per NUMERIC NOT NULL,
  economie_impots NUMERIC NOT NULL,
  effort_reel NUMERIC NOT NULL,
  optimisation_fiscale NUMERIC NOT NULL,
  reduction_impots_max NUMERIC NOT NULL,
  horizon_annees INTEGER NOT NULL,
  taux_rendement NUMERIC NOT NULL,
  capital_futur NUMERIC NOT NULL,
  gain_financier NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.points_configuration (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.points_history (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  reference_id TEXT,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.pret_immobilier_simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nom_simulation TEXT NOT NULL,
  montant_projet NUMERIC NOT NULL DEFAULT 0,
  apport_personnel NUMERIC NOT NULL DEFAULT 0,
  duree_annees INTEGER NOT NULL DEFAULT 20,
  taux_interet NUMERIC NOT NULL DEFAULT 0,
  taux_assurance NUMERIC NOT NULL DEFAULT 0,
  revenu_mensuel NUMERIC,
  montant_emprunte NUMERIC,
  mensualite_totale NUMERIC,
  cout_total_interets NUMERIC,
  cout_total_assurance NUMERIC,
  cout_global_credit NUMERIC,
  taux_endettement NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.profiles (
  id UUID NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  completed_modules INTEGER[] NOT NULL DEFAULT '{}'::integer[],
  current_module INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  company_id UUID,
  phone_number TEXT,
  birth_date DATE,
  net_taxable_income NUMERIC,
  marital_status TEXT,
  children_count INTEGER DEFAULT 0,
  avatar_url TEXT,
  job_title TEXT,
  last_login TIMESTAMPTZ,
  current_session_start TIMESTAMPTZ,
  a_pris_rdv BOOLEAN DEFAULT false,
  a_invite_collegue BOOLEAN DEFAULT false,
  household_taxable_income NUMERIC,
  theme_preference TEXT NOT NULL DEFAULT 'villains'::text,
  employee_onboarding_completed BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  objectives TEXT[] DEFAULT '{}'::text[],
  forum_anonymous_mode BOOLEAN DEFAULT false,
  forum_pseudo TEXT,
  forum_avatar_url TEXT,
  forum_posts_count INTEGER DEFAULT 0,
  forum_comments_count INTEGER DEFAULT 0,
  forum_contribution_score INTEGER DEFAULT 0,
  beta_disclaimer_accepted_at TIMESTAMPTZ,
  personal_email TEXT,
  receive_on_personal_email BOOLEAN DEFAULT false,
  PRIMARY KEY (id)
);

CREATE TABLE public.recommendation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  rule_key TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  condition_type TEXT NOT NULL,
  condition_config JSONB DEFAULT '{}'::jsonb,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'calendar'::text,
  cta_text TEXT NOT NULL,
  cta_action_type TEXT NOT NULL DEFAULT 'navigate'::text,
  cta_action_value TEXT NOT NULL,
  display_priority TEXT NOT NULL DEFAULT 'medium'::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  internal_name TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE public.referral_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  company_id UUID NOT NULL,
  colleague_name TEXT NOT NULL,
  colleague_email TEXT NOT NULL,
  colleague_phone TEXT,
  message TEXT,
  expert_booking_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.risk_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL,
  answer_text TEXT NOT NULL,
  score_value INTEGER NOT NULL,
  order_num INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.risk_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  total_weighted_score NUMERIC NOT NULL,
  profile_type TEXT NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.risk_profile_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  module_active BOOLEAN DEFAULT true,
  mandatory_for_new_users BOOLEAN DEFAULT false,
  threshold_prudent INTEGER DEFAULT 30,
  threshold_equilibre INTEGER DEFAULT 55,
  threshold_dynamique INTEGER DEFAULT 80,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.risk_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  choices JSONB,
  active BOOLEAN DEFAULT true,
  order_num INTEGER,
  amf_weight NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  can_access BOOLEAN NOT NULL DEFAULT false,
  can_modify BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.sell_to_cover (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL,
  is_sell_to_cover BOOLEAN DEFAULT true,
  quantite_vendue NUMERIC NOT NULL,
  prix_vente_devise NUMERIC NOT NULL,
  date_sell_to_cover DATE NOT NULL,
  taux_change NUMERIC NOT NULL,
  frais NUMERIC DEFAULT 0,
  taxes_prelevees NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.sidebar_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  sidebar_type TEXT NOT NULL,
  menu_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.simulation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT,
  simulator_type TEXT NOT NULL,
  simulation_data JSONB NOT NULL,
  results_data JSONB NOT NULL,
  is_saved_to_history BOOLEAN DEFAULT false,
  cta_clicked TEXT[],
  appointment_cta_clicked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  name TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE public.simulations_impots (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nom_simulation TEXT NOT NULL,
  revenu_imposable NUMERIC NOT NULL,
  statut_marital TEXT NOT NULL,
  nombre_enfants INTEGER NOT NULL DEFAULT 0,
  reductions_impot NUMERIC DEFAULT 0,
  credits_impot NUMERIC DEFAULT 0,
  parts NUMERIC NOT NULL,
  quotient_familial NUMERIC NOT NULL,
  impot_brut NUMERIC NOT NULL,
  impot_net NUMERIC NOT NULL,
  taux_moyen NUMERIC NOT NULL,
  taux_marginal NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.simulator_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'calculator'::text,
  order_num INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.simulator_ctas (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  simulator_type TEXT NOT NULL,
  condition_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  button_text TEXT NOT NULL,
  button_color TEXT,
  icon TEXT,
  action_type TEXT NOT NULL,
  action_value TEXT NOT NULL,
  order_num INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  condition_operator TEXT DEFAULT '='::text,
  condition_value JSONB DEFAULT 'null'::jsonb,
  internal_name TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE public.simulators (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  category_id UUID,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'calculator'::text,
  route TEXT NOT NULL,
  feature_key TEXT,
  duration_minutes INTEGER DEFAULT 5,
  order_num INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  visibility_status TEXT NOT NULL DEFAULT 'visible'::text,
  PRIMARY KEY (id)
);

CREATE TABLE public.tax_declaration_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  company_id UUID,
  entreprise TEXT NOT NULL,
  intitule_poste TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT,
  is_perlib_client BOOLEAN DEFAULT false,
  conseiller_dedie TEXT,
  situation_maritale TEXT,
  nombre_enfants INTEGER DEFAULT 0,
  revenu_imposable_precedent NUMERIC,
  tmi TEXT,
  revenus_types JSONB DEFAULT '[]'::jsonb,
  optimisation_types JSONB DEFAULT '[]'::jsonb,
  expertise_avocat JSONB DEFAULT '[]'::jsonb,
  delegation_complete BOOLEAN DEFAULT false,
  avis_imposition_url TEXT,
  autres_justificatifs_urls JSONB DEFAULT '[]'::jsonb,
  type_rdv TEXT,
  commentaires TEXT,
  status TEXT DEFAULT 'pending'::text,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  optimisation_autres JSONB DEFAULT '[]'::jsonb,
  prefilled_from_profile JSONB DEFAULT '{}'::jsonb,
  modified_at TIMESTAMPTZ,
  modification_count INTEGER DEFAULT 0,
  perlib_contact_email TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE public.themes (
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  labels JSONB NOT NULL DEFAULT '{"powerLabel": "Pouvoirs", "originLabel": "Histoire", "villainLabel": "Vilain", "weaknessLabel": "Faiblesses"}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  design_tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE public.user_financial_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  age INTEGER,
  situation_familiale TEXT DEFAULT 'celibataire'::text,
  nb_enfants INTEGER DEFAULT 0,
  nb_personnes_foyer INTEGER DEFAULT 1,
  revenu_mensuel_net NUMERIC DEFAULT 0,
  revenu_fiscal_annuel NUMERIC DEFAULT 0,
  autres_revenus_mensuels NUMERIC DEFAULT 0,
  revenus_locatifs NUMERIC DEFAULT 0,
  charges_fixes_mensuelles NUMERIC DEFAULT 0,
  loyer_actuel NUMERIC DEFAULT 0,
  credits_immobilier NUMERIC DEFAULT 0,
  credits_consommation NUMERIC DEFAULT 0,
  credits_auto NUMERIC DEFAULT 0,
  pensions_alimentaires NUMERIC DEFAULT 0,
  epargne_actuelle NUMERIC DEFAULT 0,
  apport_disponible NUMERIC DEFAULT 0,
  capacite_epargne_mensuelle NUMERIC DEFAULT 0,
  tmi NUMERIC DEFAULT 30,
  parts_fiscales NUMERIC DEFAULT 1,
  plafond_per_reportable NUMERIC DEFAULT 0,
  type_contrat TEXT DEFAULT 'cdi'::text,
  anciennete_annees INTEGER DEFAULT 0,
  secteur_activite TEXT,
  objectif_achat_immo BOOLEAN DEFAULT false,
  budget_achat_immo NUMERIC,
  duree_emprunt_souhaitee INTEGER DEFAULT 20,
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_naissance DATE,
  has_rsu_aga BOOLEAN DEFAULT false,
  has_espp BOOLEAN DEFAULT false,
  has_stock_options BOOLEAN DEFAULT false,
  has_bspce BOOLEAN DEFAULT false,
  has_pee BOOLEAN DEFAULT false,
  has_perco BOOLEAN DEFAULT false,
  projet_residence_principale BOOLEAN DEFAULT false,
  projet_residence_secondaire BOOLEAN DEFAULT false,
  projet_investissement_locatif BOOLEAN DEFAULT false,
  budget_residence_principale NUMERIC,
  budget_residence_secondaire NUMERIC,
  budget_investissement_locatif NUMERIC,
  statut_residence TEXT,
  epargne_livrets NUMERIC DEFAULT 0,
  patrimoine_per NUMERIC DEFAULT 0,
  patrimoine_assurance_vie NUMERIC DEFAULT 0,
  patrimoine_scpi NUMERIC DEFAULT 0,
  patrimoine_pea NUMERIC DEFAULT 0,
  patrimoine_autres NUMERIC DEFAULT 0,
  patrimoine_immo_valeur NUMERIC DEFAULT 0,
  patrimoine_immo_credit_restant NUMERIC DEFAULT 0,
  revenu_fiscal_foyer NUMERIC DEFAULT 0,
  revenu_annuel_conjoint NUMERIC DEFAULT 0,
  has_equity_income_this_year BOOLEAN DEFAULT false,
  equity_income_amount NUMERIC DEFAULT 0,
  revenus_dividendes NUMERIC DEFAULT 0,
  revenus_ventes_actions NUMERIC DEFAULT 0,
  revenus_capital_autres NUMERIC DEFAULT 0,
  financial_summary TEXT,
  financial_summary_generated_at TIMESTAMPTZ,
  charges_copropriete_taxes NUMERIC DEFAULT 0,
  charges_energie NUMERIC DEFAULT 0,
  charges_assurance_habitation NUMERIC DEFAULT 0,
  charges_transport_commun NUMERIC DEFAULT 0,
  charges_assurance_auto NUMERIC DEFAULT 0,
  charges_lld_loa_auto NUMERIC DEFAULT 0,
  charges_internet NUMERIC DEFAULT 0,
  charges_mobile NUMERIC DEFAULT 0,
  charges_abonnements NUMERIC DEFAULT 0,
  charges_frais_scolarite NUMERIC DEFAULT 0,
  charges_autres NUMERIC DEFAULT 0,
  has_pero BOOLEAN DEFAULT false,
  has_epargne_autres BOOLEAN DEFAULT false,
  has_equity_autres BOOLEAN DEFAULT false,
  patrimoine_crypto NUMERIC DEFAULT 0,
  patrimoine_private_equity NUMERIC DEFAULT 0,
  valeur_rsu_aga NUMERIC DEFAULT 0,
  valeur_espp NUMERIC DEFAULT 0,
  valeur_stock_options NUMERIC DEFAULT 0,
  valeur_bspce NUMERIC DEFAULT 0,
  valeur_pee NUMERIC DEFAULT 0,
  valeur_perco NUMERIC DEFAULT 0,
  revenu_annuel_brut NUMERIC DEFAULT 0,
  revenu_annuel_brut_conjoint NUMERIC DEFAULT 0,
  PRIMARY KEY (id)
);

CREATE TABLE public.user_fiscal_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  residence_fiscal TEXT DEFAULT 'France'::text,
  tmi INTEGER DEFAULT 30,
  mode_imposition_plus_value TEXT DEFAULT 'PFU'::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_id UUID NOT NULL,
  is_read BOOLEAN DEFAULT false,
  delivered_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.user_offer_views (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.user_parcours (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  parcours_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'onboarding'::text,
  onboarding_session_id TEXT,
  PRIMARY KEY (id),
  UNIQUE (user_id, parcours_id)
);

CREATE TABLE public.user_real_estate_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nom_bien TEXT NOT NULL DEFAULT 'Bien immobilier'::text,
  valeur_estimee NUMERIC NOT NULL DEFAULT 0,
  capital_restant_du NUMERIC NOT NULL DEFAULT 0,
  mensualite_credit NUMERIC NOT NULL DEFAULT 0,
  charges_mensuelles NUMERIC NOT NULL DEFAULT 0,
  revenus_locatifs_mensuels NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.user_risk_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question_id UUID NOT NULL,
  answer_id UUID NOT NULL,
  score_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id, role)
);

CREATE TABLE public.ventes_espp (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL,
  quantite_vendue NUMERIC NOT NULL,
  prix_vente_devise NUMERIC NOT NULL,
  date_vente DATE NOT NULL,
  taux_change NUMERIC NOT NULL,
  frais_vente NUMERIC DEFAULT 0,
  devise TEXT DEFAULT 'USD'::text,
  plus_value_brute_devise NUMERIC,
  plus_value_eur NUMERIC,
  impot_calcule NUMERIC,
  prelevements_sociaux NUMERIC,
  net_apres_impot NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.video_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id INTEGER NOT NULL,
  watch_time_seconds INTEGER NOT NULL DEFAULT 0,
  total_duration_seconds INTEGER,
  percentage_watched NUMERIC DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.villains (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  theme TEXT NOT NULL,
  description TEXT NOT NULL,
  score_a_battre INTEGER NOT NULL DEFAULT 1000,
  image_url TEXT NOT NULL,
  order_num INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  theme_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (id)
);

CREATE TABLE public.webinar_external_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  module_id INTEGER NOT NULL,
  livestorm_registrant_id TEXT,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  registered_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  attendance_duration_seconds INTEGER DEFAULT 0,
  registration_status TEXT DEFAULT 'registered'::text,
  livestorm_session_id TEXT,
  livestorm_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE TABLE public.webinar_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id INTEGER NOT NULL,
  registered_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  livestorm_participant_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  registration_status TEXT NOT NULL DEFAULT 'registration_pending'::text,
  points_awarded INTEGER DEFAULT 0,
  PRIMARY KEY (id)
);

-- ============================================================
-- 4. FOREIGN KEYS
-- ============================================================
ALTER TABLE public.advisor_certifications ADD CONSTRAINT advisor_certifications_advisor_id_fkey FOREIGN KEY (advisor_id) REFERENCES public.advisors(id);
ALTER TABLE public.advisor_certifications ADD CONSTRAINT advisor_certifications_certification_id_fkey FOREIGN KEY (certification_id) REFERENCES public.certifications(id);
ALTER TABLE public.advisor_ranks ADD CONSTRAINT advisor_ranks_advisor_id_fkey FOREIGN KEY (advisor_id) REFERENCES public.advisors(id);
ALTER TABLE public.appointment_forms ADD CONSTRAINT appointment_forms_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id);
ALTER TABLE public.appointments ADD CONSTRAINT appointments_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.appointment_forms(id);
ALTER TABLE public.appointments ADD CONSTRAINT appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
ALTER TABLE public.booking_referrers ADD CONSTRAINT booking_referrers_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.hubspot_appointments(id);
ALTER TABLE public.booking_referrers ADD CONSTRAINT booking_referrers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
ALTER TABLE public.colleague_invitations ADD CONSTRAINT colleague_invitations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
ALTER TABLE public.colleague_invitations ADD CONSTRAINT colleague_invitations_registered_user_id_fkey FOREIGN KEY (registered_user_id) REFERENCES public.profiles(id);
ALTER TABLE public.company_contacts ADD CONSTRAINT company_contacts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
ALTER TABLE public.company_faqs ADD CONSTRAINT company_faqs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
ALTER TABLE public.company_modules ADD CONSTRAINT company_modules_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
ALTER TABLE public.company_modules ADD CONSTRAINT company_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id);
ALTER TABLE public.company_onboarding ADD CONSTRAINT company_onboarding_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
ALTER TABLE public.company_transfers ADD CONSTRAINT company_transfers_from_company_id_fkey FOREIGN KEY (from_company_id) REFERENCES public.companies(id);
ALTER TABLE public.company_transfers ADD CONSTRAINT company_transfers_to_company_id_fkey FOREIGN KEY (to_company_id) REFERENCES public.companies(id);
ALTER TABLE public.company_visual_resources ADD CONSTRAINT company_visual_resources_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
ALTER TABLE public.company_webinars ADD CONSTRAINT company_webinars_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
ALTER TABLE public.company_webinars ADD CONSTRAINT company_webinars_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id);
ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
ALTER TABLE public.espp_lots ADD CONSTRAINT espp_lots_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.espp_plans(id);
ALTER TABLE public.forum_comment_likes ADD CONSTRAINT forum_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.forum_comments(id);
ALTER TABLE public.forum_comment_likes ADD CONSTRAINT forum_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
ALTER TABLE public.forum_comments ADD CONSTRAINT forum_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);
ALTER TABLE public.forum_comments ADD CONSTRAINT forum_comments_deletion_reason_id_fkey FOREIGN KEY (deletion_reason_id) REFERENCES public.forum_moderation_reasons(id);
ALTER TABLE public.forum_comments ADD CONSTRAINT forum_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.forum_comments(id);
ALTER TABLE public.forum_comments ADD CONSTRAINT forum_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.forum_posts(id);
ALTER TABLE public.forum_post_likes ADD CONSTRAINT forum_post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.forum_posts(id);
ALTER TABLE public.forum_post_likes ADD CONSTRAINT forum_post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- ============================================================
-- 5. ENABLE ROW LEVEL SECURITY
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
-- 6. SECURITY DEFINER FUNCTIONS
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, company_id)
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

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

-- advisor_certifications
CREATE POLICY "Admins can manage advisor certifications" ON public.advisor_certifications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view advisor certifications" ON public.advisor_certifications FOR SELECT USING (true);

-- advisor_ranks
CREATE POLICY "Admins can manage advisor ranks" ON public.advisor_ranks FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view advisor ranks" ON public.advisor_ranks FOR SELECT USING (true);

-- advisors
CREATE POLICY "Admins can manage advisors" ON public.advisors FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active advisors" ON public.advisors FOR SELECT USING (is_active = true);

-- appointment_forms
CREATE POLICY "Admins can manage appointment forms" ON public.appointment_forms FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active appointment forms" ON public.appointment_forms FOR SELECT USING (is_active = true);

-- appointment_preparation
CREATE POLICY "Users can insert their own preparation" ON public.appointment_preparation FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preparation" ON public.appointment_preparation FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own preparation" ON public.appointment_preparation FOR SELECT USING (auth.uid() = user_id);

-- appointment_preparation_documents
CREATE POLICY "Users can delete their own documents" ON public.appointment_preparation_documents FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own documents" ON public.appointment_preparation_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own documents" ON public.appointment_preparation_documents FOR SELECT USING (auth.uid() = user_id);

-- appointments
CREATE POLICY "Admins can manage all appointments" ON public.appointments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can update their own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);

-- block_orders
CREATE POLICY "Admins can insert block orders" ON public.block_orders FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update block orders" ON public.block_orders FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view block orders" ON public.block_orders FOR SELECT USING (true);

-- booking_referrers
CREATE POLICY "Admins can delete referrers" ON public.booking_referrers FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can read all referrers" ON public.booking_referrers FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update referrers" ON public.booking_referrers FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert their own referrer" ON public.booking_referrers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- capacite_emprunt_simulations
CREATE POLICY "Users can delete their own capacite emprunt simulations" ON public.capacite_emprunt_simulations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own capacite emprunt simulations" ON public.capacite_emprunt_simulations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own capacite emprunt simulations" ON public.capacite_emprunt_simulations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own capacite emprunt simulations" ON public.capacite_emprunt_simulations FOR SELECT USING (auth.uid() = user_id);

-- celebration_settings
CREATE POLICY "Anyone can read celebration settings" ON public.celebration_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert celebration settings" ON public.celebration_settings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update celebration settings" ON public.celebration_settings FOR UPDATE USING (auth.uid() IS NOT NULL);

-- certifications
CREATE POLICY "Admins can manage certifications" ON public.certifications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view certifications" ON public.certifications FOR SELECT USING (true);

-- colleague_invitations
CREATE POLICY "Admins can delete colleague invitations" ON public.colleague_invitations FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update colleague invitations" ON public.colleague_invitations FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all colleague invitations" ON public.colleague_invitations FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create colleague invitations" ON public.colleague_invitations FOR INSERT WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "Users can view their own colleague invitations" ON public.colleague_invitations FOR SELECT USING (auth.uid() = inviter_id);

-- communication_templates
CREATE POLICY "Allow admin to manage templates" ON public.communication_templates FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));
CREATE POLICY "Allow read access to all" ON public.communication_templates FOR SELECT USING (true);

-- companies
CREATE POLICY "Admins can delete companies" ON public.companies FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert companies" ON public.companies FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update companies" ON public.companies FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all companies" ON public.companies FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view their company" ON public.companies FOR SELECT TO authenticated USING (id IN (SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid()));

-- company_contacts
CREATE POLICY "Users can delete company contacts" ON public.company_contacts FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR (has_role(auth.uid(), 'contact_entreprise'::app_role) AND company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid())));
CREATE POLICY "Users can insert company contacts" ON public.company_contacts FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (has_role(auth.uid(), 'contact_entreprise'::app_role) AND company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid())));
CREATE POLICY "Users can update company contacts" ON public.company_contacts FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR (has_role(auth.uid(), 'contact_entreprise'::app_role) AND company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid())));
CREATE POLICY "Users can view company contacts" ON public.company_contacts FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR (has_role(auth.uid(), 'contact_entreprise'::app_role) AND company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid())));

-- company_faqs
CREATE POLICY "Admins can manage FAQs" ON public.company_faqs FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));
CREATE POLICY "Users can view FAQs for their company or global" ON public.company_faqs FOR SELECT USING (company_id IS NULL OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.company_id = company_faqs.company_id));

-- company_modules
CREATE POLICY "Admins can delete company_modules" ON public.company_modules FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert company_modules" ON public.company_modules FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update company_modules" ON public.company_modules FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view company_modules" ON public.company_modules FOR SELECT USING (true);

-- company_onboarding
CREATE POLICY "Admins can delete onboarding" ON public.company_onboarding FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert onboarding" ON public.company_onboarding FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update onboarding" ON public.company_onboarding FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all onboarding" ON public.company_onboarding FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- company_transfers
CREATE POLICY "Admins can insert transfers" ON public.company_transfers FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all transfers" ON public.company_transfers FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- company_visual_resources
CREATE POLICY "Admins can manage visual resources" ON public.company_visual_resources FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));
CREATE POLICY "Users can view resources for their company or global" ON public.company_visual_resources FOR SELECT USING (company_id IS NULL OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.company_id = company_visual_resources.company_id));

-- company_webinars
CREATE POLICY "Admins can manage company webinars" ON public.company_webinars FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));
CREATE POLICY "Employees can view their company webinars" ON public.company_webinars FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.company_id = company_webinars.company_id));

-- contact_messages
CREATE POLICY "Authenticated users can create messages" ON public.contact_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can view their own sent messages" ON public.contact_messages FOR SELECT USING (auth.uid() = sender_id);

-- csat_beta_questions
CREATE POLICY "Admins can manage beta questions" ON public.csat_beta_questions FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));
CREATE POLICY "Anyone can view active beta questions" ON public.csat_beta_questions FOR SELECT USING (is_active = true);

-- csat_responses
CREATE POLICY "Admins can view all CSAT responses" ON public.csat_responses FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));
CREATE POLICY "Users can insert their own CSAT responses" ON public.csat_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own CSAT responses" ON public.csat_responses FOR SELECT USING (auth.uid() = user_id);

-- csat_settings
CREATE POLICY "Admins can manage CSAT settings" ON public.csat_settings FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));
CREATE POLICY "Anyone can view CSAT settings" ON public.csat_settings FOR SELECT USING (true);

-- daily_logins
CREATE POLICY "System can update logins" ON public.daily_logins FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own logins" ON public.daily_logins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own logins" ON public.daily_logins FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- epargne_precaution_simulations
CREATE POLICY "Users can delete their own epargne precaution simulations" ON public.epargne_precaution_simulations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own epargne precaution simulations" ON public.epargne_precaution_simulations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own epargne precaution simulations" ON public.epargne_precaution_simulations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own epargne precaution simulations" ON public.epargne_precaution_simulations FOR SELECT USING (auth.uid() = user_id);

-- espp_lots
CREATE POLICY "Users can delete their own ESPP lots" ON public.espp_lots FOR DELETE USING (EXISTS (SELECT 1 FROM espp_plans WHERE espp_plans.id = espp_lots.plan_id AND espp_plans.user_id = auth.uid()));
CREATE POLICY "Users can insert their own ESPP lots" ON public.espp_lots FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM espp_plans WHERE espp_plans.id = espp_lots.plan_id AND espp_plans.user_id = auth.uid()));
CREATE POLICY "Users can update their own ESPP lots" ON public.espp_lots FOR UPDATE USING (EXISTS (SELECT 1 FROM espp_plans WHERE espp_plans.id = espp_lots.plan_id AND espp_plans.user_id = auth.uid()));
CREATE POLICY "Users can view their own ESPP lots" ON public.espp_lots FOR SELECT USING (EXISTS (SELECT 1 FROM espp_plans WHERE espp_plans.id = espp_lots.plan_id AND espp_plans.user_id = auth.uid()));

-- espp_plans
CREATE POLICY "Users can delete their own ESPP plans" ON public.espp_plans FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own ESPP plans" ON public.espp_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ESPP plans" ON public.espp_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own ESPP plans" ON public.espp_plans FOR SELECT USING (auth.uid() = user_id);

-- evaluation_keys
CREATE POLICY "Admins can manage evaluation_keys" ON public.evaluation_keys FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read evaluation_keys" ON public.evaluation_keys FOR SELECT USING (true);

-- evaluation_keys_registry
CREATE POLICY "Admins can manage evaluation keys" ON public.evaluation_keys_registry FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view evaluation keys" ON public.evaluation_keys_registry FOR SELECT TO authenticated USING (true);

-- expert_booking_landing_settings
CREATE POLICY "Anyone can view expert booking landing settings" ON public.expert_booking_landing_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert expert booking landing settings" ON public.expert_booking_landing_settings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update expert booking landing settings" ON public.expert_booking_landing_settings FOR UPDATE USING (auth.uid() IS NOT NULL);

-- features
CREATE POLICY "Admins can delete features" ON public.features FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert features" ON public.features FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update features" ON public.features FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view features" ON public.features FOR SELECT USING (true);

-- final_boss_settings
CREATE POLICY "Admins can manage final boss settings" ON public.final_boss_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view final boss settings" ON public.final_boss_settings FOR SELECT USING (true);

-- financial_products
CREATE POLICY "Admins can manage financial products" ON public.financial_products FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));
CREATE POLICY "Financial products are viewable by everyone" ON public.financial_products FOR SELECT USING (is_active = true);

-- financial_profile_required_fields
CREATE POLICY "Admins can manage required fields config" ON public.financial_profile_required_fields FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));
CREATE POLICY "Anyone can read required fields config" ON public.financial_profile_required_fields FOR SELECT USING (true);

-- financial_profile_settings
CREATE POLICY "Admins can insert financial profile settings" ON public.financial_profile_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update financial profile settings" ON public.financial_profile_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view financial profile settings" ON public.financial_profile_settings FOR SELECT USING (true);

-- footer_settings
CREATE POLICY "Admins can manage footer settings" ON public.footer_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view footer settings" ON public.footer_settings FOR SELECT USING (true);

-- forum_activity_logs
CREATE POLICY "Admins can view all activity logs" ON public.forum_activity_logs FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));
CREATE POLICY "System can insert activity logs" ON public.forum_activity_logs FOR INSERT WITH CHECK (auth.role() = 'service_role'::text);

-- forum_categories
CREATE POLICY "Anyone can view categories" ON public.forum_categories FOR SELECT TO authenticated USING (true);

-- forum_comment_likes
CREATE POLICY "Anyone can view comment likes" ON public.forum_comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like comments" ON public.forum_comment_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike comments" ON public.forum_comment_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- forum_comments
CREATE POLICY "Anyone can view comments" ON public.forum_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.forum_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete their own comments" ON public.forum_comments FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Users can update their own comments" ON public.forum_comments FOR UPDATE TO authenticated USING (auth.uid() = author_id);

-- forum_moderation_logs
CREATE POLICY "Moderators can insert moderation logs" ON public.forum_moderation_logs FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'contact_entreprise'::app_role));
CREATE POLICY "Moderators can view moderation logs" ON public.forum_moderation_logs FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'contact_entreprise'::app_role));

-- forum_moderation_reasons
CREATE POLICY "Admins can manage moderation reasons" ON public.forum_moderation_reasons FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can read moderation reasons" ON public.forum_moderation_reasons FOR SELECT USING (true);

-- forum_post_likes
CREATE POLICY "Anyone can view post likes" ON public.forum_post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like posts" ON public.forum_post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.forum_post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- forum_posts
CREATE POLICY "Anyone can view posts" ON public.forum_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete their own posts" ON public.forum_posts FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Users can update their own posts" ON public.forum_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);

-- forum_settings
CREATE POLICY "Admins can manage forum settings" ON public.forum_settings FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));
CREATE POLICY "Anyone can view forum settings" ON public.forum_settings FOR SELECT USING (true);

-- global_settings
CREATE POLICY "Admins can manage global settings" ON public.global_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active global settings" ON public.global_settings FOR SELECT USING (is_active = true);

-- hubspot_appointments
CREATE POLICY "Admins can delete appointments" ON public.hubspot_appointments FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all appointments" ON public.hubspot_appointments FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role can insert appointments" ON public.hubspot_appointments FOR INSERT WITH CHECK (auth.role() = 'service_role'::text);
CREATE POLICY "Users can view their own appointments" ON public.hubspot_appointments FOR SELECT USING (user_id = auth.uid());

-- lmnp_simulations
CREATE POLICY "Users can delete their own LMNP simulations" ON public.lmnp_simulations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own LMNP simulations" ON public.lmnp_simulations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own LMNP simulations" ON public.lmnp_simulations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own LMNP simulations" ON public.lmnp_simulations FOR SELECT USING (auth.uid() = user_id);

-- module_validation_settings
CREATE POLICY "Admins can update validation settings" ON public.module_validation_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view validation settings" ON public.module_validation_settings FOR SELECT USING (true);

-- module_validations
CREATE POLICY "Users can insert their own validation attempts" ON public.module_validations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own validation attempts" ON public.module_validations FOR SELECT USING (auth.uid() = user_id);

-- modules
CREATE POLICY "Admins can delete modules" ON public.modules FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert modules" ON public.modules FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update modules" ON public.modules FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view modules" ON public.modules FOR SELECT USING (true);

-- non_partner_welcome_settings
CREATE POLICY "Admins can manage non_partner_welcome_settings" ON public.non_partner_welcome_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view non_partner_welcome_settings" ON public.non_partner_welcome_settings FOR SELECT USING (true);

-- notification_logs
CREATE POLICY "Admins can manage logs" ON public.notification_logs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view their own logs" ON public.notification_logs FOR SELECT USING (auth.uid() = user_id);

-- notification_rules
CREATE POLICY "Admins can manage rules" ON public.notification_rules FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active rules" ON public.notification_rules FOR SELECT USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

-- notifications
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view notifications assigned to them" ON public.notifications FOR SELECT USING (EXISTS (SELECT 1 FROM user_notifications WHERE user_notifications.notification_id = notifications.id AND user_notifications.user_id = auth.uid()));

-- offers
CREATE POLICY "Admins can manage all offers" ON public.offers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active offers" ON public.offers FOR SELECT USING (is_active = true AND is_archived = false AND now() >= start_date AND now() <= end_date);

-- onboarding_responses
CREATE POLICY "Admins can read all onboarding responses" ON public.onboarding_responses FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));
CREATE POLICY "Users can insert own onboarding responses" ON public.onboarding_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own onboarding responses" ON public.onboarding_responses FOR SELECT USING (auth.uid() = user_id);

-- onboarding_scenes
CREATE POLICY "Admins can manage onboarding scenes" ON public.onboarding_scenes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active onboarding scenes" ON public.onboarding_scenes FOR SELECT USING (statut = true);

-- onboarding_screens
CREATE POLICY "Admins can manage onboarding screens" ON public.onboarding_screens FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));
CREATE POLICY "Anyone can read active onboarding screens" ON public.onboarding_screens FOR SELECT USING (is_active = true);

-- optimisation_fiscale_simulations
CREATE POLICY "Users can delete their own optimisation fiscale simulations" ON public.optimisation_fiscale_simulations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own optimisation fiscale simulations" ON public.optimisation_fiscale_simulations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own optimisation fiscale simulations" ON public.optimisation_fiscale_simulations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own optimisation fiscale simulations" ON public.optimisation_fiscale_simulations FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- parcours
CREATE POLICY "Admins can delete parcours" ON public.parcours FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert parcours" ON public.parcours FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update parcours" ON public.parcours FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view parcours" ON public.parcours FOR SELECT USING (true);

-- parcours_companies
CREATE POLICY "Admins can delete parcours_companies" ON public.parcours_companies FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert parcours_companies" ON public.parcours_companies FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update parcours_companies" ON public.parcours_companies FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view parcours_companies" ON public.parcours_companies FOR SELECT USING (true);

-- parcours_modules
CREATE POLICY "Admins can delete parcours_modules" ON public.parcours_modules FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert parcours_modules" ON public.parcours_modules FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update parcours_modules" ON public.parcours_modules FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view parcours_modules" ON public.parcours_modules FOR SELECT USING (true);

-- partnership_contact_requests
CREATE POLICY "Admins can delete partnership contact requests" ON public.partnership_contact_requests FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update partnership contact requests" ON public.partnership_contact_requests FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all partnership contact requests" ON public.partnership_contact_requests FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can create partnership contact requests" ON public.partnership_contact_requests FOR INSERT WITH CHECK (email IS NOT NULL AND email <> '' AND first_name IS NOT NULL AND first_name <> '' AND last_name IS NOT NULL AND last_name <> '' AND company IS NOT NULL AND company <> '' AND company_size IS NOT NULL AND company_size <> '');

-- partnership_requests
CREATE POLICY "Admins can delete partnership requests" ON public.partnership_requests FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update partnership requests" ON public.partnership_requests FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all partnership requests" ON public.partnership_requests FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create their own partnership requests" ON public.partnership_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own partnership requests" ON public.partnership_requests FOR SELECT USING (auth.uid() = user_id);

-- per_simulations
CREATE POLICY "Users can delete their own PER simulations" ON public.per_simulations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own PER simulations" ON public.per_simulations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own PER simulations" ON public.per_simulations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own PER simulations" ON public.per_simulations FOR SELECT USING (auth.uid() = user_id);

-- points_configuration
CREATE POLICY "Admins can manage points configuration" ON public.points_configuration FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view points configuration" ON public.points_configuration FOR SELECT TO authenticated USING (true);

-- points_history
CREATE POLICY "Admins can view all points history" ON public.points_history FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own points history" ON public.points_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own points history" ON public.points_history FOR SELECT USING (auth.uid() = user_id);

-- pret_immobilier_simulations
CREATE POLICY "Users can create their own simulations" ON public.pret_immobilier_simulations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own simulations" ON public.pret_immobilier_simulations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own simulations" ON public.pret_immobilier_simulations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own simulations" ON public.pret_immobilier_simulations FOR SELECT USING (auth.uid() = user_id);

-- profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- recommendation_rules
CREATE POLICY "Admins can manage recommendation rules" ON public.recommendation_rules FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active recommendation rules" ON public.recommendation_rules FOR SELECT USING (is_active = true);

-- referral_requests
CREATE POLICY "Admins can delete referral requests" ON public.referral_requests FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update referral requests" ON public.referral_requests FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all referral requests" ON public.referral_requests FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create referral requests" ON public.referral_requests FOR INSERT WITH CHECK (auth.uid() = referrer_id);
CREATE POLICY "Users can view their own referral requests" ON public.referral_requests FOR SELECT USING (auth.uid() = referrer_id);

-- registrations
CREATE POLICY "Admins can delete registrations" ON public.registrations FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update registrations" ON public.registrations FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all registrations" ON public.registrations FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can create registrations" ON public.registrations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- risk_answers
CREATE POLICY "Admins can delete answers" ON public.risk_answers FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert answers" ON public.risk_answers FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update answers" ON public.risk_answers FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Answers viewable by all" ON public.risk_answers FOR SELECT USING (true);

-- risk_profile
CREATE POLICY "Users insert own profile" ON public.risk_profile FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.risk_profile FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users view own profile" ON public.risk_profile FOR SELECT USING (auth.uid() = user_id);

-- risk_profile_settings
CREATE POLICY "Admins can insert settings" ON public.risk_profile_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update settings" ON public.risk_profile_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Settings viewable by all" ON public.risk_profile_settings FOR SELECT USING (true);

-- risk_questions
CREATE POLICY "Admins can delete questions" ON public.risk_questions FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert questions" ON public.risk_questions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update questions" ON public.risk_questions FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Questions viewable by all" ON public.risk_questions FOR SELECT USING (active = true);

-- role_permissions
CREATE POLICY "Admins can delete permissions" ON public.role_permissions FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert permissions" ON public.role_permissions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update permissions" ON public.role_permissions FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view permissions" ON public.role_permissions FOR SELECT USING (true);

-- sell_to_cover
CREATE POLICY "Users can delete their own sell-to-cover" ON public.sell_to_cover FOR DELETE USING (EXISTS (SELECT 1 FROM espp_lots JOIN espp_plans ON espp_lots.plan_id = espp_plans.id WHERE espp_lots.id = sell_to_cover.lot_id AND espp_plans.user_id = auth.uid()));
CREATE POLICY "Users can insert their own sell-to-cover" ON public.sell_to_cover FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM espp_lots JOIN espp_plans ON espp_lots.plan_id = espp_plans.id WHERE espp_lots.id = sell_to_cover.lot_id AND espp_plans.user_id = auth.uid()));
CREATE POLICY "Users can update their own sell-to-cover" ON public.sell_to_cover FOR UPDATE USING (EXISTS (SELECT 1 FROM espp_lots JOIN espp_plans ON espp_lots.plan_id = espp_plans.id WHERE espp_lots.id = sell_to_cover.lot_id AND espp_plans.user_id = auth.uid()));
CREATE POLICY "Users can view their own sell-to-cover" ON public.sell_to_cover FOR SELECT USING (EXISTS (SELECT 1 FROM espp_lots JOIN espp_plans ON espp_lots.plan_id = espp_plans.id WHERE espp_lots.id = sell_to_cover.lot_id AND espp_plans.user_id = auth.uid()));

-- settings
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view settings" ON public.settings FOR SELECT USING (true);

-- sidebar_configurations
CREATE POLICY "Anyone can read sidebar configurations" ON public.sidebar_configurations FOR SELECT USING (true);
CREATE POLICY "Only admins can modify sidebar configurations" ON public.sidebar_configurations FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

-- simulation_logs
CREATE POLICY "Admins can view all simulation logs" ON public.simulation_logs FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));
CREATE POLICY "Users can insert simulation logs" ON public.simulation_logs FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own simulation logs" ON public.simulation_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own simulation logs" ON public.simulation_logs FOR SELECT USING (auth.uid() = user_id);

-- simulations
CREATE POLICY "owner_insert_simulations" ON public.simulations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_or_admin_delete_simulations" ON public.simulations FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner_or_admin_select_simulations" ON public.simulations FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner_or_admin_update_simulations" ON public.simulations FOR UPDATE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- simulations_impots
CREATE POLICY "Users can delete their own tax simulations" ON public.simulations_impots FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tax simulations" ON public.simulations_impots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tax simulations" ON public.simulations_impots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own tax simulations" ON public.simulations_impots FOR SELECT USING (auth.uid() = user_id);

-- simulator_categories
CREATE POLICY "Admins can manage categories" ON public.simulator_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active categories" ON public.simulator_categories FOR SELECT USING (is_active = true);

-- simulator_ctas
CREATE POLICY "Admins can manage simulator CTAs" ON public.simulator_ctas FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active CTAs" ON public.simulator_ctas FOR SELECT USING (active = true OR has_role(auth.uid(), 'admin'::app_role));

-- simulators
CREATE POLICY "Admins can manage simulators" ON public.simulators FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active simulators" ON public.simulators FOR SELECT USING (is_active = true);

-- tax_declaration_requests
CREATE POLICY "Admins can delete all tax requests" ON public.tax_declaration_requests FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update all tax requests" ON public.tax_declaration_requests FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all tax requests" ON public.tax_declaration_requests FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create their own tax requests" ON public.tax_declaration_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tax requests" ON public.tax_declaration_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own tax requests" ON public.tax_declaration_requests FOR SELECT USING (auth.uid() = user_id);

-- themes
CREATE POLICY "Admins can manage themes" ON public.themes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active themes" ON public.themes FOR SELECT USING (is_active = true);

-- user_financial_profiles
CREATE POLICY "admin_delete_financial_profiles" ON public.user_financial_profiles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner_insert_financial_profiles" ON public.user_financial_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_or_admin_select_financial_profiles" ON public.user_financial_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "owner_or_admin_update_financial_profiles" ON public.user_financial_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- user_fiscal_profile
CREATE POLICY "Users can insert their own fiscal profile" ON public.user_fiscal_profile FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own fiscal profile" ON public.user_fiscal_profile FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own fiscal profile" ON public.user_fiscal_profile FOR SELECT USING (auth.uid() = user_id);

-- user_notifications
CREATE POLICY "Admins can manage all user notifications" ON public.user_notifications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete their own notifications" ON public.user_notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notification status" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own notifications" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);

-- user_offer_views
CREATE POLICY "Users can insert own offer views" ON public.user_offer_views FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own offer views" ON public.user_offer_views FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own offer views" ON public.user_offer_views FOR SELECT USING (auth.uid() = user_id);

-- user_parcours
CREATE POLICY "Admins can manage all user parcours" ON public.user_parcours FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view their own parcours" ON public.user_parcours FOR SELECT USING (auth.uid() = user_id);

-- user_real_estate_properties
CREATE POLICY "Users can create their own properties" ON public.user_real_estate_properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own properties" ON public.user_real_estate_properties FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own properties" ON public.user_real_estate_properties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own properties" ON public.user_real_estate_properties FOR SELECT USING (auth.uid() = user_id);

-- user_risk_responses
CREATE POLICY "Users insert own responses" ON public.user_risk_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own responses" ON public.user_risk_responses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users view own responses" ON public.user_risk_responses FOR SELECT USING (auth.uid() = user_id);

-- user_roles
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- ventes_espp
CREATE POLICY "Users can delete their own ESPP sales" ON public.ventes_espp FOR DELETE USING (EXISTS (SELECT 1 FROM espp_lots JOIN espp_plans ON espp_lots.plan_id = espp_plans.id WHERE espp_lots.id = ventes_espp.lot_id AND espp_plans.user_id = auth.uid()));
CREATE POLICY "Users can insert their own ESPP sales" ON public.ventes_espp FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM espp_lots JOIN espp_plans ON espp_lots.plan_id = espp_plans.id WHERE espp_lots.id = ventes_espp.lot_id AND espp_plans.user_id = auth.uid()));
CREATE POLICY "Users can update their own ESPP sales" ON public.ventes_espp FOR UPDATE USING (EXISTS (SELECT 1 FROM espp_lots JOIN espp_plans ON espp_lots.plan_id = espp_plans.id WHERE espp_lots.id = ventes_espp.lot_id AND espp_plans.user_id = auth.uid()));
CREATE POLICY "Users can view their own ESPP sales" ON public.ventes_espp FOR SELECT USING (EXISTS (SELECT 1 FROM espp_lots JOIN espp_plans ON espp_lots.plan_id = espp_plans.id WHERE espp_lots.id = ventes_espp.lot_id AND espp_plans.user_id = auth.uid()));

-- video_progress
CREATE POLICY "Users can create their own video progress" ON public.video_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own video progress" ON public.video_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own video progress" ON public.video_progress FOR SELECT USING (auth.uid() = user_id);

-- villains
CREATE POLICY "Admins can delete villains" ON public.villains FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert villains" ON public.villains FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update villains" ON public.villains FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view villains" ON public.villains FOR SELECT USING (true);

-- webinar_external_registrations
CREATE POLICY "Admins can view external registrations" ON public.webinar_external_registrations FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

-- webinar_registrations
CREATE POLICY "Admins can manage all webinar registrations" ON public.webinar_registrations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can register for webinars" ON public.webinar_registrations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view their own webinar registrations" ON public.webinar_registrations FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- 8. AUTH TRIGGER (à exécuter après création du projet Supabase)
-- ============================================================
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FIN DU DUMP
-- ============================================================
