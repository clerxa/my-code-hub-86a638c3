import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Edit2, Save, Sparkles, Trash2, Lock, Unlock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Feature {
  id: string;
  nom_fonctionnalite: string;
  categorie: string;
  description: string | null;
  cle_technique: string;
  active: boolean;
  requires_partnership: boolean;
  created_at: string;
  updated_at: string;
}

interface FeaturesTabProps {
  onRefresh: () => void;
}

export default function FeaturesTab({ onRefresh }: FeaturesTabProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Feature>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newFeature, setNewFeature] = useState({
    nom_fonctionnalite: "",
    categorie: "",
    cle_technique: "",
    description: "",
    requires_partnership: true,
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("features")
        .select("*")
        .order("categorie, nom_fonctionnalite");

      if (error) throw error;

      setFeatures(data as Feature[]);
    } catch (error) {
      console.error("Error fetching features:", error);
      toast.error("Erreur lors du chargement des features");
    } finally {
      setLoading(false);
    }
  };

  const updateFeature = async () => {
    if (!editingFeatureId) return;

    try {
      const { error } = await supabase
        .from("features")
        .update({
          nom_fonctionnalite: editForm.nom_fonctionnalite,
          description: editForm.description,
          categorie: editForm.categorie,
          requires_partnership: editForm.requires_partnership,
        })
        .eq("id", editingFeatureId);

      if (error) throw error;

      toast.success("Feature mise à jour");
      setEditingFeatureId(null);
      setEditForm({});
      fetchData();
    } catch (error) {
      console.error("Error updating feature:", error);
      toast.error("Erreur lors de la mise à jour de la feature");
    }
  };

  const toggleFeatureActive = async (feature: Feature) => {
    try {
      const { error } = await supabase
        .from("features")
        .update({ active: !feature.active })
        .eq("id", feature.id);

      if (error) throw error;

      toast.success(feature.active ? "Feature désactivée" : "Feature activée");
      fetchData();
    } catch (error) {
      console.error("Error toggling feature:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const toggleRequiresPartnership = async (feature: Feature) => {
    try {
      const { error } = await supabase
        .from("features")
        .update({ requires_partnership: !feature.requires_partnership })
        .eq("id", feature.id);

      if (error) throw error;

      toast.success(
        feature.requires_partnership 
          ? "Feature accessible à tous" 
          : "Feature restreinte aux partenaires"
      );
      fetchData();
    } catch (error) {
      console.error("Error toggling partnership requirement:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const addNewFeature = async () => {
    if (!newFeature.nom_fonctionnalite || !newFeature.categorie || !newFeature.cle_technique) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    try {
      const { error } = await supabase
        .from("features")
        .insert([{ ...newFeature, active: true }]);

      if (error) throw error;

      toast.success("Feature créée avec succès");
      setNewFeature({
        nom_fonctionnalite: "",
        categorie: "",
        cle_technique: "",
        description: "",
        requires_partnership: true,
      });
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error creating feature:", error);
      toast.error("Erreur lors de la création de la feature");
    }
  };

  const deleteFeature = async (id: string) => {
    try {
      const { error } = await supabase
        .from("features")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Feature supprimée");
      setDeleteConfirmId(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting feature:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const startEdit = (feature: Feature) => {
    setEditingFeatureId(feature.id);
    setEditForm(feature);
  };

  const cancelEdit = () => {
    setEditingFeatureId(null);
    setEditForm({});
  };

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.categorie]) {
      acc[feature.categorie] = [];
    }
    acc[feature.categorie].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Gestion des Features
              </CardTitle>
              <CardDescription className="mt-2">
                Gérez les fonctionnalités de l'application. Les features marquées comme "Partenariat requis" 
                ne sont accessibles qu'aux utilisateurs dont l'entreprise a un partenariat actif.
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nouvelle feature
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle feature</DialogTitle>
                  <DialogDescription>
                    Ajoutez une nouvelle fonctionnalité au catalogue
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nom">Nom de la feature *</Label>
                    <Input
                      id="nom"
                      value={newFeature.nom_fonctionnalite}
                      onChange={(e) => setNewFeature({ ...newFeature, nom_fonctionnalite: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="categorie">Catégorie *</Label>
                    <Input
                      id="categorie"
                      value={newFeature.categorie}
                      onChange={(e) => setNewFeature({ ...newFeature, categorie: e.target.value })}
                      placeholder="Formation, Simulateurs, Entreprise..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="cle">Clé technique *</Label>
                    <Input
                      id="cle"
                      value={newFeature.cle_technique}
                      onChange={(e) => setNewFeature({ ...newFeature, cle_technique: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                      placeholder="Ex: simulateur_espp"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newFeature.description}
                      onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Partenariat requis</Label>
                      <p className="text-xs text-muted-foreground">
                        Si activé, seuls les partenaires y auront accès
                      </p>
                    </div>
                    <Switch
                      checked={newFeature.requires_partnership}
                      onCheckedChange={(checked) => setNewFeature({ ...newFeature, requires_partnership: checked })}
                    />
                  </div>
                  <Button onClick={addNewFeature} className="w-full">
                    Créer la feature
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {Object.entries(groupedFeatures).map(([categorie, categoryFeatures]) => (
              <div key={categorie} className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Badge variant="secondary" className="text-sm font-semibold px-3 py-1">
                    {categorie}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {categoryFeatures.length} feature{categoryFeatures.length > 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="min-w-[250px]">Feature</TableHead>
                        <TableHead className="w-[120px] text-center">Active</TableHead>
                        <TableHead className="w-[150px] text-center">Accès</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryFeatures.map((feature) => (
                        <TableRow key={feature.id} className={!feature.active ? "opacity-50" : ""}>
                          <TableCell>
                            {editingFeatureId === feature.id ? (
                              <div className="space-y-2">
                                <Input
                                  value={editForm.nom_fonctionnalite || ""}
                                  onChange={(e) => setEditForm({ ...editForm, nom_fonctionnalite: e.target.value })}
                                  className="h-8"
                                />
                                <Input
                                  value={editForm.categorie || ""}
                                  onChange={(e) => setEditForm({ ...editForm, categorie: e.target.value })}
                                  className="h-8"
                                  placeholder="Catégorie"
                                />
                                <Textarea
                                  value={editForm.description || ""}
                                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                  placeholder="Description"
                                  rows={2}
                                  className="text-sm"
                                />
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={editForm.requires_partnership || false}
                                    onCheckedChange={(checked) => setEditForm({ ...editForm, requires_partnership: checked })}
                                  />
                                  <span className="text-xs">Partenariat requis</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={updateFeature} className="h-7 text-xs">
                                    <Save className="h-3 w-3 mr-1" />
                                    Sauver
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEdit} className="h-7 text-xs">
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="font-medium text-sm">{feature.nom_fonctionnalite}</p>
                                {feature.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {feature.description}
                                  </p>
                                )}
                                <code className="text-xs text-muted-foreground/70 mt-1 block">
                                  {feature.cle_technique}
                                </code>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={feature.active}
                              onCheckedChange={() => toggleFeatureActive(feature)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant={feature.requires_partnership ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => toggleRequiresPartnership(feature)}
                              className="gap-1"
                            >
                              {feature.requires_partnership ? (
                                <>
                                  <Lock className="h-3 w-3" />
                                  Partenaires
                                </>
                              ) : (
                                <>
                                  <Unlock className="h-3 w-3" />
                                  Tous
                                </>
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(feature)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteConfirmId(feature.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}

            {Object.keys(groupedFeatures).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune feature configurée. Créez-en une nouvelle pour commencer.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette feature ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La feature sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && deleteFeature(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
