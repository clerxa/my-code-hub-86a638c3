/**
 * Page Simulateur RSU Multi-Plans
 * 4 écrans : Dashboard → Éditeur de plan → Paramètres cession → Résultats
 */

import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { SimulatorHeader } from '@/components/simulators/SimulatorHeader';
import { SimulatorDisclaimer } from '@/components/simulators/SimulatorDisclaimer';
import { RSUPlansDashboard, RSUPlanEditor, RSUCessionParams, RSUResults, RSUIntroScreen } from '@/components/simulators/rsu';
import { calculateRSUSimulation } from '@/utils/rsuCalculations';
import type { RSUPlan, RSUCessionParams as CessionParamsType, RSUSimulationResult } from '@/types/rsu';

type Screen = 'intro' | 'dashboard' | 'editor' | 'cession' | 'results';

const SimulateurRSU = () => {
  const navigate = useNavigate();

  const introSeen = useRef(false);
  const [screen, setScreen] = useState<Screen>('intro');
  const [plans, setPlans] = useState<RSUPlan[]>([]);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [cessionParams, setCessionParams] = useState<CessionParamsType>({
    prix_vente: 0,
    taux_change_vente: 1,
    tmi: 30,
    annee_cession: new Date().getFullYear(),
  });
  const [result, setResult] = useState<RSUSimulationResult | null>(null);

  // Navigation handlers
  const handleBack = useCallback(() => {
    switch (screen) {
      case 'editor': setScreen('dashboard'); setEditingPlanId(null); break;
      case 'cession': setScreen('dashboard'); break;
      case 'results': setScreen('cession'); break;
      case 'dashboard': navigate(-1); break;
      default: navigate(-1);
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
      <div className="container max-w-4xl mx-auto px-4 py-8 pb-24">
        {screen !== 'intro' && (
          <SimulatorHeader
            title={screenTitle}
            description={screen === 'dashboard' ? 'Simulez l\'impact fiscal de la cession de vos RSU multi-plans' : undefined}
            onBack={handleBack}
            backLabel={screen === 'results' ? 'Modifier les paramètres' : 'Retour'}
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
            />
          )}
        </AnimatePresence>

        <div className="mt-8">
          <SimulatorDisclaimer />
        </div>
      </div>
    </div>
  );
};

export default SimulateurRSU;
