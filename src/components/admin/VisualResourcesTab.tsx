import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Image as ImageIcon, Download, Eye } from "lucide-react";
import { ImageUpload } from "./ImageUpload";

interface VisualResource {
  id: string;
  company_id: string | null;
  title: string;
  description: string | null;
  image_url: string;
  category: string;
  created_at: string;
}

export function VisualResourcesTab() {
  const [resources, setResources] = useState<VisualResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<VisualResource | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    category: "general"
  });

  const categories = [
    { value: "general", label: "Général" },
    { value: "social", label: "Réseaux sociaux" },
    { value: "email", label: "Email" },
    { value: "presentation", label: "Présentation" },
    { value: "affichage", label: "Affichage" },
    { value: "intranet", label: "Intranet" }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    const { data } = await supabase
      .from("company_visual_resources")
      .select("*")
      .is("company_id", null)
      .order("created_at", { ascending: false });

    if (data) setResources(data);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.image_url) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        company_id: null // Global pour toutes les entreprises
      };

      if (editingResource) {
        const { error } = await supabase
          .from("company_visual_resources")
          .update(dataToSave)
          .eq("id", editingResource.id);
        
        if (error) throw error;
        toast.success("Ressource mise à jour");
      } else {
        const { error } = await supabase
          .from("company_visual_resources")
          .insert(dataToSave);
        
        if (error) throw error;
        toast.success("Ressource ajoutée");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving resource:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette ressource ?")) return;
    
    try {
      const { error } = await supabase
        .from("company_visual_resources")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Ressource supprimée");
      fetchData();
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const openEditDialog = (resource: VisualResource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || "",
      image_url: resource.image_url,
      category: resource.category
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image_url: "",
      category: "general"
    });
    setEditingResource(null);
  };

  const getCategoryLabel = (value: string) => {
    return categories.find(c => c.value === value)?.label || value;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Ressources visuelles
            </CardTitle>
            <CardDescription>
              Images et visuels disponibles pour toutes les entreprises
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ressource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingResource ? "Modifier la ressource" : "Nouvelle ressource visuelle"}
                </DialogTitle>
                <DialogDescription>
                  Cette ressource sera disponible pour toutes les entreprises
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Bannière MyFinCare"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description de l'utilisation de cette image"
                    rows={2}
                  />
                </div>

                <ImageUpload
                  label="Image *"
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  bucketName="landing-images"
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingResource ? "Mettre à jour" : "Ajouter"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : resources.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune ressource visuelle</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aperçu</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell>
                    <img 
                      src={resource.image_url} 
                      alt={resource.title}
                      className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setPreviewImage(resource.image_url)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{resource.title}</p>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{resource.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryLabel(resource.category)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPreviewImage(resource.image_url)}
                        title="Prévisualiser"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(resource.image_url, '_blank')}
                        title="Télécharger"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(resource)}
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(resource.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Preview Modal */}
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Aperçu de l'image</DialogTitle>
            </DialogHeader>
            {previewImage && (
              <img 
                src={previewImage} 
                alt="Preview" 
                className="w-full h-auto rounded-lg"
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}