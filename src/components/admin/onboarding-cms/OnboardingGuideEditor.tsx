import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Save, Trash2, GripVertical, Eye,
  Sparkles, BookOpen, Calculator, User, Calendar, Compass,
  ChevronRight, Heart, Star, Trophy, Target, Zap, Shield,
  TrendingUp, PiggyBank, Wallet, HandCoins, Landmark, Lightbulb,
  Gift, Award, Clock, Bell, Settings, Home, FileText, BarChart3,
} from "lucide-react";
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

const ICON_OPTIONS: { value: string; label: string; icon: React.ElementType }[] = [
  { value: "Sparkles", label: "Sparkles", icon: Sparkles },
  { value: "BookOpen", label: "BookOpen", icon: BookOpen },
  { value: "Calculator", label: "Calculator", icon: Calculator },
  { value: "User", label: "User", icon: User },
  { value: "Calendar", label: "Calendar", icon: Calendar },
  { value: "Compass", label: "Compass", icon: Compass },
  { value: "Heart", label: "Heart", icon: Heart },
  { value: "Star", label: "Star", icon: Star },
  { value: "Trophy", label: "Trophy", icon: Trophy },
  { value: "Target", label: "Target", icon: Target },
  { value: "Zap", label: "Zap", icon: Zap },
  { value: "Shield", label: "Shield", icon: Shield },
  { value: "TrendingUp", label: "TrendingUp", icon: TrendingUp },
  { value: "PiggyBank", label: "PiggyBank", icon: PiggyBank },
  { value: "Wallet", label: "Wallet", icon: Wallet },
  { value: "HandCoins", label: "HandCoins", icon: HandCoins },
  { value: "Landmark", label: "Landmark", icon: Landmark },
  { value: "Lightbulb", label: "Lightbulb", icon: Lightbulb },
  { value: "Gift", label: "Gift", icon: Gift },
  { value: "Award", label: "Award", icon: Award },
  { value: "Clock", label: "Clock", icon: Clock },
  { value: "Bell", label: "Bell", icon: Bell },
  { value: "Settings", label: "Settings", icon: Settings },
  { value: "Home", label: "Home", icon: Home },
  { value: "FileText", label: "FileText", icon: FileText },
  { value: "BarChart3", label: "BarChart3", icon: BarChart3 },
];

export const GUIDE_ICON_MAP: Record<string, React.ElementType> = Object.fromEntries(
  ICON_OPTIONS.map(o => [o.value, o.icon])
);

interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  order_num: number;
  is_active: boolean;
}

