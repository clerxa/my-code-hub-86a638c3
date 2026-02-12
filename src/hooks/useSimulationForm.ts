import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface UseSimulationFormOptions<T> {
  /**
   * Nom du simulateur (pour le logging et debug)
   */
  simulatorName: string;
  
  /**
   * Valeurs par défaut du formulaire
   */
  defaultValues: T;
  
  /**
   * Fonction pour charger les données depuis le profil utilisateur
   * Retourne les valeurs à fusionner avec defaultValues
   */
  loadFromProfile?: () => Promise<Partial<T>>;
  
  /**
   * Fonction pour charger les données depuis une simulation existante (via location.state)
   * Retourne les valeurs à fusionner avec defaultValues
   */
  loadFromSimulation?: (simulation: any) => Partial<T>;
}

interface UseSimulationFormReturn<T> {
  /**
   * Valeurs actuelles du formulaire
   */
  values: T;
  
  /**
   * Mettre à jour une ou plusieurs valeurs
   */
  setValues: (updates: Partial<T> | ((prev: T) => Partial<T>)) => void;
  
  /**
   * Mettre à jour une valeur spécifique
   */
  setValue: <K extends keyof T>(key: K, value: T[K]) => void;
  
  /**
   * Réinitialiser le formulaire aux valeurs par défaut
   */
  reset: () => void;
  
  /**
   * État de chargement initial
   */
  loading: boolean;
  
  /**
   * Erreur lors du chargement
   */
  error: Error | null;
}

/**
 * Hook pour gérer l'état d'un formulaire de simulation avec chargement automatique
 * depuis le profil utilisateur ou une simulation existante
 * 
 * @example
 * ```tsx
 * const { values, setValue, loading } = useSimulationForm({
 *   simulatorName: 'PER',
 *   defaultValues: { revenuFiscal: 0, age: 35 },
 *   loadFromProfile: async () => {
 *     const profile = await fetchProfile();
 *     return { revenuFiscal: profile.income };
 *   }
 * });
 * ```
 */
export function useSimulationForm<T extends Record<string, any>>({
  simulatorName,
  defaultValues,
  loadFromProfile,
  loadFromSimulation,
}: UseSimulationFormOptions<T>): UseSimulationFormReturn<T> {
  const location = useLocation();
  const [values, setValuesState] = useState<T>(defaultValues);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const setValues = useCallback((updates: Partial<T> | ((prev: T) => Partial<T>)) => {
    setValuesState((prev) => {
      const newValues = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...newValues };
    });
  }, []);

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValuesState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setValuesState(defaultValues);
  }, [defaultValues]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Charger depuis simulation existante (prioritaire)
        const simulationFromState = location.state?.simulation;
        if (simulationFromState && loadFromSimulation) {
          console.log(`[${simulatorName}] Chargement depuis simulation existante`, simulationFromState);
          const loaded = loadFromSimulation(simulationFromState);
          setValuesState((prev) => ({ ...prev, ...loaded }));
          return;
        }

        // 2. Charger depuis profil utilisateur
        if (loadFromProfile) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            console.log(`[${simulatorName}] Chargement depuis profil utilisateur`);
            const loaded = await loadFromProfile();
            setValuesState((prev) => ({ ...prev, ...loaded }));
          }
        }
      } catch (err) {
        console.error(`[${simulatorName}] Erreur lors du chargement:`, err);
        setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [simulatorName, location.state, loadFromProfile, loadFromSimulation]);

  return {
    values,
    setValues,
    setValue,
    reset,
    loading,
    error,
  };
}
