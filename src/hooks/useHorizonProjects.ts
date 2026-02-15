import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HorizonProject {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  category_id: string | null;
  custom_category: string | null;
  apport: number;
  monthly_allocation: number;
  target_amount: number;
  target_date: string | null;
  duration_months: number | null;
  placement_product_id: string | null;
  annual_return_rate: number;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  // Joined data
  category_name?: string;
  category_color?: string;
  product_name?: string;
  product_return?: string;
}

export type ProjectFormData = {
  name: string;
  icon: string;
  category_id: string | null;
  custom_category: string | null;
  apport: number;
  monthly_allocation: number;
  target_amount: number;
  target_date: string | null;
  duration_months: number | null;
  placement_product_id: string | null;
  annual_return_rate: number;
  notes: string | null;
};

export function useHorizonProjects(userId: string | undefined) {
  const [projects, setProjects] = useState<HorizonProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    
    const { data, error } = await supabase
      .from("horizon_projects")
      .select(`
        *,
        horizon_project_categories(name, color),
        financial_products(name, target_return)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching projects:", error);
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((p: any) => ({
      ...p,
      category_name: p.horizon_project_categories?.name,
      category_color: p.horizon_project_categories?.color,
      product_name: p.financial_products?.name,
      product_return: p.financial_products?.target_return,
    }));

    setProjects(mapped);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const addProject = useCallback(async (data: ProjectFormData) => {
    if (!userId) return;
    const { error } = await supabase
      .from("horizon_projects")
      .insert({ user_id: userId, ...data });
    if (error) { toast.error("Erreur lors de la création du projet"); return; }
    toast.success("Projet créé !");
    await fetchProjects();
  }, [userId, fetchProjects]);

  const updateProject = useCallback(async (id: string, data: Partial<ProjectFormData>) => {
    const { error } = await supabase
      .from("horizon_projects")
      .update(data)
      .eq("id", id);
    if (error) { toast.error("Erreur lors de la mise à jour"); return; }
    toast.success("Projet mis à jour");
    await fetchProjects();
  }, [fetchProjects]);

  const deleteProject = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("horizon_projects")
      .delete()
      .eq("id", id);
    if (error) { toast.error("Erreur lors de la suppression"); return; }
    toast.success("Projet supprimé");
    await fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, addProject, updateProject, deleteProject, refetch: fetchProjects };
}
