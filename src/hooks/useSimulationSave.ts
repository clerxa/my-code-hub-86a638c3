import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface UseSimulationSaveOptions {
  /**
   * Nom de la table Supabase où sauvegarder la simulation
   */
  tableName: string;
  
  /**
   * Clé de cache React Query à invalider après sauvegarde
   */
  queryCacheKey?: string | string[];
  
  /**
   * Callback appelé après une sauvegarde réussie
   */
  onSuccess?: () => void;
}

interface UseSimulationSaveReturn {
  /**
   * État du dialog de sauvegarde
   */
  showSaveDialog: boolean;
  
  /**
   * Ouvrir le dialog de sauvegarde
   */
  openSaveDialog: () => void;
  
  /**
   * Fermer le dialog de sauvegarde
   */
  closeSaveDialog: () => void;
  
  /**
   * Nom de la simulation
   */
  simulationName: string;
  
  /**
   * Mettre à jour le nom de la simulation
   */
  setSimulationName: (name: string) => void;
  
  /**
   * Sauvegarder la simulation
   */
  saveSimulation: (data: Record<string, any>) => Promise<void>;
  
  /**
   * État de sauvegarde en cours
   */
  isSaving: boolean;
}

/**
 * Hook pour gérer la sauvegarde d'une simulation avec dialog et gestion d'état
 * 
 * @example
 * ```tsx
 * const { showSaveDialog, openSaveDialog, closeSaveDialog, saveSimulation, simulationName, setSimulationName } = useSimulationSave({
 *   tableName: 'per_simulations',
 *   queryCacheKey: 'per-simulations',
 * });
 * 
 * // Ouvrir le dialog
 * <Button onClick={openSaveDialog}>Sauvegarder</Button>
 * 
 * // Dialog
 * <Dialog open={showSaveDialog} onOpenChange={closeSaveDialog}>
 *   <Input value={simulationName} onChange={(e) => setSimulationName(e.target.value)} />
 *   <Button onClick={() => saveSimulation({ revenu: 50000 })}>Confirmer</Button>
 * </Dialog>
 * ```
 */
export function useSimulationSave({
  tableName,
  queryCacheKey,
  onSuccess,
}: UseSimulationSaveOptions): UseSimulationSaveReturn {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [simulationName, setSimulationName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openSaveDialog = useCallback(() => {
    setShowSaveDialog(true);
  }, []);

  const closeSaveDialog = useCallback(() => {
    setShowSaveDialog(false);
    setSimulationName('');
  }, []);

  const saveSimulation = useCallback(async (data: Record<string, any>) => {
    if (!simulationName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un nom pour la simulation",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const { error } = await supabase
        .from(tableName as any)
        .insert({
          ...data,
          user_id: user.id,
          nom_simulation: simulationName,
        });

      if (error) throw error;

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

      closeSaveDialog();
      onSuccess?.();
    } catch (error) {
      logger.supabaseError(tableName, 'insert', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde de la simulation",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [simulationName, tableName, queryCacheKey, toast, queryClient, closeSaveDialog, onSuccess]);

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
