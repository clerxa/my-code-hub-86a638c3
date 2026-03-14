/**
 * Page Simulateur RSU Multi-Plans
 * 4 écrans : Dashboard → Éditeur de plan → Paramètres cession → Résultats
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { SimulatorHeader } from '@/components/simulators/SimulatorHeader';
import { SimulatorDisclaimer } from '@/components/simulators/SimulatorDisclaimer';
import { SaveSimulationDialog } from '@/components/simulators/SaveSimulationDialog';
import { RSUPlansDashboard, RSUPlanEditor, RSUCessionParams, RSUResults, RSUIntroScreen } from '@/components/simulators/rsu';
import { calculateRSUSimulation } from '@/utils/rsuCalculations';
import { useUnifiedSimulationSave } from '@/hooks/useUnifiedSimulationSave';
import { useSimulationDefaults } from '@/contexts/GlobalSettingsContext';
import { Header } from '@/components/Header';
import type { RSUPlan, RSUCessionParams as CessionParamsType, RSUSimulationResult } from '@/types/rsu';

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
  const [cessionParams, setCessionParams] = useState<CessionParamsType>({
    prix_vente: 0,
    taux_change_vente: 1,
    tmi: 30,
    date_cession: new Date().toISOString().split('T')[0],
  });
  const [result, setResult] = useState<RSUSimulationResult | null>(null);
  const [loadedSimId, setLoadedSimId] = useState<string | null>(null);

  // Load saved simulation from URL param
  useEffect(() => {
    if (!loadSimId || loadedSimId === loadSimId) return;
    const loadSavedSim = async () => {
      try {
        const { data, error } = await (await import('@/integrations/supabase/client')).supabase
          .from('simulations')
          .select('data')
          .eq('id', loadSimId)
          .maybeSingle();
        if (error || !data?.data) return;
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
      }
    };
    loadSavedSim();
  }, [loadSimId, loadedSimId]);

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
  const handleBack = useCallback(() => {
    switch (screen) {
      case 'editor': setScreen('dashboard'); setEditingPlanId(null); break;
      case 'cession': setScreen('dashboard'); break;
      case 'results': setScreen('cession'); break;
      case 'dashboard': navigate('/employee/simulations'); break;
      default: navigate('/employee/simulations');
    }
  }, [screen, navigate]);

  const handleIntroComplete = useCallback(() => {
    introSeen.current = true;
    setScreen('dashboard');
  }, []);

  const screenTitle = {
    intro: 'Simulateur RSU',
    dashboard: 'Simulateur RSU',
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

  // Simulation
  const handleSimulate = useCallback(() => {
    const simResult = calculateRSUSimulation(plans, cessionParams);
    setResult(simResult);
    setScreen('results');
  }, [plans, cessionParams]);

  const handleReset = useCallback(() => {
    setResult(null);
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
            description={screen === 'dashboard' ? 'Simulez l\'impact fiscal de la cession de vos RSU multi-plans' : undefined}
            onBack={handleBack}
            backLabel={screen === 'results' ? 'Modifier les paramètres' : 'Retour aux simulateurs'}
            onViewSimulations={screen === 'dashboard' ? () => navigate('/employee/simulations') : undefined}
          />
        )}

        <AnimatePresence mode="wait">
          {screen === 'intro' && (
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
              plans={plans}
              params={cessionParams}
              onChange={setCessionParams}
              onSimulate={handleSimulate}
              onBack={() => setScreen('dashboard')}
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
