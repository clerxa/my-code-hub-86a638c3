/**
 * Page Mon Profil - Unifie informations personnelles et profil financier
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

import { toast } from "sonner";
import { 
  ArrowLeft, ArrowRight, User, Mail, Phone, Calendar, Users, Building2, Briefcase,
  Palette, Euro, Save, X, Lock, Wallet, Home, PiggyBank, Percent, Target,
  Calculator, Clock, Shield, Sparkles, Info, type LucideIcon, LayoutDashboard
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUserFinancialProfile, type FinancialProfileInput } from "@/hooks/useUserFinancialProfile";
import { useLatestEpargnePrecaution } from "@/hooks/useLatestEpargnePrecaution";
import { FinancialDashboard } from "@/components/employee/FinancialDashboard";
import { FinancialProfileWizard } from "@/components/employee/FinancialProfileWizard";
import { ObjectivesTab } from "@/components/employee/ObjectivesTab";
import { InviteColleagueDialog } from "@/components/employee/InviteColleagueDialog";
import { ForumAnonymousSettings } from "@/components/employee/ForumAnonymousSettings";

const iconMap: Record<string, LucideIcon> = {
  Calculator, Clock, Target, Shield, Wallet, Euro, Home, Briefcase, Users, Percent, PiggyBank
};

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone_number: string | null;
  birth_date: string | null;
  marital_status: string | null;
  children_count: number | null;
  job_title: string | null;
  net_taxable_income: number | null;
  household_taxable_income: number | null;
  avatar_url: string | null;
  company_id: string | null;
  forum_anonymous_mode?: boolean;
  forum_pseudo?: string | null;
  forum_avatar_url?: string | null;
  personal_email?: string | null;
  receive_on_personal_email?: boolean;
}

interface FinancialProfileSettings {
  hero_title: string;
  hero_description: string;
  benefits: Benefit[];
  cta_text: string;
  footer_note: string;
}

const tabs = [
  { id: "dashboard", label: "Synthèse", icon: LayoutDashboard },
  { id: "personal", label: "Identité", icon: User },
  { id: "situation", label: "Situation", icon: Users },
  { id: "professional", label: "Professionnel", icon: Briefcase },
  { id: "financial", label: "Revenus", icon: Wallet },
  { id: "savings", label: "Épargne", icon: PiggyBank },
  { id: "objectives", label: "Objectifs", icon: Target },
];

// Mapping field_key → tab id for clickable missing fields navigation
const FIELD_TO_TAB: Record<string, string> = {
  // Situation
  date_naissance: "situation",
  situation_familiale: "situation",
  nb_enfants: "situation",
  statut_residence: "situation",
  // Professional
  type_contrat: "professional",
  anciennete_annees: "professional",
  secteur_activite: "professional",
  // Financial / Income
  revenu_annuel_brut: "financial",
  revenu_mensuel_net: "financial",
  revenu_fiscal_annuel: "financial",
  revenu_fiscal_foyer: "financial",
  revenu_annuel_conjoint: "financial",
  revenu_annuel_brut_conjoint: "financial",
  autres_revenus_mensuels: "financial",
  revenus_locatifs: "financial",
  // Charges
  charges_fixes_mensuelles: "financial",
  loyer_actuel: "financial",
  credits_immobilier: "financial",
  credits_consommation: "financial",
  credits_auto: "financial",
  // Savings
  epargne_livrets: "savings",
  epargne_actuelle: "savings",
  capacite_epargne_mensuelle: "savings",
  patrimoine_per: "savings",
  patrimoine_assurance_vie: "savings",
  patrimoine_pea: "savings",
  patrimoine_scpi: "savings",
  patrimoine_immo_valeur: "savings",
  patrimoine_immo_credit_restant: "savings",
};

export default function EmployeeProfile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "dashboard";
  const highlightField = searchParams.get("highlight");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  
  // Profile state
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(null);
  const [company, setCompany] = useState<{ name: string; partnership_type: string | null } | null>(null);
  const [originalCompany, setOriginalCompany] = useState<{ name: string; partnership_type: string | null } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

// Financial profile state
  const { profile: financialProfile, isLoading: financialLoading, saveProfile, isSaving: savingFinancial, completeness, missingFields, missingFieldsDetailed, requiredFieldKeys } = useUserFinancialProfile();
  
  // Helper for required field asterisk
  const isFieldRequired = (fieldKey: string) => requiredFieldKeys.includes(fieldKey);
  const reqMark = (fieldKey: string) => isFieldRequired(fieldKey) ? <span className="text-destructive ml-0.5">*</span> : null;
  const [formData, setFormData] = useState<FinancialProfileInput>({});
  const [originalFormData, setOriginalFormData] = useState<FinancialProfileInput>({});
  // Prevent formData from being overwritten by backend values while the user is editing
  const financialFormInitRef = useRef(false);
  const lastFinancialUpdatedAtRef = useRef<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  
  // Données d'épargne de précaution via hook réactif (mise à jour automatique)
  const { data: epargnePrecautionData } = useLatestEpargnePrecaution();
  
  // Settings state
  const [settings, setSettings] = useState<FinancialProfileSettings | null>(null);

  // Detect changes
  const hasProfileChanges = useMemo(() => {
    if (!profile || !originalProfile) return false;
    return JSON.stringify(profile) !== JSON.stringify(originalProfile);
  }, [profile, originalProfile]);

  const hasFinancialChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalFormData);
  }, [formData, originalFormData]);

  const hasCompanyChanges = useMemo(() => {
    if (!company || !originalCompany) return false;
    return company.name !== originalCompany.name;
  }, [company, originalCompany]);

  const hasChanges = hasProfileChanges || hasFinancialChanges || hasCompanyChanges;

  // Handle tab change with URL sync
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Scroll to and highlight a specific field when navigating from Horizon
  useEffect(() => {
    if (highlightField && !loading && !financialLoading) {
      setHighlightedField(highlightField);
      // Small delay to let the tab content render
      const timer = setTimeout(() => {
        const el = document.querySelector(`[data-field="${highlightField}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
      // Remove highlight after animation
      const clearTimer = setTimeout(() => setHighlightedField(null), 3500);
      return () => { clearTimeout(timer); clearTimeout(clearTimer); };
    }
  }, [highlightField, loading, financialLoading]);

  useEffect(() => {
    if (!financialProfile) return;

    // Only (re)initialize local form when backend data truly changed (e.g., after save)
    const updatedAt = (financialProfile as any).updated_at ?? null;
    const shouldInit =
      !financialFormInitRef.current ||
      (updatedAt && updatedAt !== lastFinancialUpdatedAtRef.current);

    if (!shouldInit) return;

    financialFormInitRef.current = true;
    lastFinancialUpdatedAtRef.current = updatedAt;

    // Copy ALL fields from financialProfile to formData to avoid missing fields
    // Use profile data as fallback for fields that are shared between tables
    const data: FinancialProfileInput = {
      date_naissance: financialProfile.date_naissance ?? profile?.birth_date ?? null,
      age: financialProfile.age,
      // IMPORTANT: never override user edits with stale financialProfile values
      situation_familiale: (financialProfile.situation_familiale ?? profile?.marital_status ?? null) as any,
      nb_enfants: financialProfile.nb_enfants ?? profile?.children_count ?? null,
      nb_personnes_foyer: financialProfile.nb_personnes_foyer,
      // Revenus professionnels
      revenu_mensuel_net: financialProfile.revenu_mensuel_net,
      revenu_annuel_brut: financialProfile.revenu_annuel_brut,
      revenu_fiscal_annuel: financialProfile.revenu_fiscal_annuel,
      revenu_fiscal_foyer: financialProfile.revenu_fiscal_foyer,
      revenu_annuel_conjoint: financialProfile.revenu_annuel_conjoint,
      revenu_annuel_brut_conjoint: financialProfile.revenu_annuel_brut_conjoint,
      autres_revenus_mensuels: financialProfile.autres_revenus_mensuels,
      revenus_locatifs: financialProfile.revenus_locatifs,
      // Revenus du capital
      revenus_dividendes: financialProfile.revenus_dividendes,
      revenus_ventes_actions: financialProfile.revenus_ventes_actions,
      revenus_capital_autres: financialProfile.revenus_capital_autres,
      // Equity income
      has_equity_income_this_year: financialProfile.has_equity_income_this_year,
      equity_income_amount: financialProfile.equity_income_amount,
      // Charges - Legacy
      charges_fixes_mensuelles: financialProfile.charges_fixes_mensuelles,
      loyer_actuel: financialProfile.loyer_actuel,
      credits_immobilier: financialProfile.credits_immobilier,
      credits_consommation: financialProfile.credits_consommation,
      credits_auto: financialProfile.credits_auto,
      pensions_alimentaires: financialProfile.pensions_alimentaires,
      // Charges - Détaillées (same categories as simulator)
      charges_copropriete_taxes: financialProfile.charges_copropriete_taxes,
      charges_energie: financialProfile.charges_energie,
      charges_assurance_habitation: financialProfile.charges_assurance_habitation,
      charges_transport_commun: financialProfile.charges_transport_commun,
      charges_assurance_auto: financialProfile.charges_assurance_auto,
      charges_lld_loa_auto: financialProfile.charges_lld_loa_auto,
      charges_internet: financialProfile.charges_internet,
      charges_mobile: financialProfile.charges_mobile,
      charges_abonnements: financialProfile.charges_abonnements,
      charges_frais_scolarite: financialProfile.charges_frais_scolarite,
      charges_autres: financialProfile.charges_autres,
      // Statut residence
      statut_residence: financialProfile.statut_residence,
      // Épargne
      epargne_actuelle: financialProfile.epargne_actuelle,
      epargne_livrets: financialProfile.epargne_livrets,
      apport_disponible: financialProfile.apport_disponible,
      capacite_epargne_mensuelle: financialProfile.capacite_epargne_mensuelle,
      // Patrimoine financier
      patrimoine_per: financialProfile.patrimoine_per,
      patrimoine_assurance_vie: financialProfile.patrimoine_assurance_vie,
      patrimoine_scpi: financialProfile.patrimoine_scpi,
      patrimoine_pea: financialProfile.patrimoine_pea,
      patrimoine_crypto: financialProfile.patrimoine_crypto,
      patrimoine_private_equity: financialProfile.patrimoine_private_equity,
      patrimoine_autres: financialProfile.patrimoine_autres,
      // Patrimoine immobilier
      patrimoine_immo_valeur: financialProfile.patrimoine_immo_valeur,
      patrimoine_immo_credit_restant: financialProfile.patrimoine_immo_credit_restant,
      // Fiscal
      tmi: financialProfile.tmi,
      parts_fiscales: financialProfile.parts_fiscales,
      plafond_per_reportable: financialProfile.plafond_per_reportable,
      // Emploi
      type_contrat: financialProfile.type_contrat,
      anciennete_annees: financialProfile.anciennete_annees,
      secteur_activite: financialProfile.secteur_activite,
      // Equity
      has_rsu_aga: financialProfile.has_rsu_aga,
      has_espp: financialProfile.has_espp,
      has_stock_options: financialProfile.has_stock_options,
      has_bspce: financialProfile.has_bspce,
      has_equity_autres: financialProfile.has_equity_autres,
      // Valeurs estimées equity
      valeur_rsu_aga: financialProfile.valeur_rsu_aga,
      valeur_espp: financialProfile.valeur_espp,
      valeur_stock_options: financialProfile.valeur_stock_options,
      valeur_bspce: financialProfile.valeur_bspce,
      // Épargne salariale
      has_pee: financialProfile.has_pee,
      has_perco: financialProfile.has_perco,
      has_pero: financialProfile.has_pero,
      has_epargne_autres: financialProfile.has_epargne_autres,
      // Valeurs estimées épargne salariale
      valeur_pee: financialProfile.valeur_pee,
      valeur_perco: financialProfile.valeur_perco,
      // Projets immobiliers
      objectif_achat_immo: financialProfile.objectif_achat_immo,
      projet_residence_principale: financialProfile.projet_residence_principale,
      projet_residence_secondaire: financialProfile.projet_residence_secondaire,
      projet_investissement_locatif: financialProfile.projet_investissement_locatif,
      budget_achat_immo: financialProfile.budget_achat_immo,
      budget_residence_principale: financialProfile.budget_residence_principale,
      budget_residence_secondaire: financialProfile.budget_residence_secondaire,
      budget_investissement_locatif: financialProfile.budget_investissement_locatif,
      duree_emprunt_souhaitee: financialProfile.duree_emprunt_souhaitee,
    };

    setFormData(data);
    setOriginalFormData(data);
  }, [financialProfile]);

  // Calculate age from birth date
  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Calcul du nombre de personnes au foyer (pour affichage)
  const calculateNbPersonnes = (situation: string | null, nbEnfants: number): number => {
    let personnes = 1;
    if (situation === "marie" || situation === "pacse") {
      personnes = 2;
    }
    personnes += nbEnfants;
    return personnes;
  };

  // Calcul des parts fiscales selon les règles françaises
  const calculatePartsFiscales = (situation: string | null, nbEnfants: number): number => {
    let parts = 1; // Célibataire, divorcé, veuf
    if (situation === "marie" || situation === "pacse") {
      parts = 2; // Couple marié ou pacsé
    }
    // Enfants à charge :
    // - 1er enfant : +0.5 part
    // - 2ème enfant : +0.5 part  
    // - 3ème enfant et suivants : +1 part chacun
    if (nbEnfants >= 1) parts += 0.5;
    if (nbEnfants >= 2) parts += 0.5;
    if (nbEnfants >= 3) parts += (nbEnfants - 2); // +1 par enfant supplémentaire
    
    // Cas spécial : parent isolé avec enfants (demi-part supplémentaire)
    if ((situation === "celibataire" || situation === "divorce" || situation === "veuf") && nbEnfants > 0) {
      parts += 0.5;
    }
    return parts;
  };

  // Calcul de la TMI selon les barèmes français 2024
  const calculateTMI = (revenuImposable: number, partsFiscales: number): number => {
    if (!revenuImposable || !partsFiscales || partsFiscales === 0) return 0;
    
    const quotientFamilial = revenuImposable / partsFiscales;
    
    // Barèmes 2024 (revenus 2023)
    if (quotientFamilial <= 11294) return 0;
    if (quotientFamilial <= 28797) return 11;
    if (quotientFamilial <= 82341) return 30;
    if (quotientFamilial <= 177106) return 41;
    return 45;
  };

  // Auto-update age when birth date changes
  useEffect(() => {
    const newAge = calculateAge(formData.date_naissance || null);
    if (newAge !== formData.age) {
      setFormData((prev) => ({ ...prev, age: newAge }));
    }
  }, [formData.date_naissance]);

  // Auto-update household size and fiscal parts when situation or children change
  useEffect(() => {
    const newNbPersonnes = calculateNbPersonnes(
      formData.situation_familiale || null,
      formData.nb_enfants || 0
    );
    const newPartsFiscales = calculatePartsFiscales(
      formData.situation_familiale || null,
      formData.nb_enfants || 0
    );
    
    const updates: Partial<typeof formData> = {};
    if (newNbPersonnes !== formData.nb_personnes_foyer) {
      updates.nb_personnes_foyer = newNbPersonnes;
    }
    if (newPartsFiscales !== formData.parts_fiscales) {
      updates.parts_fiscales = newPartsFiscales;
    }
    
    if (Object.keys(updates).length > 0) {
      setFormData((prev) => ({ ...prev, ...updates }));
    }
  }, [formData.situation_familiale, formData.nb_enfants]);

  // Auto-update TMI when revenue or parts fiscales change
  useEffect(() => {
    const newTMI = calculateTMI(
      formData.revenu_fiscal_annuel || 0,
      formData.parts_fiscales || 1
    );
    
    if (newTMI !== formData.tmi) {
      setFormData((prev) => ({ ...prev, tmi: newTMI }));
    }
  }, [formData.revenu_fiscal_annuel, formData.parts_fiscales]);

  const fetchAllData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setOriginalProfile(profileData);

      if (profileData.company_id) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("name, partnership_type")
          .eq("id", profileData.company_id)
          .single();
        setCompany(companyData);
        setOriginalCompany(companyData);
      }

      // Fetch financial profile settings
      const { data: settingsData } = await supabase
        .from("financial_profile_settings")
        .select("*")
        .limit(1)
        .single();

      if (settingsData) {
        setSettings({
          hero_title: settingsData.hero_title || "Votre Profil Financier",
          hero_description: settingsData.hero_description || "Complétez votre profil financier pour une expérience personnalisée",
          benefits: (settingsData.benefits as unknown as Benefit[]) || [],
          cta_text: settingsData.cta_text || "Compléter mon profil",
          footer_note: settingsData.footer_note || "",
        });
      }

      // Note: Les données d'épargne de précaution sont maintenant chargées via useLatestEpargnePrecaution
    } catch (error: any) {
      console.error("Failed to fetch data", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Save profile changes
    if (hasProfileChanges && profile) {
      try {
        setSavingProfile(true);
        const { error } = await supabase
          .from("profiles")
          .update({
            first_name: profile.first_name,
            last_name: profile.last_name,
            phone_number: profile.phone_number,
            birth_date: profile.birth_date,
            marital_status: profile.marital_status,
            children_count: profile.children_count,
            job_title: profile.job_title,
            net_taxable_income: profile.net_taxable_income,
            household_taxable_income: profile.household_taxable_income,
            personal_email: profile.personal_email,
            receive_on_personal_email: profile.receive_on_personal_email,
          })
          .eq("id", profile.id);

        if (error) throw error;
        setOriginalProfile(profile);
      } catch (error: any) {
        console.error("Failed to update profile", error);
        toast.error("Erreur lors de la mise à jour du profil");
        return;
      } finally {
        setSavingProfile(false);
      }
    }

    // Save company name changes (only for non-partner users)
    if (hasCompanyChanges && company && profile?.company_id) {
      try {
        const { error } = await supabase
          .from("companies")
          .update({ name: company.name })
          .eq("id", profile.company_id);
        
        if (error) throw error;
        setOriginalCompany(company);
      } catch (error: any) {
        console.error("Failed to update company", error);
        toast.error("Erreur lors de la mise à jour de l'entreprise");
        return;
      }
    }

    // Save financial changes
    if (hasFinancialChanges) {
      saveProfile(formData, {
        onSuccess: () => setOriginalFormData(formData),
      });
    }

    if (!hasFinancialChanges && (hasProfileChanges || hasCompanyChanges)) {
      toast.success("Profil mis à jour avec succès");
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setFormData(originalFormData);
    setCompany(originalCompany);
  };

  const updateProfileField = (field: keyof ProfileData, value: any) => {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const updateFinancialField = <K extends keyof FinancialProfileInput>(field: K, value: FinancialProfileInput[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading || financialLoading) {
    return (
      <EmployeeLayout activeSection="profile-info">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-primary text-xl animate-pulse">Chargement...</div>
        </div>
      </EmployeeLayout>
    );
  }

  const isSaving = savingProfile || savingFinancial;

  return (
    <EmployeeLayout activeSection="profile-info">
      <div className="pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header with Avatar */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-2">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-4 border-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !profile?.id) return;
                    
                    try {
                      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
                      const timestamp = Date.now();
                      const fileName = `${profile.id}/${timestamp}.${fileExt}`;
                      
                      // Upload with upsert to handle existing files
                      const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(fileName, file, { 
                          upsert: true,
                          contentType: file.type 
                        });
                      
                      if (uploadError) {
                        console.error("Upload error:", uploadError);
                        throw uploadError;
                      }
                      
                      const { data: urlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName);
                      
                      const avatarUrl = urlData.publicUrl;
                      
                      const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ avatar_url: avatarUrl })
                        .eq('id', profile.id);
                      
                      if (updateError) {
                        console.error("Update error:", updateError);
                        throw updateError;
                      }
                      
                      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
                      setOriginalProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
                      toast.success("Avatar mis à jour !");
                    } catch (error: any) {
                      console.error("Error uploading avatar:", error);
                      toast.error(`Erreur lors de l'upload: ${error.message || 'Erreur inconnue'}`);
                    }
                  }}
                />
                <Palette className="h-6 w-6 text-white" />
              </label>
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">
                {profile?.first_name} {profile?.last_name}
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 justify-center md:justify-start mt-1">
                <Mail className="h-4 w-4" />
                {profile?.email}
              </p>
              {company && (
                <p className="text-muted-foreground flex items-center gap-2 justify-center md:justify-start mt-1">
                  <Building2 className="h-4 w-4" />
                  {company.name}
                </p>
              )}
            </div>
            {/* Financial completeness */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-1 cursor-help">
                    <div className="text-xs text-muted-foreground">Profil financier</div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${completeness}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{completeness}%</span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {completeness === 100 ? (
                    <p className="text-xs text-green-600">Profil complet !</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Pour arriver à 100%, complétez :</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        {missingFields.map((field, index) => (
                          <li key={index}>{field}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full grid grid-cols-7 h-auto p-1 bg-card border border-[hsl(var(--card-border))] shadow-[var(--shadow-card)]">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-3 text-xs md:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Tab: Dashboard (Synthèse) - Only shows full dashboard if profile is 100% complete */}
            <TabsContent value="dashboard" className="mt-6">
              <div className="max-w-4xl mx-auto">
                {completeness < 100 ? (
                  <div className="space-y-8">
                    {/* Hero section */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center space-y-4"
                    >
                      <div className="relative mx-auto w-24 h-24">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
                        />
                        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <span className="text-4xl">🚀</span>
                        </div>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        Reprenez le contrôle de votre futur
                      </h2>
                      <p className="text-muted-foreground max-w-lg mx-auto">
                        Remplir votre profil n'est pas une corvée administrative, c'est l'activation de votre tableau de bord vers la liberté.
                      </p>
                    </motion.div>

                    {/* Animated progress ring */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="flex justify-center"
                    >
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" strokeWidth="6" className="stroke-muted" />
                          <motion.circle
                            cx="50" cy="50" r="42" fill="none" strokeWidth="6"
                            className="stroke-primary"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 42}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - completeness / 100) }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold">{completeness}%</span>
                          <span className="text-xs text-muted-foreground">complété</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Unlock message */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="text-center"
                    >
                      <p className="text-sm font-medium text-primary bg-primary/10 inline-flex items-center gap-2 px-4 py-2 rounded-full">
                        <Lock className="h-3.5 w-3.5" />
                        Encore {100 - completeness}% à compléter pour activer votre synthèse financière
                      </p>
                    </motion.div>

                    {/* 3 value props - big visual cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        {
                          emoji: "⚡️",
                          title: "Sortez du brouillard",
                          desc: "Arrêtez de \"deviner\" où part votre argent. Une vision nette, c'est 90% de stress en moins et 100% de maîtrise en plus.",
                          gradient: "from-secondary/10 to-primary/10",
                          border: "border-secondary/20",
                          delay: 0.2,
                        },
                        {
                          emoji: "💎",
                          title: "Débloquez vos leviers cachés",
                          desc: "Identifier vos dépenses et vos actifs, c'est souvent découvrir de l'argent qui dort ou qui fuit. Nous vous aidons à récupérer ce qui vous appartient.",
                          gradient: "from-violet-500/10 to-purple-500/10",
                          border: "border-violet-500/20",
                          delay: 0.3,
                        },
                        {
                          emoji: "🎯",
                          title: "Tracez la route vers vos rêves",
                          desc: "On ne construit pas un empire (ou une retraite sereine) sur du sable. Vos données sont les briques qui transforment vos envies en projets concrets.",
                          gradient: "from-emerald-500/10 to-teal-500/10",
                          border: "border-emerald-500/20",
                          delay: 0.4,
                        },
                      ].map((item) => (
                        <motion.div
                          key={item.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: item.delay }}
                        >
                          <Card className={`h-full bg-gradient-to-br ${item.gradient} border ${item.border} hover:shadow-lg transition-all duration-300`}>
                            <CardContent className="p-5 space-y-3">
                              <span className="text-3xl block">{item.emoji}</span>
                              <h3 className="font-semibold text-base">{item.title}</h3>
                              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Feature pills */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                    >
                      {[
                        { icon: <Calculator className="h-4 w-4 text-primary" />, title: "Simulateurs pré-remplis", desc: "Vos données sont automatiquement injectées dans tous les simulateurs" },
                        { icon: <Target className="h-4 w-4 text-primary" />, title: "Recommandations personnalisées", desc: "Recevez des conseils adaptés à votre situation réelle" },
                        { icon: <Shield className="h-4 w-4 text-primary" />, title: "Vision 360° de vos finances", desc: "Visualisez votre patrimoine, votre épargne et votre sécurité financière" },
                      ].map((feat) => (
                        <div key={feat.title} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-transparent hover:border-primary/20 transition-colors">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {feat.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{feat.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{feat.desc}</p>
                          </div>
                        </div>
                      ))}
                    </motion.div>

                    {/* Le saviez-vous */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="p-4 rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20"
                    >
                      <p className="text-sm text-muted-foreground text-center">
                        <strong className="text-foreground">💡 Le saviez-vous ?</strong> Un utilisateur qui suit précisément son patrimoine augmente sa capacité d'investissement de 20% en moyenne dès la première année.
                      </p>
                    </motion.div>

                    {/* Missing fields - clickable chips */}
                    {missingFieldsDetailed.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-card rounded-xl p-5 space-y-3"
                      >
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                          Il vous reste à compléter :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {missingFieldsDetailed.map((field, index) => {
                            const targetTab = FIELD_TO_TAB[field.fieldKey] || "personal";
                            return (
                              <button 
                                key={index}
                                onClick={() => handleTabChange(targetTab)}
                                className="px-3 py-1.5 bg-muted/50 rounded-full text-xs border hover:border-primary hover:bg-primary/5 hover:text-primary transition-all cursor-pointer flex items-center gap-1.5 group"
                              >
                                <span>{field.label}</span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* CTA */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <Button 
                        onClick={() => handleTabChange("situation")}
                        className="w-full gap-2"
                        size="lg"
                      >
                        <Sparkles className="h-4 w-4" />
                        Compléter mon profil
                      </Button>
                    </motion.div>
                  </div>
                ) : (
                  <FinancialDashboard 
                    formData={formData}
                    completeness={completeness}
                    missingFields={missingFields}
                    onNavigateToTab={handleTabChange}
                    epargnePrecautionData={epargnePrecautionData}
                  />
                )}
              </div>
            </TabsContent>

            {/* Tab: Personal Info */}
            <TabsContent value="personal" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Identité</CardTitle>
                      <CardDescription>Vos informations personnelles de base</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Prénom</Label>
                      <Input
                        id="first_name"
                        value={profile?.first_name || ""}
                        onChange={(e) => updateProfileField("first_name", e.target.value)}
                        placeholder="Votre prénom"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Nom</Label>
                      <Input
                        id="last_name"
                        value={profile?.last_name || ""}
                        onChange={(e) => updateProfileField("last_name", e.target.value)}
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      Email professionnel
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ""}
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      L'email professionnel ne peut pas être modifié
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personal_email" className="flex items-center gap-2">
                      Adresse mail personnelle
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Cette adresse peut être utilisée pour recevoir des informations et newsletters même après votre départ de l'entreprise.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      id="personal_email"
                      type="email"
                      value={profile?.personal_email || ""}
                      onChange={(e) => updateProfileField("personal_email", e.target.value)}
                      placeholder="votre.email.personnel@exemple.com"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="receive_on_personal_email"
                      checked={profile?.receive_on_personal_email || false}
                      onCheckedChange={(checked) => updateProfileField("receive_on_personal_email", checked === true)}
                    />
                    <Label htmlFor="receive_on_personal_email" className="text-sm font-normal cursor-pointer">
                      Recevoir les communications sur mon adresse personnelle
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Coordonnées</CardTitle>
                      <CardDescription>Comment vous contacter</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Numéro de téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile?.phone_number || ""}
                      onChange={(e) => updateProfileField("phone_number", e.target.value)}
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Forum Anonymous Settings */}
              {profile && (
                <ForumAnonymousSettings
                  profileId={profile.id}
                  companyId={profile.company_id}
                  forumAnonymousMode={profile.forum_anonymous_mode}
                  forumPseudo={profile.forum_pseudo}
                  forumAvatarUrl={profile.forum_avatar_url}
                  onUpdate={fetchAllData}
                />
              )}
            </TabsContent>

            {/* Tab: Situation */}
            <TabsContent value="situation" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Situation personnelle</CardTitle>
                      <CardDescription>Ces informations permettent de personnaliser vos recommandations</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birth_date" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date de naissance{reqMark("date_naissance")}
                      </Label>
                      <Input
                        id="birth_date"
                        type="date"
                        value={formData.date_naissance || profile?.birth_date || ""}
                        onChange={(e) => {
                          updateFinancialField("date_naissance", e.target.value);
                          updateProfileField("birth_date", e.target.value);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Âge
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Calculé automatiquement à partir de votre date de naissance</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <div className="flex items-center h-10 px-3 rounded-md border bg-muted">
                        {(() => {
                          const birthDate = formData.date_naissance || profile?.birth_date;
                          if (birthDate) {
                            const age = calculateAge(birthDate);
                            return <span className="text-foreground font-medium">{age} ans</span>;
                          }
                          return <span className="text-muted-foreground text-sm">Non renseigné</span>;
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Situation familiale{reqMark("situation_familiale")}</Label>
                      <Select
                        value={formData.situation_familiale || profile?.marital_status || ""}
                        onValueChange={(value) => {
                          updateFinancialField("situation_familiale", value);
                          updateProfileField("marital_status", value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="celibataire">Célibataire</SelectItem>
                          <SelectItem value="marie">Marié(e)</SelectItem>
                          <SelectItem value="pacse">Pacsé(e)</SelectItem>
                          <SelectItem value="divorce">Divorcé(e)</SelectItem>
                          <SelectItem value="veuf">Veuf(ve)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre d'enfants à charge</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.nb_enfants ?? profile?.children_count ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const val = raw === "" ? null : Math.max(0, parseInt(raw, 10) || 0);
                          updateFinancialField("nb_enfants", val as any);
                          updateProfileField("children_count", val);
                        }}
                      />
                    </div>
                  </div>

                  {/* Statut de résidence */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Statut de résidence{reqMark("statut_residence")}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">Êtes-vous propriétaire ou locataire de votre résidence principale ?</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Select
                      value={formData.statut_residence || ""}
                      onValueChange={(value) => {
                        updateFinancialField("statut_residence", value);
                        if (value === "locataire" || value === "heberge") {
                          updateFinancialField("credits_immobilier", 0);
                          updateFinancialField("charges_copropriete_taxes", 0);
                        } else if (value === "proprietaire") {
                          updateFinancialField("loyer_actuel", 0);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner votre statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proprietaire">Propriétaire</SelectItem>
                        <SelectItem value="locataire">Locataire</SelectItem>
                        <SelectItem value="heberge">Hébergé à titre gratuit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Personnes au foyer
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </Label>
                      <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-muted-foreground">
                        {formData.nb_personnes_foyer ?? "Calculé automatiquement"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        Parts fiscales
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </Label>
                      <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-muted-foreground">
                        {formData.parts_fiscales ?? "Calculé automatiquement"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Calculé selon votre situation familiale et le nombre d'enfants
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Professional */}
            <TabsContent value="professional" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Entreprise</CardTitle>
                      <CardDescription>Votre employeur actuel</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const hasActivePartnership = company?.partnership_type && 
                      company.partnership_type.toLowerCase() !== 'aucun';
                    
                    if (hasActivePartnership) {
                      // Entreprise avec partenariat actif : champ verrouillé
                      return (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            Entreprise
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          </Label>
                          <Input
                            value={company?.name || "Non renseignée"}
                            disabled
                            className="bg-muted cursor-not-allowed"
                          />
                        </div>
                      );
                    } else {
                      // Pas de partenariat (beta / email perso) : champ modifiable
                      return (
                        <div className="space-y-2">
                          <Label>Entreprise</Label>
                          <Input
                            value={company?.name || ""}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setCompany(prev => prev ? { ...prev, name: newName } : { name: newName, partnership_type: null });
                            }}
                            placeholder="Nom de votre entreprise"
                          />
                          <p className="text-xs text-muted-foreground">
                            Vous pouvez modifier le nom de votre entreprise
                          </p>
                        </div>
                      );
                    }
                  })()}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Situation professionnelle</CardTitle>
                      <CardDescription>Détails sur votre emploi</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Poste occupé</Label>
                      <Input
                        value={profile?.job_title || ""}
                        onChange={(e) => updateProfileField("job_title", e.target.value)}
                        placeholder="Ex: Développeur, Chef de projet..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type de contrat{reqMark("type_contrat")}</Label>
                      <Select
                        value={formData.type_contrat || ""}
                        onValueChange={(value) => updateFinancialField("type_contrat", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CDI">CDI</SelectItem>
                          <SelectItem value="CDD">CDD</SelectItem>
                          <SelectItem value="Freelance">Freelance / Indépendant</SelectItem>
                          <SelectItem value="Fonctionnaire">Fonctionnaire</SelectItem>
                          <SelectItem value="Autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* Avantages entreprise */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Euro className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Avantages proposés par votre entreprise</CardTitle>
                      <CardDescription className="space-y-2">
                        <p>Indiquez les dispositifs dont vous bénéficiez. Ces informations nous permettent de personnaliser nos recommandations et simulateurs.</p>
                        <p className="text-primary/80 font-medium">💡 Le montant est optionnel, mais recenser vos dispositifs est une étape clé : faire l'état des lieux de votre patrimoine, c'est le premier pas vers une réflexion financière globale et éclairée.</p>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Rémunération Equity */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-4 rounded bg-primary" />
                      <h4 className="font-medium text-sm">Rémunération Equity</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                      <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!formData.has_rsu_aga && !formData.has_espp && !formData.has_stock_options && !formData.has_bspce && !formData.has_equity_autres}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateFinancialField("has_rsu_aga", false);
                              updateFinancialField("has_espp", false);
                              updateFinancialField("has_stock_options", false);
                              updateFinancialField("has_bspce", false);
                              updateFinancialField("has_equity_autres", false);
                            }
                          }}
                          className="h-4 w-4 rounded border-border"
                        />
                        <div>
                          <span className="font-medium text-sm">Aucun</span>
                          <p className="text-xs text-muted-foreground">Pas de rémunération en actions</p>
                        </div>
                      </label>
                      <div className="p-3 rounded-lg hover:bg-background transition-colors space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.has_rsu_aga || false}
                            onChange={(e) => {
                              updateFinancialField("has_rsu_aga", e.target.checked);
                              if (!e.target.checked) updateFinancialField("valeur_rsu_aga", 0);
                            }}
                            className="h-4 w-4 rounded border-border"
                          />
                          <div>
                            <span className="font-medium text-sm">RSU / AGA</span>
                            <p className="text-xs text-muted-foreground">Restricted Stock Units / Actions Gratuites</p>
                          </div>
                        </label>
                        {formData.has_rsu_aga && (
                          <Input
                            type="number"
                            value={formData.valeur_rsu_aga ?? ""}
                            onChange={(e) => updateFinancialField("valeur_rsu_aga", parseFloat(e.target.value) || 0)}
                            placeholder="Valeur estimée (€)"
                            className="ml-7"
                          />
                        )}
                      </div>
                      <div className="p-3 rounded-lg hover:bg-background transition-colors space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.has_espp || false}
                            onChange={(e) => {
                              updateFinancialField("has_espp", e.target.checked);
                              if (!e.target.checked) updateFinancialField("valeur_espp", 0);
                            }}
                            className="h-4 w-4 rounded border-border"
                          />
                          <div>
                            <span className="font-medium text-sm">ESPP</span>
                            <p className="text-xs text-muted-foreground">Employee Stock Purchase Plan</p>
                          </div>
                        </label>
                        {formData.has_espp && (
                          <Input
                            type="number"
                            value={formData.valeur_espp ?? ""}
                            onChange={(e) => updateFinancialField("valeur_espp", parseFloat(e.target.value) || 0)}
                            placeholder="Valeur estimée (€)"
                            className="ml-7"
                          />
                        )}
                      </div>
                      <div className="p-3 rounded-lg hover:bg-background transition-colors space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.has_stock_options || false}
                            onChange={(e) => {
                              updateFinancialField("has_stock_options", e.target.checked);
                              if (!e.target.checked) updateFinancialField("valeur_stock_options", 0);
                            }}
                            className="h-4 w-4 rounded border-border"
                          />
                          <div>
                            <span className="font-medium text-sm">Stock Options</span>
                            <p className="text-xs text-muted-foreground">Options d'achat d'actions</p>
                          </div>
                        </label>
                        {formData.has_stock_options && (
                          <Input
                            type="number"
                            value={formData.valeur_stock_options ?? ""}
                            onChange={(e) => updateFinancialField("valeur_stock_options", parseFloat(e.target.value) || 0)}
                            placeholder="Valeur estimée (€)"
                            className="ml-7"
                          />
                        )}
                      </div>
                      <div className="p-3 rounded-lg hover:bg-background transition-colors space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.has_bspce || false}
                            onChange={(e) => {
                              updateFinancialField("has_bspce", e.target.checked);
                              if (!e.target.checked) updateFinancialField("valeur_bspce", 0);
                            }}
                            className="h-4 w-4 rounded border-border"
                          />
                          <div>
                            <span className="font-medium text-sm">BSPCE</span>
                            <p className="text-xs text-muted-foreground">Bons de Souscription (startups)</p>
                          </div>
                        </label>
                        {formData.has_bspce && (
                          <Input
                            type="number"
                            value={formData.valeur_bspce ?? ""}
                            onChange={(e) => updateFinancialField("valeur_bspce", parseFloat(e.target.value) || 0)}
                            placeholder="Valeur estimée (€)"
                            className="ml-7"
                          />
                        )}
                      </div>
                      <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.has_equity_autres || false}
                          onChange={(e) => updateFinancialField("has_equity_autres", e.target.checked)}
                          className="h-4 w-4 rounded border-border"
                        />
                        <div>
                          <span className="font-medium text-sm">Autres</span>
                          <p className="text-xs text-muted-foreground">Autre type de rémunération en actions</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Épargne salariale */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-4 rounded bg-primary" />
                      <h4 className="font-medium text-sm">Épargne salariale</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                      <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!formData.has_pee && !formData.has_perco && !formData.has_pero && !formData.has_epargne_autres}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateFinancialField("has_pee", false);
                              updateFinancialField("has_perco", false);
                              updateFinancialField("has_pero", false);
                              updateFinancialField("has_epargne_autres", false);
                            }
                          }}
                          className="h-4 w-4 rounded border-border"
                        />
                        <div>
                          <span className="font-medium text-sm">Aucun</span>
                          <p className="text-xs text-muted-foreground">Pas d'épargne salariale</p>
                        </div>
                      </label>
                      <div className="p-3 rounded-lg hover:bg-background transition-colors space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.has_pee || false}
                            onChange={(e) => {
                              updateFinancialField("has_pee", e.target.checked);
                              if (!e.target.checked) updateFinancialField("valeur_pee", 0);
                            }}
                            className="h-4 w-4 rounded border-border"
                          />
                          <div>
                            <span className="font-medium text-sm">PEE</span>
                            <p className="text-xs text-muted-foreground">Plan d'Épargne Entreprise</p>
                          </div>
                        </label>
                        {formData.has_pee && (
                          <Input
                            type="number"
                            value={formData.valeur_pee ?? ""}
                            onChange={(e) => updateFinancialField("valeur_pee", parseFloat(e.target.value) || 0)}
                            placeholder="Valeur estimée (€)"
                            className="ml-7"
                          />
                        )}
                      </div>
                      <div className="p-3 rounded-lg hover:bg-background transition-colors space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.has_perco || false}
                            onChange={(e) => {
                              updateFinancialField("has_perco", e.target.checked);
                              if (!e.target.checked) updateFinancialField("valeur_perco", 0);
                            }}
                            className="h-4 w-4 rounded border-border"
                          />
                          <div>
                            <span className="font-medium text-sm">PERCO / PERCOL</span>
                            <p className="text-xs text-muted-foreground">Plan d'Épargne Retraite Collectif</p>
                          </div>
                        </label>
                        {formData.has_perco && (
                          <Input
                            type="number"
                            value={formData.valeur_perco ?? ""}
                            onChange={(e) => updateFinancialField("valeur_perco", parseFloat(e.target.value) || 0)}
                            placeholder="Valeur estimée (€)"
                            className="ml-7"
                          />
                        )}
                      </div>
                      <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.has_pero || false}
                          onChange={(e) => updateFinancialField("has_pero", e.target.checked)}
                          className="h-4 w-4 rounded border-border"
                        />
                        <div>
                          <span className="font-medium text-sm">PERO (Article 83)</span>
                          <p className="text-xs text-muted-foreground">Plan d'Épargne Retraite Obligatoire</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.has_epargne_autres || false}
                          onChange={(e) => updateFinancialField("has_epargne_autres", e.target.checked)}
                          className="h-4 w-4 rounded border-border"
                        />
                        <div>
                          <span className="font-medium text-sm">Autres</span>
                          <p className="text-xs text-muted-foreground">Autre type d'épargne salariale</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Financial - Now using wizard */}
            <TabsContent value="financial" className="space-y-6 mt-6">
              <FinancialProfileWizard
                formData={formData}
                updateField={updateFinancialField}
                onSave={() => saveProfile(formData, { onSuccess: () => setOriginalFormData(formData) })}
                isSaving={savingFinancial}
                situationFamiliale={formData.situation_familiale || profile?.marital_status || null}
                hasEquityBenefits={formData.has_rsu_aga || formData.has_espp || formData.has_stock_options || formData.has_bspce || formData.has_equity_autres || false}
                onInviteSpouse={() => setShowInviteDialog(true)}
                requiredFieldKeys={requiredFieldKeys}
              />
            </TabsContent>

            {/* Tab: Savings - Patrimoine & Épargne */}
            <TabsContent value="savings" className="space-y-6 mt-6">
              {/* Message d'info diversification */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Conseil :</strong> En indiquant les montants de vos placements, nous serons en mesure de calculer votre taux de diversification et vous proposer des recommandations personnalisées.
                  </p>
                </div>
              </div>

              {/* Patrimoine Financier */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Patrimoine financier</CardTitle>
                      <CardDescription>Sélectionnez vos types de placements et indiquez les montants (optionnel)</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: "epargne_livrets" as const, label: "Épargne sur livrets (€)", desc: "Livret A, LDDS, LEP...", required: true },
                      { key: "patrimoine_assurance_vie" as const, label: "Assurance-vie (€)", desc: undefined },
                      { key: "patrimoine_per" as const, label: "PER (€)", desc: "Plan Épargne Retraite" },
                      { key: "patrimoine_pea" as const, label: "PEA / CTO (€)", desc: undefined },
                      { key: "patrimoine_scpi" as const, label: "SCPI (€)", desc: undefined },
                      { key: "patrimoine_crypto" as const, label: "Cryptomonnaies (€)", desc: "Bitcoin, Ethereum..." },
                      { key: "patrimoine_private_equity" as const, label: "Private Equity (€)", desc: "FCPR, FCPI, FIP..." },
                      { key: "patrimoine_autres" as const, label: "Autres placements (€)", desc: "Or, bijoux, montres, œuvres d'art..." },
                    ].map((item) => (
                      <div key={item.key} className="space-y-1.5">
                        <Label className="text-sm">{item.label}{item.required ? reqMark(item.key) : ''}</Label>
                        <Input
                          type="number"
                          value={(formData[item.key] ?? 0) > 0 ? formData[item.key] : ""}
                          onChange={(e) => updateFinancialField(item.key, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                        {item.desc && <p className="text-xs text-muted-foreground">{item.desc}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Valeur estimée des dispositifs professionnels */}
                  {(() => {
                    const totalDispositifs = (formData.valeur_rsu_aga ?? 0) +
                      (formData.valeur_espp ?? 0) +
                      (formData.valeur_stock_options ?? 0) +
                      (formData.valeur_bspce ?? 0) +
                      (formData.valeur_pee ?? 0) +
                      (formData.valeur_perco ?? 0);
                    
                    if (totalDispositifs > 0) {
                      return (
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">Valeur estimée des dispositifs professionnels</span>
                              <p className="text-xs text-muted-foreground mt-1">RSU/AGA, ESPP, Stock Options, BSPCE, PEE, PERCO</p>
                            </div>
                            <span className="text-lg font-semibold text-primary">
                              {totalDispositifs.toLocaleString('fr-FR')} €
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Total patrimoine financier */}
                  {(() => {
                    const totalDispositifs = (formData.valeur_rsu_aga ?? 0) +
                      (formData.valeur_espp ?? 0) +
                      (formData.valeur_stock_options ?? 0) +
                      (formData.valeur_bspce ?? 0) +
                      (formData.valeur_pee ?? 0) +
                      (formData.valeur_perco ?? 0);

                    const totalFinancier = (formData.epargne_livrets ?? 0) +
                      (formData.patrimoine_assurance_vie ?? 0) +
                      (formData.patrimoine_per ?? 0) +
                      (formData.patrimoine_pea ?? 0) +
                      (formData.patrimoine_scpi ?? 0) +
                      (formData.patrimoine_crypto ?? 0) +
                      (formData.patrimoine_private_equity ?? 0) +
                      (formData.patrimoine_autres ?? 0) +
                      totalDispositifs;
                    
                    if (totalFinancier > 0) {
                      return (
                        <div className="mt-4 p-4 rounded-lg bg-muted/50">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Total patrimoine financier</span>
                            <span className="text-lg font-semibold text-primary">
                              {totalFinancier.toLocaleString('fr-FR')} €
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>

              {/* Capacité d'épargne */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <PiggyBank className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Capacité d'épargne</CardTitle>
                      <CardDescription>Votre capacité à mettre de côté chaque mois</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={cn("space-y-2 p-3 rounded-lg transition-all duration-700", highlightedField === "capacite_epargne_mensuelle" && "ring-2 ring-primary bg-primary/10 animate-pulse")} data-field="capacite_epargne_mensuelle">
                    <Label>Capacité d'épargne mensuelle (€/mois){reqMark("capacite_epargne_mensuelle")}</Label>
                    <Input
                      type="number"
                      value={formData.capacite_epargne_mensuelle ?? ""}
                      onChange={(e) => updateFinancialField("capacite_epargne_mensuelle", parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 300"
                    />
                    <p className="text-xs text-muted-foreground">
                      Montant que vous pouvez épargner chaque mois après vos dépenses
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Objectives */}
            <TabsContent value="objectives" className="space-y-6 mt-6">
              <ObjectivesTab />
            </TabsContent>
          </Tabs>

          {/* Invite spouse dialog */}
          {profile?.company_id && (
            <InviteColleagueDialog 
              open={showInviteDialog} 
              onOpenChange={setShowInviteDialog}
              companyId={profile.company_id}
              companyName={company?.name || ""}
              isSpouseInvite={true}
            />
          )}
        </div>
      </div>

      {/* Floating save bar */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-4 transition-all duration-300 z-50",
          hasChanges ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        )}
      >
        <div className="container mx-auto max-w-4xl flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Vous avez des modifications non enregistrées
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
