import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HorizonBudget {
  id: string;
  user_id: string;
  total_initial_capital: number;
  total_monthly_savings: number;
  created_at: string;
  updated_at: string;
}

export function useHorizonBudget(userId: string | undefined) {
  const [budget, setBudget] = useState<HorizonBudget | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBudget = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("horizon_budgets")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) console.error("Error fetching budget:", error);
    setBudget(data as HorizonBudget | null);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  const saveBudget = useCallback(async (data: { total_initial_capital: number; total_monthly_savings: number }) => {
    if (!userId) return;

    if (budget) {
      const { error } = await supabase
        .from("horizon_budgets")
        .update(data)
        .eq("id", budget.id);
      if (error) { toast.error("Erreur lors de la mise à jour du budget"); return; }
    } else {
      const { error } = await supabase
        .from("horizon_budgets")
        .insert({ user_id: userId, ...data });
      if (error) { toast.error("Erreur lors de la création du budget"); return; }
    }

    toast.success("Budget mis à jour");
    await fetchBudget();
  }, [userId, budget, fetchBudget]);

  return { budget, loading, saveBudget };
}
