/**
 * Financial Profile Wizard - Step-by-step financial data collection
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  ArrowLeft, ArrowRight, Check, Euro, Users, Briefcase, 
  Building, PiggyBank, Info, HelpCircle, ChevronDown, ChevronUp, Wallet
} from "lucide-react";
import { RealEstatePropertiesManager } from "./profile/RealEstatePropertiesManager";
import { useUserRealEstateProperties } from "@/hooks/useUserRealEstateProperties";
import { cn } from "@/lib/utils";
import { type FinancialProfileInput } from "@/hooks/useUserFinancialProfile";

interface FinancialProfileWizardProps {
  formData: FinancialProfileInput;
  updateField: <K extends keyof FinancialProfileInput>(field: K, value: FinancialProfileInput[K]) => void;
  onSave: () => void;
  isSaving: boolean;
  situationFamiliale: string | null;
  hasEquityBenefits: boolean;
  
  requiredFieldKeys?: string[];
  initialStepId?: string | null;
  chargesOnly?: boolean;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const REVENUE_STEPS: WizardStep[] = [
  { id: "revenus-pro", title: "Revenus professionnels", description: "Vos revenus du travail", icon: <Briefcase className="h-5 w-5" /> },
  { id: "revenus-capital", title: "Revenus du capital", description: "Dividendes, ventes d'actions...", icon: <Euro className="h-5 w-5" /> },
  { id: "revenus-fonciers", title: "Revenus fonciers", description: "Loyers perçus", icon: <Building className="h-5 w-5" /> },
];

const CHARGES_STEPS: WizardStep[] = [
  { id: "charges", title: "Charges fixes", description: "Vos dépenses mensuelles fixes", icon: <PiggyBank className="h-5 w-5" /> },
  { id: "charges-variables", title: "Dépenses courantes", description: "Courses, loisirs, shopping...", icon: <Wallet className="h-5 w-5" /> },
];

export function FinancialProfileWizard({
  formData,
  updateField,
  onSave,
  isSaving,
  situationFamiliale,
  hasEquityBenefits,
  
  requiredFieldKeys = [],
  initialStepId = null,
  chargesOnly = false,
}: FinancialProfileWizardProps) {
  const STEPS = chargesOnly ? CHARGES_STEPS : REVENUE_STEPS;
  
  const getStepIndex = (stepId: string | null) => {
    if (!stepId) return 0;
    const idx = STEPS.findIndex(s => s.id === stepId);
    return idx >= 0 ? idx : 0;
  };
  const [currentStep, setCurrentStep] = useState(getStepIndex(initialStepId));
  const [showWhyInfo, setShowWhyInfo] = useState(false);
  

  // React to external step navigation requests
  useEffect(() => {
    if (initialStepId) {
      setCurrentStep(getStepIndex(initialStepId));
    }
  }, [initialStepId]);

  const isMarriedOrPacs = situationFamiliale === "marie" || situationFamiliale === "pacse";

  // Fetch real estate properties for auto-sync
  const { totals: realEstateTotals } = useUserRealEstateProperties();

  // Progress calculation
  const progress = ((currentStep + 1) / STEPS.length) * 100;


  // Calculate total monthly charges automatically
  // Only includes loyer OR credits_immobilier based on statut_residence (never both)
  // Also includes charges from investment properties
  const calculateTotalCharges = (): number => {
    // Determine housing charge based on residence status
    let housingCharge = 0;
    if (formData.statut_residence === 'locataire') {
      housingCharge = formData.loyer_actuel || 0;
    } else if (formData.statut_residence === 'proprietaire') {
      housingCharge = formData.credits_immobilier || 0;
    }
    // 'heberge' (hébergé à titre gratuit) = no housing charge
    
    const charges = [
      housingCharge,
      formData.charges_copropriete_taxes || 0,
      formData.charges_energie || 0,
      formData.charges_assurance_habitation || 0,
      formData.charges_transport_commun || 0,
      formData.charges_assurance_auto || 0,
      formData.charges_lld_loa_auto || 0,
      formData.charges_internet || 0,
      formData.charges_mobile || 0,
      formData.charges_abonnements || 0,
      formData.charges_frais_scolarite || 0,
      formData.pensions_alimentaires || 0,
      formData.credits_consommation || 0,
      formData.charges_autres || 0,
      // Variable charges
      formData.charges_courses_alimentaires || 0,
      formData.charges_loisirs || 0,
      formData.charges_shopping || 0,
      formData.charges_variables_autres || 0,
      // Add investment property charges (mortgage + charges)
      realEstateTotals.mensualitesTotal,
      realEstateTotals.chargesTotal,
    ];
    return charges.reduce((sum, charge) => sum + charge, 0);
  };

  // Auto-update charges_fixes_mensuelles when any charge changes OR residence status changes
  useEffect(() => {
    const totalCharges = calculateTotalCharges();
    if (totalCharges !== formData.charges_fixes_mensuelles) {
      updateField('charges_fixes_mensuelles', totalCharges);
    }
  }, [
    formData.statut_residence, // Important: recalculate when residence status changes
    formData.loyer_actuel,
    formData.credits_immobilier,
    formData.charges_copropriete_taxes,
    formData.charges_energie,
    formData.charges_assurance_habitation,
    formData.charges_transport_commun,
    formData.charges_assurance_auto,
    formData.charges_lld_loa_auto,
    formData.charges_internet,
    formData.charges_mobile,
    formData.charges_abonnements,
    formData.charges_frais_scolarite,
    formData.pensions_alimentaires,
    formData.credits_consommation,
    formData.charges_autres,
    realEstateTotals.mensualitesTotal,
    realEstateTotals.chargesTotal,
  ]);

  // Auto-sync real estate totals to financial profile fields
  useEffect(() => {
    // Update revenus_locatifs (annual rental income from investment properties)
    const annualRentalIncome = realEstateTotals.revenusLocatifsTotal * 12;
    if (annualRentalIncome !== formData.revenus_locatifs) {
      updateField('revenus_locatifs', annualRentalIncome);
    }
    
    // Update patrimoine immobilier values
    if (realEstateTotals.valeurTotale !== formData.patrimoine_immo_valeur) {
      updateField('patrimoine_immo_valeur', realEstateTotals.valeurTotale);
    }
    if (realEstateTotals.capitalRestantTotal !== formData.patrimoine_immo_credit_restant) {
      updateField('patrimoine_immo_credit_restant', realEstateTotals.capitalRestantTotal);
    }
  }, [
    realEstateTotals.revenusLocatifsTotal,
    realEstateTotals.valeurTotale,
    realEstateTotals.capitalRestantTotal,
  ]);

  // Helper to handle numeric input without losing focus or forcing 0
  const handleNumericInput = <K extends keyof FinancialProfileInput>(
    field: K, 
    value: string
  ) => {
    // Only allow digits
    const cleanValue = value.replace(/[^0-9]/g, '');
    // Convert to number only on blur or when there's content
    // During typing, store as number (0 if empty, otherwise parsed value)
    const numValue = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
    updateField(field, numValue as FinancialProfileInput[K]);
  };

  // Get display value for numeric inputs with thousands separator (show empty string for 0)
  const getNumericDisplayValue = (value: number | undefined | null): string => {
    if (value === undefined || value === null || value === 0) return '';
    return value.toLocaleString('fr-FR');
  };

  const handleNext = () => {
    // Save current step data
    onSave();
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    onSave();
    toast.success("Profil financier enregistré avec succès !");
  };

  const renderStepIndicator = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">
          Étape {currentStep + 1} sur {STEPS.length}
        </span>
        <span className="text-sm font-medium">{STEPS[currentStep].title}</span>
      </div>
      <Progress value={progress} className="h-2" />
      
      {/* Step dots */}
      <div className="flex justify-between mt-4">
        {STEPS.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(index)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              index <= currentStep ? "opacity-100" : "opacity-40"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              index === currentStep 
                ? "bg-primary text-primary-foreground" 
                : index < currentStep 
                  ? "bg-primary/20 text-primary" 
                  : "bg-muted text-muted-foreground"
            )}>
              {index < currentStep ? <Check className="h-4 w-4" /> : step.icon}
            </div>
            <span className="text-xs hidden sm:block max-w-[80px] text-center truncate">
              {step.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  // Helper: check if a field is required (for asterisk display)
  const isRequired = (fieldKey: string) => requiredFieldKeys.includes(fieldKey);
  const requiredMark = (fieldKey: string) => isRequired(fieldKey) ? <span className="text-destructive ml-0.5">*</span> : null;

  const renderOptionalBadge = () => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 p-3 bg-muted/30 rounded-lg">
      <Info className="h-4 w-4 flex-shrink-0" />
      <span>Les champs marqués d'un <span className="text-destructive font-medium">*</span> sont pris en compte dans votre barre de progression. Les autres sont facultatifs.</span>
    </div>
  );

  const renderWhySection = () => (
    <div className="mb-6">
      <button
        onClick={() => setShowWhyInfo(!showWhyInfo)}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
      >
        <HelpCircle className="h-4 w-4" />
        <span>Pourquoi ces informations ?</span>
        {showWhyInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      
      {showWhyInfo && (
        <Card className="mt-3 border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm">
              <strong>Faciliter vos simulations :</strong> Ces données pré-rempliront automatiquement les simulateurs fiscaux et patrimoniaux.
            </p>
            <p className="text-sm">
              <strong>Votre audit patrimonial :</strong> Avoir une vision claire de votre situation financière est la première étape vers une gestion optimisée.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case "revenus-pro":
        return (
          <div className="space-y-6">
            {/* Personal income */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Vos revenus — vous seul(e)
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label>Revenu annuel brut (€) — vous seul(e){requiredMark("revenu_annuel_brut")}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">Votre salaire annuel brut (avant prélèvements sociaux). Vous le trouverez sur votre contrat de travail ou en haut de votre fiche de paie.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={getNumericDisplayValue(formData.revenu_annuel_brut)}
                    onChange={(e) => {
                      handleNumericInput("revenu_annuel_brut", e.target.value);
                      // Auto-calculate net: brut × 0.77
                      const cleanValue = e.target.value.replace(/[^0-9]/g, '');
                      const brut = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
                      const net = Math.round(brut * 0.77);
                      updateField("revenu_mensuel_net", net);
                    }}
                    placeholder="Ex: 58 000"
                  />
                  {/* Display auto-calculated net */}
                  {(formData.revenu_annuel_brut ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                      <span>Revenu annuel net estimé :</span>
                      <span className="font-semibold text-foreground">
                        {Math.round((formData.revenu_annuel_brut ?? 0) * 0.77).toLocaleString('fr-FR')} €
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">Estimation : revenu net ≈ 77% du brut (taux moyen de cotisations sociales salariales ~23%)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Spouse income - only if married/pacs */}
            {isMarriedOrPacs && (
              <div className="space-y-4 pt-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Revenus de votre conjoint(e)
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label>Revenu annuel brut de votre conjoint(e) (€){requiredMark("revenu_annuel_brut_conjoint")}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">Salaire annuel brut de votre conjoint(e) (avant prélèvements sociaux)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={getNumericDisplayValue(formData.revenu_annuel_brut_conjoint)}
                    onChange={(e) => {
                      handleNumericInput("revenu_annuel_brut_conjoint", e.target.value);
                      // Auto-calculate conjoint net: brut × 0.77
                      const cleanValue = e.target.value.replace(/[^0-9]/g, '');
                      const brut = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
                      const net = Math.round(brut * 0.77);
                      updateField("revenu_annuel_conjoint", net);
                    }}
                    placeholder="Ex: 52 000"
                  />
                  {/* Display auto-calculated net for spouse */}
                  {(formData.revenu_annuel_brut_conjoint ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                      <span>Revenu annuel net estimé :</span>
                      <span className="font-semibold text-foreground">
                        {Math.round((formData.revenu_annuel_brut_conjoint ?? 0) * 0.77).toLocaleString('fr-FR')} €
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">Estimation : revenu net ≈ 77% du brut (taux moyen de cotisations sociales salariales ~23%)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Total revenus foyer */}
            {((formData.revenu_annuel_brut ?? 0) > 0 || (formData.revenu_annuel_brut_conjoint ?? 0) > 0) && (
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Revenus bruts annuels du foyer
                  </span>
                  <span className="font-semibold text-primary">
                    {((formData.revenu_annuel_brut ?? 0) + 
                      (formData.revenu_annuel_brut_conjoint ?? 0)
                    ).toLocaleString('fr-FR')} €
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground">
                    Revenus nets mensuels estimés du foyer
                  </span>
                  <span className="text-sm font-medium">
                    {Math.round(
                      ((formData.revenu_annuel_brut ?? 0) + 
                       (formData.revenu_annuel_brut_conjoint ?? 0)) * 0.77 / 12
                    ).toLocaleString('fr-FR')} €/mois
                  </span>
                </div>
              </div>
            )}

            {/* Revenu fiscal de référence du foyer — importé par ATLAS */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Label>Revenu fiscal de référence du foyer (€){requiredMark("revenu_fiscal_annuel")}</Label>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">importé par ATLAS</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">Ce montant est importé automatiquement depuis votre avis d'imposition (module ATLAS). Vous pouvez aussi le saisir manuellement.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                type="text"
                inputMode="numeric"
                value={getNumericDisplayValue(formData.revenu_fiscal_annuel)}
                onChange={(e) => handleNumericInput("revenu_fiscal_annuel", e.target.value)}
                placeholder="Visible sur votre avis d'imposition — ligne « Revenu fiscal de référence »"
              />
            </div>

            {/* Equity income - only if has equity benefits */}
            {hasEquityBenefits && (
              <div className="space-y-4 pt-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Rémunération en equity
                </h4>
                
                <div className="space-y-3">
                  <Label>Percevez-vous ou comptez-vous percevoir des revenus en equity cette année ?</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.has_equity_income_this_year === true}
                        onChange={() => updateField("has_equity_income_this_year", true)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Oui</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.has_equity_income_this_year === false}
                        onChange={() => updateField("has_equity_income_this_year", false)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Non</span>
                    </label>
                  </div>
                </div>

                {formData.has_equity_income_this_year && (
                  <div className="space-y-2 pl-4">
                    <Label>Montant estimé des revenus equity cette année (€)</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={getNumericDisplayValue(formData.equity_income_amount)}
                      onChange={(e) => handleNumericInput("equity_income_amount", e.target.value)}
                      placeholder="Ex: 15 000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Incluez ventes de RSU/AGA, exercice de stock-options, ESPP...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "revenus-capital":
        return (
          <div className="space-y-6">
            <h4 className="font-medium flex items-center gap-2">
              <Euro className="h-4 w-4 text-primary" />
              Revenus du capital (cette année)
            </h4>
            <p className="text-sm text-muted-foreground -mt-4">
              Estimez les revenus du capital que vous percevrez ou avez perçus cette année.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label>Dividendes perçus cette année (€)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">Dividendes perçus de vos placements (actions, SCPI...)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={getNumericDisplayValue(formData.revenus_dividendes)}
                  onChange={(e) => handleNumericInput("revenus_dividendes", e.target.value)}
                  placeholder="Ex: 2 000"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label>Plus-values de ventes d'actions cette année (€)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">Plus-values réalisées sur ventes de titres (hors equity employeur)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={getNumericDisplayValue(formData.revenus_ventes_actions)}
                  onChange={(e) => handleNumericInput("revenus_ventes_actions", e.target.value)}
                  placeholder="Ex: 5 000"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Autres revenus du capital cette année (€)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={getNumericDisplayValue(formData.revenus_capital_autres)}
                  onChange={(e) => handleNumericInput("revenus_capital_autres", e.target.value)}
                  placeholder="Ex: 1 000"
                />
                <p className="text-xs text-muted-foreground">
                  Intérêts, royalties, crypto, etc.
                </p>
              </div>
            </div>
          </div>
        );

      case "revenus-fonciers":
        return (
          <div className="space-y-6">
            <h4 className="font-medium flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              Patrimoine immobilier locatif / investissement
            </h4>
            <p className="text-sm text-muted-foreground -mt-4">
              Ajoutez vos biens immobiliers locatifs ou d'investissement (hors résidence principale).
            </p>
            
            {/* Real estate properties manager */}
            <RealEstatePropertiesManager />

          </div>
        );

      case "charges":
        const isLocataire = formData.statut_residence === 'locataire';
        const isProprietaire = formData.statut_residence === 'proprietaire';
        const isHeberge = formData.statut_residence === 'heberge';
        const hasResidenceStatus = isLocataire || isProprietaire || isHeberge;

        // Calculate subtotals per category
        const logementSubtotal = (isLocataire ? (formData.loyer_actuel || 0) : 0) +
          (isProprietaire ? (formData.credits_immobilier || 0) + (formData.charges_copropriete_taxes || 0) : 0) +
          (formData.charges_energie || 0) + (formData.charges_assurance_habitation || 0);
        const locatifSubtotal = (realEstateTotals.mensualitesTotal || 0) + (realEstateTotals.chargesTotal || 0);
        const transportSubtotal = (formData.charges_transport_commun || 0) + (formData.charges_assurance_auto || 0) + (formData.charges_lld_loa_auto || formData.credits_auto || 0);
        const communicationSubtotal = (formData.charges_internet || 0) + (formData.charges_mobile || 0) + (formData.charges_abonnements || 0);
        const familleSubtotal = (formData.charges_frais_scolarite || 0) + (formData.pensions_alimentaires || 0);
        const creditSubtotal = (formData.credits_consommation || 0);
        const autresSubtotal = (formData.charges_autres || 0);

        const SubtotalBadge = ({ amount }: { amount: number }) => (
          <span className={cn(
            "ml-auto mr-2 text-sm font-semibold tabular-nums",
            amount > 0 ? "text-primary" : "text-muted-foreground"
          )}>
            {amount.toLocaleString('fr-FR')} €
          </span>
        );

        return (
          <div className="space-y-4">
            <Accordion type="multiple" defaultValue={["logement"]} className="space-y-2">

              {/* 🏠 Logement et Énergie */}
              <AccordionItem value="logement" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline gap-2">
                  <span className="flex items-center gap-2 text-left">🏠 Logement & Énergie</span>
                  <SubtotalBadge amount={logementSubtotal} />
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  {!hasResidenceStatus && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        💡 Renseignez votre <strong>statut de résidence</strong> dans l'onglet "Situation" pour personnaliser cette section.
                      </p>
                    </div>
                  )}
                  {isLocataire && (
                    <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                      <p className="text-xs font-medium text-primary">🏠 Locataire</p>
                      <div className="space-y-2">
                        <Label>Loyer charges comprises (€/mois)</Label>
                        <Input type="text" inputMode="numeric" value={getNumericDisplayValue(formData.loyer_actuel)} onChange={(e) => handleNumericInput("loyer_actuel", e.target.value)} placeholder="Ex: 1 200" />
                      </div>
                    </div>
                  )}
                  {isProprietaire && (
                    <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                      <p className="text-xs font-medium text-primary">🏡 Propriétaire</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Mensualité crédit immobilier (€/mois)</Label>
                          <Input type="text" inputMode="numeric" value={getNumericDisplayValue(formData.credits_immobilier)} onChange={(e) => handleNumericInput("credits_immobilier", e.target.value)} placeholder="Ex: 1 500" />
                        </div>
                        <div className="space-y-2">
                          <Label>Charges copropriété / taxes foncières (€/mois)</Label>
                          <Input type="text" inputMode="numeric" value={getNumericDisplayValue(formData.charges_copropriete_taxes)} onChange={(e) => handleNumericInput("charges_copropriete_taxes", e.target.value)} placeholder="Ex: 150" />
                        </div>
                      </div>
                    </div>
                  )}
                  {isHeberge && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs font-medium text-primary">🏠 Hébergé à titre gratuit</p>
                      <p className="text-sm text-muted-foreground">Aucune charge de logement principale à déclarer.</p>
                    </div>
                  )}
                  {hasResidenceStatus && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Électricité, gaz, eau (€/mois)</Label>
                        <Input type="text" inputMode="numeric" value={getNumericDisplayValue(formData.charges_energie)} onChange={(e) => handleNumericInput("charges_energie", e.target.value)} placeholder="Ex: 120" />
                      </div>
                      <div className="space-y-2">
                        <Label>Assurance habitation (€/mois)</Label>
                        <Input type="text" inputMode="numeric" value={getNumericDisplayValue(formData.charges_assurance_habitation)} onChange={(e) => handleNumericInput("charges_assurance_habitation", e.target.value)} placeholder="Ex: 30" />
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* 🏘️ Immobilier locatif */}
              {(realEstateTotals.mensualitesTotal > 0 || realEstateTotals.chargesTotal > 0) && (
                <AccordionItem value="locatif" className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="hover:no-underline gap-2">
                    <span className="flex items-center gap-2 text-left">🏘️ Immobilier locatif</span>
                    <SubtotalBadge amount={locatifSubtotal} />
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="p-3 rounded-lg bg-muted/30 space-y-3">
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                        Récupéré de l'onglet Revenus fonciers
                      </Badge>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {realEstateTotals.mensualitesTotal > 0 && (
                          <div className="space-y-1">
                            <Label className="text-muted-foreground">Mensualités crédits (biens locatifs)</Label>
                            <p className="text-base font-medium">{realEstateTotals.mensualitesTotal.toLocaleString('fr-FR')} €/mois</p>
                          </div>
                        )}
                        {realEstateTotals.chargesTotal > 0 && (
                          <div className="space-y-1">
                            <Label className="text-muted-foreground">Charges & taxes (biens locatifs)</Label>
                            <p className="text-base font-medium">{realEstateTotals.chargesTotal.toLocaleString('fr-FR')} €/mois</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Calculé depuis vos biens dans l'onglet Revenus fonciers.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* 🚗 Transports et Mobilité */}
              <AccordionItem value="transport" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline gap-2">
                  <span className="flex items-center gap-2 text-left">🚗 Transports & Mobilité</span>
                  <SubtotalBadge amount={transportSubtotal} />
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Transports en commun (€/mois)</Label>
                      <Input type="text" inputMode="numeric" value={getNumericDisplayValue(formData.charges_transport_commun)} onChange={(e) => handleNumericInput("charges_transport_commun", e.target.value)} placeholder="Ex: 84" />
                    </div>
                    <div className="space-y-2">
                      <Label>Assurance automobile (€/mois)</Label>
                      <Input type="text" inputMode="numeric" value={getNumericDisplayValue(formData.charges_assurance_auto)} onChange={(e) => handleNumericInput("charges_assurance_auto", e.target.value)} placeholder="Ex: 60" />
                    </div>
                    <div className="space-y-2">
                      <Label>LLD/LOA ou crédit auto (€/mois)</Label>
                      <Input type="text" inputMode="numeric" value={getNumericDisplayValue(formData.charges_lld_loa_auto || formData.credits_auto)} onChange={(e) => handleNumericInput("charges_lld_loa_auto", e.target.value)} placeholder="Ex: 350" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 📱 Communication et Services */}
              <AccordionItem value="communication" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline gap-2">
                  <span className="flex items-center gap-2 text-left">📱 Communication & Services</span>
                  <SubtotalBadge amount={communicationSubtotal} />
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Internet (Box) (€/mois)</Label>
                      <Input type="text" inputMode="numeric" value={getNumericDisplayValue(formData.charges_internet)} onChange={(e) => handleNumericInput("charges_internet", e.target.value)} placeholder="Ex: 35" />
                    </div>
                    <div className="space-y-2">
                      <Label>Forfait mobile (€/mois)</Label>
                      <Input type="text" inputMode="numeric" value={getNumericDisplayValue(formData.charges_mobile)} onChange={(e) => handleNumericInput("charges_mobile", e.target.value)} placeholder="Ex: 20" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Streaming, sport, presse (€/mois)</Label>
                      <Input type="text" inputMode="numeric" value={getNumericDisplayValue(formData.charges_abonnements)} onChange={(e) => handleNumericInput("charges_abonnements", e.target.value)} placeholder="Ex: 50" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 👨‍👩‍👧 Famille */}
              <AccordionItem value="famille" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline gap-2">
                  <span className="flex items-center gap-2 text-left">👨‍👩‍👧 Famille</span>
                  <SubtotalBadge amount={familleSubtotal} />
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Scolarité, crèche, garde d'enfants (€/mois)</Label>
                      <Input type="text" inputMode="numeric" value={getNumericDisplayValue(formData.charges_frais_scolarite)} onChange={(e) => handleNumericInput("charges_frais_scolarite", e.target.value)} placeholder="Ex: 200" />
                    </div>
                    <div className="space-y-2">
                      <Label>Pension alimentaire (€/mois)</Label>
                      <Input type="text" inputMode="numeric" value={getNumericDisplayValue(formData.pensions_alimentaires)} onChange={(e) => handleNumericInput("pensions_alimentaires", e.target.value)} placeholder="Ex: 0" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 💰 Crédit consommation */}
              <AccordionItem value="credit" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline gap-2">
                  <span className="flex items-center gap-2 text-left">💰 Crédit consommation</span>
                  <SubtotalBadge amount={creditSubtotal} />
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-2">
                    <Label>Mensualité crédit consommation (€/mois)</Label>
                    <Input type="text" inputMode="numeric" value={getNumericDisplayValue(formData.credits_consommation)} onChange={(e) => handleNumericInput("credits_consommation", e.target.value)} placeholder="Ex: 200" />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 💳 Autres */}
              <AccordionItem value="autres" className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline gap-2">
                  <span className="flex items-center gap-2 text-left">💳 Autres charges</span>
                  <SubtotalBadge amount={autresSubtotal} />
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-2">
                    <Label>Autres charges fixes (mutuelle, prévoyance...) (€/mois)</Label>
                    <Input type="text" inputMode="numeric" value={getNumericDisplayValue(formData.charges_autres)} onChange={(e) => handleNumericInput("charges_autres", e.target.value)} placeholder="Ex: 100" />
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>

            {/* 📊 Total charges fixes mensuelles */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <span className="font-medium">Total charges fixes mensuelles</span>
                </div>
                <span className="text-xl font-bold text-primary">
                  {calculateTotalCharges().toLocaleString('fr-FR')} €
                </span>
              </div>
            </div>

          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderWhySection()}
      {renderStepIndicator()}
      {renderOptionalBadge()}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {STEPS[currentStep].icon}
            </div>
            <div>
              <CardTitle className="text-lg">{STEPS[currentStep].title}</CardTitle>
              <CardDescription>{STEPS[currentStep].description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={isSaving}>
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Terminer"}
            <Check className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

    </div>
  );
}