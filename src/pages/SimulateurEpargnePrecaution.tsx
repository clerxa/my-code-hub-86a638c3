import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserCircle, Euro, Shield, Briefcase, Target, PiggyBank, Home, Car, Smartphone, Users2, Wallet, CreditCard, Sparkles, ArrowLeft, Loader2, Building2, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEpargnePrecautionCalculations } from "@/hooks/useEpargnePrecautionCalculations";
import { useFinancialProfilePrefill } from "@/hooks/useFinancialProfilePrefill";
import { useUserRealEstateProperties } from "@/hooks/useUserRealEstateProperties";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useSimulationTracking } from "@/hooks/useSimulationTracking";
import { useCTARulesEngine } from "@/hooks/useCTARulesEngine";
import { SimulatorWizard, SimulatorStep } from "@/components/simulators/SimulatorWizard";
import { SimulatorStepField } from "@/components/simulators/SimulatorStepField";
import { SimulatorResultsSection, ResultCard } from "@/components/simulators/SimulatorResultsSection";
import { SimulationValidationOverlay } from "@/components/simulators/SimulationValidationOverlay";
import { SaveSimulationDialog } from "@/components/simulators/SaveSimulationDialog";
import { SimulatorDisclaimer } from "@/components/simulators/SimulatorDisclaimer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUnifiedSimulationSave } from "@/hooks/useUnifiedSimulationSave";
import { useSimulationLoader } from "@/hooks/useSimulationLoader";
import { 
  NiveauSecurite, 
  TypeContrat, 
  ChargesDetailees,
  NIVEAU_SECURITE_MOIS,
  TYPE_CONTRAT_LABELS,
  CHARGES_CATEGORIES,
  getEmptyChargesDetailees,
  calculateTotalCharges,
} from "@/types/epargne-precaution";

