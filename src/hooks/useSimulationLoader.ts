import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseSimulationLoaderOptions {
  onDataLoaded?: (data: Record<string, unknown>, name: string | null) => void;
}

interface UseSimulationLoaderReturn {
  simulationId: string | null;
  isLoadingSimulation: boolean;
  loadedSimulationName: string | null;
  simulationData: Record<string, unknown> | null;
  isFromHistory: boolean;
}

/**
 * Hook unifié pour charger une simulation depuis l'URL (?sim=xxx) ou location.state
 * 
 * Priorités de chargement:
 * 1. location.state.simulationData (données passées directement, le plus rapide)
 * 2. Fetch depuis Supabase via ?sim=xxx (si pas de state)
 */
export function useSimulationLoader(options: UseSimulationLoaderOptions = {}): UseSimulationLoaderReturn {
  const { onDataLoaded } = options;
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { toast } = useToast();

  const simulationId = searchParams.get('sim');
  const [isLoadingSimulation, setIsLoadingSimulation] = useState(!!simulationId || !!location.state?.simulationData);
  const [loadedSimulationName, setLoadedSimulationName] = useState<string | null>(null);
  const [simulationData, setSimulationData] = useState<Record<string, unknown> | null>(null);
  const [isFromHistory, setIsFromHistory] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Use a ref to avoid re-running the effect when callback changes
  const onDataLoadedRef = useRef(onDataLoaded);
  onDataLoadedRef.current = onDataLoaded;

  useEffect(() => {
    // Skip if already loaded to prevent infinite loops
    if (hasLoaded) return;

    const loadSimulation = async () => {
      // Priorité 1: données passées via location.state (plus rapide, depuis le tableau historique)
      if (location.state?.simulationData) {
        const data = location.state.simulationData as Record<string, unknown>;
        const name = location.state.simulationName as string | null;
        
        setSimulationData(data);
        setLoadedSimulationName(name || 'Simulation chargée');
        setIsFromHistory(true);
        setIsLoadingSimulation(false);
        setHasLoaded(true);
        
        onDataLoadedRef.current?.(data, name);
        return;
      }

      // Priorité 2: charger depuis Supabase si on a un ID dans l'URL
      if (!simulationId) {
        setIsLoadingSimulation(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('simulations')
          .select('*')
          .eq('id', simulationId)
          .single();

        if (error) throw error;

        if (data && data.data) {
          const simData = data.data as Record<string, unknown>;
          const name = data.name || null;
          
          setSimulationData(simData);
          setLoadedSimulationName(name || 'Simulation chargée');
          setIsFromHistory(true);
          setHasLoaded(true);
          
          onDataLoadedRef.current?.(simData, name);
        }
      } catch (error) {
        console.error('Erreur chargement simulation:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger la simulation",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSimulation(false);
      }
    };

    loadSimulation();
  }, [simulationId, location.state, toast, hasLoaded]);

  return {
    simulationId,
    isLoadingSimulation,
    loadedSimulationName,
    simulationData,
    isFromHistory,
  };
}
