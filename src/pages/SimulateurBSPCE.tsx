import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Calculator } from 'lucide-react';
import { SimulatorHeader } from '@/components/simulators/SimulatorHeader';
import { SimulatorDisclaimer } from '@/components/simulators/SimulatorDisclaimer';
import { BSPCEIntroScreen, BSPCESimulationMode, BSPCEFiscalMode } from '@/components/simulators/bspce';
import { Header } from '@/components/Header';

type Screen = 'intro' | 'main';

const SimulateurBSPCE = () => {
  const navigate = useNavigate();
  const introSeen = useRef(false);
  const [screen, setScreen] = useState<Screen>('intro');
  const [activeTab, setActiveTab] = useState('simulation');

  const handleStart = () => {
    introSeen.current = true;
    setScreen('main');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <AnimatePresence mode="wait">
          {screen === 'intro' ? (
            <BSPCEIntroScreen key="intro" onStart={handleStart} />
          ) : (
            <div key="main" className="space-y-6">
              <SimulatorHeader
                title="Mes plans BSPCE"
                description="Bons de Souscription de Parts de Créateur d'Entreprise"
                onBack={() => navigate('/employee/vega')}
                backLabel="Retour à VEGA"
              />

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="simulation" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Je veux projeter mon gain</div>
                      <div className="text-[10px] text-muted-foreground hidden sm:block">Je n'ai pas encore exercé — je veux explorer différents scénarios</div>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="fiscal" className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Je veux calculer mon impôt</div>
                      <div className="text-[10px] text-muted-foreground hidden sm:block">J'ai exercé ou je vais exercer — je veux connaître mon gain net</div>
                    </div>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="simulation" className="mt-6">
                  <BSPCESimulationMode />
                </TabsContent>

                <TabsContent value="fiscal" className="mt-6">
                  <BSPCEFiscalMode />
                </TabsContent>
              </Tabs>

              <SimulatorDisclaimer />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SimulateurBSPCE;
