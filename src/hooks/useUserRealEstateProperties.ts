import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

export interface RealEstateProperty {
  id: string;
  user_id: string;
  nom_bien: string;
  valeur_estimee: number;
  capital_restant_du: number;
  mensualite_credit: number;
  charges_mensuelles: number;
  revenus_locatifs_mensuels: number;
  created_at: string;
  updated_at: string;
}

export type RealEstatePropertyInput = Omit<RealEstateProperty, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export const useUserRealEstateProperties = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['user-real-estate-properties', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_real_estate_properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as RealEstateProperty[];
    },
    enabled: !!user?.id,
  });

  const addPropertyMutation = useMutation({
    mutationFn: async (input: Partial<RealEstatePropertyInput>) => {
      if (!user?.id) throw new Error("Utilisateur non connecté");

      const { data, error } = await supabase
        .from('user_real_estate_properties')
        .insert({ 
          ...input, 
          user_id: user.id,
          nom_bien: input.nom_bien || `Bien ${(properties?.length || 0) + 1}`
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-real-estate-properties'] });
      toast.success("Bien immobilier ajouté");
    },
    onError: (error) => {
      console.error('Error adding property:', error);
      toast.error("Erreur lors de l'ajout du bien");
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<RealEstatePropertyInput> & { id: string }) => {
      if (!user?.id) throw new Error("Utilisateur non connecté");

      const { data, error } = await supabase
        .from('user_real_estate_properties')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-real-estate-properties'] });
    },
    onError: (error) => {
      console.error('Error updating property:', error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Utilisateur non connecté");

      const { error } = await supabase
        .from('user_real_estate_properties')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-real-estate-properties'] });
      toast.success("Bien supprimé");
    },
    onError: (error) => {
      console.error('Error deleting property:', error);
      toast.error("Erreur lors de la suppression");
    },
  });

  // Computed aggregates
  const totals = {
    valeurTotale: properties.reduce((sum, p) => sum + Number(p.valeur_estimee || 0), 0),
    capitalRestantTotal: properties.reduce((sum, p) => sum + Number(p.capital_restant_du || 0), 0),
    mensualitesTotal: properties.reduce((sum, p) => sum + Number(p.mensualite_credit || 0), 0),
    chargesTotal: properties.reduce((sum, p) => sum + Number(p.charges_mensuelles || 0), 0),
    revenusLocatifsTotal: properties.reduce((sum, p) => sum + Number(p.revenus_locatifs_mensuels || 0), 0),
  };

  return {
    properties,
    isLoading,
    error,
    addProperty: addPropertyMutation.mutate,
    updateProperty: updatePropertyMutation.mutate,
    deleteProperty: deletePropertyMutation.mutate,
    isAdding: addPropertyMutation.isPending,
    isUpdating: updatePropertyMutation.isPending,
    isDeleting: deletePropertyMutation.isPending,
    totals,
  };
};
