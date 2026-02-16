export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      advisor_certifications: {
        Row: {
          advisor_id: string
          certification_id: string
          created_at: string
          id: string
        }
        Insert: {
          advisor_id: string
          certification_id: string
          created_at?: string
          id?: string
        }
        Update: {
          advisor_id?: string
          certification_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisor_certifications_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_certifications_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_ranks: {
        Row: {
          advisor_id: string
          created_at: string
          id: string
          rank: number
        }
        Insert: {
          advisor_id: string
          created_at?: string
          id?: string
          rank: number
        }
        Update: {
          advisor_id?: string
          created_at?: string
          id?: string
          rank?: number
        }
        Relationships: [
          {
            foreignKeyName: "advisor_ranks_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "advisors"
            referencedColumns: ["id"]
          },
        ]
      }
      advisors: {
        Row: {
          bio: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      appointment_forms: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          fillout_form_id: string
          fillout_form_url: string
          icon: string | null
          id: string
          is_active: boolean | null
          module_id: number | null
          name: string
          points_awarded: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          fillout_form_id: string
          fillout_form_url: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          module_id?: number | null
          name: string
          points_awarded?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          fillout_form_id?: string
          fillout_form_url?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          module_id?: number | null
          name?: string
          points_awarded?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_forms_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_preparation: {
        Row: {
          created_at: string
          id: string
          intention_note: string | null
          objectives: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intention_note?: string | null
          objectives?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intention_note?: string | null
          objectives?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appointment_preparation_documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          event_end_time: string
          event_start_time: string
          event_url: string | null
          extra_data: Json | null
          fillout_submission_id: string | null
          form_id: string | null
          id: string
          reschedule_url: string | null
          scheduled_with_email: string | null
          scheduled_with_name: string | null
          status: string | null
          timezone: string | null
          updated_at: string
          user_email: string
          user_full_name: string | null
          user_id: string
          user_phone: string | null
        }
        Insert: {
          created_at?: string
          event_end_time: string
          event_start_time: string
          event_url?: string | null
          extra_data?: Json | null
          fillout_submission_id?: string | null
          form_id?: string | null
          id?: string
          reschedule_url?: string | null
          scheduled_with_email?: string | null
          scheduled_with_name?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string
          user_email: string
          user_full_name?: string | null
          user_id: string
          user_phone?: string | null
        }
        Update: {
          created_at?: string
          event_end_time?: string
          event_start_time?: string
          event_url?: string | null
          extra_data?: Json | null
          fillout_submission_id?: string | null
          form_id?: string | null
          id?: string
          reschedule_url?: string | null
          scheduled_with_email?: string | null
          scheduled_with_name?: string | null
          status?: string | null
          timezone?: string | null
          updated_at?: string
          user_email?: string
          user_full_name?: string | null
          user_id?: string
          user_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "appointment_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      block_orders: {
        Row: {
          block_order: Json
          created_at: string
          id: string
          layout_config: Json | null
          page_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          block_order?: Json
          created_at?: string
          id?: string
          layout_config?: Json | null
          page_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          block_order?: Json
          created_at?: string
          id?: string
          layout_config?: Json | null
          page_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          color: string | null
          created_at: string
          display_order: number
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string
          category_id: string | null
          content: string
          cover_image_alt: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          category_id?: string | null
          content?: string
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          category_id?: string | null
          content?: string
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_referrers: {
        Row: {
          appointment_id: string | null
          created_at: string
          id: string
          matched_at: string | null
          referrer_label: string | null
          referrer_path: string
          user_email: string
          user_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          matched_at?: string | null
          referrer_label?: string | null
          referrer_path: string
          user_email: string
          user_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          matched_at?: string | null
          referrer_label?: string | null
          referrer_path?: string
          user_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_referrers_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "hubspot_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_referrers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      capacite_emprunt_simulations: {
        Row: {
          allocations_chomage: number
          apport_personnel: number
          autres_charges: number
          autres_revenus: number
          capacite_emprunt: number | null
          charges_fixes: number
          created_at: string
          credit_auto: number
          credit_conso: number
          credit_immo: number
          duree_annees: number
          frais_notaire: number
          id: string
          indemnites_maladie: number
          loyer_actuel: number
          mensualite_maximale: number | null
          montant_projet_max: number | null
          nom_simulation: string
          pensions_alimentaires: number
          reste_a_vivre: number | null
          reste_a_vivre_futur: number | null
          revenu_mensuel_net: number
          revenus_capital: number
          revenus_locatifs: number
          salaires: number
          taux_assurance: number
          taux_endettement_actuel: number | null
          taux_endettement_futur: number | null
          taux_interet: number
          taux_utilisation_capacite: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allocations_chomage?: number
          apport_personnel?: number
          autres_charges?: number
          autres_revenus?: number
          capacite_emprunt?: number | null
          charges_fixes?: number
          created_at?: string
          credit_auto?: number
          credit_conso?: number
          credit_immo?: number
          duree_annees?: number
          frais_notaire?: number
          id?: string
          indemnites_maladie?: number
          loyer_actuel?: number
          mensualite_maximale?: number | null
          montant_projet_max?: number | null
          nom_simulation: string
          pensions_alimentaires?: number
          reste_a_vivre?: number | null
          reste_a_vivre_futur?: number | null
          revenu_mensuel_net?: number
          revenus_capital?: number
          revenus_locatifs?: number
          salaires?: number
          taux_assurance?: number
          taux_endettement_actuel?: number | null
          taux_endettement_futur?: number | null
          taux_interet?: number
          taux_utilisation_capacite?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allocations_chomage?: number
          apport_personnel?: number
          autres_charges?: number
          autres_revenus?: number
          capacite_emprunt?: number | null
          charges_fixes?: number
          created_at?: string
          credit_auto?: number
          credit_conso?: number
          credit_immo?: number
          duree_annees?: number
          frais_notaire?: number
          id?: string
          indemnites_maladie?: number
          loyer_actuel?: number
          mensualite_maximale?: number | null
          montant_projet_max?: number | null
          nom_simulation?: string
          pensions_alimentaires?: number
          reste_a_vivre?: number | null
          reste_a_vivre_futur?: number | null
          revenu_mensuel_net?: number
          revenus_capital?: number
          revenus_locatifs?: number
          salaires?: number
          taux_assurance?: number
          taux_endettement_actuel?: number | null
          taux_endettement_futur?: number | null
          taux_interet?: number
          taux_utilisation_capacite?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      celebration_settings: {
        Row: {
          button_text: string | null
          button_url: string | null
          created_at: string
          gradient_end: string | null
          gradient_middle: string | null
          gradient_start: string | null
          id: string
          motivational_message: string | null
          show_confetti: boolean | null
          show_points: boolean | null
          subtitle: string | null
          title: string | null
          updated_at: string
          video_enabled: boolean | null
          video_url: string | null
        }
        Insert: {
          button_text?: string | null
          button_url?: string | null
          created_at?: string
          gradient_end?: string | null
          gradient_middle?: string | null
          gradient_start?: string | null
          id?: string
          motivational_message?: string | null
          show_confetti?: boolean | null
          show_points?: boolean | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          video_enabled?: boolean | null
          video_url?: string | null
        }
        Update: {
          button_text?: string | null
          button_url?: string | null
          created_at?: string
          gradient_end?: string | null
          gradient_middle?: string | null
          gradient_start?: string | null
          id?: string
          motivational_message?: string | null
          show_confetti?: boolean | null
          show_points?: boolean | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          video_enabled?: boolean | null
          video_url?: string | null
        }
        Relationships: []
      }
      certifications: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_logos: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          logo_url: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          logo_url: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          logo_url?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      colleague_invitations: {
        Row: {
          colleague_email: string
          colleague_first_name: string
          colleague_last_name: string
          colleague_phone: string | null
          company_id: string
          created_at: string
          email_opened_at: string | null
          email_sent_at: string | null
          external_company_name: string | null
          id: string
          invitation_token: string | null
          inviter_id: string
          is_external: boolean | null
          link_clicked_at: string | null
          message: string | null
          registered_at: string | null
          registered_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          colleague_email: string
          colleague_first_name: string
          colleague_last_name: string
          colleague_phone?: string | null
          company_id: string
          created_at?: string
          email_opened_at?: string | null
          email_sent_at?: string | null
          external_company_name?: string | null
          id?: string
          invitation_token?: string | null
          inviter_id: string
          is_external?: boolean | null
          link_clicked_at?: string | null
          message?: string | null
          registered_at?: string | null
          registered_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          colleague_email?: string
          colleague_first_name?: string
          colleague_last_name?: string
          colleague_phone?: string | null
          company_id?: string
          created_at?: string
          email_opened_at?: string | null
          email_sent_at?: string | null
          external_company_name?: string | null
          id?: string
          invitation_token?: string | null
          inviter_id?: string
          is_external?: boolean | null
          link_clicked_at?: string | null
          message?: string | null
          registered_at?: string | null
          registered_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "colleague_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colleague_invitations_registered_user_id_fkey"
            columns: ["registered_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_templates: {
        Row: {
          communication_type: string
          created_at: string
          deadline: string
          id: string
          is_active: boolean | null
          template_content: string
          updated_at: string
        }
        Insert: {
          communication_type: string
          created_at?: string
          deadline: string
          id?: string
          is_active?: boolean | null
          template_content: string
          updated_at?: string
        }
        Update: {
          communication_type?: string
          created_at?: string
          deadline?: string
          id?: string
          is_active?: boolean | null
          template_content?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          banner_url: string | null
          canal_communication_autre: string | null
          company_size: number | null
          compensation_devices: Json | null
          cover_url: string | null
          created_at: string
          documents_resources: Json | null
          email_domains: string[] | null
          employee_locations: string[] | null
          enable_points_ranking: boolean
          expert_booking_hubspot_embed: string | null
          expert_booking_url: string | null
          forum_access_all_discussions: boolean | null
          has_foreign_employees: boolean | null
          hr_challenges: Json | null
          id: string
          internal_communications: Json | null
          internal_initiatives: Json | null
          logo_url: string | null
          max_tax_declarations: number | null
          name: string
          niveau_maturite_financiere: string | null
          partnership_type: string | null
          primary_color: string | null
          rang: number | null
          referral_typeform_url: string | null
          secondary_color: string | null
          simulators_config: Json | null
          tax_declaration_help_enabled: boolean | null
          tax_permanence_config: Json | null
          webinar_replays: Json | null
          work_mode: string | null
        }
        Insert: {
          banner_url?: string | null
          canal_communication_autre?: string | null
          company_size?: number | null
          compensation_devices?: Json | null
          cover_url?: string | null
          created_at?: string
          documents_resources?: Json | null
          email_domains?: string[] | null
          employee_locations?: string[] | null
          enable_points_ranking?: boolean
          expert_booking_hubspot_embed?: string | null
          expert_booking_url?: string | null
          forum_access_all_discussions?: boolean | null
          has_foreign_employees?: boolean | null
          hr_challenges?: Json | null
          id?: string
          internal_communications?: Json | null
          internal_initiatives?: Json | null
          logo_url?: string | null
          max_tax_declarations?: number | null
          name: string
          niveau_maturite_financiere?: string | null
          partnership_type?: string | null
          primary_color?: string | null
          rang?: number | null
          referral_typeform_url?: string | null
          secondary_color?: string | null
          simulators_config?: Json | null
          tax_declaration_help_enabled?: boolean | null
          tax_permanence_config?: Json | null
          webinar_replays?: Json | null
          work_mode?: string | null
        }
        Update: {
          banner_url?: string | null
          canal_communication_autre?: string | null
          company_size?: number | null
          compensation_devices?: Json | null
          cover_url?: string | null
          created_at?: string
          documents_resources?: Json | null
          email_domains?: string[] | null
          employee_locations?: string[] | null
          enable_points_ranking?: boolean
          expert_booking_hubspot_embed?: string | null
          expert_booking_url?: string | null
          forum_access_all_discussions?: boolean | null
          has_foreign_employees?: boolean | null
          hr_challenges?: Json | null
          id?: string
          internal_communications?: Json | null
          internal_initiatives?: Json | null
          logo_url?: string | null
          max_tax_declarations?: number | null
          name?: string
          niveau_maturite_financiere?: string | null
          partnership_type?: string | null
          primary_color?: string | null
          rang?: number | null
          referral_typeform_url?: string | null
          secondary_color?: string | null
          simulators_config?: Json | null
          tax_declaration_help_enabled?: boolean | null
          tax_permanence_config?: Json | null
          webinar_replays?: Json | null
          work_mode?: string | null
        }
        Relationships: []
      }
      company_contacts: {
        Row: {
          company_id: string
          created_at: string
          email: string
          id: string
          is_forum_moderator: boolean | null
          nom: string
          photo_url: string | null
          role_contact: string | null
          telephone: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          id?: string
          is_forum_moderator?: boolean | null
          nom: string
          photo_url?: string | null
          role_contact?: string | null
          telephone?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          is_forum_moderator?: boolean | null
          nom?: string
          photo_url?: string | null
          role_contact?: string | null
          telephone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_faqs: {
        Row: {
          answer: string
          category: string | null
          company_id: string | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          company_id?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          company_id?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_faqs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_modules: {
        Row: {
          company_id: string
          created_at: string
          custom_order: number | null
          id: string
          is_active: boolean
          module_id: number
        }
        Insert: {
          company_id: string
          created_at?: string
          custom_order?: number | null
          id?: string
          is_active?: boolean
          module_id: number
        }
        Update: {
          company_id?: string
          created_at?: string
          custom_order?: number | null
          id?: string
          is_active?: boolean
          module_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      company_onboarding: {
        Row: {
          company_id: string | null
          created_at: string
          etape_actuelle: number
          id: string
          onboarding_termine: boolean
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          etape_actuelle?: number
          id?: string
          onboarding_termine?: boolean
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          etape_actuelle?: number
          id?: string
          onboarding_termine?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_onboarding_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_transfers: {
        Row: {
          created_at: string
          from_company_id: string | null
          id: string
          notes: string | null
          to_company_id: string
          transfer_options: Json | null
          transferred_by: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_company_id?: string | null
          id?: string
          notes?: string | null
          to_company_id: string
          transfer_options?: Json | null
          transferred_by: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_company_id?: string | null
          id?: string
          notes?: string | null
          to_company_id?: string
          transfer_options?: Json | null
          transferred_by?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_transfers_from_company_id_fkey"
            columns: ["from_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_transfers_to_company_id_fkey"
            columns: ["to_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_visual_resources: {
        Row: {
          category: string | null
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_visual_resources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_webinars: {
        Row: {
          company_id: string
          created_at: string
          id: string
          module_id: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          module_id: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          module_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_webinars_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_webinars_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          recipient_id: string | null
          recipient_type: string
          sender_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          recipient_id?: string | null
          recipient_type: string
          sender_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          recipient_id?: string | null
          recipient_type?: string
          sender_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      csat_beta_questions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          options: Json | null
          priority_order: number
          question_text: string
          question_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          options?: Json | null
          priority_order?: number
          question_text: string
          question_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          options?: Json | null
          priority_order?: number
          question_text?: string
          question_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      csat_responses: {
        Row: {
          beta_responses: Json | null
          completed_at: string
          completion_status: string
          content_id: string
          content_name: string
          content_quality_score: number | null
          content_type: string
          created_at: string
          experience_score: number | null
          expert_intent: string | null
          id: string
          improvement_feedback: string | null
          information_level: string | null
          parcours_id: string | null
          positive_feedback: string | null
          relevance_score: number | null
          user_id: string | null
          user_level: string | null
          visual_score: number | null
        }
        Insert: {
          beta_responses?: Json | null
          completed_at?: string
          completion_status?: string
          content_id: string
          content_name: string
          content_quality_score?: number | null
          content_type: string
          created_at?: string
          experience_score?: number | null
          expert_intent?: string | null
          id?: string
          improvement_feedback?: string | null
          information_level?: string | null
          parcours_id?: string | null
          positive_feedback?: string | null
          relevance_score?: number | null
          user_id?: string | null
          user_level?: string | null
          visual_score?: number | null
        }
        Update: {
          beta_responses?: Json | null
          completed_at?: string
          completion_status?: string
          content_id?: string
          content_name?: string
          content_quality_score?: number | null
          content_type?: string
          created_at?: string
          experience_score?: number | null
          expert_intent?: string | null
          id?: string
          improvement_feedback?: string | null
          information_level?: string | null
          parcours_id?: string | null
          positive_feedback?: string | null
          relevance_score?: number | null
          user_id?: string | null
          user_level?: string | null
          visual_score?: number | null
        }
        Relationships: []
      }
      csat_settings: {
        Row: {
          alert_complex_percentage: number | null
          alert_low_score_threshold: number | null
          alert_unclear_next_step_percentage: number | null
          beta_questions_count: number
          created_at: string
          csat_enabled: boolean
          disabled_module_ids: number[] | null
          enabled_for_financial_profile: boolean
          enabled_for_modules: boolean
          enabled_for_onboarding: boolean
          enabled_for_parcours: boolean
          enabled_for_simulators: boolean
          expert_intent_enabled: boolean
          id: string
          updated_at: string
        }
        Insert: {
          alert_complex_percentage?: number | null
          alert_low_score_threshold?: number | null
          alert_unclear_next_step_percentage?: number | null
          beta_questions_count?: number
          created_at?: string
          csat_enabled?: boolean
          disabled_module_ids?: number[] | null
          enabled_for_financial_profile?: boolean
          enabled_for_modules?: boolean
          enabled_for_onboarding?: boolean
          enabled_for_parcours?: boolean
          enabled_for_simulators?: boolean
          expert_intent_enabled?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          alert_complex_percentage?: number | null
          alert_low_score_threshold?: number | null
          alert_unclear_next_step_percentage?: number | null
          beta_questions_count?: number
          created_at?: string
          csat_enabled?: boolean
          disabled_module_ids?: number[] | null
          enabled_for_financial_profile?: boolean
          enabled_for_modules?: boolean
          enabled_for_onboarding?: boolean
          enabled_for_parcours?: boolean
          enabled_for_simulators?: boolean
          expert_intent_enabled?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_logins: {
        Row: {
          created_at: string | null
          id: string
          login_date: string
          points_awarded: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          login_date?: string
          points_awarded?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          login_date?: string
          points_awarded?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      diagnostic_configs: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      diagnostic_results: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string
          elapsed_seconds: number | null
          id: string
          score_percent: number | null
          section_scores: Json | null
          status: string
          total_max: number | null
          total_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          elapsed_seconds?: number | null
          id?: string
          score_percent?: number | null
          section_scores?: Json | null
          status?: string
          total_max?: number | null
          total_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          elapsed_seconds?: number | null
          id?: string
          score_percent?: number | null
          section_scores?: Json | null
          status?: string
          total_max?: number | null
          total_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      epargne_precaution_simulations: {
        Row: {
          capacite_epargne_mensuelle: number
          charges_abonnements: number | null
          charges_assurance_auto: number | null
          charges_assurance_habitation: number | null
          charges_autres: number | null
          charges_copropriete_taxes: number | null
          charges_energie: number | null
          charges_fixes_mensuelles: number
          charges_frais_scolarite: number | null
          charges_internet: number | null
          charges_lld_loa_auto: number | null
          charges_loyer_credit: number | null
          charges_mobile: number | null
          charges_transport_commun: number | null
          coefficient_metier: number
          created_at: string
          cta_affiche: string | null
          depenses_mensuelles: number
          epargne_actuelle: number
          epargne_manquante: number
          epargne_mensuelle_optimale: number | null
          epargne_recommandee: number
          id: string
          indice_resilience: number
          message_personnalise: string | null
          nb_mois_securite: number
          niveau_securite: string
          nom_simulation: string
          nombre_personnes: number
          revenu_mensuel: number
          temps_pour_objectif: number | null
          type_contrat: string | null
          type_metier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capacite_epargne_mensuelle: number
          charges_abonnements?: number | null
          charges_assurance_auto?: number | null
          charges_assurance_habitation?: number | null
          charges_autres?: number | null
          charges_copropriete_taxes?: number | null
          charges_energie?: number | null
          charges_fixes_mensuelles: number
          charges_frais_scolarite?: number | null
          charges_internet?: number | null
          charges_lld_loa_auto?: number | null
          charges_loyer_credit?: number | null
          charges_mobile?: number | null
          charges_transport_commun?: number | null
          coefficient_metier: number
          created_at?: string
          cta_affiche?: string | null
          depenses_mensuelles: number
          epargne_actuelle: number
          epargne_manquante: number
          epargne_mensuelle_optimale?: number | null
          epargne_recommandee: number
          id?: string
          indice_resilience: number
          message_personnalise?: string | null
          nb_mois_securite: number
          niveau_securite: string
          nom_simulation: string
          nombre_personnes?: number
          revenu_mensuel: number
          temps_pour_objectif?: number | null
          type_contrat?: string | null
          type_metier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          capacite_epargne_mensuelle?: number
          charges_abonnements?: number | null
          charges_assurance_auto?: number | null
          charges_assurance_habitation?: number | null
          charges_autres?: number | null
          charges_copropriete_taxes?: number | null
          charges_energie?: number | null
          charges_fixes_mensuelles?: number
          charges_frais_scolarite?: number | null
          charges_internet?: number | null
          charges_lld_loa_auto?: number | null
          charges_loyer_credit?: number | null
          charges_mobile?: number | null
          charges_transport_commun?: number | null
          coefficient_metier?: number
          created_at?: string
          cta_affiche?: string | null
          depenses_mensuelles?: number
          epargne_actuelle?: number
          epargne_manquante?: number
          epargne_mensuelle_optimale?: number | null
          epargne_recommandee?: number
          id?: string
          indice_resilience?: number
          message_personnalise?: string | null
          nb_mois_securite?: number
          niveau_securite?: string
          nom_simulation?: string
          nombre_personnes?: number
          revenu_mensuel?: number
          temps_pour_objectif?: number | null
          type_contrat?: string | null
          type_metier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      espp_lots: {
        Row: {
          broker_transaction_id: string | null
          created_at: string | null
          date_acquisition: string
          fmv_retenu_plan: number
          frais_achat: number | null
          gain_acquisition_par_action: number
          gain_acquisition_total_devise: number
          gain_acquisition_total_eur: number
          id: string
          plan_id: string
          prix_achat_unitaire_devise: number
          pru_fiscal_eur: number
          quantite_achetee_brut: number
          updated_at: string | null
        }
        Insert: {
          broker_transaction_id?: string | null
          created_at?: string | null
          date_acquisition: string
          fmv_retenu_plan: number
          frais_achat?: number | null
          gain_acquisition_par_action: number
          gain_acquisition_total_devise: number
          gain_acquisition_total_eur: number
          id?: string
          plan_id: string
          prix_achat_unitaire_devise: number
          pru_fiscal_eur: number
          quantite_achetee_brut: number
          updated_at?: string | null
        }
        Update: {
          broker_transaction_id?: string | null
          created_at?: string | null
          date_acquisition?: string
          fmv_retenu_plan?: number
          frais_achat?: number | null
          gain_acquisition_par_action?: number
          gain_acquisition_total_devise?: number
          gain_acquisition_total_eur?: number
          id?: string
          plan_id?: string
          prix_achat_unitaire_devise?: number
          pru_fiscal_eur?: number
          quantite_achetee_brut?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "espp_lots_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "espp_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      espp_plans: {
        Row: {
          broker: string | null
          created_at: string | null
          date_debut: string
          date_fin: string
          devise_plan: string | null
          discount_pct: number | null
          entreprise: string
          fmv_debut: number
          fmv_fin: number
          id: string
          lookback: boolean | null
          montant_investi: number
          nom_plan: string
          taux_change_payroll: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          broker?: string | null
          created_at?: string | null
          date_debut: string
          date_fin: string
          devise_plan?: string | null
          discount_pct?: number | null
          entreprise: string
          fmv_debut: number
          fmv_fin: number
          id?: string
          lookback?: boolean | null
          montant_investi: number
          nom_plan: string
          taux_change_payroll: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          broker?: string | null
          created_at?: string | null
          date_debut?: string
          date_fin?: string
          devise_plan?: string | null
          discount_pct?: number | null
          entreprise?: string
          fmv_debut?: number
          fmv_fin?: number
          id?: string
          lookback?: boolean | null
          montant_investi?: number
          nom_plan?: string
          taux_change_payroll?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      evaluation_keys: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          key_name: string
          label: string
          source_column: string | null
          source_table: string | null
          source_type: string
          unit: string | null
          updated_at: string
          value_type: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          key_name: string
          label: string
          source_column?: string | null
          source_table?: string | null
          source_type: string
          unit?: string | null
          updated_at?: string
          value_type?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          key_name?: string
          label?: string
          source_column?: string | null
          source_table?: string | null
          source_type?: string
          unit?: string | null
          updated_at?: string
          value_type?: string
        }
        Relationships: []
      }
      evaluation_keys_registry: {
        Row: {
          category: string
          created_at: string
          description: string | null
          formula: string | null
          id: string
          is_auto_generated: boolean | null
          is_calculated: boolean | null
          key: string
          label: string
          source: string
          type: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          formula?: string | null
          id?: string
          is_auto_generated?: boolean | null
          is_calculated?: boolean | null
          key: string
          label: string
          source: string
          type?: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          formula?: string | null
          id?: string
          is_auto_generated?: boolean | null
          is_calculated?: boolean | null
          key?: string
          label?: string
          source?: string
          type?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expert_booking_landing_settings: {
        Row: {
          benefits: Json | null
          created_at: string
          cta_secondary_text: string | null
          cta_text: string | null
          expertises: Json | null
          footer_text: string | null
          gallery_images: Json | null
          gallery_subtitle: string | null
          gallery_title: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          testimonial_author: string | null
          testimonial_enabled: boolean | null
          testimonial_role: string | null
          testimonial_text: string | null
          updated_at: string
        }
        Insert: {
          benefits?: Json | null
          created_at?: string
          cta_secondary_text?: string | null
          cta_text?: string | null
          expertises?: Json | null
          footer_text?: string | null
          gallery_images?: Json | null
          gallery_subtitle?: string | null
          gallery_title?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          testimonial_author?: string | null
          testimonial_enabled?: boolean | null
          testimonial_role?: string | null
          testimonial_text?: string | null
          updated_at?: string
        }
        Update: {
          benefits?: Json | null
          created_at?: string
          cta_secondary_text?: string | null
          cta_text?: string | null
          expertises?: Json | null
          footer_text?: string | null
          gallery_images?: Json | null
          gallery_subtitle?: string | null
          gallery_title?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          testimonial_author?: string | null
          testimonial_enabled?: boolean | null
          testimonial_role?: string | null
          testimonial_text?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      features: {
        Row: {
          active: boolean
          categorie: string
          cle_technique: string
          created_at: string | null
          description: string | null
          id: string
          nom_fonctionnalite: string
          requires_partnership: boolean | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          categorie: string
          cle_technique: string
          created_at?: string | null
          description?: string | null
          id?: string
          nom_fonctionnalite: string
          requires_partnership?: boolean | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          categorie?: string
          cle_technique?: string
          created_at?: string | null
          description?: string | null
          id?: string
          nom_fonctionnalite?: string
          requires_partnership?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      final_boss_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          nom: string
          theme_data: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          nom?: string
          theme_data?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          nom?: string
          theme_data?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      financial_product_partners: {
        Row: {
          created_at: string
          display_order: number
          id: string
          logo_url: string | null
          name: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          logo_url?: string | null
          name: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          logo_url?: string | null
          name?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_product_partners_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "financial_products"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_products: {
        Row: {
          availability: string | null
          availability_icon: string | null
          benefits: Json | null
          category: string | null
          created_at: string
          cta_secondary_text: string | null
          cta_secondary_url: string | null
          cta_text: string | null
          cta_url: string | null
          description: string | null
          disclaimer_specific: string | null
          display_order: number | null
          expert_tip_content: string | null
          expert_tip_icon: string | null
          expert_tip_title: string | null
          fiscal_after_label: string | null
          fiscal_after_value: string | null
          fiscal_before_label: string | null
          fiscal_before_value: string | null
          fiscal_comparison_enabled: boolean | null
          fiscal_explanation: string | null
          fiscal_savings_label: string | null
          fiscal_savings_value: string | null
          gradient_end: string | null
          gradient_start: string | null
          hero_image_url: string | null
          horizon_max_years: number | null
          horizon_min_years: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          liquidity_type: string | null
          max_amount: string | null
          max_amount_label: string | null
          name: string
          risk_label: string | null
          risk_level: number | null
          slug: string
          tagline: string | null
          tags: string[] | null
          target_return: string | null
          target_return_label: string | null
          updated_at: string
        }
        Insert: {
          availability?: string | null
          availability_icon?: string | null
          benefits?: Json | null
          category?: string | null
          created_at?: string
          cta_secondary_text?: string | null
          cta_secondary_url?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          disclaimer_specific?: string | null
          display_order?: number | null
          expert_tip_content?: string | null
          expert_tip_icon?: string | null
          expert_tip_title?: string | null
          fiscal_after_label?: string | null
          fiscal_after_value?: string | null
          fiscal_before_label?: string | null
          fiscal_before_value?: string | null
          fiscal_comparison_enabled?: boolean | null
          fiscal_explanation?: string | null
          fiscal_savings_label?: string | null
          fiscal_savings_value?: string | null
          gradient_end?: string | null
          gradient_start?: string | null
          hero_image_url?: string | null
          horizon_max_years?: number | null
          horizon_min_years?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          liquidity_type?: string | null
          max_amount?: string | null
          max_amount_label?: string | null
          name: string
          risk_label?: string | null
          risk_level?: number | null
          slug: string
          tagline?: string | null
          tags?: string[] | null
          target_return?: string | null
          target_return_label?: string | null
          updated_at?: string
        }
        Update: {
          availability?: string | null
          availability_icon?: string | null
          benefits?: Json | null
          category?: string | null
          created_at?: string
          cta_secondary_text?: string | null
          cta_secondary_url?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          disclaimer_specific?: string | null
          display_order?: number | null
          expert_tip_content?: string | null
          expert_tip_icon?: string | null
          expert_tip_title?: string | null
          fiscal_after_label?: string | null
          fiscal_after_value?: string | null
          fiscal_before_label?: string | null
          fiscal_before_value?: string | null
          fiscal_comparison_enabled?: boolean | null
          fiscal_explanation?: string | null
          fiscal_savings_label?: string | null
          fiscal_savings_value?: string | null
          gradient_end?: string | null
          gradient_start?: string | null
          hero_image_url?: string | null
          horizon_max_years?: number | null
          horizon_min_years?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          liquidity_type?: string | null
          max_amount?: string | null
          max_amount_label?: string | null
          name?: string
          risk_label?: string | null
          risk_level?: number | null
          slug?: string
          tagline?: string | null
          tags?: string[] | null
          target_return?: string | null
          target_return_label?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      financial_profile_required_fields: {
        Row: {
          created_at: string
          display_order: number
          field_key: string
          field_label: string
          id: string
          is_required: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          field_key: string
          field_label: string
          id?: string
          is_required?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          field_key?: string
          field_label?: string
          id?: string
          is_required?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      financial_profile_settings: {
        Row: {
          benefits: Json | null
          created_at: string
          cta_text: string | null
          footer_note: string | null
          hero_description: string | null
          hero_title: string | null
          id: string
          updated_at: string
        }
        Insert: {
          benefits?: Json | null
          created_at?: string
          cta_text?: string | null
          footer_note?: string | null
          hero_description?: string | null
          hero_title?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          benefits?: Json | null
          created_at?: string
          cta_text?: string | null
          footer_note?: string | null
          hero_description?: string | null
          hero_title?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      footer_settings: {
        Row: {
          company_text: string | null
          contact_email: string | null
          copyright_text: string | null
          created_at: string
          id: string
          legal_mentions: string | null
          privacy_policy_url: string | null
          show_powered_by: boolean | null
          social_links: Json | null
          terms_url: string | null
          updated_at: string
        }
        Insert: {
          company_text?: string | null
          contact_email?: string | null
          copyright_text?: string | null
          created_at?: string
          id?: string
          legal_mentions?: string | null
          privacy_policy_url?: string | null
          show_powered_by?: boolean | null
          social_links?: Json | null
          terms_url?: string | null
          updated_at?: string
        }
        Update: {
          company_text?: string | null
          contact_email?: string | null
          copyright_text?: string | null
          created_at?: string
          id?: string
          legal_mentions?: string | null
          privacy_policy_url?: string | null
          show_powered_by?: boolean | null
          social_links?: Json | null
          terms_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      forum_activity_logs: {
        Row: {
          action_type: string
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          color: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          order_num: number
          slug: string
        }
        Insert: {
          color?: string
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          order_num: number
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          order_num?: number
          slug?: string
        }
        Relationships: []
      }
      forum_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "forum_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason_id: string | null
          display_avatar_url: string | null
          display_pseudo: string | null
          id: string
          is_anonymous: boolean | null
          is_best_answer: boolean | null
          is_deleted: boolean | null
          parent_comment_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason_id?: string | null
          display_avatar_url?: string | null
          display_pseudo?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_best_answer?: boolean | null
          is_deleted?: boolean | null
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason_id?: string | null
          display_avatar_url?: string | null
          display_pseudo?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_best_answer?: boolean | null
          is_deleted?: boolean | null
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_comments_deletion_reason_id_fkey"
            columns: ["deletion_reason_id"]
            isOneToOne: false
            referencedRelation: "forum_moderation_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "forum_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_moderation_logs: {
        Row: {
          action: string
          created_at: string | null
          custom_reason: string | null
          id: string
          moderator_id: string | null
          reason_id: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action?: string
          created_at?: string | null
          custom_reason?: string | null
          id?: string
          moderator_id?: string | null
          reason_id?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          created_at?: string | null
          custom_reason?: string | null
          id?: string
          moderator_id?: string | null
          reason_id?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      forum_moderation_reasons: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          label: string
          order_num: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          order_num?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          order_num?: number | null
        }
        Relationships: []
      }
      forum_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          category_id: string
          content: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason_id: string | null
          display_avatar_url: string | null
          display_pseudo: string | null
          has_best_answer: boolean | null
          id: string
          is_anonymous: boolean | null
          is_closed: boolean | null
          is_deleted: boolean | null
          is_pinned: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          author_id: string
          category_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason_id?: string | null
          display_avatar_url?: string | null
          display_pseudo?: string | null
          has_best_answer?: boolean | null
          id?: string
          is_anonymous?: boolean | null
          is_closed?: boolean | null
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          author_id?: string
          category_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason_id?: string | null
          display_avatar_url?: string | null
          display_pseudo?: string | null
          has_best_answer?: boolean | null
          id?: string
          is_anonymous?: boolean | null
          is_closed?: boolean | null
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: []
      }
      forum_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      global_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean
          key: string
          label: string
          updated_at: string
          validation_max: number | null
          validation_min: number | null
          value: Json
          value_type: string
          year: number | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          key: string
          label: string
          updated_at?: string
          validation_max?: number | null
          validation_min?: number | null
          value: Json
          value_type?: string
          year?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          updated_at?: string
          validation_max?: number | null
          validation_min?: number | null
          value?: Json
          value_type?: string
          year?: number | null
        }
        Relationships: []
      }
      horizon_budgets: {
        Row: {
          created_at: string
          id: string
          total_initial_capital: number
          total_monthly_savings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          total_initial_capital?: number
          total_monthly_savings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          total_initial_capital?: number
          total_monthly_savings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      horizon_project_categories: {
        Row: {
          color: string
          created_at: string
          display_order: number
          icon: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      horizon_projects: {
        Row: {
          annual_return_rate: number | null
          apport: number
          category_id: string | null
          created_at: string
          custom_category: string | null
          duration_months: number | null
          icon: string
          id: string
          monthly_allocation: number
          name: string
          notes: string | null
          placement_product_id: string | null
          status: string
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_return_rate?: number | null
          apport?: number
          category_id?: string | null
          created_at?: string
          custom_category?: string | null
          duration_months?: number | null
          icon?: string
          id?: string
          monthly_allocation?: number
          name: string
          notes?: string | null
          placement_product_id?: string | null
          status?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_return_rate?: number | null
          apport?: number
          category_id?: string | null
          created_at?: string
          custom_category?: string | null
          duration_months?: number | null
          icon?: string
          id?: string
          monthly_allocation?: number
          name?: string
          notes?: string | null
          placement_product_id?: string | null
          status?: string
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horizon_projects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "horizon_project_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horizon_projects_placement_product_id_fkey"
            columns: ["placement_product_id"]
            isOneToOne: false
            referencedRelation: "financial_products"
            referencedColumns: ["id"]
          },
        ]
      }
      hubspot_appointments: {
        Row: {
          booking_source: string | null
          company_id: string | null
          created_at: string
          host_name: string | null
          hubspot_contact_id: string | null
          hubspot_meeting_id: string | null
          id: string
          meeting_end_time: string | null
          meeting_link: string | null
          meeting_start_time: string | null
          meeting_title: string | null
          raw_payload: Json | null
          referrer_label: string | null
          referrer_path: string | null
          updated_at: string
          user_email: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          booking_source?: string | null
          company_id?: string | null
          created_at?: string
          host_name?: string | null
          hubspot_contact_id?: string | null
          hubspot_meeting_id?: string | null
          id?: string
          meeting_end_time?: string | null
          meeting_link?: string | null
          meeting_start_time?: string | null
          meeting_title?: string | null
          raw_payload?: Json | null
          referrer_label?: string | null
          referrer_path?: string | null
          updated_at?: string
          user_email: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          booking_source?: string | null
          company_id?: string | null
          created_at?: string
          host_name?: string | null
          hubspot_contact_id?: string | null
          hubspot_meeting_id?: string | null
          id?: string
          meeting_end_time?: string | null
          meeting_link?: string | null
          meeting_start_time?: string | null
          meeting_title?: string | null
          raw_payload?: Json | null
          referrer_label?: string | null
          referrer_path?: string | null
          updated_at?: string
          user_email?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hubspot_appointments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      intention_score_config: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          max_points: number | null
          points_per_unit: number
          signal_category: string
          signal_key: string
          signal_label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          max_points?: number | null
          points_per_unit?: number
          signal_category: string
          signal_key: string
          signal_label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          max_points?: number | null
          points_per_unit?: number
          signal_category?: string
          signal_key?: string
          signal_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      lmnp_simulations: {
        Row: {
          amort_immo: number | null
          amort_mobilier: number | null
          amort_non_deduits: number | null
          amort_total: number | null
          assurance_gli: number
          assurance_pno: number
          autre_charge: number
          cfe: number
          charges_copro: number
          created_at: string
          duree_immo: number
          duree_mobilier: number
          expert_comptable: number
          fiscalite_totale_micro: number | null
          fiscalite_totale_reel: number | null
          frais_deplacement: number
          gestion_locative: number
          id: string
          interets_emprunt: number
          ir_micro: number | null
          ir_reel: number | null
          meilleur_regime: string | null
          nom_simulation: string
          petit_materiel: number
          ps_micro: number | null
          ps_reel: number | null
          recettes: number
          resultat_avant_amort: number | null
          resultat_fiscal_micro: number | null
          resultat_fiscal_reel: number | null
          taxe_fonciere: number
          tmi: number
          total_charges: number
          travaux_entretien: number
          updated_at: string
          user_id: string
          valeur_bien: number
          valeur_mobilier: number
        }
        Insert: {
          amort_immo?: number | null
          amort_mobilier?: number | null
          amort_non_deduits?: number | null
          amort_total?: number | null
          assurance_gli?: number
          assurance_pno?: number
          autre_charge?: number
          cfe?: number
          charges_copro?: number
          created_at?: string
          duree_immo?: number
          duree_mobilier?: number
          expert_comptable?: number
          fiscalite_totale_micro?: number | null
          fiscalite_totale_reel?: number | null
          frais_deplacement?: number
          gestion_locative?: number
          id?: string
          interets_emprunt?: number
          ir_micro?: number | null
          ir_reel?: number | null
          meilleur_regime?: string | null
          nom_simulation: string
          petit_materiel?: number
          ps_micro?: number | null
          ps_reel?: number | null
          recettes?: number
          resultat_avant_amort?: number | null
          resultat_fiscal_micro?: number | null
          resultat_fiscal_reel?: number | null
          taxe_fonciere?: number
          tmi?: number
          total_charges?: number
          travaux_entretien?: number
          updated_at?: string
          user_id: string
          valeur_bien?: number
          valeur_mobilier?: number
        }
        Update: {
          amort_immo?: number | null
          amort_mobilier?: number | null
          amort_non_deduits?: number | null
          amort_total?: number | null
          assurance_gli?: number
          assurance_pno?: number
          autre_charge?: number
          cfe?: number
          charges_copro?: number
          created_at?: string
          duree_immo?: number
          duree_mobilier?: number
          expert_comptable?: number
          fiscalite_totale_micro?: number | null
          fiscalite_totale_reel?: number | null
          frais_deplacement?: number
          gestion_locative?: number
          id?: string
          interets_emprunt?: number
          ir_micro?: number | null
          ir_reel?: number | null
          meilleur_regime?: string | null
          nom_simulation?: string
          petit_materiel?: number
          ps_micro?: number | null
          ps_reel?: number | null
          recettes?: number
          resultat_avant_amort?: number | null
          resultat_fiscal_micro?: number | null
          resultat_fiscal_reel?: number | null
          taxe_fonciere?: number
          tmi?: number
          total_charges?: number
          travaux_entretien?: number
          updated_at?: string
          user_id?: string
          valeur_bien?: number
          valeur_mobilier?: number
        }
        Relationships: []
      }
      module_validation_settings: {
        Row: {
          allow_retry: boolean | null
          created_at: string | null
          id: string
          max_retry_attempts: number | null
          module_type: string
          quiz_first_attempt_percentage: number | null
          quiz_retry_percentage: number | null
          updated_at: string | null
          video_min_watch_percentage: number | null
          webinar_participation_points: number | null
          webinar_registration_points: number | null
        }
        Insert: {
          allow_retry?: boolean | null
          created_at?: string | null
          id?: string
          max_retry_attempts?: number | null
          module_type: string
          quiz_first_attempt_percentage?: number | null
          quiz_retry_percentage?: number | null
          updated_at?: string | null
          video_min_watch_percentage?: number | null
          webinar_participation_points?: number | null
          webinar_registration_points?: number | null
        }
        Update: {
          allow_retry?: boolean | null
          created_at?: string | null
          id?: string
          max_retry_attempts?: number | null
          module_type?: string
          quiz_first_attempt_percentage?: number | null
          quiz_retry_percentage?: number | null
          updated_at?: string | null
          video_min_watch_percentage?: number | null
          webinar_participation_points?: number | null
          webinar_registration_points?: number | null
        }
        Relationships: []
      }
      module_validations: {
        Row: {
          attempted_at: string | null
          created_at: string | null
          id: string
          module_id: number
          success: boolean
          user_id: string
        }
        Insert: {
          attempted_at?: string | null
          created_at?: string | null
          id?: string
          module_id: number
          success: boolean
          user_id: string
        }
        Update: {
          attempted_at?: string | null
          created_at?: string | null
          id?: string
          module_id?: number
          success?: boolean
          user_id?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          appointment_calendar_url: string | null
          content_data: Json | null
          content_type: string | null
          content_url: string | null
          created_at: string
          description: string
          difficulty_level: number | null
          duration: string | null
          embed_code: string | null
          estimated_time: number | null
          id: number
          is_optional: boolean | null
          key_takeaways: string[] | null
          livestorm_session_id: string | null
          order_num: number
          pedagogical_objectives: string[] | null
          points: number
          points_participation: number | null
          points_registration: number | null
          quiz_questions: Json | null
          theme: string[] | null
          title: string
          type: string
          webinar_date: string | null
          webinar_image_url: string | null
          webinar_registration_url: string | null
        }
        Insert: {
          appointment_calendar_url?: string | null
          content_data?: Json | null
          content_type?: string | null
          content_url?: string | null
          created_at?: string
          description: string
          difficulty_level?: number | null
          duration?: string | null
          embed_code?: string | null
          estimated_time?: number | null
          id?: number
          is_optional?: boolean | null
          key_takeaways?: string[] | null
          livestorm_session_id?: string | null
          order_num: number
          pedagogical_objectives?: string[] | null
          points?: number
          points_participation?: number | null
          points_registration?: number | null
          quiz_questions?: Json | null
          theme?: string[] | null
          title: string
          type: string
          webinar_date?: string | null
          webinar_image_url?: string | null
          webinar_registration_url?: string | null
        }
        Update: {
          appointment_calendar_url?: string | null
          content_data?: Json | null
          content_type?: string | null
          content_url?: string | null
          created_at?: string
          description?: string
          difficulty_level?: number | null
          duration?: string | null
          embed_code?: string | null
          estimated_time?: number | null
          id?: number
          is_optional?: boolean | null
          key_takeaways?: string[] | null
          livestorm_session_id?: string | null
          order_num?: number
          pedagogical_objectives?: string[] | null
          points?: number
          points_participation?: number | null
          points_registration?: number | null
          quiz_questions?: Json | null
          theme?: string[] | null
          title?: string
          type?: string
          webinar_date?: string | null
          webinar_image_url?: string | null
          webinar_registration_url?: string | null
        }
        Relationships: []
      }
      non_partner_welcome_settings: {
        Row: {
          allowed_simulators: string[] | null
          benefits: Json | null
          benefits_title: string | null
          contacts: Json | null
          contacts_title: string | null
          created_at: string | null
          email_body: string | null
          email_subject: string | null
          footer_text: string | null
          hero_description: string | null
          hero_icon: string | null
          hero_title: string | null
          id: string
          max_simulations: number | null
          primary_button_text: string | null
          quota_banner_label: string | null
          secondary_button_text: string | null
          updated_at: string | null
        }
        Insert: {
          allowed_simulators?: string[] | null
          benefits?: Json | null
          benefits_title?: string | null
          contacts?: Json | null
          contacts_title?: string | null
          created_at?: string | null
          email_body?: string | null
          email_subject?: string | null
          footer_text?: string | null
          hero_description?: string | null
          hero_icon?: string | null
          hero_title?: string | null
          id?: string
          max_simulations?: number | null
          primary_button_text?: string | null
          quota_banner_label?: string | null
          secondary_button_text?: string | null
          updated_at?: string | null
        }
        Update: {
          allowed_simulators?: string[] | null
          benefits?: Json | null
          benefits_title?: string | null
          contacts?: Json | null
          contacts_title?: string | null
          created_at?: string | null
          email_body?: string | null
          email_subject?: string | null
          footer_text?: string | null
          hero_description?: string | null
          hero_icon?: string | null
          hero_title?: string | null
          id?: string
          max_simulations?: number | null
          primary_button_text?: string | null
          quota_banner_label?: string | null
          secondary_button_text?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          id: string
          notification_id: string | null
          rule_id: string | null
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          notification_id?: string | null
          rule_id?: string | null
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string | null
          rule_id?: string | null
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_rules: {
        Row: {
          active: boolean | null
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          display_type: string
          frequency_limit: string | null
          id: string
          message_template: string
          rule_key: string
          rule_name: string
          segmentation: Json | null
          threshold_value: Json | null
          title_template: string
          trigger_condition: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          display_type: string
          frequency_limit?: string | null
          id?: string
          message_template: string
          rule_key: string
          rule_name: string
          segmentation?: Json | null
          threshold_value?: Json | null
          title_template: string
          trigger_condition: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          display_type?: string
          frequency_limit?: string | null
          id?: string
          message_template?: string
          rule_key?: string
          rule_name?: string
          segmentation?: Json | null
          threshold_value?: Json | null
          title_template?: string
          trigger_condition?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          button_text: string | null
          created_at: string | null
          created_by: string | null
          display_type: string
          id: string
          image_url: string | null
          message: string
          title: string
          trigger_type: string
          url_action: string | null
        }
        Insert: {
          button_text?: string | null
          created_at?: string | null
          created_by?: string | null
          display_type: string
          id?: string
          image_url?: string | null
          message: string
          title: string
          trigger_type: string
          url_action?: string | null
        }
        Update: {
          button_text?: string | null
          created_at?: string | null
          created_by?: string | null
          display_type?: string
          id?: string
          image_url?: string | null
          message?: string
          title?: string
          trigger_type?: string
          url_action?: string | null
        }
        Relationships: []
      }
      offers: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          cta_text: string | null
          cta_url: string | null
          description: string | null
          display_order: number | null
          end_date: string
          id: string
          image_url: string | null
          is_active: boolean | null
          is_archived: boolean | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          display_order?: number | null
          end_date: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_archived?: boolean | null
          start_date?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          display_order?: number | null
          end_date?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_archived?: boolean | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_guide_steps: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          order_num: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          order_num?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          order_num?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_responses: {
        Row: {
          created_at: string
          flow_id: string
          id: string
          lead_rank: number | null
          response_value: Json | null
          screen_id: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          flow_id?: string
          id?: string
          lead_rank?: number | null
          response_value?: Json | null
          screen_id?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          flow_id?: string
          id?: string
          lead_rank?: number | null
          response_value?: Json | null
          screen_id?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      onboarding_scenes: {
        Row: {
          created_at: string | null
          effet: string
          id: string
          image: string
          ordre: number
          statut: boolean
          texte: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          effet?: string
          id?: string
          image: string
          ordre: number
          statut?: boolean
          texte: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          effet?: string
          id?: string
          image?: string
          ordre?: number
          statut?: boolean
          texte?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      onboarding_screens: {
        Row: {
          created_at: string
          flow_id: string
          id: string
          is_active: boolean
          metadata: Json | null
          next_step_id: string | null
          options: Json | null
          order_num: number
          status: string
          subtitle: string | null
          title: string
          type: string
          updated_at: string
          workflow_position: Json | null
        }
        Insert: {
          created_at?: string
          flow_id?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          next_step_id?: string | null
          options?: Json | null
          order_num?: number
          status?: string
          subtitle?: string | null
          title: string
          type: string
          updated_at?: string
          workflow_position?: Json | null
        }
        Update: {
          created_at?: string
          flow_id?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          next_step_id?: string | null
          options?: Json | null
          order_num?: number
          status?: string
          subtitle?: string | null
          title?: string
          type?: string
          updated_at?: string
          workflow_position?: Json | null
        }
        Relationships: []
      }
      optimisation_fiscale_simulations: {
        Row: {
          created_at: string
          dispositifs_selectionnes: Json | null
          dons_66_montant: number | null
          dons_75_montant: number | null
          duree_pinel: number | null
          duree_pinel_om: number | null
          economie_totale: number | null
          id: string
          impot_apres: number | null
          impot_avant: number
          montant_aide_domicile: number | null
          montant_esus: number | null
          montant_garde_enfant: number | null
          montant_girardin: number | null
          montant_per: number | null
          montant_pme: number | null
          nb_enfants: number
          nom_simulation: string
          plafond_per: number | null
          plafond_per_report_n1: number | null
          plafond_per_report_n2: number | null
          plafond_per_report_n3: number | null
          plafond_per_total: number | null
          plafond_per_utilise: number | null
          prix_pinel: number | null
          prix_pinel_om: number | null
          reduction_aide_domicile: number | null
          reduction_dons_66: number | null
          reduction_dons_75: number | null
          reduction_esus: number | null
          reduction_garde_enfant: number | null
          reduction_girardin: number | null
          reduction_per: number | null
          reduction_pinel_annuelle: number | null
          reduction_pinel_om_annuelle: number | null
          reduction_pme: number | null
          revenu_imposable: number
          revenus_professionnels: number
          situation_familiale: string
          taux_pinel: number | null
          taux_pinel_om: number | null
          tmi: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dispositifs_selectionnes?: Json | null
          dons_66_montant?: number | null
          dons_75_montant?: number | null
          duree_pinel?: number | null
          duree_pinel_om?: number | null
          economie_totale?: number | null
          id?: string
          impot_apres?: number | null
          impot_avant: number
          montant_aide_domicile?: number | null
          montant_esus?: number | null
          montant_garde_enfant?: number | null
          montant_girardin?: number | null
          montant_per?: number | null
          montant_pme?: number | null
          nb_enfants?: number
          nom_simulation: string
          plafond_per?: number | null
          plafond_per_report_n1?: number | null
          plafond_per_report_n2?: number | null
          plafond_per_report_n3?: number | null
          plafond_per_total?: number | null
          plafond_per_utilise?: number | null
          prix_pinel?: number | null
          prix_pinel_om?: number | null
          reduction_aide_domicile?: number | null
          reduction_dons_66?: number | null
          reduction_dons_75?: number | null
          reduction_esus?: number | null
          reduction_garde_enfant?: number | null
          reduction_girardin?: number | null
          reduction_per?: number | null
          reduction_pinel_annuelle?: number | null
          reduction_pinel_om_annuelle?: number | null
          reduction_pme?: number | null
          revenu_imposable: number
          revenus_professionnels: number
          situation_familiale: string
          taux_pinel?: number | null
          taux_pinel_om?: number | null
          tmi: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dispositifs_selectionnes?: Json | null
          dons_66_montant?: number | null
          dons_75_montant?: number | null
          duree_pinel?: number | null
          duree_pinel_om?: number | null
          economie_totale?: number | null
          id?: string
          impot_apres?: number | null
          impot_avant?: number
          montant_aide_domicile?: number | null
          montant_esus?: number | null
          montant_garde_enfant?: number | null
          montant_girardin?: number | null
          montant_per?: number | null
          montant_pme?: number | null
          nb_enfants?: number
          nom_simulation?: string
          plafond_per?: number | null
          plafond_per_report_n1?: number | null
          plafond_per_report_n2?: number | null
          plafond_per_report_n3?: number | null
          plafond_per_total?: number | null
          plafond_per_utilise?: number | null
          prix_pinel?: number | null
          prix_pinel_om?: number | null
          reduction_aide_domicile?: number | null
          reduction_dons_66?: number | null
          reduction_dons_75?: number | null
          reduction_esus?: number | null
          reduction_garde_enfant?: number | null
          reduction_girardin?: number | null
          reduction_per?: number | null
          reduction_pinel_annuelle?: number | null
          reduction_pinel_om_annuelle?: number | null
          reduction_pme?: number | null
          revenu_imposable?: number
          revenus_professionnels?: number
          situation_familiale?: string
          taux_pinel?: number | null
          taux_pinel_om?: number | null
          tmi?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      parcours: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_default: boolean
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_default?: boolean
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_default?: boolean
          title?: string
        }
        Relationships: []
      }
      parcours_companies: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_pinned: boolean | null
          parcours_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          parcours_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          parcours_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parcours_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcours_companies_parcours_id_fkey"
            columns: ["parcours_id"]
            isOneToOne: false
            referencedRelation: "parcours"
            referencedColumns: ["id"]
          },
        ]
      }
      parcours_modules: {
        Row: {
          created_at: string
          id: string
          is_optional: boolean
          module_id: number
          order_num: number
          parcours_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_optional?: boolean
          module_id: number
          order_num: number
          parcours_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_optional?: boolean
          module_id?: number
          order_num?: number
          parcours_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parcours_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcours_modules_parcours_id_fkey"
            columns: ["parcours_id"]
            isOneToOne: false
            referencedRelation: "parcours"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_contact_requests: {
        Row: {
          company: string
          company_size: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company: string
          company_size: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string
          company_size?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      partnership_requests: {
        Row: {
          company_id: string | null
          contact_email: string
          contact_first_name: string | null
          contact_last_name: string | null
          contact_role: string | null
          created_at: string
          id: string
          message: string | null
          sender_email: string | null
          sender_first_name: string | null
          sender_last_name: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          contact_email: string
          contact_first_name?: string | null
          contact_last_name?: string | null
          contact_role?: string | null
          created_at?: string
          id?: string
          message?: string | null
          sender_email?: string | null
          sender_first_name?: string | null
          sender_last_name?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          contact_email?: string
          contact_first_name?: string | null
          contact_last_name?: string | null
          contact_role?: string | null
          created_at?: string
          id?: string
          message?: string | null
          sender_email?: string | null
          sender_first_name?: string | null
          sender_last_name?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      per_simulations: {
        Row: {
          age_actuel: number
          age_retraite: number
          capital_futur: number
          created_at: string
          economie_impots: number
          effort_reel: number
          gain_financier: number
          horizon_annees: number
          id: string
          impot_avec_per: number
          impot_sans_per: number
          nom_simulation: string
          optimisation_fiscale: number
          parts_fiscales: number
          plafond_per_annuel: number
          plafond_per_reportable: number
          plafond_per_total: number
          reduction_impots_max: number
          revenu_fiscal: number
          taux_rendement: number
          tmi: number
          updated_at: string
          user_id: string
          versements_per: number
        }
        Insert: {
          age_actuel: number
          age_retraite: number
          capital_futur: number
          created_at?: string
          economie_impots: number
          effort_reel: number
          gain_financier: number
          horizon_annees: number
          id?: string
          impot_avec_per: number
          impot_sans_per: number
          nom_simulation: string
          optimisation_fiscale: number
          parts_fiscales: number
          plafond_per_annuel: number
          plafond_per_reportable?: number
          plafond_per_total: number
          reduction_impots_max: number
          revenu_fiscal: number
          taux_rendement: number
          tmi: number
          updated_at?: string
          user_id: string
          versements_per: number
        }
        Update: {
          age_actuel?: number
          age_retraite?: number
          capital_futur?: number
          created_at?: string
          economie_impots?: number
          effort_reel?: number
          gain_financier?: number
          horizon_annees?: number
          id?: string
          impot_avec_per?: number
          impot_sans_per?: number
          nom_simulation?: string
          optimisation_fiscale?: number
          parts_fiscales?: number
          plafond_per_annuel?: number
          plafond_per_reportable?: number
          plafond_per_total?: number
          reduction_impots_max?: number
          revenu_fiscal?: number
          taux_rendement?: number
          tmi?: number
          updated_at?: string
          user_id?: string
          versements_per?: number
        }
        Relationships: []
      }
      points_configuration: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          points: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          points?: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          points?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      points_history: {
        Row: {
          category: string
          created_at: string
          id: string
          points_awarded: number
          reference_id: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          points_awarded?: number
          reference_id?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          points_awarded?: number
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pret_immobilier_simulations: {
        Row: {
          apport_personnel: number
          cout_global_credit: number | null
          cout_total_assurance: number | null
          cout_total_interets: number | null
          created_at: string
          duree_annees: number
          id: string
          mensualite_totale: number | null
          montant_emprunte: number | null
          montant_projet: number
          nom_simulation: string
          revenu_mensuel: number | null
          taux_assurance: number
          taux_endettement: number | null
          taux_interet: number
          updated_at: string
          user_id: string
        }
        Insert: {
          apport_personnel?: number
          cout_global_credit?: number | null
          cout_total_assurance?: number | null
          cout_total_interets?: number | null
          created_at?: string
          duree_annees?: number
          id?: string
          mensualite_totale?: number | null
          montant_emprunte?: number | null
          montant_projet?: number
          nom_simulation: string
          revenu_mensuel?: number | null
          taux_assurance?: number
          taux_endettement?: number | null
          taux_interet?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          apport_personnel?: number
          cout_global_credit?: number | null
          cout_total_assurance?: number | null
          cout_total_interets?: number | null
          created_at?: string
          duree_annees?: number
          id?: string
          mensualite_totale?: number | null
          montant_emprunte?: number | null
          montant_projet?: number
          nom_simulation?: string
          revenu_mensuel?: number | null
          taux_assurance?: number
          taux_endettement?: number | null
          taux_interet?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_category_links: {
        Row: {
          category_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_category_links_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "horizon_project_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_category_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "financial_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_rate_tiers: {
        Row: {
          annual_rate: number
          created_at: string
          horizon_max_years: number
          horizon_min_years: number
          id: string
          label: string | null
          product_id: string
        }
        Insert: {
          annual_rate?: number
          created_at?: string
          horizon_max_years?: number
          horizon_min_years?: number
          id?: string
          label?: string | null
          product_id: string
        }
        Update: {
          annual_rate?: number
          created_at?: string
          horizon_max_years?: number
          horizon_min_years?: number
          id?: string
          label?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_rate_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "financial_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          a_invite_collegue: boolean | null
          a_pris_rdv: boolean | null
          avatar_url: string | null
          beta_disclaimer_accepted_at: string | null
          birth_date: string | null
          children_count: number | null
          company_id: string | null
          completed_modules: number[]
          created_at: string
          current_module: number | null
          current_session_start: string | null
          deleted_at: string | null
          email: string
          employee_onboarding_completed: boolean | null
          first_name: string | null
          forum_anonymous_mode: boolean | null
          forum_avatar_url: string | null
          forum_comments_count: number | null
          forum_contribution_score: number | null
          forum_posts_count: number | null
          forum_pseudo: string | null
          household_taxable_income: number | null
          id: string
          is_active: boolean | null
          job_title: string | null
          last_login: string | null
          last_name: string | null
          marital_status: string | null
          net_taxable_income: number | null
          objectives: string[] | null
          personal_email: string | null
          phone_number: string | null
          receive_on_personal_email: boolean | null
          theme_preference: string
          total_points: number
        }
        Insert: {
          a_invite_collegue?: boolean | null
          a_pris_rdv?: boolean | null
          avatar_url?: string | null
          beta_disclaimer_accepted_at?: string | null
          birth_date?: string | null
          children_count?: number | null
          company_id?: string | null
          completed_modules?: number[]
          created_at?: string
          current_module?: number | null
          current_session_start?: string | null
          deleted_at?: string | null
          email: string
          employee_onboarding_completed?: boolean | null
          first_name?: string | null
          forum_anonymous_mode?: boolean | null
          forum_avatar_url?: string | null
          forum_comments_count?: number | null
          forum_contribution_score?: number | null
          forum_posts_count?: number | null
          forum_pseudo?: string | null
          household_taxable_income?: number | null
          id: string
          is_active?: boolean | null
          job_title?: string | null
          last_login?: string | null
          last_name?: string | null
          marital_status?: string | null
          net_taxable_income?: number | null
          objectives?: string[] | null
          personal_email?: string | null
          phone_number?: string | null
          receive_on_personal_email?: boolean | null
          theme_preference?: string
          total_points?: number
        }
        Update: {
          a_invite_collegue?: boolean | null
          a_pris_rdv?: boolean | null
          avatar_url?: string | null
          beta_disclaimer_accepted_at?: string | null
          birth_date?: string | null
          children_count?: number | null
          company_id?: string | null
          completed_modules?: number[]
          created_at?: string
          current_module?: number | null
          current_session_start?: string | null
          deleted_at?: string | null
          email?: string
          employee_onboarding_completed?: boolean | null
          first_name?: string | null
          forum_anonymous_mode?: boolean | null
          forum_avatar_url?: string | null
          forum_comments_count?: number | null
          forum_contribution_score?: number | null
          forum_posts_count?: number | null
          forum_pseudo?: string | null
          household_taxable_income?: number | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          last_login?: string | null
          last_name?: string | null
          marital_status?: string | null
          net_taxable_income?: number | null
          objectives?: string[] | null
          personal_email?: string | null
          phone_number?: string | null
          receive_on_personal_email?: boolean | null
          theme_preference?: string
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_rules: {
        Row: {
          condition_config: Json | null
          condition_type: string
          created_at: string
          cta_action_type: string
          cta_action_value: string
          cta_text: string
          description: string | null
          display_priority: string
          icon: string
          id: string
          internal_name: string | null
          is_active: boolean
          message: string
          priority: number
          rule_key: string
          rule_name: string
          title: string
          updated_at: string
        }
        Insert: {
          condition_config?: Json | null
          condition_type: string
          created_at?: string
          cta_action_type?: string
          cta_action_value: string
          cta_text: string
          description?: string | null
          display_priority?: string
          icon?: string
          id?: string
          internal_name?: string | null
          is_active?: boolean
          message: string
          priority?: number
          rule_key: string
          rule_name: string
          title: string
          updated_at?: string
        }
        Update: {
          condition_config?: Json | null
          condition_type?: string
          created_at?: string
          cta_action_type?: string
          cta_action_value?: string
          cta_text?: string
          description?: string | null
          display_priority?: string
          icon?: string
          id?: string
          internal_name?: string | null
          is_active?: boolean
          message?: string
          priority?: number
          rule_key?: string
          rule_name?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_requests: {
        Row: {
          colleague_email: string
          colleague_name: string
          colleague_phone: string | null
          company_id: string
          created_at: string
          expert_booking_url: string | null
          id: string
          message: string | null
          referrer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          colleague_email: string
          colleague_name: string
          colleague_phone?: string | null
          company_id: string
          created_at?: string
          expert_booking_url?: string | null
          id?: string
          message?: string | null
          referrer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          colleague_email?: string
          colleague_name?: string
          colleague_phone?: string | null
          company_id?: string
          created_at?: string
          expert_booking_url?: string | null
          id?: string
          message?: string | null
          referrer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          company_id: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
        }
        Relationships: []
      }
      risk_answers: {
        Row: {
          answer_text: string
          created_at: string | null
          id: string
          order_num: number | null
          question_id: string
          score_value: number
        }
        Insert: {
          answer_text: string
          created_at?: string | null
          id?: string
          order_num?: number | null
          question_id: string
          score_value: number
        }
        Update: {
          answer_text?: string
          created_at?: string | null
          id?: string
          order_num?: number | null
          question_id?: string
          score_value?: number
        }
        Relationships: []
      }
      risk_profile: {
        Row: {
          id: string
          last_updated: string | null
          profile_type: string
          total_weighted_score: number
          user_id: string
        }
        Insert: {
          id?: string
          last_updated?: string | null
          profile_type: string
          total_weighted_score: number
          user_id: string
        }
        Update: {
          id?: string
          last_updated?: string | null
          profile_type?: string
          total_weighted_score?: number
          user_id?: string
        }
        Relationships: []
      }
      risk_profile_settings: {
        Row: {
          id: string
          mandatory_for_new_users: boolean | null
          module_active: boolean | null
          threshold_dynamique: number | null
          threshold_equilibre: number | null
          threshold_prudent: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          mandatory_for_new_users?: boolean | null
          module_active?: boolean | null
          threshold_dynamique?: number | null
          threshold_equilibre?: number | null
          threshold_prudent?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          mandatory_for_new_users?: boolean | null
          module_active?: boolean | null
          threshold_dynamique?: number | null
          threshold_equilibre?: number | null
          threshold_prudent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      risk_questions: {
        Row: {
          active: boolean | null
          amf_weight: number
          category: string
          choices: Json | null
          created_at: string | null
          id: string
          order_num: number | null
          question_text: string
          question_type: string
        }
        Insert: {
          active?: boolean | null
          amf_weight?: number
          category: string
          choices?: Json | null
          created_at?: string | null
          id?: string
          order_num?: number | null
          question_text: string
          question_type: string
        }
        Update: {
          active?: boolean | null
          amf_weight?: number
          category?: string
          choices?: Json | null
          created_at?: string | null
          id?: string
          order_num?: number | null
          question_text?: string
          question_type?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          action: string
          can_access: boolean
          can_modify: boolean
          category: string
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          action: string
          can_access?: boolean
          can_modify?: boolean
          category: string
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          action?: string
          can_access?: boolean
          can_modify?: boolean
          category?: string
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      sell_to_cover: {
        Row: {
          created_at: string | null
          date_sell_to_cover: string
          frais: number | null
          id: string
          is_sell_to_cover: boolean | null
          lot_id: string
          prix_vente_devise: number
          quantite_vendue: number
          taux_change: number
          taxes_prelevees: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_sell_to_cover: string
          frais?: number | null
          id?: string
          is_sell_to_cover?: boolean | null
          lot_id: string
          prix_vente_devise: number
          quantite_vendue: number
          taux_change: number
          taxes_prelevees?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_sell_to_cover?: string
          frais?: number | null
          id?: string
          is_sell_to_cover?: boolean | null
          lot_id?: string
          prix_vente_devise?: number
          quantite_vendue?: number
          taux_change?: number
          taxes_prelevees?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          metadata: Json | null
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          metadata?: Json | null
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          metadata?: Json | null
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      sidebar_configurations: {
        Row: {
          categories: Json
          created_at: string
          id: string
          menu_items: Json
          sidebar_type: string
          updated_at: string
        }
        Insert: {
          categories?: Json
          created_at?: string
          id?: string
          menu_items?: Json
          sidebar_type: string
          updated_at?: string
        }
        Update: {
          categories?: Json
          created_at?: string
          id?: string
          menu_items?: Json
          sidebar_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      simulation_logs: {
        Row: {
          appointment_cta_clicked: boolean | null
          created_at: string | null
          cta_clicked: string[] | null
          id: string
          is_saved_to_history: boolean | null
          results_data: Json
          session_id: string | null
          simulation_data: Json
          simulator_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          appointment_cta_clicked?: boolean | null
          created_at?: string | null
          cta_clicked?: string[] | null
          id?: string
          is_saved_to_history?: boolean | null
          results_data: Json
          session_id?: string | null
          simulation_data: Json
          simulator_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          appointment_cta_clicked?: boolean | null
          created_at?: string | null
          cta_clicked?: string[] | null
          id?: string
          is_saved_to_history?: boolean | null
          results_data?: Json
          session_id?: string | null
          simulation_data?: Json
          simulator_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      simulations: {
        Row: {
          created_at: string
          data: Json
          id: string
          name: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          name?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          name?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      simulations_impots: {
        Row: {
          created_at: string | null
          credits_impot: number | null
          id: string
          impot_brut: number
          impot_net: number
          nom_simulation: string
          nombre_enfants: number
          parts: number
          quotient_familial: number
          reductions_impot: number | null
          revenu_imposable: number
          statut_marital: string
          taux_marginal: number
          taux_moyen: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_impot?: number | null
          id?: string
          impot_brut: number
          impot_net: number
          nom_simulation: string
          nombre_enfants?: number
          parts: number
          quotient_familial: number
          reductions_impot?: number | null
          revenu_imposable: number
          statut_marital: string
          taux_marginal: number
          taux_moyen: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_impot?: number | null
          id?: string
          impot_brut?: number
          impot_net?: number
          nom_simulation?: string
          nombre_enfants?: number
          parts?: number
          quotient_familial?: number
          reductions_impot?: number | null
          revenu_imposable?: number
          statut_marital?: string
          taux_marginal?: number
          taux_moyen?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      simulator_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          order_num: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          order_num?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          order_num?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      simulator_ctas: {
        Row: {
          action_type: string
          action_value: string
          active: boolean
          button_color: string | null
          button_text: string
          condition_key: string
          condition_operator: string | null
          condition_value: Json | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          internal_name: string | null
          order_num: number
          simulator_type: string
          title: string
          updated_at: string
        }
        Insert: {
          action_type: string
          action_value: string
          active?: boolean
          button_color?: string | null
          button_text: string
          condition_key: string
          condition_operator?: string | null
          condition_value?: Json | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          internal_name?: string | null
          order_num?: number
          simulator_type: string
          title: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          action_value?: string
          active?: boolean
          button_color?: string | null
          button_text?: string
          condition_key?: string
          condition_operator?: string | null
          condition_value?: Json | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          internal_name?: string | null
          order_num?: number
          simulator_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      simulators: {
        Row: {
          category_id: string | null
          config: Json | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          feature_key: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          order_num: number
          route: string
          slug: string
          updated_at: string
          visibility_status: string
        }
        Insert: {
          category_id?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          feature_key?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          order_num?: number
          route: string
          slug: string
          updated_at?: string
          visibility_status?: string
        }
        Update: {
          category_id?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          feature_key?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          order_num?: number
          route?: string
          slug?: string
          updated_at?: string
          visibility_status?: string
        }
        Relationships: []
      }
      tax_declaration_requests: {
        Row: {
          autres_justificatifs_urls: Json | null
          avis_imposition_url: string | null
          commentaires: string | null
          company_id: string | null
          conseiller_dedie: string | null
          created_at: string
          delegation_complete: boolean | null
          email: string
          entreprise: string
          expertise_avocat: Json | null
          id: string
          intitule_poste: string
          is_perlib_client: boolean | null
          modification_count: number | null
          modified_at: string | null
          nom: string
          nombre_enfants: number | null
          optimisation_autres: Json | null
          optimisation_types: Json | null
          perlib_contact_email: string | null
          prefilled_from_profile: Json | null
          prenom: string
          revenu_imposable_precedent: number | null
          revenus_types: Json | null
          situation_maritale: string | null
          status: string | null
          submitted_at: string | null
          telephone: string | null
          tmi: string | null
          type_rdv: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          autres_justificatifs_urls?: Json | null
          avis_imposition_url?: string | null
          commentaires?: string | null
          company_id?: string | null
          conseiller_dedie?: string | null
          created_at?: string
          delegation_complete?: boolean | null
          email: string
          entreprise: string
          expertise_avocat?: Json | null
          id?: string
          intitule_poste: string
          is_perlib_client?: boolean | null
          modification_count?: number | null
          modified_at?: string | null
          nom: string
          nombre_enfants?: number | null
          optimisation_autres?: Json | null
          optimisation_types?: Json | null
          perlib_contact_email?: string | null
          prefilled_from_profile?: Json | null
          prenom: string
          revenu_imposable_precedent?: number | null
          revenus_types?: Json | null
          situation_maritale?: string | null
          status?: string | null
          submitted_at?: string | null
          telephone?: string | null
          tmi?: string | null
          type_rdv?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          autres_justificatifs_urls?: Json | null
          avis_imposition_url?: string | null
          commentaires?: string | null
          company_id?: string | null
          conseiller_dedie?: string | null
          created_at?: string
          delegation_complete?: boolean | null
          email?: string
          entreprise?: string
          expertise_avocat?: Json | null
          id?: string
          intitule_poste?: string
          is_perlib_client?: boolean | null
          modification_count?: number | null
          modified_at?: string | null
          nom?: string
          nombre_enfants?: number | null
          optimisation_autres?: Json | null
          optimisation_types?: Json | null
          perlib_contact_email?: string | null
          prefilled_from_profile?: Json | null
          prenom?: string
          revenu_imposable_precedent?: number | null
          revenus_types?: Json | null
          situation_maritale?: string | null
          status?: string | null
          submitted_at?: string | null
          telephone?: string | null
          tmi?: string | null
          type_rdv?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      themes: {
        Row: {
          created_at: string
          description: string | null
          design_tokens: Json
          id: string
          is_active: boolean
          label: string
          labels: Json
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          design_tokens?: Json
          id: string
          is_active?: boolean
          label: string
          labels?: Json
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          design_tokens?: Json
          id?: string
          is_active?: boolean
          label?: string
          labels?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_name: string
          event_type: string
          id: string
          page_path: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_name: string
          event_type: string
          id?: string
          page_path?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_name?: string
          event_type?: string
          id?: string
          page_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_financial_profiles: {
        Row: {
          age: number | null
          anciennete_annees: number | null
          apport_disponible: number | null
          autres_revenus_mensuels: number | null
          budget_achat_immo: number | null
          budget_investissement_locatif: number | null
          budget_residence_principale: number | null
          budget_residence_secondaire: number | null
          capacite_epargne_mensuelle: number | null
          charges_abonnements: number | null
          charges_assurance_auto: number | null
          charges_assurance_habitation: number | null
          charges_autres: number | null
          charges_copropriete_taxes: number | null
          charges_energie: number | null
          charges_fixes_mensuelles: number | null
          charges_frais_scolarite: number | null
          charges_internet: number | null
          charges_lld_loa_auto: number | null
          charges_mobile: number | null
          charges_transport_commun: number | null
          created_at: string
          credits_auto: number | null
          credits_consommation: number | null
          credits_immobilier: number | null
          date_naissance: string | null
          duree_emprunt_souhaitee: number | null
          epargne_actuelle: number | null
          epargne_livrets: number | null
          equity_income_amount: number | null
          financial_summary: string | null
          financial_summary_generated_at: string | null
          has_bspce: boolean | null
          has_epargne_autres: boolean | null
          has_equity_autres: boolean | null
          has_equity_income_this_year: boolean | null
          has_espp: boolean | null
          has_pee: boolean | null
          has_perco: boolean | null
          has_pero: boolean | null
          has_rsu_aga: boolean | null
          has_stock_options: boolean | null
          id: string
          is_complete: boolean | null
          loyer_actuel: number | null
          nb_enfants: number | null
          nb_personnes_foyer: number | null
          objectif_achat_immo: boolean | null
          parts_fiscales: number | null
          patrimoine_assurance_vie: number | null
          patrimoine_autres: number | null
          patrimoine_crypto: number | null
          patrimoine_immo_credit_restant: number | null
          patrimoine_immo_valeur: number | null
          patrimoine_pea: number | null
          patrimoine_per: number | null
          patrimoine_private_equity: number | null
          patrimoine_scpi: number | null
          pensions_alimentaires: number | null
          plafond_per_reportable: number | null
          projet_investissement_locatif: boolean | null
          projet_residence_principale: boolean | null
          projet_residence_secondaire: boolean | null
          revenu_annuel_brut: number | null
          revenu_annuel_brut_conjoint: number | null
          revenu_annuel_conjoint: number | null
          revenu_fiscal_annuel: number | null
          revenu_fiscal_foyer: number | null
          revenu_mensuel_net: number | null
          revenus_capital_autres: number | null
          revenus_dividendes: number | null
          revenus_locatifs: number | null
          revenus_ventes_actions: number | null
          secteur_activite: string | null
          situation_familiale: string | null
          statut_residence: string | null
          tmi: number | null
          type_contrat: string | null
          updated_at: string
          user_id: string
          valeur_bspce: number | null
          valeur_espp: number | null
          valeur_pee: number | null
          valeur_perco: number | null
          valeur_rsu_aga: number | null
          valeur_stock_options: number | null
        }
        Insert: {
          age?: number | null
          anciennete_annees?: number | null
          apport_disponible?: number | null
          autres_revenus_mensuels?: number | null
          budget_achat_immo?: number | null
          budget_investissement_locatif?: number | null
          budget_residence_principale?: number | null
          budget_residence_secondaire?: number | null
          capacite_epargne_mensuelle?: number | null
          charges_abonnements?: number | null
          charges_assurance_auto?: number | null
          charges_assurance_habitation?: number | null
          charges_autres?: number | null
          charges_copropriete_taxes?: number | null
          charges_energie?: number | null
          charges_fixes_mensuelles?: number | null
          charges_frais_scolarite?: number | null
          charges_internet?: number | null
          charges_lld_loa_auto?: number | null
          charges_mobile?: number | null
          charges_transport_commun?: number | null
          created_at?: string
          credits_auto?: number | null
          credits_consommation?: number | null
          credits_immobilier?: number | null
          date_naissance?: string | null
          duree_emprunt_souhaitee?: number | null
          epargne_actuelle?: number | null
          epargne_livrets?: number | null
          equity_income_amount?: number | null
          financial_summary?: string | null
          financial_summary_generated_at?: string | null
          has_bspce?: boolean | null
          has_epargne_autres?: boolean | null
          has_equity_autres?: boolean | null
          has_equity_income_this_year?: boolean | null
          has_espp?: boolean | null
          has_pee?: boolean | null
          has_perco?: boolean | null
          has_pero?: boolean | null
          has_rsu_aga?: boolean | null
          has_stock_options?: boolean | null
          id?: string
          is_complete?: boolean | null
          loyer_actuel?: number | null
          nb_enfants?: number | null
          nb_personnes_foyer?: number | null
          objectif_achat_immo?: boolean | null
          parts_fiscales?: number | null
          patrimoine_assurance_vie?: number | null
          patrimoine_autres?: number | null
          patrimoine_crypto?: number | null
          patrimoine_immo_credit_restant?: number | null
          patrimoine_immo_valeur?: number | null
          patrimoine_pea?: number | null
          patrimoine_per?: number | null
          patrimoine_private_equity?: number | null
          patrimoine_scpi?: number | null
          pensions_alimentaires?: number | null
          plafond_per_reportable?: number | null
          projet_investissement_locatif?: boolean | null
          projet_residence_principale?: boolean | null
          projet_residence_secondaire?: boolean | null
          revenu_annuel_brut?: number | null
          revenu_annuel_brut_conjoint?: number | null
          revenu_annuel_conjoint?: number | null
          revenu_fiscal_annuel?: number | null
          revenu_fiscal_foyer?: number | null
          revenu_mensuel_net?: number | null
          revenus_capital_autres?: number | null
          revenus_dividendes?: number | null
          revenus_locatifs?: number | null
          revenus_ventes_actions?: number | null
          secteur_activite?: string | null
          situation_familiale?: string | null
          statut_residence?: string | null
          tmi?: number | null
          type_contrat?: string | null
          updated_at?: string
          user_id: string
          valeur_bspce?: number | null
          valeur_espp?: number | null
          valeur_pee?: number | null
          valeur_perco?: number | null
          valeur_rsu_aga?: number | null
          valeur_stock_options?: number | null
        }
        Update: {
          age?: number | null
          anciennete_annees?: number | null
          apport_disponible?: number | null
          autres_revenus_mensuels?: number | null
          budget_achat_immo?: number | null
          budget_investissement_locatif?: number | null
          budget_residence_principale?: number | null
          budget_residence_secondaire?: number | null
          capacite_epargne_mensuelle?: number | null
          charges_abonnements?: number | null
          charges_assurance_auto?: number | null
          charges_assurance_habitation?: number | null
          charges_autres?: number | null
          charges_copropriete_taxes?: number | null
          charges_energie?: number | null
          charges_fixes_mensuelles?: number | null
          charges_frais_scolarite?: number | null
          charges_internet?: number | null
          charges_lld_loa_auto?: number | null
          charges_mobile?: number | null
          charges_transport_commun?: number | null
          created_at?: string
          credits_auto?: number | null
          credits_consommation?: number | null
          credits_immobilier?: number | null
          date_naissance?: string | null
          duree_emprunt_souhaitee?: number | null
          epargne_actuelle?: number | null
          epargne_livrets?: number | null
          equity_income_amount?: number | null
          financial_summary?: string | null
          financial_summary_generated_at?: string | null
          has_bspce?: boolean | null
          has_epargne_autres?: boolean | null
          has_equity_autres?: boolean | null
          has_equity_income_this_year?: boolean | null
          has_espp?: boolean | null
          has_pee?: boolean | null
          has_perco?: boolean | null
          has_pero?: boolean | null
          has_rsu_aga?: boolean | null
          has_stock_options?: boolean | null
          id?: string
          is_complete?: boolean | null
          loyer_actuel?: number | null
          nb_enfants?: number | null
          nb_personnes_foyer?: number | null
          objectif_achat_immo?: boolean | null
          parts_fiscales?: number | null
          patrimoine_assurance_vie?: number | null
          patrimoine_autres?: number | null
          patrimoine_crypto?: number | null
          patrimoine_immo_credit_restant?: number | null
          patrimoine_immo_valeur?: number | null
          patrimoine_pea?: number | null
          patrimoine_per?: number | null
          patrimoine_private_equity?: number | null
          patrimoine_scpi?: number | null
          pensions_alimentaires?: number | null
          plafond_per_reportable?: number | null
          projet_investissement_locatif?: boolean | null
          projet_residence_principale?: boolean | null
          projet_residence_secondaire?: boolean | null
          revenu_annuel_brut?: number | null
          revenu_annuel_brut_conjoint?: number | null
          revenu_annuel_conjoint?: number | null
          revenu_fiscal_annuel?: number | null
          revenu_fiscal_foyer?: number | null
          revenu_mensuel_net?: number | null
          revenus_capital_autres?: number | null
          revenus_dividendes?: number | null
          revenus_locatifs?: number | null
          revenus_ventes_actions?: number | null
          secteur_activite?: string | null
          situation_familiale?: string | null
          statut_residence?: string | null
          tmi?: number | null
          type_contrat?: string | null
          updated_at?: string
          user_id?: string
          valeur_bspce?: number | null
          valeur_espp?: number | null
          valeur_pee?: number | null
          valeur_perco?: number | null
          valeur_rsu_aga?: number | null
          valeur_stock_options?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_financial_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_fiscal_profile: {
        Row: {
          created_at: string | null
          id: string
          mode_imposition_plus_value: string | null
          residence_fiscal: string | null
          tmi: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mode_imposition_plus_value?: string | null
          residence_fiscal?: string | null
          tmi?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mode_imposition_plus_value?: string | null
          residence_fiscal?: string | null
          tmi?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          delivered_at: string | null
          id: string
          is_read: boolean | null
          notification_id: string
          user_id: string
        }
        Insert: {
          delivered_at?: string | null
          id?: string
          is_read?: boolean | null
          notification_id: string
          user_id: string
        }
        Update: {
          delivered_at?: string | null
          id?: string
          is_read?: boolean | null
          notification_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_offer_views: {
        Row: {
          id: string
          last_viewed_at: string
          user_id: string
        }
        Insert: {
          id?: string
          last_viewed_at?: string
          user_id: string
        }
        Update: {
          id?: string
          last_viewed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding_guide: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number | null
          dismissed: boolean | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          dismissed?: boolean | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          dismissed?: boolean | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_guide_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_parcours: {
        Row: {
          assigned_at: string
          id: string
          onboarding_session_id: string | null
          parcours_id: string
          source: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          onboarding_session_id?: string | null
          parcours_id: string
          source?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          onboarding_session_id?: string | null
          parcours_id?: string
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_real_estate_properties: {
        Row: {
          capital_restant_du: number
          charges_mensuelles: number
          created_at: string
          id: string
          mensualite_credit: number
          nom_bien: string
          revenus_locatifs_mensuels: number
          updated_at: string
          user_id: string
          valeur_estimee: number
        }
        Insert: {
          capital_restant_du?: number
          charges_mensuelles?: number
          created_at?: string
          id?: string
          mensualite_credit?: number
          nom_bien?: string
          revenus_locatifs_mensuels?: number
          updated_at?: string
          user_id: string
          valeur_estimee?: number
        }
        Update: {
          capital_restant_du?: number
          charges_mensuelles?: number
          created_at?: string
          id?: string
          mensualite_credit?: number
          nom_bien?: string
          revenus_locatifs_mensuels?: number
          updated_at?: string
          user_id?: string
          valeur_estimee?: number
        }
        Relationships: []
      }
      user_risk_responses: {
        Row: {
          answer_id: string
          created_at: string | null
          id: string
          question_id: string
          score_value: number
          user_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string | null
          id?: string
          question_id: string
          score_value: number
          user_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string | null
          id?: string
          question_id?: string
          score_value?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      ventes_espp: {
        Row: {
          created_at: string | null
          date_vente: string
          devise: string | null
          frais_vente: number | null
          id: string
          impot_calcule: number | null
          lot_id: string
          net_apres_impot: number | null
          plus_value_brute_devise: number | null
          plus_value_eur: number | null
          prelevements_sociaux: number | null
          prix_vente_devise: number
          quantite_vendue: number
          taux_change: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_vente: string
          devise?: string | null
          frais_vente?: number | null
          id?: string
          impot_calcule?: number | null
          lot_id: string
          net_apres_impot?: number | null
          plus_value_brute_devise?: number | null
          plus_value_eur?: number | null
          prelevements_sociaux?: number | null
          prix_vente_devise: number
          quantite_vendue: number
          taux_change: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_vente?: string
          devise?: string | null
          frais_vente?: number | null
          id?: string
          impot_calcule?: number | null
          lot_id?: string
          net_apres_impot?: number | null
          plus_value_brute_devise?: number | null
          plus_value_eur?: number | null
          prelevements_sociaux?: number | null
          prix_vente_devise?: number
          quantite_vendue?: number
          taux_change?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      video_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          module_id: number
          percentage_watched: number | null
          total_duration_seconds: number | null
          updated_at: string
          user_id: string
          watch_time_seconds: number
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id: number
          percentage_watched?: number | null
          total_duration_seconds?: number | null
          updated_at?: string
          user_id: string
          watch_time_seconds?: number
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id?: number
          percentage_watched?: number | null
          total_duration_seconds?: number | null
          updated_at?: string
          user_id?: string
          watch_time_seconds?: number
        }
        Relationships: []
      }
      villains: {
        Row: {
          created_at: string | null
          description: string
          id: string
          image_url: string
          nom: string
          order_num: number
          score_a_battre: number
          theme: string
          theme_data: Json
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          image_url: string
          nom: string
          order_num?: number
          score_a_battre?: number
          theme: string
          theme_data?: Json
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string
          nom?: string
          order_num?: number
          score_a_battre?: number
          theme?: string
          theme_data?: Json
        }
        Relationships: []
      }
      webinar_external_registrations: {
        Row: {
          attendance_duration_seconds: number | null
          company_name: string | null
          completed_at: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          joined_at: string | null
          last_name: string | null
          livestorm_data: Json | null
          livestorm_registrant_id: string | null
          livestorm_session_id: string | null
          module_id: number
          registered_at: string | null
          registration_status: string | null
          updated_at: string
        }
        Insert: {
          attendance_duration_seconds?: number | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          joined_at?: string | null
          last_name?: string | null
          livestorm_data?: Json | null
          livestorm_registrant_id?: string | null
          livestorm_session_id?: string | null
          module_id: number
          registered_at?: string | null
          registration_status?: string | null
          updated_at?: string
        }
        Update: {
          attendance_duration_seconds?: number | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          joined_at?: string | null
          last_name?: string | null
          livestorm_data?: Json | null
          livestorm_registrant_id?: string | null
          livestorm_session_id?: string | null
          module_id?: number
          registered_at?: string | null
          registration_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      webinar_registrations: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          joined_at: string | null
          livestorm_participant_id: string | null
          module_id: number
          points_awarded: number | null
          registered_at: string | null
          registration_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          livestorm_participant_id?: string | null
          module_id: number
          points_awarded?: number | null
          registered_at?: string | null
          registration_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          livestorm_participant_id?: string | null
          module_id?: number
          points_awarded?: number | null
          registered_at?: string | null
          registration_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_company_employee_stats: {
        Args: {
          p_company_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_company_extended_stats: {
        Args: {
          p_company_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_company_module_chart_data: {
        Args: { p_company_id: string }
        Returns: Json
      }
      get_company_registration_trends: {
        Args: { p_company_id: string }
        Returns: Json
      }
      get_company_simulation_stats: {
        Args: {
          p_company_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_current_user_company_id: { Args: never; Returns: string }
      get_filtered_forum_posts: {
        Args: {
          p_category_id?: string
          p_limit?: number
          p_since_days?: number
          p_sort_by?: string
        }
        Returns: {
          author_id: string
          category_id: string
          content: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason_id: string | null
          display_avatar_url: string | null
          display_pseudo: string | null
          has_best_answer: boolean | null
          id: string
          is_anonymous: boolean | null
          is_closed: boolean | null
          is_deleted: boolean | null
          is_pinned: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "forum_posts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_level: {
        Args: { max_points: number; user_points: number }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "contact_entreprise" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "contact_entreprise", "user"],
    },
  },
} as const
