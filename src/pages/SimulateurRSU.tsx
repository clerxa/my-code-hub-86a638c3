/**
 * Page Mes Plans RSU — Agrégateur de plans d'actionnariat salarié
 * 5 écrans : Dashboard → Éditeur de plan → Paramètres cession → Résultats → Simulations sauvegardées
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Scale, Receipt, BarChart3, Sparkles } from 'lucide-react';
import { SimulatorHeader } from '@/components/simulators/SimulatorHeader';
import { SimulatorDisclaimer } from '@/components/simulators/SimulatorDisclaimer';
import { SimulationValidationOverlay } from '@/components/simulators/SimulationValidationOverlay';
import type { ValidationStep } from '@/components/simulators/SimulationValidationOverlay';
import { RSUPlansDashboard, RSUPlanEditor, RSUCessionParams, RSUResults, RSUIntroScreen } from '@/components/simulators/rsu';
import { RSUSavedSimulations } from '@/components/simulators/rsu/RSUSavedSimulations';
import { calculateRSUSimulation } from '@/utils/rsuCalculations';
import { useSimulationDefaults } from '@/contexts/GlobalSettingsContext';
import { Header } from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  useRSUPlans,
  savePlanToDb,
  deletePlanFromDb,
  saveSimulationToDb,
} from '@/hooks/useRSUPersistence';
import type { RSUPlan, RSUCessionParams as CessionParamsType, RSUSimulationResult } from '@/types/rsu';

const RSU_VALIDATION_STEPS: ValidationStep[] = [
  { icon: Receipt, text: "Identification du régime fiscal applicable...", duration: 900 },
  { icon: Scale, text: "Calcul du gain d'acquisition et de la plus-value de cession...", duration: 1100 },
  { icon: BarChart3, text: "Application des tranches IR, PS et contribution salariale...", duration: 1000 },
  { icon: Sparkles, text: "Consolidation et optimisation des résultats...", duration: 700 },
];

type Screen = 'intro' | 'dashboard' | 'editor' | 'cession' | 'results' | 'saved';

const SimulateurRSU = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loadSimId = searchParams.get('load');
  const { default_tmi, isLoading: settingsLoading } = useSimulationDefaults();

  const introSeen = useRef(false);
  const [screen, setScreen] = useState<Screen>(loadSimId ? 'dashboard' : 'intro');
  const { plans, setPlans, isLoading: isLoadingPlans, reload: reloadPlans } = useRSUPlans();
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [simulatingPlanId, setSimulatingPlanId] = useState<string | null>(null);
  const [cessionParams, setCessionParams] = useState<CessionParamsType>({
    mode: 'simple',
    prix_vente: 0,
    taux_change_vente: 1,
    tmi: 30,
    date_cession: new Date().toISOString().split('T')[0],
  });
  const [result, setResult] = useState<RSUSimulationResult | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [pendingResult, setPendingResult] = useState<RSUSimulationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-show dashboard if plans exist after loading
  useEffect(() => {
    if (!isLoadingPlans && plans.length > 0 && screen === 'intro') {
      introSeen.current = true;
      setScreen('dashboard');
    }
  }, [isLoadingPlans, plans.length, screen]);

  // TMI defaults
  useEffect(() => {
    if (!settingsLoading && default_tmi) {
      setCessionParams(prev => prev.tmi === 30 ? { ...prev, tmi: default_tmi } : prev);
    }
  }, [settingsLoading, default_tmi]);

  // Navigation
  const backTarget = '/employee/vega';
  const handleBack = useCallback(() => {
    switch (screen) {
      case 'editor': setScreen('dashboard'); setEditingPlanId(null); break;
      case 'cession': setSimulatingPlanId(null); setScreen('dashboard'); break;
      case 'results': setScreen('cession'); break;
      case 'saved': setScreen('dashboard'); break;
      case 'dashboard': navigate(backTarget); break;
      default: navigate(backTarget);
    }
  }, [screen, navigate, backTarget]);

  const handleIntroComplete = useCallback(() => {
    introSeen.current = true;
    setScreen('dashboard');
  }, []);

  const screenTitle = {
    intro: 'Mes plans RSU',
    dashboard: 'Mes plans RSU',
    editor: editingPlanId ? 'Modifier le plan' : 'Nouveau plan',
    cession: 'Paramètres de cession',
    results: 'Résultats',
    saved: 'Mes simulations sauvegardées',
  }[screen];

  // Plan CRUD
  const handleAddPlan = useCallback(() => {
    setEditingPlanId(null);
    setScreen('editor');
  }, []);

  const handleEditPlan = useCallback((id: string) => {
    setEditingPlanId(id);
    setScreen('editor');
  }, []);

  const handleDeletePlan = useCallback(async (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
    const success = await deletePlanFromDb(id);
    if (!success) {
      toast.error('Erreur lors de la suppression');
      reloadPlans();
    }
  }, [setPlans, reloadPlans]);

  const handleSavePlan = useCallback(async (plan: RSUPlan) => {
    setPlans(prev => {
      const existing = prev.findIndex(p => p.id === plan.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = plan;
        return updated;
      }
      return [...prev, plan];
    });
    setEditingPlanId(null);
    setScreen('dashboard');

    // Persist to dedicated tables
    await savePlanToDb(plan);
  }, [setPlans]);

  // Simulation
  const simulatingPlans = simulatingPlanId ? plans.filter(p => p.id === simulatingPlanId) : plans;

  const handleSimulate = useCallback(() => {
    const simResult = calculateRSUSimulation(simulatingPlans, cessionParams);
    setPendingResult(simResult);
    setShowValidation(true);
  }, [simulatingPlans, cessionParams]);

  const handleValidationComplete = useCallback(() => {
    setShowValidation(false);
    if (pendingResult) {
      setResult(pendingResult);
      setPendingResult(null);
      setScreen('results');
    }
  }, [pendingResult]);

  const handleReset = useCallback(() => {
    setResult(null);
    setSimulatingPlanId(null);
    setScreen('dashboard');
  }, []);

  // Save simulation to dedicated tables
  const handleSaveSimulation = useCallback(async () => {
    if (!result) return;
    setIsSaving(true);
    const now = new Date();
    const datePart = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const nom = `Simulation RSU — ${datePart}`;

    const simId = await saveSimulationToDb(nom, simulatingPlans, cessionParams);
    setIsSaving(false);

    if (simId) {
      toast.success('Simulation sauvegardée avec succès');
    } else {
      toast.error('Erreur lors de la sauvegarde');
    }
  }, [result, simulatingPlans, cessionParams]);

  // Load a saved simulation
  const handleLoadSimulation = useCallback((loadedPlans: RSUPlan[], loadedParams: CessionParamsType) => {
    setPlans(loadedPlans);
    setCessionParams(loadedParams);
    setSimulatingPlanId(null);

    // Auto-compute results
    const simResult = calculateRSUSimulation(loadedPlans, loadedParams);
    setResult(simResult);
    setScreen('results');
  }, [setPlans]);

  const editingPlan = editingPlanId ? plans.find(p => p.id === editingPlanId) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto w-full max-w-[1680px] px-4 py-8 pb-24 lg:px-6 2xl:px-8">
        {screen !== 'intro' && (
          <SimulatorHeader
            title={screenTitle}
            description={screen === 'dashboard' ? 'Gérez vos plans RSU et simulez l\'impact fiscal de la cession de vos actions' : undefined}
            onBack={handleBack}
            backLabel={
              screen === 'results' ? 'Modifier les paramètres'
              : screen === 'saved' ? 'Retour au dashboard'
              : 'Retour à VEGA'
            }
          />
        )}

        {isLoadingPlans && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {!isLoadingPlans && screen === 'intro' && (
            <RSUIntroScreen key="intro" onStart={handleIntroComplete} />
          )}

          {screen === 'dashboard' && (
            <RSUPlansDashboard
              key="dashboard"
              plans={plans}
              onAddPlan={handleAddPlan}
              onEditPlan={handleEditPlan}
              onDeletePlan={handleDeletePlan}
              onSimulate={() => setScreen('cession')}
              onSimulatePlan={(id) => { setSimulatingPlanId(id); setScreen('cession'); }}
              onViewSavedSimulations={() => setScreen('saved')}
            />
          )}

          {screen === 'editor' && (
            <RSUPlanEditor
              key="editor"
              plan={editingPlan}
              onSave={handleSavePlan}
              onCancel={() => { setEditingPlanId(null); setScreen('dashboard'); }}
            />
          )}

          {screen === 'cession' && (
            <RSUCessionParams
              key="cession"
              plans={simulatingPlans}
              params={cessionParams}
              onChange={setCessionParams}
              onSimulate={handleSimulate}
              onBack={() => { setSimulatingPlanId(null); setScreen('dashboard'); }}
            />
          )}

          {screen === 'results' && result && (
            <RSUResults
              key="results"
              result={result}
              onReset={handleReset}
              onSave={handleSaveSimulation}
              isSaving={isSaving}
              cessionParams={cessionParams}
              plansSource={simulatingPlans}
            />
          )}

          {screen === 'saved' && (
            <RSUSavedSimulations
              key="saved"
              onLoad={handleLoadSimulation}
              onBack={() => setScreen('dashboard')}
            />
          )}
        </AnimatePresence>

        <SimulationValidationOverlay
          isValidating={showValidation}
          onComplete={handleValidationComplete}
          simulatorName="Mes plans RSU"
          simulatorId="rsu-cession"
          steps={RSU_VALIDATION_STEPS}
        />

        <div className="mt-8">
          <SimulatorDisclaimer />
        </div>
      </div>
    </div>
  );
};

export default SimulateurRSU;