export function OnboardingGuideEditor() {
  const [steps, setSteps] = useState<GuideStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSteps();
  }, []);

  const fetchSteps = async () => {
    try {
      const { data, error } = await supabase
        .from("onboarding_guide_steps" as any)
        .select("*")
        .order("order_num");
      if (error) throw error;
      const items = (data || []) as unknown as GuideStep[];
      setSteps(items);
      if (items.length > 0 && !selectedId) setSelectedId(items[0].id);
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du chargement des étapes");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    const newStep: GuideStep = {
      id: `temp-${Date.now()}`,
      title: "Nouvelle étape",
      description: "Description de l'étape",
      icon: "Sparkles",
      order_num: steps.length,
      is_active: true,
    };
    setSteps([...steps, newStep]);
    setSelectedId(newStep.id);
    setHasChanges(true);
  };

  const handleUpdate = (id: string, field: keyof GuideStep, value: any) => {
    setSteps(steps.map(s => (s.id === id ? { ...s, [field]: value } : s)));
    setHasChanges(true);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    newSteps.forEach((s, i) => (s.order_num = i));
    setSteps(newSteps);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    newSteps.forEach((s, i) => (s.order_num = i));
    setSteps(newSteps);
    setHasChanges(true);
  };

  const handleDelete = () => {
    if (!deleteConfirmId) return;
    const remaining = steps.filter(s => s.id !== deleteConfirmId);
    remaining.forEach((s, i) => (s.order_num = i));
    setSteps(remaining);
    if (selectedId === deleteConfirmId) setSelectedId(remaining[0]?.id || null);
    setDeleteConfirmId(null);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get current DB IDs
      const { data: dbSteps } = await supabase
        .from("onboarding_guide_steps" as any)
        .select("id");
      const dbIds = ((dbSteps || []) as any[]).map((s: any) => s.id);
      const currentIds = steps.filter(s => !s.id.startsWith("temp-")).map(s => s.id);
      const toDelete = dbIds.filter((id: string) => !currentIds.includes(id));

      if (toDelete.length > 0) {
        await supabase.from("onboarding_guide_steps" as any).delete().in("id", toDelete);
      }

      for (const step of steps) {
        if (step.id.startsWith("temp-")) {
          const { error } = await supabase.from("onboarding_guide_steps" as any).insert({
            title: step.title,
            description: step.description,
            icon: step.icon,
            order_num: step.order_num,
            is_active: step.is_active,
          } as any);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("onboarding_guide_steps" as any)
            .update({
              title: step.title,
              description: step.description,
              icon: step.icon,
              order_num: step.order_num,
              is_active: step.is_active,
            } as any)
            .eq("id", step.id);
          if (error) throw error;
        }
      }

      setHasChanges(false);
      toast.success("Guide sauvegardé !");
      fetchSteps();
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const selected = steps.find(s => s.id === selectedId);
  const IconComponent = selected ? (GUIDE_ICON_MAP[selected.icon] || Sparkles) : Sparkles;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Étapes du guide d'onboarding</h3>
          <Badge variant="outline" className="text-xs">{steps.filter(s => s.is_active).length} active(s)</Badge>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="secondary" className="animate-pulse text-xs bg-orange-500/20 text-orange-700 border-orange-500/30">
              Non sauvegardé
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" /> Ajouter
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
            <Save className="h-4 w-4 mr-1" /> {saving ? "..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Step list */}
        <div className="lg:col-span-4 space-y-2">
          {steps.map((step, index) => {
            const StepIcon = GUIDE_ICON_MAP[step.icon] || Sparkles;
            return (
              <Card
                key={step.id}
                className={`cursor-pointer transition-all hover:shadow-sm ${
                  selectedId === step.id ? "ring-2 ring-primary" : ""
                } ${!step.is_active ? "opacity-50" : ""}`}
                onClick={() => setSelectedId(step.id)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }} className="text-muted-foreground hover:text-foreground text-xs">▲</button>
                    <button onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }} className="text-muted-foreground hover:text-foreground text-xs">▼</button>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <StepIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{step.title}</p>
                    <p className="text-xs text-muted-foreground">Étape {index + 1}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(step.id); }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            );
          })}
          {steps.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Aucune étape. Cliquez sur "Ajouter" pour commencer.
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="lg:col-span-5 space-y-4">
          {selected ? (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label>Titre</Label>
                  <Input
                    value={selected.title}
                    onChange={e => handleUpdate(selected.id, "title", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={selected.description}
                    onChange={e => handleUpdate(selected.id, "description", e.target.value)}
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Icône</Label>
                  <Select value={selected.icon} onValueChange={v => handleUpdate(selected.id, "icon", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(opt => {
                        const OptIcon = opt.icon;
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <OptIcon className="h-4 w-4" />
                              {opt.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={selected.is_active}
                    onCheckedChange={v => handleUpdate(selected.id, "is_active", v)}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Sélectionnez une étape</div>
          )}
        </div>

        {/* Preview */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Aperçu</p>
              {selected ? (
                <div className="text-center space-y-3">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <IconComponent className="h-7 w-7 text-primary" />
                  </div>
                  <h4 className="font-semibold text-sm">{selected.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{selected.description}</p>
                  <div className="flex items-center justify-center gap-1 pt-2">
                    {steps.filter(s => s.is_active).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === steps.filter(s => s.is_active).indexOf(selected)
                            ? "w-4 bg-primary"
                            : "w-1.5 bg-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center">—</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette étape ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
