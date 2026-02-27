/**
 * Page Simulateur ESPP v2
 * 4 écrans : Intro → Dashboard → Éditeur de période → TMI → Résultats
 * Architecture alignée sur le simulateur RSU
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { SimulatorHeader } from '@/components/simulators/SimulatorHeader';
import { SimulatorDisclaimer } from '@/components/simulators/SimulatorDisclaimer';
import { SimulationValidationOverlay } from '@/components/simulators/SimulationValidationOverlay';
import { SaveSimulationDialog } from '@/components/simulators/SaveSimulationDialog';
import {
  ESPPIntroScreen,
  ESPPPeriodsDashboard,
  ESPPPeriodEditor,
  ESPPTMIScreen,
  ESPPResults,
} from '@/components/simulators/espp';
import { calculateESPPSimulation } from '@/utils/esppCalculations';
import { useUnifiedSimulationSave } from '@/hooks/useUnifiedSimulationSave';
import { useSimulationDefaults } from '@/contexts/GlobalSettingsContext';
import type { ESPPPeriod, ESPPSimulationResult } from '@/types/esppNew';

type Screen = 'intro' | 'dashboard' | 'editor' | 'tmi' | 'results';

const SimulateurESPP = () => {
  const navigate = useNavigate();
  const { default_tmi, isLoading: settingsLoading } = useSimulationDefaults();

  const [screen, setScreen] = useState<Screen>('intro');
  const [periods, setPeriods] = useState<ESPPPeriod[]>([]);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [tmi, setTmi] = useState(30);
  const [result, setResult] = useState<ESPPSimulationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Sync TMI depuis les settings globaux
  useEffect(() => {
    if (!settingsLoading && default_tmi) {
      setTmi(prev => prev === 30 ? default_tmi : prev);
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
    type: 'espp',
    queryCacheKey: ['simulations', 'espp_simulations'],
  });

  const handleSave = useCallback(() => {
    if (!result) return;
    saveSimulation({
      periodes: periods.map(p => ({ ...p })),
      tmi,
      result: {
        gain_brut_total: result.gain_brut_total,
        total_impots: result.total_impots,
        gain_net_total: result.gain_net_total,
        taux_effectif: result.taux_effectif,
        rabais_brut_total: result.rabais_brut_total,
        pv_brute_total: result.pv_brute_total,
      },
    });
  }, [result, periods, tmi, saveSimulation]);

  // Navigation
  const handleBack = useCallback(() => {
    switch (screen) {
      case 'editor': setScreen('dashboard'); setEditingPeriodId(null); break;
      case 'tmi': setScreen('dashboard'); break;
      case 'results': setScreen('tmi'); break;
      case 'dashboard': navigate(-1); break;
      default: navigate(-1);
    }
  }, [screen, navigate]);

  const screenTitle = {
    intro: 'Simulateur ESPP',
    dashboard: 'Simulateur ESPP',
    editor: editingPeriodId ? 'Modifier la période' : 'Nouvelle période',
    tmi: 'Paramètres fiscaux',
    results: 'Résultats',
  }[screen];

  // Period CRUD
  const handleAddPeriod = useCallback(() => {
    setEditingPeriodId(null);
    setScreen('editor');
  }, []);

  const handleEditPeriod = useCallback((id: string) => {
    setEditingPeriodId(id);
    setScreen('editor');
  }, []);

  const handleDeletePeriod = useCallback((id: string) => {
    setPeriods(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleSavePeriod = useCallback((period: ESPPPeriod) => {
    setPeriods(prev => {
      const existing = prev.findIndex(p => p.id === period.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = period;
        return updated;
      }
      return [...prev, period];
    });
    setEditingPeriodId(null);
    setScreen('dashboard');
  }, []);

  // Simulation
  const handleSimulate = useCallback(() => {
    const simResult = calculateESPPSimulation(periods, tmi);
    setResult(simResult);
    setIsValidating(true);
  }, [periods, tmi]);

  const handleValidationComplete = useCallback(() => {
    setIsValidating(false);
    setScreen('results');
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setScreen('dashboard');
  }, []);

  const editingPeriod = editingPeriodId ? periods.find(p => p.id === editingPeriodId) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        {screen !== 'intro' && (
          <SimulatorHeader
            title={screenTitle}
            description={screen === 'dashboard' ? "Simulez l'impact fiscal de vos plans d'achat d'actions" : undefined}
            onBack={handleBack}
            backLabel={screen === 'results' ? 'Modifier les paramètres' : 'Retour'}
            onViewSimulations={screen === 'dashboard' ? () => navigate('/employee/simulations') : undefined}
          />
        )}

        <AnimatePresence mode="wait">
          {screen === 'intro' && (
            <ESPPIntroScreen key="intro" onStart={() => setScreen('dashboard')} />
          )}

          {screen === 'dashboard' && (
            <ESPPPeriodsDashboard
              key="dashboard"
              periods={periods}
              onAddPeriod={handleAddPeriod}
              onEditPeriod={handleEditPeriod}
              onDeletePeriod={handleDeletePeriod}
              onSimulate={() => setScreen('tmi')}
            />
          )}

          {screen === 'editor' && (
            <ESPPPeriodEditor
              key="editor"
              period={editingPeriod}
              onSave={handleSavePeriod}
              onCancel={() => { setEditingPeriodId(null); setScreen('dashboard'); }}
            />
          )}

          {screen === 'tmi' && (
            <ESPPTMIScreen
              key="tmi"
              tmi={tmi}
              onChangeTmi={setTmi}
              onSimulate={handleSimulate}
              onBack={() => setScreen('dashboard')}
            />
          )}

          {screen === 'results' && result && (
            <ESPPResults
              key="results"
              result={result}
              tmi={tmi}
              onReset={handleReset}
              onSave={() => openSaveDialog()}
            />
          )}
        </AnimatePresence>

        <SimulationValidationOverlay
          isValidating={isValidating}
          onComplete={handleValidationComplete}
          simulatorName="Simulateur ESPP"
          simulatorId="espp"
        />

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

export default SimulateurESPP;
