import { useState, useEffect } from "react";
import { calculateTMI, calculatePartsFiscales } from "@/utils/taxCalculations";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, CheckCircle, Send, FileText, User, Wallet, TrendingUp, Settings, Calendar, AlertTriangle, Edit } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { TaxDeclarationFormData, TaxPermanenceConfig } from "@/types/tax-declaration";
import { Step1InformationsGenerales } from "./steps/Step1InformationsGenerales";
import { Step2SituationFiscale } from "./steps/Step2SituationFiscale";
import { Step3Revenus } from "./steps/Step3Revenus";
import { Step4Optimisation } from "./steps/Step4Optimisation";
import { Step5Intervenants } from "./steps/Step5Intervenants";
import { Step6Documents } from "./steps/Step6Documents";
import { TaxDeclarationConfirmation } from "./TaxDeclarationConfirmation";

const STEPS = [
  { id: 'info', title: 'Informations', icon: User },
  { id: 'fiscal', title: 'Situation fiscale', icon: FileText },
  { id: 'revenus', title: 'Revenus 2025', icon: Wallet },
  { id: 'optimisation', title: 'Optimisation', icon: TrendingUp },
  { id: 'intervenants', title: 'Intervenants', icon: Settings },
  { id: 'documents', title: 'Documents', icon: Calendar },
];

const initialFormData: TaxDeclarationFormData = {
  entreprise: '',
  intitule_poste: '',
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  is_perlib_client: false,
  conseiller_dedie: '',
  situation_maritale: '',
  nombre_enfants: 0,
  revenu_imposable_precedent: 0,
  tmi: '',
  prefilled_from_profile: {},
  revenus_types: [],
  optimisation_types: [],
  optimisation_autres: [],
  expertise_avocat: [],
  delegation_complete: false,
  avis_imposition_url: '',
  autres_justificatifs_urls: [],
  type_rdv: '',
  commentaires: '',
};

// Calcul de la TMI selon les barèmes français — utilise les fonctions centralisées
const calculateTMIFromBrackets = (revenuImposable: number, situationMaritale: string, nbEnfants: number): string => {
  if (!revenuImposable || revenuImposable === 0) return '';
  
  const parts = calculatePartsFiscales(situationMaritale, nbEnfants);
  const tmi = calculateTMI(revenuImposable, parts);
  return String(tmi);
};

// Mapping de situation familiale du profil vers le format du formulaire
const mapSituationFamiliale = (profileSituation: string | null): string => {
  if (!profileSituation) return '';
  const mapping: Record<string, string> = {
    'celibataire': 'celibataire',
    'marie': 'marie',
    'pacse': 'pacse',
    'divorce': 'divorce',
    'veuf': 'veuf',
    'concubinage': 'celibataire', // Fiscalement traité comme célibataire
  };
  return mapping[profileSituation.toLowerCase()] || '';
};

