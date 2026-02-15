/**
 * CMS pour configurer les poids du scoring d'intention
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";

interface ScoreConfig {
  id: string;
  signal_key: string;
  signal_label: string;
  signal_category: string;
  points_per_unit: number;
  max_points: number | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  engagement: { label: "Engagement", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  profile_maturity: { label: "Maturité profil", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  intent_rdv: { label: "Intent RDV", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

export function IntentionScoreConfigTab() {
  const [configs, setConfigs] = useState<ScoreConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    const { data, error } = await supabase
      .from("intention_score_config")
      .select("*")
      .order("display_order");
    if (error) {
      toast.error("Erreur chargement config");
      return;
    }
    setConfigs((data || []) as ScoreConfig[]);
    setLoading(false);
  }

  function updateField(id: string, field: keyof ScoreConfig, value: any) {
    setConfigs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
    setDirty(true);
  }

  async function saveAll() {
    setSaving(true);
    try {
      for (const c of configs) {
        const { error } = await supabase
          .from("intention_score_config")
          .update({
            signal_label: c.signal_label,
            points_per_unit: c.points_per_unit,
            max_points: c.max_points,
            is_active: c.is_active,
            description: c.description,
          })
          .eq("id", c.id);
        if (error) throw error;
      }
      toast.success("Configuration sauvegardée !");
      setDirty(false);
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  // Group by category
  const grouped = configs.reduce<Record<string, ScoreConfig[]>>((acc, c) => {
    (acc[c.signal_category] = acc[c.signal_category] || []).push(c);
    return acc;
  }, {});

  const maxTotal = configs.filter((c) => c.is_active).reduce((s, c) => s + (c.max_points || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuration du scoring</h2>
          <p className="text-muted-foreground">
            Ajustez les poids de chaque signal d'intention — Score max total : <strong>{maxTotal} pts</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadConfigs} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-2" />Réinitialiser
          </Button>
          <Button onClick={saveAll} disabled={!dirty || saving}>
            <Save className="h-4 w-4 mr-2" />{saving ? "Sauvegarde…" : "Sauvegarder"}
          </Button>
        </div>
      </div>

      {Object.entries(grouped).map(([cat, items]) => {
        const catConfig = CATEGORY_LABELS[cat] || { label: cat, color: "bg-gray-100 text-gray-800" };
        return (
          <Card key={cat}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className={catConfig.color}>{catConfig.label}</Badge>
                <span className="text-sm font-normal text-muted-foreground">
                  {items.filter((i) => i.is_active).reduce((s, i) => s + (i.max_points || 0), 0)} pts max
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((c) => (
                <div
                  key={c.id}
                  className={`grid grid-cols-12 gap-4 items-center p-3 rounded-lg border ${!c.is_active ? 'opacity-50 bg-muted/30' : 'bg-card'}`}
                >
                  <div className="col-span-4">
                    <Label className="text-sm font-medium">{c.signal_label}</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.description || c.signal_key}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Points/unité</Label>
                    <Input
                      type="number"
                      min={0}
                      value={c.points_per_unit}
                      onChange={(e) => updateField(c.id, "points_per_unit", Number(e.target.value))}
                      className="h-8"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Max points</Label>
                    <Input
                      type="number"
                      min={0}
                      value={c.max_points ?? ""}
                      onChange={(e) =>
                        updateField(c.id, "max_points", e.target.value ? Number(e.target.value) : null)
                      }
                      className="h-8"
                      placeholder="∞"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Input
                      value={c.description || ""}
                      onChange={(e) => updateField(c.id, "description", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <Label className="text-xs">Actif</Label>
                    <Switch
                      checked={c.is_active}
                      onCheckedChange={(v) => updateField(c.id, "is_active", v)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
