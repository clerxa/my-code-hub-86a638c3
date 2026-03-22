/**
 * Audit patrimonial — sous-page de PANORAMA
 * Contient les onglets : Situation, Professionnel, Revenus, Épargne, Objectifs
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Users, Building2, Briefcase,
  Euro, Save, X, Lock, Wallet, PiggyBank,
  Target, Info, type LucideIcon, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserFinancialProfile, type FinancialProfileInput } from "@/hooks/useUserFinancialProfile";
import { FinancialProfileWizard } from "@/components/employee/FinancialProfileWizard";
import { ObjectivesTab } from "@/components/employee/ObjectivesTab";

import { calculateTMI, calculatePartsFiscales } from "@/utils/taxCalculations";
import { useFiscalRules } from "@/contexts/GlobalSettingsContext";

const tabs = [
  { id: "situation", label: "Situation", icon: Users },
  { id: "professional", label: "Professionnel", icon: Briefcase },
  { id: "financial", label: "Revenus", icon: Wallet },
  { id: "savings", label: "Épargne", icon: PiggyBank },
  { id: "objectives", label: "Objectifs", icon: Target },
];

// Same field-to-tab mapping for navigation from PANORAMA missing fields
export const AUDIT_FIELD_TO_TAB: Record<string, string> = {
  date_naissance: "situation",
  situation_familiale: "situation",
  nb_enfants: "situation",
  statut_residence: "situation",
  type_contrat: "professional",
  anciennete_annees: "professional",
  secteur_activite: "professional",
  revenu_annuel_brut: "financial",
  revenu_mensuel_net: "financial",
  revenu_fiscal_annuel: "financial",
  revenu_fiscal_foyer: "financial",
  revenu_annuel_conjoint: "financial",
  revenu_annuel_brut_conjoint: "financial",
  autres_revenus_mensuels: "financial",
  revenus_locatifs: "financial",
  charges_fixes_mensuelles: "financial",
  loyer_actuel: "financial",
  credits_immobilier: "financial",
  credits_consommation: "financial",
  credits_auto: "financial",
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

const FIELD_TO_WIZARD_STEP: Record<string, string> = {
  revenu_annuel_brut: "revenus-pro",
  revenu_mensuel_net: "revenus-pro",
  revenu_fiscal_annuel: "revenus-pro",
  revenu_fiscal_foyer: "revenus-pro",
  revenu_annuel_conjoint: "revenus-pro",
  revenu_annuel_brut_conjoint: "revenus-pro",
  autres_revenus_mensuels: "revenus-pro",
  revenus_dividendes: "revenus-capital",
  revenus_ventes_actions: "revenus-capital",
  revenus_capital_autres: "revenus-capital",
  revenus_locatifs: "revenus-fonciers",
  charges_fixes_mensuelles: "charges",
  loyer_actuel: "charges",
  credits_immobilier: "charges",
  credits_consommation: "charges",
  credits_auto: "charges",
  charges_copropriete_taxes: "charges",
  charges_energie: "charges",
  charges_assurance_habitation: "charges",
  charges_transport_commun: "charges",
  charges_assurance_auto: "charges",
  charges_lld_loa_auto: "charges",
  charges_internet: "charges",
  charges_mobile: "charges",
  charges_abonnements: "charges",
  charges_frais_scolarite: "charges",
  pensions_alimentaires: "charges",
  charges_autres: "charges",
};

interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  marital_status: string | null;
  children_count: number | null;
  job_title: string | null;
  company_id: string | null;
}

export default function PanoramaAuditPage() {
  const navigate = useNavigate();
  const fiscalRules = useFiscalRules();
  const { tax_brackets } = fiscalRules;
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "situation";
  const highlightField = searchParams.get("highlight");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [wizardInitialStep, setWizardInitialStep] = useState<string | null>(null);

  // Profile state (minimal — only fields shared with financial)
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(null);
  const [company, setCompany] = useState<{ name: string; partnership_type: string | null } | null>(null);
  const [originalCompany, setOriginalCompany] = useState<{ name: string; partnership_type: string | null } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Financial profile state
  const { profile: financialProfile, isLoading: financialLoading, saveProfile, isSaving: savingFinancial, completeness, missingFields, missingFieldsDetailed, requiredFieldKeys } = useUserFinancialProfile();
  const isFieldRequired = (fieldKey: string) => requiredFieldKeys.includes(fieldKey);
  const reqMark = (fieldKey: string) => isFieldRequired(fieldKey) ? <span className="text-destructive ml-0.5">*</span> : null;
  const [formData, setFormData] = useState<FinancialProfileInput>({});
  const [originalFormData, setOriginalFormData] = useState<FinancialProfileInput>({});
  const financialFormInitRef = useRef(false);
  const lastFinancialUpdatedAtRef = useRef<string | null>(null);
  

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

  const handleTabChange = (value: string, fieldKey?: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
    if (value === "financial" && fieldKey && FIELD_TO_WIZARD_STEP[fieldKey]) {
      setWizardInitialStep(FIELD_TO_WIZARD_STEP[fieldKey]);
    } else {
      setWizardInitialStep(null);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (highlightField && !loading && !financialLoading) {
      setHighlightedField(highlightField);
      const timer = setTimeout(() => {
        const el = document.querySelector(`[data-field="${highlightField}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
      const clearTimer = setTimeout(() => setHighlightedField(null), 3500);
      return () => { clearTimeout(timer); clearTimeout(clearTimer); };
    }
  }, [highlightField, loading, financialLoading]);

  useEffect(() => {
    if (!financialProfile) return;
    const updatedAt = (financialProfile as any).updated_at ?? null;
    const shouldInit = !financialFormInitRef.current || (updatedAt && updatedAt !== lastFinancialUpdatedAtRef.current);
    if (!shouldInit) return;
    financialFormInitRef.current = true;
    lastFinancialUpdatedAtRef.current = updatedAt;

    const data: FinancialProfileInput = {
      date_naissance: financialProfile.date_naissance ?? profile?.birth_date ?? null,
      age: financialProfile.age,
      situation_familiale: (financialProfile.situation_familiale ?? profile?.marital_status ?? null) as any,
      nb_enfants: financialProfile.nb_enfants ?? profile?.children_count ?? null,
      nb_personnes_foyer: financialProfile.nb_personnes_foyer,
      revenu_mensuel_net: financialProfile.revenu_mensuel_net,
      revenu_annuel_brut: financialProfile.revenu_annuel_brut,
      revenu_fiscal_annuel: financialProfile.revenu_fiscal_annuel,
      revenu_fiscal_foyer: financialProfile.revenu_fiscal_foyer,
      revenu_annuel_conjoint: financialProfile.revenu_annuel_conjoint,
      revenu_annuel_brut_conjoint: financialProfile.revenu_annuel_brut_conjoint,
      autres_revenus_mensuels: financialProfile.autres_revenus_mensuels,
      revenus_locatifs: financialProfile.revenus_locatifs,
      revenus_dividendes: financialProfile.revenus_dividendes,
      revenus_ventes_actions: financialProfile.revenus_ventes_actions,
      revenus_capital_autres: financialProfile.revenus_capital_autres,
      has_equity_income_this_year: financialProfile.has_equity_income_this_year,
      equity_income_amount: financialProfile.equity_income_amount,
      charges_fixes_mensuelles: financialProfile.charges_fixes_mensuelles,
      loyer_actuel: financialProfile.loyer_actuel,
      credits_immobilier: financialProfile.credits_immobilier,
      credits_consommation: financialProfile.credits_consommation,
      credits_auto: financialProfile.credits_auto,
      pensions_alimentaires: financialProfile.pensions_alimentaires,
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
      statut_residence: financialProfile.statut_residence,
      epargne_actuelle: financialProfile.epargne_actuelle,
      epargne_livrets: financialProfile.epargne_livrets,
      apport_disponible: financialProfile.apport_disponible,
      capacite_epargne_mensuelle: financialProfile.capacite_epargne_mensuelle,
      patrimoine_per: financialProfile.patrimoine_per,
      patrimoine_assurance_vie: financialProfile.patrimoine_assurance_vie,
      patrimoine_scpi: financialProfile.patrimoine_scpi,
      patrimoine_pea: financialProfile.patrimoine_pea,
      patrimoine_crypto: financialProfile.patrimoine_crypto,
      patrimoine_private_equity: financialProfile.patrimoine_private_equity,
      patrimoine_autres: financialProfile.patrimoine_autres,
      patrimoine_immo_valeur: financialProfile.patrimoine_immo_valeur,
      patrimoine_immo_credit_restant: financialProfile.patrimoine_immo_credit_restant,
      tmi: financialProfile.tmi,
      parts_fiscales: financialProfile.parts_fiscales,
      plafond_per_reportable: financialProfile.plafond_per_reportable,
      type_contrat: financialProfile.type_contrat,
      anciennete_annees: financialProfile.anciennete_annees,
      secteur_activite: financialProfile.secteur_activite,
      has_rsu_aga: financialProfile.has_rsu_aga,
      has_espp: financialProfile.has_espp,
      has_stock_options: financialProfile.has_stock_options,
      has_bspce: financialProfile.has_bspce,
      has_equity_autres: financialProfile.has_equity_autres,
      valeur_rsu_aga: financialProfile.valeur_rsu_aga,
      valeur_espp: financialProfile.valeur_espp,
      valeur_stock_options: financialProfile.valeur_stock_options,
      valeur_bspce: financialProfile.valeur_bspce,
      has_pee: financialProfile.has_pee,
      has_perco: financialProfile.has_perco,
      has_pero: financialProfile.has_pero,
      has_epargne_autres: financialProfile.has_epargne_autres,
      valeur_pee: financialProfile.valeur_pee,
      valeur_perco: financialProfile.valeur_perco,
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

  // Auto-calculations
  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const calculateNbPersonnes = (situation: string | null, nbEnfants: number): number => {
    let personnes = 1;
    if (situation === "marie" || situation === "pacse") personnes = 2;
    personnes += nbEnfants;
    return personnes;
  };

  const calculatePartsFiscalesLocal = (situation: string | null, nbEnfants: number): number => {
    return calculatePartsFiscales(situation || 'celibataire', nbEnfants, fiscalRules);
  };

  const calculateTMILocal = (revenuImposable: number, partsFiscales: number): number => {
    return calculateTMI(revenuImposable, partsFiscales, tax_brackets);
  };

  useEffect(() => {
    const newAge = calculateAge(formData.date_naissance || null);
    if (newAge !== formData.age) setFormData((prev) => ({ ...prev, age: newAge }));
  }, [formData.date_naissance]);

  useEffect(() => {
    const newNbPersonnes = calculateNbPersonnes(formData.situation_familiale || null, formData.nb_enfants || 0);
    const newPartsFiscales = calculatePartsFiscalesLocal(formData.situation_familiale || null, formData.nb_enfants || 0);
    const updates: Partial<typeof formData> = {};
    if (newNbPersonnes !== formData.nb_personnes_foyer) updates.nb_personnes_foyer = newNbPersonnes;
    if (newPartsFiscales !== formData.parts_fiscales) updates.parts_fiscales = newPartsFiscales;
    if (Object.keys(updates).length > 0) setFormData((prev) => ({ ...prev, ...updates }));
  }, [formData.situation_familiale, formData.nb_enfants]);

  useEffect(() => {
    const newTMI = calculateTMILocal(formData.revenu_fiscal_annuel || 0, formData.parts_fiscales || 1);
    if (newTMI !== formData.tmi) setFormData((prev) => ({ ...prev, tmi: newTMI }));
  }, [formData.revenu_fiscal_annuel, formData.parts_fiscales]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, birth_date, marital_status, children_count, job_title, company_id")
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
    } catch (error: any) {
      console.error("Failed to fetch data", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (hasProfileChanges && profile) {
      try {
        setSavingProfile(true);
        const { error } = await supabase
          .from("profiles")
          .update({
            birth_date: profile.birth_date,
            marital_status: profile.marital_status,
            children_count: profile.children_count,
            job_title: profile.job_title,
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

    if (hasFinancialChanges) {
      saveProfile(formData, { onSuccess: () => setOriginalFormData(formData) });
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
      <EmployeeLayout activeSection="panorama">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-primary text-xl animate-pulse">Chargement...</div>
        </div>
      </EmployeeLayout>
    );
  }

  const isSaving = savingProfile || savingFinancial;

  return (
    <EmployeeLayout activeSection="panorama">
      <div className="pb-24">
        <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
          {/* Header */}
          <div className="space-y-4">
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/panorama")}>
              <ArrowLeft className="h-4 w-4" /> Retour à PANORAMA
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Audit patrimonial</h1>
              <p className="text-muted-foreground mt-1">
                Complétez votre situation pour des recommandations personnalisées
              </p>
            </div>

            {/* Completeness bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={completeness} className="h-2" />
              </div>
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">{completeness}% complété</span>
            </div>

            {/* Missing fields chips */}
            {missingFieldsDetailed.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {missingFieldsDetailed.slice(0, 6).map((field, index) => {
                  const targetTab = AUDIT_FIELD_TO_TAB[field.fieldKey] || "situation";
                  return (
                    <button
                      key={index}
                      onClick={() => handleTabChange(targetTab, field.fieldKey)}
                      className="px-3 py-1.5 bg-muted/50 rounded-full text-xs border hover:border-primary hover:bg-primary/5 hover:text-primary transition-all cursor-pointer flex items-center gap-1.5 group"
                    >
                      <span>{field.label}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full grid grid-cols-5 h-auto p-1 bg-card border shadow-sm">
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
                      <CardDescription>Ces informations vous concernent personnellement</CardDescription>
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
                            <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                            <TooltipContent><p>Calculé automatiquement</p></TooltipContent>
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
                        <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
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
                          <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
                          <TooltipContent><p className="text-xs max-w-xs">Êtes-vous propriétaire ou locataire de votre résidence principale ?</p></TooltipContent>
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
                      <SelectTrigger><SelectValue placeholder="Sélectionner votre statut" /></SelectTrigger>
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
                      <CardDescription>Votre situation professionnelle personnelle</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const hasActivePartnership = company?.partnership_type && company.partnership_type.toLowerCase() !== 'aucun';
                    if (hasActivePartnership) {
                      return (
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">Entreprise <Lock className="h-3 w-3 text-muted-foreground" /></Label>
                          <Input value={company?.name || "Non renseignée"} disabled className="bg-muted cursor-not-allowed" />
                        </div>
                      );
                    } else {
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
                      <CardDescription>Votre situation professionnelle personnelle</CardDescription>
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
                      <Select value={formData.type_contrat || ""} onValueChange={(value) => updateFinancialField("type_contrat", value)}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
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
                        <p>Indiquez les dispositifs dont vous bénéficiez.</p>
                        <p className="text-primary/80 font-medium">💡 Le montant est optionnel, mais recenser vos dispositifs est une étape clé.</p>
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
                      {([
                        { field: "has_rsu_aga" as const, valField: "valeur_rsu_aga" as const, label: "RSU / AGA", desc: "Restricted Stock Units / Actions Gratuites" },
                        { field: "has_espp" as const, valField: "valeur_espp" as const, label: "ESPP", desc: "Employee Stock Purchase Plan" },
                        { field: "has_stock_options" as const, valField: "valeur_stock_options" as const, label: "Stock Options", desc: "Options d'achat d'actions" },
                        { field: "has_bspce" as const, valField: "valeur_bspce" as const, label: "BSPCE", desc: "Bons de Souscription (startups)" },
                      ]).map(item => (
                        <div key={item.field} className="p-3 rounded-lg hover:bg-background transition-colors space-y-2">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData[item.field] || false}
                              onChange={(e) => {
                                updateFinancialField(item.field, e.target.checked);
                                if (!e.target.checked) updateFinancialField(item.valField, 0);
                              }}
                              className="h-4 w-4 rounded border-border"
                            />
                            <div>
                              <span className="font-medium text-sm">{item.label}</span>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          </label>
                          {formData[item.field] && (
                            <Input
                              type="number"
                              value={formData[item.valField] ?? ""}
                              onChange={(e) => updateFinancialField(item.valField, parseFloat(e.target.value) || 0)}
                              placeholder="Valeur estimée (€)"
                              className="ml-7"
                            />
                          )}
                        </div>
                      ))}
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
                      {([
                        { field: "has_pee" as const, valField: "valeur_pee" as const, label: "PEE", desc: "Plan d'Épargne Entreprise" },
                        { field: "has_perco" as const, valField: "valeur_perco" as const, label: "PERCO / PERCOL", desc: "Plan d'Épargne Retraite Collectif" },
                      ]).map(item => (
                        <div key={item.field} className="p-3 rounded-lg hover:bg-background transition-colors space-y-2">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData[item.field] || false}
                              onChange={(e) => {
                                updateFinancialField(item.field, e.target.checked);
                                if (!e.target.checked) updateFinancialField(item.valField, 0);
                              }}
                              className="h-4 w-4 rounded border-border"
                            />
                            <div>
                              <span className="font-medium text-sm">{item.label}</span>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          </label>
                          {formData[item.field] && (
                            <Input
                              type="number"
                              value={formData[item.valField] ?? ""}
                              onChange={(e) => updateFinancialField(item.valField, parseFloat(e.target.value) || 0)}
                              placeholder="Valeur estimée (€)"
                              className="ml-7"
                            />
                          )}
                        </div>
                      ))}
                      <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer">
                        <input type="checkbox" checked={formData.has_pero || false} onChange={(e) => updateFinancialField("has_pero", e.target.checked)} className="h-4 w-4 rounded border-border" />
                        <div><span className="font-medium text-sm">PERO (Article 83)</span><p className="text-xs text-muted-foreground">Plan d'Épargne Retraite Obligatoire</p></div>
                      </label>
                      <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer">
                        <input type="checkbox" checked={formData.has_epargne_autres || false} onChange={(e) => updateFinancialField("has_epargne_autres", e.target.checked)} className="h-4 w-4 rounded border-border" />
                        <div><span className="font-medium text-sm">Autres</span><p className="text-xs text-muted-foreground">Autre type d'épargne salariale</p></div>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Financial - Wizard */}
            <TabsContent value="financial" className="space-y-6 mt-6">
              {/* Note contextuelle foyer fiscal */}
              <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 mb-4">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Ces informations concernent <strong>votre foyer fiscal</strong>. 
                  Si vous vivez en couple, incluez les revenus et charges de votre conjoint(e).
                </p>
              </div>
              <FinancialProfileWizard
                formData={formData}
                updateField={updateFinancialField}
                onSave={() => saveProfile(formData, { onSuccess: () => setOriginalFormData(formData) })}
                isSaving={savingFinancial}
                situationFamiliale={formData.situation_familiale || profile?.marital_status || null}
                hasEquityBenefits={formData.has_rsu_aga || formData.has_espp || formData.has_stock_options || formData.has_bspce || formData.has_equity_autres || false}
                onInviteSpouse={() => setShowInviteDialog(true)}
                requiredFieldKeys={requiredFieldKeys}
                initialStepId={wizardInitialStep}
              />
            </TabsContent>

            {/* Tab: Savings */}
            <TabsContent value="savings" className="space-y-6 mt-6">
              {/* Note contextuelle foyer fiscal */}
              <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 mb-4">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Ces informations concernent <strong>votre foyer fiscal</strong>. 
                  Si vous vivez en couple, incluez les revenus et charges de votre conjoint(e).
                </p>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Conseil :</strong> En indiquant les montants des placements de votre foyer, nous serons en mesure de calculer votre taux de diversification et vous proposer des recommandations personnalisées.
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Patrimoine financier du foyer</CardTitle>
                      <CardDescription>Incluez l'ensemble des placements de votre foyer fiscal (vous + conjoint(e))</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: "epargne_livrets" as const, label: "Épargne sur livrets du foyer (€)", desc: "Livret A, LDDS, LEP — tous comptes confondus", required: true },
                      { key: "patrimoine_assurance_vie" as const, label: "Assurance-vie du foyer (€)", desc: undefined },
                      { key: "patrimoine_per" as const, label: "PER du foyer (€)", desc: "Plan Épargne Retraite — tous les plans du foyer" },
                      { key: "patrimoine_pea" as const, label: "PEA / CTO du foyer (€)", desc: undefined },
                      { key: "patrimoine_scpi" as const, label: "SCPI du foyer (€)", desc: undefined },
                      { key: "patrimoine_crypto" as const, label: "Cryptomonnaies (€)", desc: "Bitcoin, Ethereum..." },
                      { key: "patrimoine_private_equity" as const, label: "Private Equity (€)", desc: "FCPR, FCPI, FIP..." },
                      { key: "patrimoine_autres" as const, label: "Autres placements du foyer (€)", desc: "Or, bijoux, montres, œuvres d'art..." },
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

                  {/* Total patrimoine financier */}
                  {(() => {
                    const totalDispositifs = (formData.valeur_rsu_aga ?? 0) + (formData.valeur_espp ?? 0) +
                      (formData.valeur_stock_options ?? 0) + (formData.valeur_bspce ?? 0) +
                      (formData.valeur_pee ?? 0) + (formData.valeur_perco ?? 0);
                    const totalFinancier = (formData.epargne_livrets ?? 0) + (formData.patrimoine_assurance_vie ?? 0) +
                      (formData.patrimoine_per ?? 0) + (formData.patrimoine_pea ?? 0) +
                      (formData.patrimoine_scpi ?? 0) + (formData.patrimoine_crypto ?? 0) +
                      (formData.patrimoine_private_equity ?? 0) + (formData.patrimoine_autres ?? 0) + totalDispositifs;
                    if (totalFinancier > 0) {
                      return (
                        <div className="mt-4 p-4 rounded-lg bg-muted/50">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Total patrimoine financier du foyer</span>
                            <span className="text-lg font-semibold text-primary">{totalFinancier.toLocaleString('fr-FR')} €</span>
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
                      <CardTitle className="text-lg">Capacité d'épargne du foyer</CardTitle>
                      <CardDescription>Ce que votre foyer met de côté chaque mois, tous comptes confondus</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={cn("space-y-2 p-3 rounded-lg transition-all duration-700", highlightedField === "capacite_epargne_mensuelle" && "ring-2 ring-primary bg-primary/10 animate-pulse")} data-field="capacite_epargne_mensuelle">
                    <Label>Épargne mensuelle du foyer (€/mois){reqMark("capacite_epargne_mensuelle")}</Label>
                    <Input
                      type="number"
                      value={formData.capacite_epargne_mensuelle ?? ""}
                      onChange={(e) => updateFinancialField("capacite_epargne_mensuelle", parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 300"
                    />
                    <p className="text-xs text-muted-foreground">Total épargné chaque mois par votre foyer, après toutes les dépenses</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Objectives */}
            <TabsContent value="objectives" className="space-y-6 mt-6">
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardDescription>Les projets et objectifs de votre foyer</CardDescription>
                </CardHeader>
              </Card>
              <ObjectivesTab />
            </TabsContent>
          </Tabs>

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
          <p className="text-sm text-muted-foreground">Vous avez des modifications non enregistrées</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" /> Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" /> {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
