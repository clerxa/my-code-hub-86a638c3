import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProspectEmployeeQuestion {
  id: string;
  icon: string;
  text: string;
  tech_highlight: boolean;
  display_order: number;
  is_active: boolean;
}

export function useProspectEmployeeQuestions() {
  return useQuery({
    queryKey: ["prospect-employee-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prospect_employee_questions")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as unknown as ProspectEmployeeQuestion[];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useAllProspectEmployeeQuestions() {
  return useQuery({
    queryKey: ["prospect-employee-questions-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prospect_employee_questions")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as unknown as ProspectEmployeeQuestion[];
    },
  });
}

export function useUpsertEmployeeQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (q: Partial<ProspectEmployeeQuestion> & { id?: string }) => {
      if (q.id) {
        const { id, ...rest } = q;
        const { error } = await supabase.from("prospect_employee_questions").update(rest as any).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("prospect_employee_questions").insert(q as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prospect-employee-questions"] });
      qc.invalidateQueries({ queryKey: ["prospect-employee-questions-all"] });
      toast.success("Question sauvegardée");
    },
    onError: () => toast.error("Erreur"),
  });
}

export function useDeleteEmployeeQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prospect_employee_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prospect-employee-questions"] });
      qc.invalidateQueries({ queryKey: ["prospect-employee-questions-all"] });
      toast.success("Question supprimée");
    },
    onError: () => toast.error("Erreur"),
  });
}
