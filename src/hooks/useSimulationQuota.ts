/**
 * Hook to manage simulation quota for non-partner users
 * Quota limit is configurable via CMS (non_partner_welcome_settings)
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useNonPartnerSettings } from "./useNonPartnerSettings";

interface SimulationQuotaData {
  simulationsUsed: number;
  simulationsRemaining: number;
  isLimited: boolean;
  hasPartnership: boolean;
  limit: number;
  quotaLabel: string;
  allowedSimulators: string[];
}

export const useSimulationQuota = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch settings from CMS
  const { data: settings, isLoading: settingsLoading } = useNonPartnerSettings();
  
  const limit = settings?.max_simulations ?? 10;
  const quotaLabel = settings?.quota_banner_label ?? 'Analyses gratuites';
  const allowedSimulators = settings?.allowed_simulators ?? [];

  const { data, isLoading, error } = useQuery({
    queryKey: ['simulation-quota', user?.id, limit],
    queryFn: async (): Promise<SimulationQuotaData> => {
      if (!user?.id) {
        return {
          simulationsUsed: 0,
          simulationsRemaining: 0,
          isLimited: true,
          hasPartnership: false,
          limit,
          quotaLabel,
          allowedSimulators,
        };
      }

      // 1. Check if user has an active partnership
      const { data: profileData } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle();

      let hasPartnership = false;
      if (profileData?.company_id) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("partnership_type")
          .eq("id", profileData.company_id)
          .maybeSingle();

        hasPartnership = companyData?.partnership_type && 
          companyData.partnership_type.toLowerCase() !== 'aucun';
      }

      // If user has partnership, unlimited access
      if (hasPartnership) {
        return {
          simulationsUsed: 0,
          simulationsRemaining: Infinity,
          isLimited: false,
          hasPartnership: true,
          limit,
          quotaLabel,
          allowedSimulators,
        };
      }

      // 2. Count simulations used (from simulation_logs)
      const { count, error: countError } = await supabase
        .from("simulation_logs")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id);

      if (countError) {
        console.error("Error counting simulations:", countError);
        throw countError;
      }

      const simulationsUsed = count || 0;
      const simulationsRemaining = Math.max(0, limit - simulationsUsed);
      const isLimited = simulationsRemaining === 0;

      return {
        simulationsUsed,
        simulationsRemaining,
        isLimited,
        hasPartnership: false,
        limit,
        quotaLabel,
        allowedSimulators,
      };
    },
    enabled: !!user?.id && !settingsLoading,
    staleTime: 30 * 1000, // 30 seconds cache
  });

  // Function to check if user can run a simulation
  const canRunSimulation = (): boolean => {
    if (!data) return false;
    return data.hasPartnership || data.simulationsRemaining > 0;
  };
  
  // Function to check if a specific simulator is allowed for non-partners
  const isSimulatorAllowed = (featureKey: string): boolean => {
    if (!data) return false;
    if (data.hasPartnership) return true;
    return data.allowedSimulators.includes(featureKey);
  };

  // Function to refresh quota after a simulation
  const refreshQuota = () => {
    queryClient.invalidateQueries({ queryKey: ['simulation-quota'] });
  };

  return {
    ...data,
    isLoading: isLoading || settingsLoading,
    error,
    canRunSimulation,
    isSimulatorAllowed,
    refreshQuota,
    limit,
    quotaLabel,
    allowedSimulators,
  };
};