export function TaxDeclarationWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<TaxDeclarationFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [permanenceConfig, setPermanenceConfig] = useState<TaxPermanenceConfig | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [existingRequestId, setExistingRequestId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [quotaReached, setQuotaReached] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{ current: number; max: number } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      // Fetch profile, financial profile, and existing request in parallel
      const [profileResult, financialProfileResult, existingRequestResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("first_name, last_name, email, phone_number, job_title, company_id, marital_status, net_taxable_income")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("user_financial_profiles")
          .select("situation_familiale, nb_enfants, revenu_fiscal_annuel, tmi")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("tax_declaration_requests")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      const profile = profileResult.data;
      const financialProfile = financialProfileResult.data;
      const existingRequest = existingRequestResult.data as any;

      // Check if user already has a request
      if (existingRequest) {
        setExistingRequestId(existingRequest.id);
        setIsEditMode(true);
        // Pre-fill with existing request data
        setFormData({
          entreprise: existingRequest.entreprise || '',
          intitule_poste: existingRequest.intitule_poste || '',
          nom: existingRequest.nom || '',
          prenom: existingRequest.prenom || '',
          email: existingRequest.email || '',
          telephone: existingRequest.telephone || '',
          is_perlib_client: existingRequest.is_perlib_client || false,
          conseiller_dedie: existingRequest.conseiller_dedie || '',
          situation_maritale: existingRequest.situation_maritale || '',
          nombre_enfants: existingRequest.nombre_enfants || 0,
          revenu_imposable_precedent: existingRequest.revenu_imposable_precedent || 0,
          tmi: existingRequest.tmi || '',
          prefilled_from_profile: existingRequest.prefilled_from_profile || {},
          revenus_types: existingRequest.revenus_types || [],
          optimisation_types: existingRequest.optimisation_types || [],
          optimisation_autres: existingRequest.optimisation_autres || [],
          expertise_avocat: existingRequest.expertise_avocat || [],
          delegation_complete: existingRequest.delegation_complete || false,
          avis_imposition_url: existingRequest.avis_imposition_url || '',
          autres_justificatifs_urls: existingRequest.autres_justificatifs_urls || [],
          type_rdv: existingRequest.type_rdv || '',
          commentaires: existingRequest.commentaires || '',
        });
      }

      if (profile) {
        setCompanyId(profile.company_id);
        
        // Fetch company info, permanence config, and quota
        const { data: company } = await supabase
          .from("companies")
          .select("name, tax_permanence_config, max_tax_declarations")
          .eq("id", profile.company_id)
          .maybeSingle();

        if (company?.tax_permanence_config) {
          setPermanenceConfig(company.tax_permanence_config as unknown as TaxPermanenceConfig);
        }

        // Check company quota
        if (company && !existingRequest) {
          const maxDeclarations = (company as any).max_tax_declarations || 100;
          const { count } = await supabase
            .from("tax_declaration_requests")
            .select("id", { count: 'exact', head: true })
            .eq("company_id", profile.company_id);
          
          setQuotaInfo({ current: count || 0, max: maxDeclarations });
          if ((count || 0) >= maxDeclarations) {
            setQuotaReached(true);
          }
        }

        // Only pre-fill if no existing request
        if (!existingRequest) {

        // Pre-fill with user data
        const prefillData: Partial<TaxDeclarationFormData> = {
          nom: profile.last_name || '',
          prenom: profile.first_name || '',
          email: profile.email || user.email || '',
          telephone: profile.phone_number || '',
          intitule_poste: profile.job_title || '',
          entreprise: company?.name || '',
          prefilled_from_profile: {},
        };

        // Pre-fill from financial profile if available
        if (financialProfile) {
          const situationMapped = mapSituationFamiliale(financialProfile.situation_familiale);
          if (situationMapped) {
            prefillData.situation_maritale = situationMapped;
            prefillData.prefilled_from_profile = { ...prefillData.prefilled_from_profile, situation_maritale: true };
          }
          
          if (financialProfile.nb_enfants !== null && financialProfile.nb_enfants !== undefined) {
            prefillData.nombre_enfants = financialProfile.nb_enfants;
            prefillData.prefilled_from_profile = { ...prefillData.prefilled_from_profile, nombre_enfants: true };
          }
          
          if (financialProfile.revenu_fiscal_annuel && financialProfile.revenu_fiscal_annuel > 0) {
            prefillData.revenu_imposable_precedent = financialProfile.revenu_fiscal_annuel;
            prefillData.prefilled_from_profile = { ...prefillData.prefilled_from_profile, revenu_imposable_precedent: true };
          }
        }
        
        // Fallback to profile marital_status if not in financial profile
        if (!prefillData.situation_maritale && profile.marital_status) {
          const situationMapped = mapSituationFamiliale(profile.marital_status);
          if (situationMapped) {
            prefillData.situation_maritale = situationMapped;
            prefillData.prefilled_from_profile = { ...prefillData.prefilled_from_profile, situation_maritale: true };
          }
        }
        
        // Fallback to profile net_taxable_income
        if (!prefillData.revenu_imposable_precedent && profile.net_taxable_income && profile.net_taxable_income > 0) {
          prefillData.revenu_imposable_precedent = profile.net_taxable_income;
          prefillData.prefilled_from_profile = { ...prefillData.prefilled_from_profile, revenu_imposable_precedent: true };
        }

        // Auto-calculate TMI if we have income
        if (prefillData.revenu_imposable_precedent && prefillData.revenu_imposable_precedent > 0) {
          const calculatedTMI = calculateTMIFromBrackets(
            prefillData.revenu_imposable_precedent,
            prefillData.situation_maritale || '',
            prefillData.nombre_enfants || 0
          );
          if (calculatedTMI) {
            prefillData.tmi = calculatedTMI;
            prefillData.prefilled_from_profile = { ...prefillData.prefilled_from_profile, tmi_auto_calculated: true };
          }
        }

        setFormData(prev => ({ ...prev, ...prefillData }));
        } // End of if (!existingRequest)
      }
    };
    fetchUserData();
  }, [user]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const StepIcon = currentStepData?.icon;

  const updateFormData = (updates: Partial<TaxDeclarationFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !companyId) {
      toast.error("Erreur d'authentification");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && existingRequestId) {
        // Update existing request
        const { error } = await supabase
          .from("tax_declaration_requests")
          .update({
            entreprise: formData.entreprise,
            intitule_poste: formData.intitule_poste,
            nom: formData.nom,
            prenom: formData.prenom,
            email: formData.email,
            telephone: formData.telephone || null,
            is_perlib_client: formData.is_perlib_client,
            conseiller_dedie: formData.conseiller_dedie || null,
            situation_maritale: formData.situation_maritale || null,
            nombre_enfants: formData.nombre_enfants,
            revenu_imposable_precedent: formData.revenu_imposable_precedent || null,
            tmi: formData.tmi || null,
            revenus_types: formData.revenus_types,
            optimisation_types: formData.optimisation_types,
            optimisation_autres: formData.optimisation_autres,
            expertise_avocat: formData.expertise_avocat,
            delegation_complete: formData.delegation_complete,
            avis_imposition_url: formData.avis_imposition_url || null,
            autres_justificatifs_urls: formData.autres_justificatifs_urls,
            type_rdv: formData.type_rdv || null,
            commentaires: formData.commentaires || null,
            prefilled_from_profile: formData.prefilled_from_profile,
            modified_at: new Date().toISOString(),
          })
          .eq("id", existingRequestId);

        if (error) throw error;

        // Increment modification count with a separate query
        const { data: currentData } = await supabase
          .from("tax_declaration_requests")
          .select("modification_count")
          .eq("id", existingRequestId)
          .single();
        
        await supabase
          .from("tax_declaration_requests")
          .update({ modification_count: ((currentData as any)?.modification_count || 0) + 1 })
          .eq("id", existingRequestId);

        toast.success("Votre demande a été mise à jour avec succès !");
      } else {
        // Create new request
        const { error } = await supabase
          .from("tax_declaration_requests")
          .insert({
            user_id: user.id,
            company_id: companyId,
            entreprise: formData.entreprise,
            intitule_poste: formData.intitule_poste,
            nom: formData.nom,
            prenom: formData.prenom,
            email: formData.email,
            telephone: formData.telephone || null,
            is_perlib_client: formData.is_perlib_client,
            conseiller_dedie: formData.conseiller_dedie || null,
            situation_maritale: formData.situation_maritale || null,
            nombre_enfants: formData.nombre_enfants,
            revenu_imposable_precedent: formData.revenu_imposable_precedent || null,
            tmi: formData.tmi || null,
            revenus_types: formData.revenus_types,
            optimisation_types: formData.optimisation_types,
            optimisation_autres: formData.optimisation_autres,
            expertise_avocat: formData.expertise_avocat,
            delegation_complete: formData.delegation_complete,
            avis_imposition_url: formData.avis_imposition_url || null,
            autres_justificatifs_urls: formData.autres_justificatifs_urls,
            type_rdv: formData.type_rdv || null,
            commentaires: formData.commentaires || null,
            prefilled_from_profile: formData.prefilled_from_profile,
            status: 'pending',
          });

        if (error) throw error;

        toast.success("Votre demande a été soumise avec succès !");
      }
      
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting tax declaration request:", error);
      toast.error("Erreur lors de la soumission de votre demande");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <Step1InformationsGenerales formData={formData} updateFormData={updateFormData} />;
      case 1:
        return <Step2SituationFiscale formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <Step3Revenus formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <Step4Optimisation formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <Step5Intervenants formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <Step6Documents formData={formData} updateFormData={updateFormData} permanenceConfig={permanenceConfig} />;
      default:
        return null;
    }
  };

  // Show confirmation page after submission
  if (isSubmitted) {
    return <TaxDeclarationConfirmation formData={formData} permanenceConfig={permanenceConfig} isUpdate={isEditMode} />;
  }

  // Show quota reached message
  if (quotaReached && !isEditMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">Quota atteint</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              <p className="mt-2">
                Le nombre maximum d'accompagnements fiscaux pour votre entreprise a été atteint.
                Veuillez contacter votre service RH ou CSE pour plus d'informations.
              </p>
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Retour
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Edit Mode Banner */}
        {isEditMode && (
          <Alert className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
            <Edit className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <span>Vous modifiez votre demande existante.</span>
              <Badge variant="outline" className="text-xs">Mode modification</Badge>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button type="button" variant="ghost" onClick={handlePrevious} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {currentStep === 0 ? "Retour" : "Précédent"}
            </Button>
            <div className="text-sm text-muted-foreground">
              Étape {currentStep + 1} sur {STEPS.length}
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Aide à la déclaration fiscale 2026
            </h1>
            <p className="text-muted-foreground mt-2">
              Préparez votre déclaration sur les revenus de l'année 2025
            </p>
          </div>

          {/* Progress bar */}
          <div className="relative">
            <Progress value={progress} className="h-2" />
            
            <div className="flex justify-between mt-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => index < currentStep && setCurrentStep(index)}
                    disabled={index > currentStep}
                    className={cn(
                      "flex flex-col items-center gap-1 transition-all",
                      index < currentStep && "cursor-pointer",
                      index > currentStep && "opacity-40"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border transition-all",
                        index < currentStep && "bg-primary text-primary-foreground border-primary",
                        index === currentStep && "border-primary text-primary bg-primary/10",
                        index > currentStep && "border-muted text-muted-foreground"
                      )}
                    >
                      {index < currentStep ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className={cn(
                      "text-xs hidden md:block max-w-[80px] text-center",
                      index === currentStep ? "text-primary font-medium" : "text-muted-foreground"
                    )}>
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepData?.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  {StepIcon && (
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <StepIcon className="h-5 w-5" />
                    </div>
                  )}
                  <h2 className="text-xl font-semibold">{currentStepData?.title}</h2>
                </div>
              </div>

              <div className="min-h-[300px]">
                {renderStepContent()}
              </div>

              {/* Navigation */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="gap-2"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Send className="h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : isLastStep ? (
                    <>
                      <Send className="h-4 w-4" />
                      Soumettre ma demande
                    </>
                  ) : (
                    <>
                      Continuer
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Vos informations sont traitées de manière confidentielle conformément à notre politique de confidentialité.
        </p>
      </div>
    </div>
  );
}
