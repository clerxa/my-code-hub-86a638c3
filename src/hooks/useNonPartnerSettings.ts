/**
 * Hook to fetch non-partner settings from the database
 * Used to centralize quota config and allowed simulators
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface NonPartnerSettings {
  max_simulations: number;
  allowed_simulators: string[];
  quota_banner_label: string;
}

const DEFAULT_SETTINGS: NonPartnerSettings = {
  max_simulations: 10,
  allowed_simulators: [
    'simulateur_pret_immobilier',
    'simulateur_epargne_precaution',
    'simulateur_impots',
    'simulateur_espp',
    'simulateur_interets_composes',
    'optimisation_fiscale',
    'simulateur_capacite_emprunt',
    'simulateur_lmnp',
    'simulateur_per'
  ],
  quota_banner_label: 'Analyses gratuites'
};

export const useNonPartnerSettings = () => {
  return useQuery({
    queryKey: ['non-partner-settings'],
    queryFn: async (): Promise<NonPartnerSettings> => {
      const { data, error } = await supabase
        .from("non_partner_welcome_settings")
        .select("max_simulations, allowed_simulators, quota_banner_label")
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching non-partner settings:", error);
        return DEFAULT_SETTINGS;
      }

      return {
        max_simulations: data.max_simulations ?? DEFAULT_SETTINGS.max_simulations,
        allowed_simulators: data.allowed_simulators ?? DEFAULT_SETTINGS.allowed_simulators,
        quota_banner_label: data.quota_banner_label ?? DEFAULT_SETTINGS.quota_banner_label,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
