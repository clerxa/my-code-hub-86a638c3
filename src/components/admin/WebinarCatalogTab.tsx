import { useState, useEffect, useRef } from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Clock, BookOpen, Loader2, Download, RefreshCw } from "lucide-react";

interface CatalogItem {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  category: string;
  visual_url: string | null;
  is_active: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  duration_minutes: 45,
  category: "a_la_demande",
  is_active: true,
};

export const WebinarCatalogTab = () => {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [generatedVisual, setGeneratedVisual] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("webinar_catalog")
      .select("*")
      .order("category")
      .order("name");
    if (data) setItems(data as CatalogItem[]);
    setLoading(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setGeneratedVisual(null);
    setDialogOpen(true);
  };

  const openEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      duration_minutes: item.duration_minutes,
      category: item.category,
      is_active: item.is_active,
    });
    setGeneratedVisual(item.visual_url);
    setDialogOpen(true);
  };

  const generateVisual = () => {
    const canvas = canvasRef.current;
    if (!canvas || !form.name.trim()) return;

    const width = 1280;
    const height = 720;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dark background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // "WEBINAR EXCLUSIF" gradient
    const label = "WEBINAR EXCLUSIF";
    ctx.font = "bold 72px Inter, system-ui, sans-serif";
    const lm = ctx.measureText(label);
    const lx = (width - lm.width) / 2;
    const gradient = ctx.createLinearGradient(lx, 0, lx + lm.width, 0);
    gradient.addColorStop(0, "#3b82f6");
    gradient.addColorStop(0.3, "#7c3aed");
    gradient.addColorStop(0.6, "#f59e0b");
    gradient.addColorStop(1, "#ef4444");
    ctx.fillStyle = gradient;
    ctx.fillText(label, lx, 160);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 56px Inter, system-ui, sans-serif";
    const lines = wrapText(ctx, form.name.toUpperCase(), width - 120);
    const lh = 72;
    const total = lines.length * lh;
    const startY = 260 + (height - 260 - total) / 2 - 40;
    lines.forEach((line, i) => {
      const w = ctx.measureText(line).width;
      ctx.fillText(line, (width - w) / 2, startY + i * lh);
    });

    // Bottom accent
    const ag = ctx.createLinearGradient(width * 0.3, 0, width * 0.7, 0);
    ag.addColorStop(0, "#3b82f6");
    ag.addColorStop(1, "#7c3aed");
    ctx.fillStyle = ag;
    ctx.fillRect(width * 0.35, height - 40, width * 0.3, 4);

    const dataUrl = canvas.toDataURL("image/png");
    setGeneratedVisual(dataUrl);
  };

  // Auto-generate when name changes in dialog
  useEffect(() => {
    if (dialogOpen && form.name.trim()) {
      const timer = setTimeout(generateVisual, 300);
      return () => clearTimeout(timer);
    }
  }, [form.name, dialogOpen]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    setSaving(true);

    const payload = {
      name: form.name,
      description: form.description,
      duration_minutes: form.duration_minutes,
      category: form.category,
      is_active: form.is_active,
      visual_url: generatedVisual,
    };

    if (editingId) {
      const { error } = await supabase
        .from("webinar_catalog")
        .update(payload)
        .eq("id", editingId);
      if (error) {
        toast.error("Erreur : " + error.message);
      } else {
        toast.success("Webinar mis à jour");
        setDialogOpen(false);
        fetchItems();
      }
    } else {
      const { error } = await supabase
        .from("webinar_catalog")
        .insert(payload);
      if (error) {
        toast.error("Erreur : " + error.message);
      } else {
        toast.success("Webinar ajouté au catalogue");
        setDialogOpen(false);
        fetchItems();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce webinar du catalogue ?")) return;
    const { error } = await supabase.from("webinar_catalog").delete().eq("id", id);
    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success("Webinar supprimé");
      fetchItems();
    }
  };

  const parcours = items.filter((i) => i.category === "parcours_fincare");
  const demande = items.filter((i) => i.category === "a_la_demande");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Catalogue Webinars</h2>
          <p className="text-sm text-muted-foreground">
            Gérez les webinars disponibles dans le catalogue. Ils pourront être utilisés lors de la création de modules.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un webinar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Aucun webinar dans le catalogue</p>
            <p className="text-sm mt-1">Commencez par en ajouter un.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {parcours.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                📋 Parcours FinCare
                <Badge variant="default" className="text-xs">{parcours.length}</Badge>
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {parcours.map((item) => (
                  <CatalogCard key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
          {demande.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                📦 À la demande
                <Badge variant="secondary" className="text-xs">{demande.length}</Badge>
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {demande.map((item) => (
                  <CatalogCard key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier le webinar" : "Nouveau webinar"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du webinar *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Épargne salariale – Mode d'emploi"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <RichTextEditor
                value={form.description}
                onChange={(value) => setForm({ ...form, description: value })}
                placeholder="Description du contenu du webinar…"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Durée (minutes)</Label>
                <Input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 45 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parcours_fincare">📋 Parcours FinCare</SelectItem>
                    <SelectItem value="a_la_demande">📦 À la demande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label>Actif dans le catalogue</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>

            {/* Visual preview */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Visuel auto-généré</Label>
              {generatedVisual ? (
                <div className="space-y-2">
                  <img src={generatedVisual} alt="Visuel" className="w-full rounded-lg" style={{ aspectRatio: "1280/720" }} />
                  <Button type="button" variant="outline" size="sm" onClick={generateVisual}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Régénérer
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Saisissez un nom pour générer le visuel.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingId ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

function CatalogCard({
  item,
  onEdit,
  onDelete,
}: {
  item: CatalogItem;
  onEdit: (item: CatalogItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${!item.is_active ? "opacity-60" : ""}`}>
      {item.visual_url ? (
        <img src={item.visual_url} alt={item.name} className="w-full h-36 object-cover" />
      ) : (
        <div className="w-full h-36 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
          <BookOpen className="h-10 w-10 text-white/60" />
        </div>
      )}
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm line-clamp-2">{item.name}</h4>
          {!item.is_active && <Badge variant="outline" className="text-xs shrink-0">Inactif</Badge>}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {item.duration_minutes} min
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  words.forEach((word) => {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [""];
}
