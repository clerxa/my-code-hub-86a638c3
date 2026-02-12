import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";

export interface EpargnePrecautionData {
  nb_mois_securite: number;
  indice_resilience: number;
  epargne_recommandee: number;
  epargne_actuelle: number;
  epargne_manquante: number;
}

/**
 * Hook pour charger les dernières données de simulation d'épargne de précaution
 * Utilise React Query pour une mise en cache réactive
 */
export function useLatestEpargnePrecaution() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['epargne-precaution-latest', user?.id],
    queryFn: async (): Promise<EpargnePrecautionData | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("simulations")
        .select("data")
        .eq("user_id", user.id)
        .eq("type", "epargne_precaution")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return null;
      }

      const simData = data[0].data as {
        nb_mois_securite?: number;
        indice_resilience?: number;
        epargne_recommandee?: number;
        epargne_actuelle?: number;
        epargne_manquante?: number;
      };

      if (!simData) return null;

      return {
        nb_mois_securite: simData.nb_mois_securite || 0,
        indice_resilience: simData.indice_resilience || 0,
        epargne_recommandee: simData.epargne_recommandee || 0,
        epargne_actuelle: simData.epargne_actuelle || 0,
        epargne_manquante: simData.epargne_manquante || 0,
      };
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 secondes
  });

  // Invalider le cache quand la table simulations change
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('epargne-precaution-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'simulations',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['epargne-precaution-latest', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
