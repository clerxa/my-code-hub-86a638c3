import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ModuleItem {
  id: number;
  title: string;
  theme: string[] | null;
  description: string | null;
  type: string | null;
  order_num: number | null;
}

export function useAllModules() {
  return useQuery({
    queryKey: ["all-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("id, title, theme, description, type, order_num")
        .order("order_num");
      if (error) throw error;
      return data as ModuleItem[];
    },
    staleTime: 1000 * 60 * 10,
  });
}
