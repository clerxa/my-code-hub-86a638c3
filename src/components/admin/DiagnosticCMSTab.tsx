import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Save, RefreshCw, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { diagnosticConfig as defaultConfig, type DiagnosticConfig, type DiagnosticSection, type DiagnosticQuestion, type DiagnosticOption, type DiagnosticResultThreshold } from "@/data/diagnostic-config";

export function DiagnosticCMSTab() {
  const [config, setConfig] = useState<DiagnosticConfig>(defaultConfig);
  const [configId, setConfigId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("diagnostic_configs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfigId(data.id);
        setConfig(data.config as unknown as DiagnosticConfig);
      } else {
        // Seed the default config
        const { data: created, error: createError } = await supabase
          .from("diagnostic_configs")
          .insert({ name: "default", config: defaultConfig as any, is_active: true })
          .select()
          .single();

        if (createError) throw createError;
        setConfigId(created.id);
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error("Error fetching diagnostic config:", error);
      toast.error("Erreur lors du chargement de la configuration");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!configId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("diagnostic_configs")
        .update({ config: config as any })
        .eq("id", configId);

      if (error) throw error;
      toast.success("Configuration sauvegardée !");
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  // --- Config helpers ---
  const updateGlobalConfig = (key: keyof DiagnosticConfig["config"], value: any) => {
    setConfig(prev => ({ ...prev, config: { ...prev.config, [key]: value } }));
  };

  const updateSection = (sIdx: number, updates: Partial<DiagnosticSection>) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) => i === sIdx ? { ...s, ...updates } : s),
    }));
  };

  const addSection = () => {
    const newId = `section_${Date.now()}`;
    setConfig(prev => ({
      ...prev,
      sections: [...prev.sections, {
        id: newId, title: "Nouvelle section", icon: "Circle",
        description: "", interstitial: "", questions: [],
      }],
    }));
  };

  const removeSection = (sIdx: number) => {
    setConfig(prev => ({ ...prev, sections: prev.sections.filter((_, i) => i !== sIdx) }));
  };

  const moveSection = (sIdx: number, dir: -1 | 1) => {
    const target = sIdx + dir;
    if (target < 0 || target >= config.sections.length) return;
    setConfig(prev => {
      const sections = [...prev.sections];
      [sections[sIdx], sections[target]] = [sections[target], sections[sIdx]];
      return { ...prev, sections };
    });
  };

  // Question helpers
  const addQuestion = (sIdx: number) => {
    const qId = `q_${Date.now()}`;
    updateSection(sIdx, {
      questions: [...config.sections[sIdx].questions, {
        id: qId, label: "Nouvelle question", info: "", options: [
          { label: "Option 1", points: 0 },
          { label: "Option 2", points: 2 },
          { label: "Option 3", points: 4 },
        ],
      }],
    });
  };

  const updateQuestion = (sIdx: number, qIdx: number, updates: Partial<DiagnosticQuestion>) => {
    const questions = config.sections[sIdx].questions.map((q, i) =>
      i === qIdx ? { ...q, ...updates } : q
    );
    updateSection(sIdx, { questions });
  };

  const removeQuestion = (sIdx: number, qIdx: number) => {
    updateSection(sIdx, { questions: config.sections[sIdx].questions.filter((_, i) => i !== qIdx) });
  };

  const moveQuestion = (sIdx: number, qIdx: number, dir: -1 | 1) => {
    const target = qIdx + dir;
    const qs = config.sections[sIdx].questions;
    if (target < 0 || target >= qs.length) return;
    const newQs = [...qs];
    [newQs[qIdx], newQs[target]] = [newQs[target], newQs[qIdx]];
    updateSection(sIdx, { questions: newQs });
  };

  // Option helpers
  const addOption = (sIdx: number, qIdx: number) => {
    const q = config.sections[sIdx].questions[qIdx];
    updateQuestion(sIdx, qIdx, {
      options: [...q.options, { label: "Nouvelle option", points: 0 }],
    });
  };

  const updateOption = (sIdx: number, qIdx: number, oIdx: number, updates: Partial<DiagnosticOption>) => {
    const q = config.sections[sIdx].questions[qIdx];
    const options = q.options.map((o, i) => i === oIdx ? { ...o, ...updates } : o);
    updateQuestion(sIdx, qIdx, { options });
  };

  const removeOption = (sIdx: number, qIdx: number, oIdx: number) => {
    const q = config.sections[sIdx].questions[qIdx];
    updateQuestion(sIdx, qIdx, { options: q.options.filter((_, i) => i !== oIdx) });
  };

  // Result helpers
  const updateResult = (rIdx: number, updates: Partial<DiagnosticResultThreshold>) => {
    setConfig(prev => ({
      ...prev,
      results: prev.results.map((r, i) => i === rIdx ? { ...r, ...updates } : r),
    }));
  };

  const addResult = () => {
    setConfig(prev => ({
      ...prev,
      results: [...prev.results, {
        min: 0, max: 100, level: "good" as const, title: "Nouveau seuil",
        emoji: "📊", description: "Description du seuil",
      }],
    }));
  };

  const removeResult = (rIdx: number) => {
    setConfig(prev => ({ ...prev, results: prev.results.filter((_, i) => i !== rIdx) }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalQuestions = config.sections.reduce((s, sec) => s + sec.questions.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Diagnostic CMS</h2>
          <p className="text-muted-foreground">
            {config.sections.length} sections · {totalQuestions} questions · {config.results.length} seuils
          </p>
        </div>
        <Button onClick={saveConfig} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Paramètres généraux</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input value={config.config.title} onChange={e => updateGlobalConfig("title", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Sous-titre</Label>
            <Input value={config.config.subtitle} onChange={e => updateGlobalConfig("subtitle", e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={config.config.showTimer} onCheckedChange={v => updateGlobalConfig("showTimer", v)} />
            <Label>Afficher le chronomètre</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={config.config.allowBack} onCheckedChange={v => updateGlobalConfig("allowBack", v)} />
            <Label>Permettre le retour</Label>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Sections & Questions</h3>
          <Button variant="outline" size="sm" onClick={addSection}>
            <Plus className="h-4 w-4 mr-1" /> Section
          </Button>
        </div>

        <Accordion type="multiple" className="space-y-3">
          {config.sections.map((section, sIdx) => (
            <AccordionItem key={section.id} value={section.id} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={e => { e.stopPropagation(); moveSection(sIdx, -1); }} disabled={sIdx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); moveSection(sIdx, 1); }} disabled={sIdx === config.sections.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                  <Badge variant="secondary">{sIdx + 1}</Badge>
                  <span className="font-medium">{section.title}</span>
                  <Badge variant="outline" className="ml-auto mr-2">{section.questions.length} questions</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-4">
                {/* Section meta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Titre</Label>
                    <Input value={section.title} onChange={e => updateSection(sIdx, { title: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Icône (Lucide)</Label>
                    <Input value={section.icon} onChange={e => updateSection(sIdx, { icon: e.target.value })} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Description</Label>
                    <Input value={section.description || ""} onChange={e => updateSection(sIdx, { description: e.target.value })} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Message interstitiel</Label>
                    <Textarea value={section.interstitial} onChange={e => updateSection(sIdx, { interstitial: e.target.value })} rows={2} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Questions</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => addQuestion(sIdx)}>
                      <Plus className="h-3 w-3 mr-1" /> Question
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => removeSection(sIdx)}>
                      <Trash2 className="h-3 w-3 mr-1" /> Section
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Questions */}
                {section.questions.map((q, qIdx) => (
                  <Card key={q.id} className="border-dashed">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex flex-col gap-0.5 mt-1">
                          <button onClick={() => moveQuestion(sIdx, qIdx, -1)} disabled={qIdx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button onClick={() => moveQuestion(sIdx, qIdx, 1)} disabled={qIdx === section.questions.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">Q{qIdx + 1}</Badge>
                            <Input
                              value={q.label}
                              onChange={e => updateQuestion(sIdx, qIdx, { label: e.target.value })}
                              className="flex-1"
                              placeholder="Libellé de la question"
                            />
                            <Button variant="ghost" size="icon" onClick={() => removeQuestion(sIdx, qIdx)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Info-bulle (Pourquoi cette question ?)</Label>
                            <Textarea
                              value={q.info || ""}
                              onChange={e => updateQuestion(sIdx, qIdx, { info: e.target.value })}
                              rows={2}
                              placeholder="Explication pour l'utilisateur"
                            />
                          </div>
                          {/* Options */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Options de réponse</Label>
                              <Button variant="ghost" size="sm" onClick={() => addOption(sIdx, qIdx)}>
                                <Plus className="h-3 w-3 mr-1" /> Option
                              </Button>
                            </div>
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <Input
                                  value={opt.label}
                                  onChange={e => updateOption(sIdx, qIdx, oIdx, { label: e.target.value })}
                                  className="flex-1"
                                  placeholder="Libellé"
                                />
                                <div className="flex items-center gap-1 w-20">
                                  <Input
                                    type="number"
                                    value={opt.points}
                                    onChange={e => updateOption(sIdx, qIdx, oIdx, { points: Number(e.target.value) })}
                                    className="w-16"
                                    min={0}
                                  />
                                  <span className="text-xs text-muted-foreground">pts</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeOption(sIdx, qIdx, oIdx)} disabled={q.options.length <= 2}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Results Thresholds */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Seuils de résultats</CardTitle>
              <CardDescription>Définissez les messages selon le score obtenu</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addResult}>
              <Plus className="h-4 w-4 mr-1" /> Seuil
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.results.map((result, rIdx) => (
            <Card key={rIdx} className="border-dashed">
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Score min</Label>
                    <Input type="number" value={result.min} onChange={e => updateResult(rIdx, { min: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Score max</Label>
                    <Input type="number" value={result.max} onChange={e => updateResult(rIdx, { max: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Niveau</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={result.level}
                      onChange={e => updateResult(rIdx, { level: e.target.value as any })}
                    >
                      <option value="critical">Critique</option>
                      <option value="warning">Attention</option>
                      <option value="good">Bon</option>
                      <option value="excellent">Excellent</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Emoji</Label>
                    <Input value={result.emoji} onChange={e => updateResult(rIdx, { emoji: e.target.value })} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeResult(rIdx)} disabled={config.results.length <= 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Titre</Label>
                  <Input value={result.title} onChange={e => updateResult(rIdx, { title: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description / Recommandation</Label>
                  <Textarea value={result.description} onChange={e => updateResult(rIdx, { description: e.target.value })} rows={2} />
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Bottom save */}
      <div className="flex justify-end">
        <Button onClick={saveConfig} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Sauvegarde..." : "Sauvegarder la configuration"}
        </Button>
      </div>
    </div>
  );
}
