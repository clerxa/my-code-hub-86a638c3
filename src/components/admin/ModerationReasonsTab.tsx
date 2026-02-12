/**
 * ===========================================================
 * 📄 File: ModerationReasonsTab.tsx
 * 📌 Rôle : Onglet de configuration des raisons de modération
 * ===========================================================
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Save, GripVertical, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ModerationReason {
  id: string;
  label: string;
  description: string | null;
  order_num: number;
  is_active: boolean;
  created_at: string;
}

export function ModerationReasonsTab() {
  const [reasons, setReasons] = useState<ModerationReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<ModerationReason | null>(null);
  const [form, setForm] = useState({
    label: "",
    description: "",
  });

  useEffect(() => {
    fetchReasons();
  }, []);

  const fetchReasons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("forum_moderation_reasons")
        .select("*")
        .order("order_num");

      if (error) throw error;
      setReasons(data || []);
    } catch (error) {
      console.error("Error fetching moderation reasons:", error);
      toast.error("Erreur lors du chargement des raisons");
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (reason?: ModerationReason) => {
    if (reason) {
      setEditingReason(reason);
      setForm({
        label: reason.label,
        description: reason.description || "",
      });
    } else {
      setEditingReason(null);
      setForm({ label: "", description: "" });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.label.trim()) {
      toast.error("Le libellé est requis");
      return;
    }

    setSaving(true);
    try {
      if (editingReason) {
        const { error } = await supabase
          .from("forum_moderation_reasons")
          .update({
            label: form.label,
            description: form.description || null,
          })
          .eq("id", editingReason.id);

        if (error) throw error;
        toast.success("Raison modifiée avec succès");
      } else {
        const maxOrder = reasons.length > 0 
          ? Math.max(...reasons.map(r => r.order_num)) 
          : 0;

        const { error } = await supabase
          .from("forum_moderation_reasons")
          .insert({
            label: form.label,
            description: form.description || null,
            order_num: maxOrder + 1,
          });

        if (error) throw error;
        toast.success("Raison ajoutée avec succès");
      }

      setDialogOpen(false);
      fetchReasons();
    } catch (error) {
      console.error("Error saving reason:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (reason: ModerationReason) => {
    try {
      const { error } = await supabase
        .from("forum_moderation_reasons")
        .update({ is_active: !reason.is_active })
        .eq("id", reason.id);

      if (error) throw error;
      
      setReasons(reasons.map(r => 
        r.id === reason.id ? { ...r, is_active: !r.is_active } : r
      ));
      
      toast.success(
        reason.is_active 
          ? "Raison désactivée" 
          : "Raison activée"
      );
    } catch (error) {
      console.error("Error toggling reason:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette raison ?")) return;

    try {
      const { error } = await supabase
        .from("forum_moderation_reasons")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Raison supprimée");
      fetchReasons();
    } catch (error) {
      console.error("Error deleting reason:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Raisons de modération
            </CardTitle>
            <CardDescription>
              Configurez les raisons affichées lors de la suppression de contenu par les modérateurs
            </CardDescription>
          </div>
          <Button onClick={() => openDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24">Statut</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reasons.map((reason, index) => (
                <TableRow key={reason.id}>
                  <TableCell className="text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">{reason.label}</TableCell>
                  <TableCell className="text-muted-foreground max-w-md truncate">
                    {reason.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={reason.is_active}
                      onCheckedChange={() => toggleActive(reason)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDialog(reason)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(reason.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {reasons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucune raison de modération configurée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReason ? "Modifier la raison" : "Ajouter une raison"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label">Libellé *</Label>
              <Input
                id="label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Ex: Haine & Insultes"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex: Propos discriminatoires, injures ou harcèlement."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
