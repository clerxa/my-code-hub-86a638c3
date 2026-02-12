import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EvaluationKey, EvaluationCategory } from '@/types/evaluation-keys';

export const useEvaluationKeys = () => {
  const [keys, setKeys] = useState<EvaluationKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('evaluation_keys')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;
      setKeys(data as EvaluationKey[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching evaluation keys:', err);
      setError('Erreur lors du chargement des clés d\'évaluation');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  // Filtrer par catégorie
  const getKeysByCategory = useCallback((category: EvaluationCategory) => {
    return keys.filter(key => key.category === category);
  }, [keys]);

  // Grouper par catégorie
  const getKeysGroupedByCategory = useCallback(() => {
    return keys.reduce((acc, key) => {
      if (!acc[key.category]) {
        acc[key.category] = [];
      }
      acc[key.category].push(key);
      return acc;
    }, {} as Record<EvaluationCategory, EvaluationKey[]>);
  }, [keys]);

  // Obtenir une clé par son nom
  const getKeyByName = useCallback((keyName: string) => {
    return keys.find(key => key.key_name === keyName);
  }, [keys]);

  // Ajouter une nouvelle clé
  const addKey = async (newKey: Omit<EvaluationKey, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('evaluation_keys')
        .insert([newKey])
        .select()
        .single();

      if (insertError) throw insertError;
      await fetchKeys();
      return { success: true, data };
    } catch (err) {
      console.error('Error adding evaluation key:', err);
      return { success: false, error: err };
    }
  };

  // Mettre à jour une clé
  const updateKey = async (id: string, updates: Partial<EvaluationKey>) => {
    try {
      const { error: updateError } = await supabase
        .from('evaluation_keys')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchKeys();
      return { success: true };
    } catch (err) {
      console.error('Error updating evaluation key:', err);
      return { success: false, error: err };
    }
  };

  // Supprimer une clé (soft delete)
  const deleteKey = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('evaluation_keys')
        .update({ is_active: false })
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchKeys();
      return { success: true };
    } catch (err) {
      console.error('Error deleting evaluation key:', err);
      return { success: false, error: err };
    }
  };

  return {
    keys,
    loading,
    error,
    refetch: fetchKeys,
    getKeysByCategory,
    getKeysGroupedByCategory,
    getKeyByName,
    addKey,
    updateKey,
    deleteKey,
  };
};
