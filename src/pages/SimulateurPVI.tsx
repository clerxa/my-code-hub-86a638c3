/**
 * Page Simulateur Plus-Value Immobilière (PVI)
 * Flux vertical : Formulaire → Résultats
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { PVIInputForm, PVIResultsSection, PVIReportChart } from '@/components/simulators/pvi';
import { usePVICalculations } from '@/hooks/usePVICalculations';
import { SaveSimulationDialog } from '@/components/simulators/SaveSimulationDialog';
import { useUnifiedSimulationSave } from '@/hooks/useUnifiedSimulationSave';
import { SimulatorHeader } from '@/components/simulators/SimulatorHeader';
import { SimulatorDisclaimer } from '@/components/simulators/SimulatorDisclaimer';
import { format } from 'date-fns';
import type { PVIFormInputs, PVICalculationResult } from '@/types/pvi';

const defaultFormData: PVIFormInputs = {
  nature_bien: 'residence_secondaire',
  date_acquisition: '',
  date_cession: '',
  prix_cession: 0,
  prix_acquisition: 0,
  mode_frais_acquisition: 'forfait',
  frais_acquisition_reel: 0,
  mode_travaux: 'reel',
  travaux_reel: 0,
};

const SimulateurPVI: React.FC = () => {
  const navigate = useNavigate();
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<PVIFormInputs>(defaultFormData);
  const [result, setResult] = useState<PVICalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [simulationName, setSimulationName] = useState(() => 
    `Plus-Value Immo - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`
  );
  
  const { calculerPVILocal, calculerPVIBackend } = usePVICalculations();
  const { saveSimulation, isSaving, showExpertPrompt, closeExpertPrompt } = useUnifiedSimulationSave({
    type: 'pvi',
    queryCacheKey: ['simulations', 'pvi_simulations'],
  });
  
  // Calcul de la durée de détention en temps réel
  const dureeDetention = useMemo(() => {
    if (!formData.date_acquisition || !formData.date_cession) return undefined;
    
    const acquisition = new Date(formData.date_acquisition);
    const cession = new Date(formData.date_cession);
    const diffMs = cession.getTime() - acquisition.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
  }, [formData.date_acquisition, formData.date_cession]);
  
  const handleFormChange = useCallback((updates: Partial<PVIFormInputs>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);
  
  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    
    try {
      // Utiliser le calcul backend pour la précision
      const calculatedResult = await calculerPVIBackend(formData);
      
      if (calculatedResult) {
        setResult(calculatedResult);
        setShowResults(true);
        
        // Scroll vers les résultats
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (error) {
      console.error('Erreur calcul PVI:', error);
      // Fallback sur calcul local
      const localResult = calculerPVILocal(formData);
      if (localResult) {
        setResult(localResult);
        setShowResults(true);
      }
    } finally {
      setIsCalculating(false);
    }
  }, [formData, calculerPVIBackend, calculerPVILocal]);
  
  const handleBack = useCallback(() => {
    navigate('/employee/simulations');
  }, [navigate]);
  
  const handleSave = useCallback(async () => {
    if (!result || !simulationName.trim()) return;
    
    await saveSimulation({
      name: simulationName,
      data: {
        ...formData,
        ...result
      }
    });
    
    setSaveDialogOpen(false);
    navigate('/employee/simulations?tab=historique');
  }, [result, formData, simulationName, saveSimulation, navigate]);
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8 pb-24">
        <SimulatorHeader
          title="Plus-Value Immobilière"
          description="Calculez l'impôt sur la plus-value de votre bien immobilier"
           onBack={handleBack}
          onViewSimulations={() => navigate('/employee/simulations')}
        />
        
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PVIInputForm
                formData={formData}
                onFormChange={handleFormChange}
                onSubmit={handleCalculate}
                isCalculating={isCalculating}
                dureeDetention={dureeDetention}
              />
            </motion.div>
          ) : result && (
            <motion.div
              key="results"
              ref={resultsRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <PVIResultsSection result={result} prixCession={formData.prix_cession} />
              <PVIReportChart result={result} />
              
              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 pb-20 relative z-10">
                <Button
                  onClick={() => setSaveDialogOpen(true)}
                  className="flex-1"
                  size="lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer ma simulation
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <SimulatorDisclaimer />
      </div>
      
      <SaveSimulationDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
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

export default SimulateurPVI;
