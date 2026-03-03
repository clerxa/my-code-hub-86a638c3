import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Pencil, Trash2, Copy, ExternalLink } from "lucide-react";
import { useProspectPresentations, useCreatePresentation, useDeletePresentation, useUpdatePresentation } from "@/hooks/useProspectPresentations";
import { ProspectPresentationForm } from "./presentations/ProspectPresentationForm";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ProspectPresentationsTab() {
  const { user } = useAuth();
  const { data: presentations, isLoading } = useProspectPresentations();
  const createMutation = useCreatePresentation();
  const deleteMutation = useDeletePresentation();
  const updateMutation = useUpdatePresentation();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreate = async () => {
    const result = await createMutation.mutateAsync({
      title: "Nouvelle présentation",
      prospect_name: "",
      created_by: user?.id,
    } as any);
    setEditingId(result.id);
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/presentation/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien copié !");
  };

  const handlePublish = (id: string, currentStatus: string) => {
    updateMutation.mutate({
      id,
      status: currentStatus === "published" ? "draft" : "published",
    } as any);
  };

  if (editingId) {
    return (
      <ProspectPresentationForm
        presentationId={editingId}
        onBack={() => setEditingId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Présentations Prospects</h2>
          <p className="text-muted-foreground">Générez des présentations commerciales personnalisées</p>
        </div>
        <Button onClick={handleCreate} disabled={createMutation.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle présentation
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-5 bg-muted rounded w-3/4" /></CardHeader>
              <CardContent><div className="h-4 bg-muted rounded w-1/2" /></CardContent>
            </Card>
          ))}
        </div>
      ) : !presentations?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucune présentation créée. Cliquez sur "Nouvelle présentation" pour commencer.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {presentations.map(p => (
            <Card key={p.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base truncate">{p.title || "Sans titre"}</CardTitle>
                  <Badge variant={p.status === "published" ? "default" : "secondary"}>
                    {p.status === "published" ? "Publié" : "Brouillon"}
                  </Badge>
                </div>
                {p.prospect_name && (
                  <p className="text-sm text-muted-foreground">{p.prospect_name}</p>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">
                  Modifié le {new Date(p.updated_at).toLocaleDateString("fr-FR")}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => setEditingId(p.id)}>
                    <Pencil className="h-3 w-3 mr-1" /> Éditer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(`/presentation/${p.share_token}`, "_blank")}>
                    <Eye className="h-3 w-3 mr-1" /> Voir
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleCopyLink(p.share_token)}>
                    <Copy className="h-3 w-3 mr-1" /> Lien
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handlePublish(p.id, p.status)}>
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {p.status === "published" ? "Dépublier" : "Publier"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette présentation ?</AlertDialogTitle>
                        <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(p.id)}>Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
