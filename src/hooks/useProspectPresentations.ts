import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProspectPresentation {
  id: string;
  title: string;
  prospect_name: string;
  prospect_logo_url: string | null;
  prospect_sector: string;
  selected_stats: string[];
  selected_key_figures: string[];
  selected_client_logos: string[];
  selected_testimonials: string[];
  selected_modules: any[];
  challenge_text: string | null;
  challenge_bullets: string[];
  contact_name: string;
  contact_role: string;
  contact_phone: string;
  contact_email: string;
  contact_booking_url: string | null;
  status: string;
  share_token: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useProspectPresentations() {
  return useQuery({
    queryKey: ["prospect-presentations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prospect_presentations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ProspectPresentation[];
    },
  });
}

export function useProspectPresentation(id: string | undefined) {
  return useQuery({
    queryKey: ["prospect-presentation", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("prospect_presentations")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as unknown as ProspectPresentation;
    },
    enabled: !!id,
  });
}

export function useProspectPresentationByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["prospect-presentation-token", token],
    queryFn: async () => {
      if (!token) return null;
      const { data, error } = await supabase
        .from("prospect_presentations")
        .select("*")
        .eq("share_token", token)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data as unknown as ProspectPresentation;
    },
    enabled: !!token,
  });
}

export function useCreatePresentation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ProspectPresentation>) => {
      const { data: result, error } = await supabase
        .from("prospect_presentations")
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;
      return result as unknown as ProspectPresentation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospect-presentations"] });
      toast.success("Présentation créée");
    },
    onError: () => toast.error("Erreur lors de la création"),
  });
}

export function useUpdatePresentation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ProspectPresentation> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("prospect_presentations")
        .update(data as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result as unknown as ProspectPresentation;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["prospect-presentations"] });
      queryClient.invalidateQueries({ queryKey: ["prospect-presentation", vars.id] });
      toast.success("Présentation sauvegardée");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });
}

export function useDeletePresentation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("prospect_presentations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospect-presentations"] });
      toast.success("Présentation supprimée");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });
}
