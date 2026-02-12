import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { SimulationType } from '@/types/simulations';
import type { Json } from '@/integrations/supabase/types';

interface UseUnifiedSimulationSaveOptions {
  type: SimulationType;
  queryCacheKey?: string | string[];
  onSuccess?: () => void;
  /** Si true, redirige vers /employee/simulations?tab=historique après sauvegarde */
  redirectAfterSave?: boolean;
}

interface UseUnifiedSimulationSaveReturn {
  showSaveDialog: boolean;
  openSaveDialog: (defaultName?: string) => void;
  closeSaveDialog: () => void;
  simulationName: string;
  setSimulationName: (name: string) => void;
  saveSimulation: (data: Record<string, unknown>) => Promise<void>;
  isSaving: boolean;
}

/**
 * Hook unifié pour sauvegarder une simulation dans la table unique `simulations`
 */
export function useUnifiedSimulationSave({
  type,
  queryCacheKey,
  onSuccess,
  redirectAfterSave = true,
}: UseUnifiedSimulationSaveOptions): UseUnifiedSimulationSaveReturn {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [simulationName, setSimulationName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openSaveDialog = useCallback((defaultName?: string) => {
    if (defaultName) {
      setSimulationName(defaultName);
    }
    setShowSaveDialog(true);
  }, []);

  const closeSaveDialog = useCallback(() => {
    setShowSaveDialog(false);
    // Ne pas effacer le nom pour permettre de ré-ouvrir avec le même nom
  }, []);

  const saveSimulation = useCallback(async (data: Record<string, unknown>) => {
    console.log('[useUnifiedSimulationSave] saveSimulation appelé', { simulationName, type, dataKeys: Object.keys(data) });
    
    if (!simulationName.trim()) {
      console.warn('[useUnifiedSimulationSave] Nom vide, affichage toast erreur');
      toast({
        title: "Erreur",
        description: "Veuillez saisir un nom pour la simulation",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    console.log('[useUnifiedSimulationSave] isSaving = true');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[useUnifiedSimulationSave] User récupéré:', user?.id || 'NULL');
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Cast data to Json type for Supabase
      const jsonData = data as Json;

      console.log('[useUnifiedSimulationSave] INSERT dans simulations...', { user_id: user.id, type, name: simulationName });
      
      const { error } = await supabase
        .from('simulations')
        .insert({
          user_id: user.id,
          type,
          name: simulationName,
          data: jsonData,
        });

      if (error) {
        console.error('[useUnifiedSimulationSave] Erreur Supabase:', error);
        throw error;
      }

      console.log('[useUnifiedSimulationSave] INSERT réussi, affichage toast succès');
      toast({
        title: "Succès",
        description: "Simulation sauvegardée avec succès",
      });

      // Invalider le cache React Query
      if (queryCacheKey) {
        const keys: string[] = Array.isArray(queryCacheKey) ? queryCacheKey : [queryCacheKey];
        for (const key of keys) {
          await queryClient.invalidateQueries({ queryKey: [key] });
        }
      }
      // Toujours invalider le cache des simulations unifiées
      await queryClient.invalidateQueries({ queryKey: ['simulations'] });
      await queryClient.invalidateQueries({ queryKey: ['simulations-count'] });

      closeSaveDialog();
      onSuccess?.();
      
      // Redirection vers l'historique des simulations
      if (redirectAfterSave) {
        console.log('[useUnifiedSimulationSave] Redirection vers /employee/simulations?tab=historique');
        navigate('/employee/simulations?tab=historique');
      }
    } catch (error) {
      console.error('[useUnifiedSimulationSave] Catch error:', error);
      logger.supabaseError('simulations', 'insert', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde de la simulation",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      console.log('[useUnifiedSimulationSave] isSaving = false (finally)');
    }
  }, [simulationName, type, queryCacheKey, toast, queryClient, closeSaveDialog, onSuccess, navigate, redirectAfterSave]);

  return {
    showSaveDialog,
    openSaveDialog,
    closeSaveDialog,
    simulationName,
    setSimulationName,
    saveSimulation,
    isSaving,
  };
}
