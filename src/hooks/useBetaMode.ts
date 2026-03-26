import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BetaConfig {
  enabled: boolean;
  locked_modules: string[];
}

export function useBetaMode() {
  const { data } = useQuery({
    queryKey: ["beta-mode"],
    queryFn: async (): Promise<BetaConfig> => {
      const { data, error } = await supabase
        .from("global_settings")
        .select("key, value")
        .eq("category", "beta")
        .in("key", ["beta_mode_enabled", "beta_locked_modules"]);

      if (error || !data) return { enabled: false, locked_modules: [] };

      const enabledSetting = data.find(s => s.key === "beta_mode_enabled");
      const modulesSetting = data.find(s => s.key === "beta_locked_modules");

      const enabled = enabledSetting?.value === true || enabledSetting?.value === "true";

      let locked_modules: string[] = [];
      try {
        const raw = modulesSetting?.value;
        if (typeof raw === "string") {
          locked_modules = JSON.parse(raw);
        } else if (Array.isArray(raw)) {
          locked_modules = raw as string[];
        }
      } catch {
        locked_modules = [];
      }

      return { enabled, locked_modules };
    },
    staleTime: 5 * 60 * 1000,
  });

  const isModuleLocked = (moduleKey: string): boolean => {
    if (!data?.enabled) return false;
    return data.locked_modules.includes(moduleKey.toLowerCase());
  };

  return {
    isBetaMode: data?.enabled ?? false,
    lockedModules: data?.locked_modules ?? [],
    isModuleLocked,
  };
}
