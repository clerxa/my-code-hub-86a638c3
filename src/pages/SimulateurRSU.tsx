/**
 * Page Mes Plans RSU — Agrégateur de plans d'actionnariat salarié
 * 4 écrans : Dashboard → Éditeur de plan → Paramètres cession → Résultats
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Scale, Receipt, BarChart3, Sparkles } from 'lucide-react';
import { SimulatorHeader } from '@/components/simulators/SimulatorHeader';
import { SimulatorDisclaimer } from '@/components/simulators/SimulatorDisclaimer';
import { SaveSimulationDialog } from '@/components/simulators/SaveSimulationDialog';
import { SimulationValidationOverlay } from '@/components/simulators/SimulationValidationOverlay';
import type { ValidationStep } from '@/components/simulators/SimulationValidationOverlay';
import { RSUPlansDashboard, RSUPlanEditor, RSUCessionParams, RSUResults, RSUIntroScreen } from '@/components/simulators/rsu';
import { calculateRSUSimulation } from '@/utils/rsuCalculations';
import { useUnifiedSimulationSave } from '@/hooks/useUnifiedSimulationSave';
import { useSimulationDefaults } from '@/contexts/GlobalSettingsContext';
import { Header } from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { RSUPlan, RSUCessionParams as CessionParamsType, RSUSimulationResult } from '@/types/rsu';

const RSU_VALIDATION_STEPS: ValidationStep[] = [
  { icon: Receipt, text: "Identification du régime fiscal applicable...", duration: 900 },
  { icon: Scale, text: "Calcul du gain d'acquisition et de la plus-value de cession...", duration: 1100 },
  { icon: BarChart3, text: "Application des tranches IR, PS et contribution salariale...", duration: 1000 },
  { icon: Sparkles, text: "Consolidation et optimisation des résultats...", duration: 700 },
];

type Screen = 'intro' | 'dashboard' | 'editor' | 'cession' | 'results';

const SimulateurRSU = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loadSimId = searchParams.get('load');
  const { default_tmi, isLoading: settingsLoading } = useSimulationDefaults();

  const introSeen = useRef(false);
  const [screen, setScreen] = useState<Screen>(loadSimId ? 'dashboard' : 'intro');
  const [plans, setPlans] = useState<RSUPlan[]>([]);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [simulatingPlanId, setSimulatingPlanId] = useState<string | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [cessionParams, setCessionParams] = useState<CessionParamsType>({
    prix_vente: 0,
    taux_change_vente: 1,
    tmi: 30,
    date_cession: new Date().toISOString().split('T')[0],
  });
  const [result, setResult] = useState<RSUSimulationResult | null>(null);
  const [loadedSimId, setLoadedSimId] = useState<string | null>(null);

  // Load ALL saved RSU plans from the simulations table
  useEffect(() => {
    const loadAllPlans = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsLoadingPlans(false); return; }

        const { data: sims, error } = await supabase
          .from('simulations')
          .select('id, data, name, created_at')
          .eq('user_id', user.id)
          .eq('type', 'rsu')
          .order('created_at', { ascending: false });

        if (error || !sims) { setIsLoadingPlans(false); return; }

        // Extract all plans from all saved simulations
        const allPlans: RSUPlan[] = [];
        const seenPlanIds = new Set<string>();
        for (const sim of sims) {
          const simData = sim.data as any;
          if (Array.isArray(simData?.plans)) {
            for (const plan of simData.plans) {
              if (plan.id && !seenPlanIds.has(plan.id)) {
                seenPlanIds.add(plan.id);
                allPlans.push(plan);
              }
            }
          }
        }

        if (allPlans.length > 0) {
          setPlans(allPlans);
          introSeen.current = true;
          setScreen('dashboard');
        }
      } catch (e) {
        console.error('Failed to load RSU plans:', e);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    // If loading a specific sim, use that logic instead
    if (loadSimId) {
      const loadSavedSim = async () => {
        try {
          const { data, error } = await supabase
            .from('simulations')
            .select('data')
            .eq('id', loadSimId)
            .maybeSingle();
          if (error || !data?.data) { setIsLoadingPlans(false); return; }
          const simData = data.data as any;
          if (Array.isArray(simData.plans)) {
            setPlans(simData.plans);
            if (simData.cession_params) {
              setCessionParams(prev => ({ ...prev, ...simData.cession_params }));
            }
            introSeen.current = true;
            setScreen('dashboard');
          }
          setLoadedSimId(loadSimId);
        } catch (e) {
          console.error('Failed to load simulation:', e);
        } finally {
          setIsLoadingPlans(false);
        }
      };
      loadSavedSim();
    } else {
      loadAllPlans();
    }
  }, [loadSimId]);

  // Mettre à jour le TMI par défaut quand les settings sont chargés
  useEffect(() => {
    if (!settingsLoading && default_tmi) {
      setCessionParams(prev => prev.tmi === 30 ? { ...prev, tmi: default_tmi } : prev);
    }
  }, [settingsLoading, default_tmi]);

  // Sauvegarde unifiée
  const {
    showSaveDialog,
    openSaveDialog,
    closeSaveDialog,
    simulationName,
    setSimulationName,
    saveSimulation,
    isSaving,
    showExpertPrompt,
    closeExpertPrompt,
  } = useUnifiedSimulationSave({
    type: 'rsu',
    queryCacheKey: ['simulations', 'rsu_simulations'],
  });

  const handleSave = useCallback(() => {
    if (!result) return;
    saveSimulation({
      plans: plans.map(p => ({
        ...p,
        vestings: p.vestings.map(v => ({ ...v })),
      })),
      cession_params: { ...cessionParams },
      result: {
        gain_brut_total: result.gain_brut_total,
        total_impots: result.total_impots,
        gain_net_total: result.gain_net_total,
        taux_effectif: result.taux_effectif,
        seuil_300k_applique: result.seuil_300k_applique,
        total_ir: result.total_ir,
        total_ps: result.total_ps,
        total_contribution_salariale: result.total_contribution_salariale,
        total_csg_crds: result.total_csg_crds,
      },
    });
  }, [result, plans, cessionParams, saveSimulation]);

  // Navigation handlers
  const backTarget = '/employee/vega';
  const handleBack = useCallback(() => {
    switch (screen) {
      case 'editor': setScreen('dashboard'); setEditingPlanId(null); break;
      case 'cession': setSimulatingPlanId(null); setScreen('dashboard'); break;
      case 'results': setScreen('cession'); break;
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

  const handleDeletePlan = useCallback((id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleSavePlan = useCallback((plan: RSUPlan) => {
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
  }, []);

  // Simulation — only the selected plan
  const simulatingPlans = simulatingPlanId ? plans.filter(p => p.id === simulatingPlanId) : plans;

  const handleSimulate = useCallback(() => {
    const simResult = calculateRSUSimulation(simulatingPlans, cessionParams);
    setResult(simResult);
    setScreen('results');
  }, [simulatingPlans, cessionParams]);

  const handleReset = useCallback(() => {
    setResult(null);
    setSimulatingPlanId(null);
    setScreen('dashboard');
  }, []);

  const editingPlan = editingPlanId ? plans.find(p => p.id === editingPlanId) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        {screen !== 'intro' && (
          <SimulatorHeader
            title={screenTitle}
            description={screen === 'dashboard' ? 'Gérez vos plans RSU et simulez l\'impact fiscal de la cession de vos actions' : undefined}
            onBack={handleBack}
            backLabel={screen === 'results' ? 'Modifier les paramètres' : 'Retour à VEGA'}
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
              onSave={() => openSaveDialog()}
            />
          )}
        </AnimatePresence>

        <div className="mt-8">
          <SimulatorDisclaimer />
        </div>
      </div>

      <SaveSimulationDialog
        open={showSaveDialog}
        onOpenChange={closeSaveDialog}
        simulationName={simulationName}
        onSimulationNameChange={setSimulationName}
        onSave={handleSave}
        isSaving={isSaving}
        showExpertPrompt={showExpertPrompt}
        onCloseExpertPrompt={closeExpertPrompt}
      />
    </div>
  );
};

export default SimulateurRSU;