const SimulateurEpargnePrecaution = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { calculerSimulation, getCoefficientContrat } = useEpargnePrecautionCalculations();
  const { getPrefillData, hasProfile, isLoading: isProfileLoading } = useFinancialProfilePrefill();
  const { totals: realEstateTotals } = useUserRealEstateProperties();
  const { user } = useAuth();

  // État du wizard
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  // État du formulaire - Charges détaillées
  const [chargesDetailees, setChargesDetailees] = useState<ChargesDetailees>(getEmptyChargesDetailees());
  
  // Autres champs
  const [epargneActuelle, setEpargneActuelle] = useState(2000);
  const [niveauSecurite, setNiveauSecurite] = useState<NiveauSecurite>("confortable");
  const [capaciteEpargneMensuelle, setCapaciteEpargneMensuelle] = useState(300);
  const [typeContrat, setTypeContrat] = useState<TypeContrat>("cdi");
  
  // Fonction pour restaurer les données
  const restoreSimulationData = (simData: Record<string, unknown>) => {
    if (simData.charges_fixes_mensuelles !== undefined) {
      setChargesDetailees({
        loyer: (simData.charges_loyer_credit as number) || 0,
        credit_immobilier: 0,
        copropriete_taxes: (simData.charges_copropriete_taxes as number) || 0,
        energie: (simData.charges_energie as number) || 0,
        assurance_habitation: (simData.charges_assurance_habitation as number) || 0,
        transport_commun: (simData.charges_transport_commun as number) || 0,
        assurance_auto: (simData.charges_assurance_auto as number) || 0,
        lld_loa_auto: (simData.charges_lld_loa_auto as number) || 0,
        internet: (simData.charges_internet as number) || 0,
        mobile: (simData.charges_mobile as number) || 0,
        abonnements: (simData.charges_abonnements as number) || 0,
        frais_scolarite: (simData.charges_frais_scolarite as number) || 0,
        pension_alimentaire: 0,
        credit_consommation: 0,
        investissement_locatif_credits: (simData.investissement_locatif_credits as number) || 0,
        investissement_locatif_charges: (simData.investissement_locatif_charges as number) || 0,
        impots: (simData.impots as number) || 0,
        autres: (simData.charges_autres as number) || 0,
      });
    }
    if (simData.epargne_actuelle !== undefined) setEpargneActuelle(simData.epargne_actuelle as number);
    if (simData.niveau_securite !== undefined) setNiveauSecurite(simData.niveau_securite as NiveauSecurite);
    if (simData.capacite_epargne_mensuelle !== undefined) setCapaciteEpargneMensuelle(simData.capacite_epargne_mensuelle as number);
    if (simData.type_contrat !== undefined) setTypeContrat(simData.type_contrat as TypeContrat);
    setShowResults(true);
  };

  // Hook de chargement unifié
  const { isLoadingSimulation, loadedSimulationName, isFromHistory } = useSimulationLoader({
    onDataLoaded: (data, name) => {
      restoreSimulationData(data);
      if (name) setNomSimulation(name);
    },
  });
  
  // Hook de sauvegarde unifié
  const {
    showSaveDialog,
    openSaveDialog,
    closeSaveDialog,
    simulationName: nomSimulation,
    setSimulationName: setNomSimulation,
    saveSimulation,
    isSaving,
    showExpertPrompt,
    closeExpertPrompt,
  } = useUnifiedSimulationSave({
    type: 'epargne_precaution',
    queryCacheKey: ['simulations', 'epargne_precaution_simulations'],
  });
  
  const [profileApplied, setProfileApplied] = useState(false);
  const [prefilledFields, setPrefilledFields] = useState<Set<string>>(new Set());

  // Tracking
  const {
    startValidation,
    completeValidation,
    markAsSaved,
    trackCTAClick,
    showValidationOverlay,
    simulationLogId,
    validateSimulation,
  } = useSimulationTracking();

  // Pré-remplir depuis le profil financier
  useEffect(() => {
    if (!isProfileLoading && hasProfile && !profileApplied && !location.state?.simulation) {
      const data = getPrefillData();
      
      if (data.chargesDetailees) {
        const charges = { ...data.chargesDetailees };
        
        // Injecter les investissements locatifs depuis le portefeuille immobilier
        if (realEstateTotals) {
          charges.investissement_locatif_credits = realEstateTotals.mensualitesTotal ?? 0;
          charges.investissement_locatif_charges = realEstateTotals.chargesTotal ?? 0;
        }
        
        setChargesDetailees(charges);
        
        // Tracker les champs pré-remplis (ceux > 0)
        const filledFields = new Set<string>();
        Object.entries(charges).forEach(([key, value]) => {
          if (value > 0) filledFields.add(key);
        });
        if (data.epargneActuelle > 0) filledFields.add('epargne_actuelle');
        if (data.capaciteEpargneMensuelle > 0) filledFields.add('capacite_epargne_mensuelle');
        if (data.typeContrat) filledFields.add('type_contrat');
        setPrefilledFields(filledFields);
      }
      
      if (data.epargneActuelle > 0) setEpargneActuelle(data.epargneActuelle);
      if (data.capaciteEpargneMensuelle > 0) setCapaciteEpargneMensuelle(data.capaciteEpargneMensuelle);
      
      // Mapper le type de contrat
      const contratMapping: Record<string, TypeContrat> = {
        'cdi': 'cdi',
        'cdd': 'cdd',
        'independant': 'independant',
        'fonctionnaire': 'cdi',
      };
      if (data.typeContrat && contratMapping[data.typeContrat]) {
        setTypeContrat(contratMapping[data.typeContrat]);
      }
      
      // Récupérer les impôts depuis ATLAS
      if (user?.id) {
        supabase
          .from("ocr_avis_imposition_analyses" as any)
          .select("impot_net_total")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
          .then(({ data: atlasResult }) => {
            const atlasRecord = atlasResult as any;
            if (atlasRecord?.impot_net_total) {
              const impotMensuel = Math.round(atlasRecord.impot_net_total / 12);
              setChargesDetailees(prev => ({ ...prev, impots: impotMensuel }));
              setPrefilledFields(prev => {
                const next = new Set(prev);
                if (impotMensuel > 0) next.add('impots');
                return next;
              });
            }
          });
      }
      
      setProfileApplied(true);
    }
  }, [isProfileLoading, hasProfile, profileApplied, getPrefillData, location.state, realEstateTotals, user?.id]);

  // Charger une simulation existante
  useEffect(() => {
    const simulation = location.state?.simulation;
    if (simulation) {
      setChargesDetailees({
        loyer: simulation.charges_loyer_credit || 0,
        credit_immobilier: 0,
        copropriete_taxes: simulation.charges_copropriete_taxes || 0,
        energie: simulation.charges_energie || 0,
        assurance_habitation: simulation.charges_assurance_habitation || 0,
        transport_commun: simulation.charges_transport_commun || 0,
        assurance_auto: simulation.charges_assurance_auto || 0,
        lld_loa_auto: simulation.charges_lld_loa_auto || 0,
        internet: simulation.charges_internet || 0,
        mobile: simulation.charges_mobile || 0,
        abonnements: simulation.charges_abonnements || 0,
        frais_scolarite: simulation.charges_frais_scolarite || 0,
        pension_alimentaire: simulation.charges_pension_alimentaire || 0,
        credit_consommation: 0,
        investissement_locatif_credits: simulation.investissement_locatif_credits || 0,
        investissement_locatif_charges: simulation.investissement_locatif_charges || 0,
        impots: simulation.impots || 0,
        autres: simulation.charges_autres || 0,
      });
      setEpargneActuelle(simulation.epargne_actuelle);
      setNiveauSecurite(simulation.niveau_securite);
      setCapaciteEpargneMensuelle(simulation.capacite_epargne_mensuelle);
      setTypeContrat(simulation.type_contrat || 'cdi');
    }
  }, [location.state]);

  // Total des charges
  const totalCharges = useMemo(() => calculateTotalCharges(chargesDetailees), [chargesDetailees]);

  // Calculs
  const formData = useMemo(() => ({
    charges_detaillees: chargesDetailees,
    epargne_actuelle: epargneActuelle,
    niveau_securite: niveauSecurite,
    capacite_epargne_mensuelle: capaciteEpargneMensuelle,
    type_contrat: typeContrat,
  }), [chargesDetailees, epargneActuelle, niveauSecurite, capaciteEpargneMensuelle, typeContrat]);

  const resultats = useMemo(() => {
    if (totalCharges === 0) return null;
    return calculerSimulation(formData);
  }, [formData, totalCharges, calculerSimulation]);

  // CTA intelligents - passer toutes les clés disponibles pour le moteur de règles
  const { ctas } = useCTARulesEngine('epargne_precaution', {
    // Résultats calculés
    epargne_manquante: resultats?.epargne_manquante || 0,
    nb_mois_securite: resultats?.nb_mois_securite || 0,
    epargne_recommandee: resultats?.epargne_recommandee || 0,
    indice_resilience: resultats?.indice_resilience || 0,
    temps_pour_objectif: resultats?.temps_pour_objectif || 0,
    depenses_mensuelles: resultats?.depenses_mensuelles || totalCharges,
    // Inputs utilisateur
    niveau_securite: formData.niveau_securite,
    epargne_actuelle: epargneActuelle,
    capacite_epargne: capaciteEpargneMensuelle,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Validation
  const handleValidate = async () => {
    if (!resultats) return;
    
    startValidation();
    
    await validateSimulation({
      simulatorType: "epargne_precaution",
      simulationData: formData,
      resultsData: resultats,
    });
  };

  const handleValidationComplete = () => {
    completeValidation();
    setShowResults(true);
  };

  // Sauvegarde
  const handleSave = async () => {
    const now = new Date();
    const defaultName = `Épargne de précaution - ${format(now, 'dd/MM/yyyy HH:mm')}`;
    openSaveDialog(loadedSimulationName || defaultName);
  };

  const handleConfirmSave = async () => {
    if (!resultats) {
      toast({ title: "Erreur", description: "Veuillez d'abord valider la simulation", variant: "destructive" });
      return;
    }

    const simulationData = {
      // Charges détaillées
      charges_loyer_credit: chargesDetailees.loyer + chargesDetailees.credit_immobilier,
      charges_copropriete_taxes: chargesDetailees.copropriete_taxes,
      charges_energie: chargesDetailees.energie,
      charges_assurance_habitation: chargesDetailees.assurance_habitation,
      charges_transport_commun: chargesDetailees.transport_commun,
      charges_assurance_auto: chargesDetailees.assurance_auto,
      charges_lld_loa_auto: chargesDetailees.lld_loa_auto,
      charges_internet: chargesDetailees.internet,
      charges_mobile: chargesDetailees.mobile,
      charges_abonnements: chargesDetailees.abonnements,
      charges_frais_scolarite: chargesDetailees.frais_scolarite,
      charges_autres: chargesDetailees.autres + chargesDetailees.credit_consommation,
      // Total et autres
      charges_fixes_mensuelles: totalCharges,
      epargne_actuelle: epargneActuelle,
      niveau_securite: niveauSecurite,
      nb_mois_securite: resultats.nb_mois_securite,
      capacite_epargne_mensuelle: capaciteEpargneMensuelle,
      type_contrat: typeContrat,
      coefficient_metier: resultats.coefficient_contrat,
      depenses_mensuelles: resultats.depenses_mensuelles,
      epargne_recommandee: resultats.epargne_recommandee,
      epargne_manquante: resultats.epargne_manquante,
      temps_pour_objectif: resultats.temps_pour_objectif,
      epargne_mensuelle_optimale: resultats.epargne_mensuelle_optimale,
      indice_resilience: resultats.indice_resilience,
      message_personnalise: resultats.message_personnalise,
      cta_affiche: resultats.cta_condition,
    };

    await saveSimulation(simulationData);
    
    if (simulationLogId) {
      await markAsSaved();
    }
  };

  const handleCTAClick = async (ctaId: string, isAppointment: boolean) => {
    if (simulationLogId) {
      await trackCTAClick(ctaId, isAppointment);
    }
  };

  const handleReset = () => {
    setShowResults(false);
    setCurrentStep(0);
  };

  const getResilienceColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "highlight";
    if (score >= 40) return "warning";
    return "warning";
  };

  // Mise à jour d'une charge
  const updateCharge = (key: keyof ChargesDetailees, value: number) => {
    setChargesDetailees(prev => ({ ...prev, [key]: value }));
    // Retirer de la liste des champs pré-remplis si l'utilisateur modifie
    setPrefilledFields(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  // Vérifier si un champ est pré-rempli depuis le profil
  const isFieldPrefilled = (key: string) => prefilledFields.has(key);

  // Composant pour afficher une catégorie de charges
  const ChargesCategoryCard = ({ categoryKey, category }: { categoryKey: string; category: typeof CHARGES_CATEGORIES[keyof typeof CHARGES_CATEGORIES] }) => {
    const hasPrefilledFields = category.fields.some(f => isFieldPrefilled(f.key));
    
    return (
      <Card className={`border-border/50 ${hasPrefilledFields ? 'ring-1 ring-primary/30' : ''}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span>{category.icon}</span>
            {category.label}
            {hasPrefilledFields && (
              <span className="ml-auto flex items-center gap-1 text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <Sparkles className="h-3 w-3" />
                Profil
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {category.fields.map(field => {
            const isPrefilled = isFieldPrefilled(field.key);
            return (
              <div key={field.key} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">{field.label}</Label>
                  {isPrefilled && (
                    <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      depuis profil
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={chargesDetailees[field.key as keyof ChargesDetailees] === 0 ? '' : chargesDetailees[field.key as keyof ChargesDetailees]}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      updateCharge(field.key as keyof ChargesDetailees, val === '' ? 0 : parseInt(val, 10));
                    }}
                    placeholder={field.placeholder}
                    className={`pr-8 ${isPrefilled ? 'border-primary/30 bg-primary/5' : ''}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€/mois</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  // Définition des étapes
  const steps: SimulatorStep[] = [
    {
      id: "introduction",
      title: "Bienvenue",
      subtitle: "Calculez votre épargne de précaution idéale",
      icon: Shield,
      content: (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/20">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Objectif de ce simulateur</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Ce simulateur vous aide à déterminer le <strong>montant idéal d'épargne de précaution</strong> à constituer 
                pour faire face aux imprévus de la vie (perte d'emploi, dépenses imprévues, réparations...).
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Évaluation de vos charges fixes mensuelles
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Calcul adapté à votre situation professionnelle
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Recommandation personnalisée et plan d'action
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-secondary/30 bg-secondary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-secondary/20">
                  <UserCircle className="h-5 w-5 text-secondary" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">💡 Astuce pour aller plus vite</h4>
                  <p className="text-sm text-muted-foreground">
                    Complétez votre <strong>profil financier</strong> une seule fois et vos informations 
                    seront automatiquement pré-remplies dans tous les simulateurs !
                  </p>
                  {hasProfile ? (
                    <p className="text-sm text-primary font-medium">
                      ✓ Votre profil financier est déjà renseigné
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Rendez-vous dans l'onglet "Finances" de votre profil pour le compléter.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
      isValid: () => true,
    },
    {
      id: "charges-logement",
      title: "Logement & Énergie",
      subtitle: "Vos dépenses mensuelles de logement",
      icon: Home,
      content: (
        <div className="space-y-4">
          <ChargesCategoryCard categoryKey="logement" category={CHARGES_CATEGORIES.logement} />
        </div>
      ),
      isValid: () => true,
    },
    {
      id: "charges-transport",
      title: "Transports & Mobilité",
      subtitle: "Vos dépenses de déplacement",
      icon: Car,
      content: (
        <div className="space-y-4">
          <ChargesCategoryCard categoryKey="transport" category={CHARGES_CATEGORIES.transport} />
        </div>
      ),
      isValid: () => true,
    },
    {
      id: "charges-communication",
      title: "Communication & Services",
      subtitle: "Vos abonnements",
      icon: Smartphone,
      content: (
        <div className="space-y-4">
          <ChargesCategoryCard categoryKey="communication" category={CHARGES_CATEGORIES.communication} />
        </div>
      ),
      isValid: () => true,
    },
    {
      id: "charges-famille",
      title: "Famille",
      subtitle: "Charges liées à la famille",
      icon: Users2,
      content: (
        <div className="space-y-4">
          <ChargesCategoryCard categoryKey="famille" category={CHARGES_CATEGORIES.famille} />
        </div>
      ),
      isValid: () => true,
    },
    {
      id: "charges-credit-autres",
      title: "Crédits & Autres",
      subtitle: "Crédits consommation et autres charges",
      icon: CreditCard,
      content: (
        <div className="space-y-4">
          <ChargesCategoryCard categoryKey="credit" category={CHARGES_CATEGORIES.credit} />
          <ChargesCategoryCard categoryKey="investissement_locatif" category={CHARGES_CATEGORIES.investissement_locatif} />
          <ChargesCategoryCard categoryKey="impots" category={CHARGES_CATEGORIES.impots} />
          <ChargesCategoryCard categoryKey="autres" category={CHARGES_CATEGORIES.autres} />
          
          {/* Récapitulatif des charges */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total charges fixes mensuelles</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(totalCharges)}</span>
              </div>
              {prefilledFields.size > 0 && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Certains champs ont été pré-remplis depuis votre profil financier
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ),
      isValid: () => totalCharges > 0,
    },
    {
      id: "contrat-epargne",
      title: "Situation & Épargne",
      subtitle: "Votre type de contrat et épargne actuelle",
      icon: Briefcase,
      content: (
        <div className="space-y-6">
          <SimulatorStepField
            label="Type de contrat"
            tooltip="Influence le coefficient de sécurité appliqué"
            type="custom"
            delay={0}
          >
            <Select value={typeContrat} onValueChange={(v) => setTypeContrat(v as TypeContrat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_CONTRAT_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              Coefficient de sécurité : x{getCoefficientContrat(typeContrat).toFixed(1)}
            </p>
          </SimulatorStepField>

          <SimulatorStepField
            label="Épargne disponible actuelle"
            tooltip="Épargne liquide disponible immédiatement (livrets, comptes)"
            value={epargneActuelle}
            onChange={setEpargneActuelle}
            type="currency"
            showSlider
            sliderMin={0}
            sliderMax={50000}
            sliderStep={500}
            delay={1}
            highlight
          />

          <SimulatorStepField
            label="Capacité d'épargne mensuelle"
            tooltip="Combien pouvez-vous mettre de côté chaque mois ?"
            value={capaciteEpargneMensuelle}
            onChange={setCapaciteEpargneMensuelle}
            type="currency"
            showSlider
            sliderMin={0}
            sliderMax={2000}
            sliderStep={50}
            delay={2}
          />
        </div>
      ),
    },
    {
      id: "objectif",
      title: "Niveau de sécurité",
      subtitle: "Quel niveau de protection souhaitez-vous ?",
      icon: Shield,
      content: (
        <div className="space-y-6">
          <SimulatorStepField
            label="Niveau de sécurité souhaité"
            type="custom"
            delay={0}
          >
            <RadioGroup 
              value={niveauSecurite} 
              onValueChange={(v) => setNiveauSecurite(v as NiveauSecurite)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="minimum" id="minimum" />
                <Label htmlFor="minimum" className="cursor-pointer flex-1">
                  <div className="font-medium">Minimum</div>
                  <div className="text-sm text-muted-foreground">{NIVEAU_SECURITE_MOIS.minimum} mois de charges</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer bg-primary/5 border-primary/20">
                <RadioGroupItem value="confortable" id="confortable" />
                <Label htmlFor="confortable" className="cursor-pointer flex-1">
                  <div className="font-medium">Confortable (recommandé)</div>
                  <div className="text-sm text-muted-foreground">{NIVEAU_SECURITE_MOIS.confortable} mois de charges</div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="optimal" id="optimal" />
                <Label htmlFor="optimal" className="cursor-pointer flex-1">
                  <div className="font-medium">Optimal</div>
                  <div className="text-sm text-muted-foreground">{NIVEAU_SECURITE_MOIS.optimal} mois de charges</div>
                </Label>
              </div>
            </RadioGroup>
          </SimulatorStepField>

          {/* Résultat masqué jusqu'au clic sur "Voir mes résultats" */}
        </div>
      ),
    },
  ];

  // Résultats
  const resultsContent = resultats ? (
    <SimulatorResultsSection
      mainResult={{
        title: resultats.epargne_manquante > 0 ? "Épargne manquante" : "Félicitations !",
        value: resultats.epargne_manquante > 0 
          ? resultats.epargne_manquante 
          : "Objectif atteint !",
        subtitle: resultats.message_personnalise,
        badge: `Résilience : ${resultats.indice_resilience}%`,
      }}
      ctas={ctas}
      onCTAClick={handleCTAClick}
      onSave={handleSave}
      onReset={handleReset}
      isSaving={isSaving}
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ResultCard
          title="Épargne actuelle"
          value={epargneActuelle}
          icon={PiggyBank}
          delay={0}
        />
        <ResultCard
          title="Objectif recommandé"
          value={resultats.epargne_recommandee}
          subtitle={`${resultats.nb_mois_securite} mois de charges`}
          icon={Target}
          variant="highlight"
          delay={1}
        />
        <ResultCard
          title="Indice de résilience"
          value={`${resultats.indice_resilience}%`}
          icon={Shield}
          variant={getResilienceColor(resultats.indice_resilience) as any}
          delay={2}
        />
      </div>

      {/* Détail des charges */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Récapitulatif de vos charges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {(chargesDetailees.loyer + chargesDetailees.credit_immobilier) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">🏠 Loyer/Crédit</span>
                <span className="font-medium">{formatCurrency(chargesDetailees.loyer + chargesDetailees.credit_immobilier)}</span>
              </div>
            )}
            {(chargesDetailees.copropriete_taxes + chargesDetailees.energie + chargesDetailees.assurance_habitation) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">⚡ Charges logement</span>
                <span className="font-medium">{formatCurrency(chargesDetailees.copropriete_taxes + chargesDetailees.energie + chargesDetailees.assurance_habitation)}</span>
              </div>
            )}
            {(chargesDetailees.transport_commun + chargesDetailees.assurance_auto + chargesDetailees.lld_loa_auto) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">🚗 Transport</span>
                <span className="font-medium">{formatCurrency(chargesDetailees.transport_commun + chargesDetailees.assurance_auto + chargesDetailees.lld_loa_auto)}</span>
              </div>
            )}
            {(chargesDetailees.internet + chargesDetailees.mobile + chargesDetailees.abonnements) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">📱 Communication</span>
                <span className="font-medium">{formatCurrency(chargesDetailees.internet + chargesDetailees.mobile + chargesDetailees.abonnements)}</span>
              </div>
            )}
            {(chargesDetailees.frais_scolarite + chargesDetailees.pension_alimentaire) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">👨‍👩‍👧 Famille</span>
                <span className="font-medium">{formatCurrency(chargesDetailees.frais_scolarite + chargesDetailees.pension_alimentaire)}</span>
              </div>
            )}
            {chargesDetailees.credit_consommation > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">💰 Crédit conso</span>
                <span className="font-medium">{formatCurrency(chargesDetailees.credit_consommation)}</span>
              </div>
            )}
            {chargesDetailees.autres > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">💳 Autres</span>
                <span className="font-medium">{formatCurrency(chargesDetailees.autres)}</span>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t flex justify-between font-medium">
            <span>Total mensuel</span>
            <span className="text-primary">{formatCurrency(totalCharges)}</span>
          </div>
        </CardContent>
      </Card>

      {resultats.epargne_manquante > 0 && resultats.temps_pour_objectif && (
        <div className="mt-6 p-4 rounded-lg bg-muted/30">
          <h3 className="font-medium mb-3">Plan d'action</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Épargne mensuelle optimale</span>
              <span className="font-medium">{formatCurrency(resultats.epargne_mensuelle_optimale || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Temps pour atteindre l'objectif</span>
              <span className="font-medium">{resultats.temps_pour_objectif} mois</span>
            </div>
          </div>
        </div>
      )}
    </SimulatorResultsSection>
  ) : null;

  // Loading state
  if (isLoadingSimulation) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      
      {/* Bandeau simulation chargée */}
      {isFromHistory && loadedSimulationName && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary">
                Simulation : {loadedSimulationName}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/employee/simulations?tab=historique')}
              className="text-primary hover:text-primary/80"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour à l'historique
            </Button>
          </div>
        </div>
      )}
      
      {hasProfile && !showResults && currentStep === 0 && !isFromHistory && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <Alert className="bg-primary/5 border-primary/20">
            <UserCircle className="h-4 w-4" />
            <AlertDescription>
              Vos informations ont été pré-remplies depuis votre profil financier.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <SimulatorWizard
        title="Simulateur d'épargne de précaution"
        subtitle="Calculez votre matelas de sécurité idéal"
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        showResults={showResults}
        resultsContent={resultsContent}
        onValidate={handleValidate}
        onBack={() => navigate('/employee/simulations')}
        onBackFromResults={() => setShowResults(false)}
      />

      <SimulationValidationOverlay
        isValidating={showValidationOverlay}
        onComplete={handleValidationComplete}
        simulatorName="Épargne de précaution"
        simulatorId="epargne_precaution"
      />

      <div className="container mx-auto px-4 max-w-4xl pb-8">
        <SimulatorDisclaimer />
      </div>

      <SaveSimulationDialog
        open={showSaveDialog}
        onOpenChange={(open) => open ? openSaveDialog() : closeSaveDialog()}
        simulationName={nomSimulation}
        onSimulationNameChange={setNomSimulation}
        onSave={handleConfirmSave}
        isSaving={isSaving}
        showExpertPrompt={showExpertPrompt}
        onCloseExpertPrompt={closeExpertPrompt}
      />
    </>
  );
};

export default SimulateurEpargnePrecaution;
