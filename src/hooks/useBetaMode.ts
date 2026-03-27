import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BetaConfig {
  enabled: boolean;
  locked_modules: string[];
  companyAccess: Record<string, boolean>;
}

export function useBetaMode() {
  const { data, isLoading } = useQuery({
    queryKey: ["beta-mode"],
    queryFn: async (): Promise<BetaConfig> => {
      // Fetch global beta settings
      const { data: settings, error } = await supabase
        .from("global_settings")
        .select("key, value")
        .eq("category", "beta")
        .in("key", ["beta_mode_enabled", "beta_locked_modules"]);

      if (error || !settings) return { enabled: false, locked_modules: [], companyAccess: {} };

      const enabledSetting = settings.find(s => s.key === "beta_mode_enabled");
      const modulesSetting = settings.find(s => s.key === "beta_locked_modules");

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

      // Fetch company-level access for current user
      let companyAccess: Record<string, boolean> = {};
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", session.session.user.id)
          .single();

        if (profile?.company_id) {
          const { data: company } = await (supabase as any)
            .from("companies")
            .select("access_vega, access_atlas, access_horizon, access_zenith")
            .eq("id", profile.company_id)
            .single();

          if (company) {
            companyAccess = {
              vega: company.access_vega || false,
              atlas: company.access_atlas || false,
              horizon: company.access_horizon || false,
              zenith: company.access_zenith || false,
            };
          }
        }
      }

      return { enabled, locked_modules, companyAccess };
    },
    staleTime: 5 * 60 * 1000,
  });

  const isModuleLocked = (moduleKey: string): boolean => {
    if (!data?.enabled) return false;
    const key = moduleKey.toLowerCase();
    // If company has explicit access, module is NOT locked
    if (data.companyAccess[key]) return false;
    return data.locked_modules.includes(key);
  };

  return {
    isBetaMode: data?.enabled ?? false,
    lockedModules: data?.locked_modules ?? [],
    isModuleLocked,
  };
}
