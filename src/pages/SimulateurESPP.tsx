import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserFiscalProfile, ESPPPlan, ESPPLot, VenteESPP } from "@/types/espp";
import { ProfilFiscalStep } from "@/components/espp/ProfilFiscalStep";
import { PlanESPPStep } from "@/components/espp/PlanESPPStep";
import { ResultatsStep } from "@/components/espp/ResultatsStep";
import { VentesStep } from "@/components/espp/VentesStep";
import { useESPPCalculations } from "@/hooks/useESPPCalculations";

type Step = 'profil' | 'plans' | 'ventes' | 'resultats';

const SimulateurESPP = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { calculerGainAcquisition, calculerPlusValue } = useESPPCalculations();
  
  const [currentStep, setCurrentStep] = useState<Step>('profil');
  const [loading, setLoading] = useState(false);
  
  // Récupérer le plan_id de l'URL pour édition et l'étape souhaitée
  const urlParams = new URLSearchParams(window.location.search);
  const planIdToEdit = urlParams.get('plan');
  const stepParam = urlParams.get('step') as Step | null;
  
  // États des données
  const [profile, setProfile] = useState<Partial<UserFiscalProfile>>({
    residence_fiscal: 'France',
    tmi: 30,
    mode_imposition_plus_value: 'PFU'
  });
  const [plans, setPlans] = useState<Partial<ESPPPlan>[]>([]);
  const [existingPlans, setExistingPlans] = useState<ESPPPlan[]>([]);
  const [lots, setLots] = useState<ESPPLot[]>([]);
  const [ventes, setVentes] = useState<Partial<VenteESPP>[]>([]);

  // Chargement des données existantes
  useEffect(() => {
    if (user) {
      loadExistingData();
    }
  }, [user]);

  // Si un plan_id est fourni, charger ce plan spécifique pour édition
  useEffect(() => {
    if (user && planIdToEdit && existingPlans.length > 0) {
      selectPlan(planIdToEdit);
      // Si un step est spécifié dans l'URL, naviguer vers cette étape
      if (stepParam && ['profil', 'plans', 'ventes', 'resultats'].includes(stepParam)) {
        setCurrentStep(stepParam);
      }
    }
  }, [user, planIdToEdit, existingPlans, stepParam]);

  const loadExistingData = async () => {
    if (!user) return;

    try {
      // Charger le profil fiscal
      const { data: profileData } = await supabase
        .from('user_fiscal_profile')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile({
          ...profileData,
          tmi: profileData.tmi as 0 | 11 | 30 | 41 | 45,
          mode_imposition_plus_value: profileData.mode_imposition_plus_value as 'PFU' | 'Barème'
        });
      }

      // Charger les plans
      const { data: plansData } = await supabase
        .from('espp_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (plansData && plansData.length > 0) {
        setExistingPlans(plansData);
        
        // Charger les lots pour ces plans
        const planIds = plansData.map(p => p.id);
        const { data: lotsData } = await supabase
          .from('espp_lots')
          .select('*')
          .in('plan_id', planIds)
          .order('date_acquisition', { ascending: false });

        if (lotsData) {
          setLots(lotsData);
          
          // Charger les ventes pour ces lots
          const lotIds = lotsData.map(l => l.id);
          const { data: ventesData } = await supabase
            .from('ventes_espp')
            .select('*')
            .in('lot_id', lotIds)
            .order('date_vente', { ascending: false });

          if (ventesData) {
            setVentes(ventesData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_fiscal_profile')
        .upsert({
          user_id: user.id,
          residence_fiscal: profile.residence_fiscal,
          tmi: profile.tmi,
          mode_imposition_plus_value: profile.mode_imposition_plus_value
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Erreur lors de la sauvegarde du profil");
    }
  };

  const deletePlan = async (planId: string) => {
    if (!user) return;
    
    try {
      // Supprimer d'abord les ventes liées aux lots de ce plan
      const lotsToDelete = lots.filter(l => l.plan_id === planId).map(l => l.id);
      if (lotsToDelete.length > 0) {
        await supabase
          .from('ventes_espp')
          .delete()
          .in('lot_id', lotsToDelete);
        
        // Supprimer les lots
        await supabase
          .from('espp_lots')
          .delete()
          .in('id', lotsToDelete);
      }

      // Supprimer le plan
      const { error } = await supabase
        .from('espp_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      
      // Mettre à jour l'état local immédiatement
      setExistingPlans(prev => prev.filter(p => p.id !== planId));
      setLots(prev => prev.filter(l => l.plan_id !== planId));
      setVentes(prev => prev.filter(v => !lotsToDelete.includes(v.lot_id || '')));
      
      toast.success("Plan supprimé avec succès");
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error("Erreur lors de la suppression du plan");
    }
  };

  const selectPlan = async (planId: string) => {
    if (!user) return;
    
    try {
      // Charger les lots de ce plan
      const { data: lotsData, error: lotsError } = await supabase
        .from('espp_lots')
        .select('*')
        .eq('plan_id', planId);

      if (lotsError) throw lotsError;
      
      if (lotsData && lotsData.length > 0) {
        setLots(lotsData);
        
        // Charger les ventes associées
        const lotIds = lotsData.map(l => l.id);
        const { data: ventesData, error: ventesError } = await supabase
          .from('ventes_espp')
          .select('*')
          .in('lot_id', lotIds);

        if (ventesError) throw ventesError;
        
        if (ventesData) {
          setVentes(ventesData);
        }
      }
      
      // Passer à l'étape ventes
      setCurrentStep('ventes');
      toast.success("Plan sélectionné");
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast.error("Erreur lors de la sélection du plan");
    }
  };

  const savePlansAndLots = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Sauvegarder chaque plan et créer ses lots
      for (const plan of plans) {
        const planData: any = {
          nom_plan: plan.nom_plan,
          entreprise: plan.entreprise,
          devise_plan: plan.devise_plan,
          date_debut: plan.date_debut,
          date_fin: plan.date_fin,
          lookback: plan.lookback,
          discount_pct: plan.discount_pct,
          fmv_debut: plan.fmv_debut,
          fmv_fin: plan.fmv_fin,
          montant_investi: plan.montant_investi,
          taux_change_payroll: plan.taux_change_payroll,
          broker: plan.broker,
          user_id: user.id
        };

        if (plan.id) {
          planData.id = plan.id;
        }

        const { data: savedPlan, error: planError } = await supabase
          .from('espp_plans')
          .upsert(planData)
          .select()
          .single();

        if (planError) throw planError;

        // Créer le lot correspondant avec les calculs
        const calcul = calculerGainAcquisition(plan as ESPPPlan);
        
        const { error: lotError } = await supabase
          .from('espp_lots')
          .upsert({
            plan_id: savedPlan.id,
            date_acquisition: plan.date_fin,
            quantite_achetee_brut: calcul.quantiteActions,
            prix_achat_unitaire_devise: calcul.prixAchatFinal,
            fmv_retenu_plan: plan.fmv_fin,
            gain_acquisition_par_action: calcul.gainAcquisitionParAction,
            gain_acquisition_total_devise: calcul.gainAcquisitionTotal,
            gain_acquisition_total_eur: calcul.gainAcquisitionEUR,
            pru_fiscal_eur: calcul.pruFiscalEUR,
            frais_achat: 0
          });

        if (lotError) throw lotError;
      }

      // Recharger les lots et vider les plans en cours
      await loadExistingData();
      setPlans([]);
      toast.success("Plans et lots sauvegardés avec succès");
    } catch (error) {
      console.error('Error saving plans:', error);
      toast.error("Erreur lors de la sauvegarde des plans");
    } finally {
      setLoading(false);
    }
  };

  const saveVentes = async () => {
    if (!user || !profile.tmi) return;
    setLoading(true);

    try {
      // Ne garder que les lignes complètes et valides
      const ventesCompletes = ventes.filter((vente) =>
        vente.lot_id &&
        (vente.quantite_vendue ?? 0) > 0 &&
        (vente.prix_vente_devise ?? 0) > 0 &&
        !!vente.date_vente &&
        (vente.taux_change ?? 0) > 0
      ) as VenteESPP[];

      if (ventesCompletes.length === 0) {
        // Rien à enregistrer, on passe simplement aux résultats
        return;
      }

      for (const vente of ventesCompletes) {
        const lot = lots.find((l) => l.id === vente.lot_id);
        if (!lot) continue;

        const resultat = calculerPlusValue(
          vente.quantite_vendue!,
          vente.prix_vente_devise!,
          vente.taux_change!,
          lot.pru_fiscal_eur,
          lot.fmv_retenu_plan,
          vente.frais_vente || 0,
          profile as UserFiscalProfile
        );

        const venteData: any = {
          lot_id: vente.lot_id,
          quantite_vendue: vente.quantite_vendue,
          prix_vente_devise: vente.prix_vente_devise,
          date_vente: vente.date_vente,
          taux_change: vente.taux_change,
          frais_vente: vente.frais_vente || 0,
          devise: vente.devise || 'USD',
          plus_value_brute_devise: resultat.plusValueBrute,
          plus_value_eur: resultat.plusValueEUR,
          impot_calcule: resultat.impot,
          prelevements_sociaux: resultat.prelevementsSociaux,
          net_apres_impot: resultat.netApresImpot,
        };

        if ((vente as any).id) {
          venteData.id = (vente as any).id;
        }

        const { error } = await supabase
          .from('ventes_espp')
          .upsert(venteData);

        if (error) throw error;
      }

      await loadExistingData();
      toast.success('Ventes sauvegardées avec succès');
    } catch (error) {
      console.error('Error saving ventes:', error);
      toast.error('Erreur lors de la sauvegarde des ventes');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 'profil') {
      await saveProfile();
      setCurrentStep('plans');
    } else if (currentStep === 'plans') {
      if (plans.length > 0) {
        await savePlansAndLots();
      }
      setCurrentStep('ventes');
    } else if (currentStep === 'ventes') {
      await saveVentes();
      setCurrentStep('resultats');
    }
  };
  const handlePreviousStep = () => {
    if (currentStep === 'plans') setCurrentStep('profil');
    else if (currentStep === 'ventes') setCurrentStep('plans');
    else if (currentStep === 'resultats') setCurrentStep('ventes');
  };

  const handleFinish = () => {
    toast.success("Simulation terminée avec succès !");
    navigate('/employee');
  };

  const getProgress = () => {
    switch (currentStep) {
      case 'profil': return 25;
      case 'plans': return 50;
      case 'ventes': return 75;
      case 'resultats': return 100;
      default: return 0;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'profil': return 'Profil Fiscal';
      case 'plans': return 'Plans ESPP';
      case 'ventes': return 'Ventes';
      case 'resultats': return 'Résultats';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/employee')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl hero-gradient">Simulateur ESPP</h1>
              <p className="text-muted-foreground">Optimisez votre fiscalité sur les plans d'actionnariat salarié</p>
            </div>
          </div>

          {/* Barre de progression */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{getStepTitle()}</span>
                <span>{getProgress()}%</span>
              </div>
              <Progress value={getProgress()} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className={currentStep === 'profil' ? 'text-primary font-semibold' : ''}>Profil</span>
                <span className={currentStep === 'plans' ? 'text-primary font-semibold' : ''}>Plans</span>
                <span className={currentStep === 'ventes' ? 'text-primary font-semibold' : ''}>Ventes</span>
                <span className={currentStep === 'resultats' ? 'text-primary font-semibold' : ''}>Résultats</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Contenu des étapes */}
        {currentStep === 'profil' && (
          <ProfilFiscalStep
            profile={profile}
            onUpdate={setProfile}
            onNext={handleNextStep}
          />
        )}

        {currentStep === 'plans' && (
          <PlanESPPStep
            plans={plans}
            existingPlans={existingPlans}
            onUpdate={setPlans}
            onDelete={deletePlan}
            onSelectPlan={selectPlan}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
          />
        )}

        {currentStep === 'ventes' && (
          <VentesStep
            ventes={ventes}
            lots={lots}
            profile={profile as UserFiscalProfile}
            onUpdate={setVentes}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
          />
        )}

        {currentStep === 'resultats' && (
          <ResultatsStep
            lots={lots}
            ventes={ventes as any}
            profile={profile as UserFiscalProfile}
            onPrevious={handlePreviousStep}
            onFinish={handleFinish}
          />
        )}
      </div>
    </div>
  );
};

export default SimulateurESPP;
