import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface ClientLogo {
  id: string;
  name: string;
  logo_url: string;
  display_order: number;
  is_active: boolean;
}

export function ClientLogosManager() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newLogo, setNewLogo] = useState("");

  const { data: logos = [], isLoading } = useQuery({
    queryKey: ["admin-client-logos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_logos")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as ClientLogo[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = logos.length > 0 ? Math.max(...logos.map((l) => l.display_order)) : 0;
      const { error } = await supabase.from("client_logos").insert({
        name: newName,
        logo_url: newLogo,
        display_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-logos"] });
      queryClient.invalidateQueries({ queryKey: ["client-logos"] });
      setNewName("");
      setNewLogo("");
      toast.success("Logo ajouté");
    },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ClientLogo> }) => {
      const { error } = await supabase.from("client_logos").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-logos"] });
      queryClient.invalidateQueries({ queryKey: ["client-logos"] });
      toast.success("Logo mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_logos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-logos"] });
      queryClient.invalidateQueries({ queryKey: ["client-logos"] });
      toast.success("Logo supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Logos références clients</CardTitle>
        <p className="text-sm text-muted-foreground">
          Ces logos sont partagés sur toutes les landing pages (Index, Partnership, etc.)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new logo */}
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <p className="text-sm font-medium">Ajouter un logo</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom de l'entreprise</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Salesforce"
              />
            </div>
            <div className="space-y-2">
              <ImageUpload
                label="Logo"
                value={newLogo}
                onChange={setNewLogo}
                bucketName="landing-images"
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => addMutation.mutate()}
            disabled={!newName || !newLogo || addMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {/* Existing logos */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : (
          <div className="space-y-3">
            {logos.map((logo) => (
              <div
                key={logo.id}
                className="flex items-center gap-4 border rounded-lg p-3 bg-card"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <img
                  src={logo.logo_url}
                  alt={logo.name}
                  className="h-12 w-12 object-contain rounded bg-white p-1 border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <Input
                    value={logo.name}
                    onChange={(e) =>
                      updateMutation.mutate({ id: logo.id, updates: { name: e.target.value } })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={logo.is_active}
                    onCheckedChange={(checked) =>
                      updateMutation.mutate({ id: logo.id, updates: { is_active: checked } })
                    }
                  />
                  <span className="text-xs text-muted-foreground w-12">
                    {logo.is_active ? "Actif" : "Masqué"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(logo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {logos.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun logo configuré. Ajoutez votre première référence ci-dessus.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
