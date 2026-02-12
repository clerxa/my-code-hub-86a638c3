import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

export interface UserFinancialProfile {
  id: string;
  user_id: string;
  // Personal
  date_naissance: string | null;
  age: number | null;
  situation_familiale: string;
  nb_enfants: number;
  nb_personnes_foyer: number;
  // Income - Professional
  revenu_mensuel_net: number;
  revenu_annuel_brut: number;
  revenu_fiscal_annuel: number;
  revenu_fiscal_foyer: number;
  revenu_annuel_conjoint: number;
  revenu_annuel_brut_conjoint: number;
  autres_revenus_mensuels: number;
  revenus_locatifs: number;
  // Income - Capital
  revenus_dividendes: number;
  revenus_ventes_actions: number;
  revenus_capital_autres: number;
  // Equity income
  has_equity_income_this_year: boolean;
  equity_income_amount: number;
  // Expenses - Legacy fields
  charges_fixes_mensuelles: number;
  loyer_actuel: number;
  credits_immobilier: number;
  credits_consommation: number;
  credits_auto: number;
  pensions_alimentaires: number;
  // Expenses - Detailed charges (same as simulator)
  // 🏠 Logement et Énergie
  charges_copropriete_taxes: number;
  charges_energie: number;
  charges_assurance_habitation: number;
  // 🚗 Transports et Mobilité
  charges_transport_commun: number;
  charges_assurance_auto: number;
  charges_lld_loa_auto: number;
  // 📱 Communication et Services
  charges_internet: number;
  charges_mobile: number;
  charges_abonnements: number;
  // 👨‍👩‍👧 Famille
  charges_frais_scolarite: number;
  // 💳 Autres
  charges_autres: number;
  // Residence status
  statut_residence: string | null;
  // Assets - Savings
  epargne_actuelle: number;
  epargne_livrets: number;
  capacite_epargne_mensuelle: number;
  // Assets - Financial patrimony
  patrimoine_per: number;
  patrimoine_assurance_vie: number;
  patrimoine_scpi: number;
  patrimoine_pea: number;
  patrimoine_crypto: number;
  patrimoine_private_equity: number;
  patrimoine_autres: number;
  // Assets - Real estate patrimony
  patrimoine_immo_valeur: number;
  patrimoine_immo_credit_restant: number;
  // Real Estate Projects
  apport_disponible: number;
  objectif_achat_immo: boolean;
  projet_residence_principale: boolean;
  projet_residence_secondaire: boolean;
  projet_investissement_locatif: boolean;
  budget_achat_immo: number | null;
  budget_residence_principale: number | null;
  budget_residence_secondaire: number | null;
  budget_investissement_locatif: number | null;
  duree_emprunt_souhaitee: number;
  // Tax
  tmi: number;
  parts_fiscales: number;
  plafond_per_reportable: number;
  // Employment
  type_contrat: string;
  anciennete_annees: number;
  secteur_activite: string | null;
  // Equity compensation
  has_rsu_aga: boolean;
  has_espp: boolean;
  has_stock_options: boolean;
  has_bspce: boolean;
  has_equity_autres: boolean;
  // Valeurs estimées des dispositifs equity
  valeur_rsu_aga: number;
  valeur_espp: number;
  valeur_stock_options: number;
  valeur_bspce: number;
  // Employee savings
  has_pee: boolean;
  has_perco: boolean;
  has_pero: boolean;
  has_epargne_autres: boolean;
  // Valeurs estimées épargne salariale
  valeur_pee: number;
  valeur_perco: number;
  // Summary
  financial_summary: string | null;
  financial_summary_generated_at: string | null;
  // Metadata
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export type FinancialProfileInput = Partial<Omit<UserFinancialProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

interface RequiredFieldConfig {
  id: string;
  field_key: string;
  field_label: string;
  is_required: boolean;
  display_order: number;
}

export const useUserFinancialProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch required fields configuration from database
  const { data: requiredFieldsConfig } = useQuery({
    queryKey: ['financial-profile-required-fields', 'required-only'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_profile_required_fields')
        .select('*')
        .eq('is_required', true)
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching required fields config:', error);
        // Fallback to hardcoded defaults
        return [
          { field_key: 'revenu_annuel_brut', field_label: 'Revenu annuel brut' },
          { field_key: 'revenu_fiscal_annuel', field_label: 'Revenu imposable annuel' },
          { field_key: 'charges_fixes_mensuelles', field_label: 'Charges fixes mensuelles' },
          { field_key: 'epargne_livrets', field_label: 'Épargne sur livrets' },
          { field_key: 'type_contrat', field_label: 'Type de contrat' },
        ] as RequiredFieldConfig[];
      }
      return data as RequiredFieldConfig[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch user profile (first_name, last_name) for completeness check
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-names', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['user-financial-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_financial_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserFinancialProfile | null;
    },
    enabled: !!user?.id,
  });

  const upsertMutation = useMutation({
    mutationFn: async (input: FinancialProfileInput) => {
      if (!user?.id) throw new Error("Utilisateur non connecté");

      // Check if profile exists
      const { data: existing } = await supabase
        .from('user_financial_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('user_financial_profiles')
          .update(input)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('user_financial_profiles')
          .insert({ ...input, user_id: user.id })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-financial-profile'] });
      toast.success("Profil financier enregistré avec succès");
    },
    onError: (error) => {
      console.error('Error saving financial profile:', error);
      toast.error("Erreur lors de l'enregistrement du profil");
    },
  });

  // Calculate completeness percentage using dynamic config
  // Fields that live on the profiles table instead of user_financial_profiles
  const PROFILE_TABLE_FIELDS = ['first_name', 'last_name'];

  const getFieldValue = (fieldKey: string, p: UserFinancialProfile | null) => {
    if (PROFILE_TABLE_FIELDS.includes(fieldKey)) {
      return userProfile?.[fieldKey as keyof typeof userProfile] ?? null;
    }
    return p?.[fieldKey as keyof UserFinancialProfile] ?? null;
  };

  const isFieldFilled = (fieldKey: string, p: UserFinancialProfile | null) => {
    const value = getFieldValue(fieldKey, p);
    return value !== null && value !== undefined && value !== 0 && value !== '';
  };

  const calculateCompleteness = (p: UserFinancialProfile | null): number => {
    if (!requiredFieldsConfig?.length) return 0;
    // For profile-only fields, we can still calculate even without financial profile
    const filledCount = requiredFieldsConfig.filter(({ field_key }) => isFieldFilled(field_key, p)).length;
    return Math.round((filledCount / requiredFieldsConfig.length) * 100);
  };

  // Get list of missing fields using dynamic config (with field keys for navigation)
  const getMissingFields = (p: UserFinancialProfile | null): { label: string; fieldKey: string }[] => {
    if (!requiredFieldsConfig?.length) return [];
    
    return requiredFieldsConfig
      .filter(({ field_key }) => !isFieldFilled(field_key, p))
      .map(f => ({ label: f.field_label, fieldKey: f.field_key }));
  };

  // Legacy: flat label list for backward compatibility
  const getMissingFieldLabels = (p: UserFinancialProfile | null): string[] => {
    return getMissingFields(p).map(f => f.label);
  };

  return {
    profile,
    isLoading,
    error,
    saveProfile: upsertMutation.mutate,
    isSaving: upsertMutation.isPending,
    completeness: calculateCompleteness(profile),
    missingFields: getMissingFieldLabels(profile),
    missingFieldsDetailed: getMissingFields(profile),
    isComplete: profile?.is_complete || false,
    requiredFieldKeys: (requiredFieldsConfig || []).map(f => f.field_key),
  };
};
