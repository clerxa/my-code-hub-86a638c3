import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Plus, Trash2, GripVertical, Lightbulb, Eye, Settings, Zap, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { IconSelector } from "./IconSelector";
import { ConditionEditor, UnifiedConditionConfig, migrateOldConditionConfig } from "./shared/ConditionEditor";

interface RecommendationRule {
  id: string;
  internal_name?: string;
  rule_key: string;
  rule_name: string;
  description: string | null;
  is_active: boolean;
  priority: number;
  condition_type: string;
  condition_config: Record<string, any>;
  title: string;
  message: string;
  icon: string;
  cta_text: string;
  cta_action_type: string;
  cta_action_value: string;
  display_priority: string;
}

// Génère un nom interne lisible pour une recommandation
const generateRecommendationInternalName = (conditionType: string, title: string, priority: number): string => {
  const condPart = conditionType.replace(/\s+/g, '_').toLowerCase();
  const titlePart = title.substring(0, 25).replace(/\s+/g, '_').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return `reco_${condPart}_${titlePart}_${priority}`;
};

// All available condition types with their descriptions
const CONDITION_TYPES = [
  { value: "unified", label: "⚡ Conditions avancées (nouveau)", description: "Utilisez le nouvel éditeur de conditions avec toutes les métriques disponibles" },
  { value: "no_risk_profile", label: "Pas de profil de risque", description: "L'utilisateur n'a pas encore complété son profil de risque" },
  { value: "financial_profile_incomplete", label: "Profil financier incomplet", description: "Le profil financier n'est pas complet à 100%" },
  { value: "no_modules", label: "Aucun module validé", description: "L'utilisateur n'a validé aucun module de formation" },
  { value: "simulation_threshold", label: "Seuil de simulation", description: "Basé sur les résultats des simulations (PER, optimisation...)" },
  { value: "financial_threshold", label: "Seuil financier", description: "Basé sur les données du profil financier" },
  { value: "module_progress", label: "Progression modules", description: "Basé sur le nombre de modules validés" },
  { value: "no_appointment", label: "Pas de rendez-vous", description: "L'utilisateur n'a pas pris de rendez-vous" },
  { value: "no_simulation", label: "Pas de simulation", description: "L'utilisateur n'a réalisé aucune simulation" },
  { value: "no_diagnostic", label: "Diagnostic non réalisé", description: "L'utilisateur n'a jamais commencé le diagnostic financier" },
  { value: "diagnostic_incomplete", label: "Diagnostic non terminé", description: "L'utilisateur a commencé mais pas terminé le diagnostic" },
  { value: "diagnostic_completed", label: "Diagnostic terminé", description: "L'utilisateur a terminé le diagnostic financier" },
  { value: "always", label: "Toujours afficher", description: "Affiche toujours cette recommandation" },
  { value: "custom", label: "Règle personnalisée (legacy)", description: "Combinaison de conditions personnalisées" },
];

// Available keys for financial thresholds
const FINANCIAL_KEYS = [
  { value: "revenu_mensuel_net", label: "Revenu mensuel net", type: "number" },
  { value: "revenu_fiscal_annuel", label: "Revenu fiscal annuel", type: "number" },
  { value: "tmi", label: "TMI (%)", type: "number" },
  { value: "charges_fixes", label: "Charges fixes mensuelles", type: "number" },
  { value: "epargne_disponible", label: "Épargne disponible", type: "number" },
  { value: "taux_epargne", label: "Taux d'épargne (%)", type: "number" },
  { value: "patrimoine_total", label: "Patrimoine total", type: "number" },
  { value: "capacite_emprunt", label: "Capacité d'emprunt", type: "number" },
];

// Available keys for simulation thresholds
const SIMULATION_KEYS = [
  { value: "per_economie", label: "Économie PER", type: "number" },
  { value: "optim_economie", label: "Économie optimisation fiscale", type: "number" },
  { value: "epargne_manquante", label: "Épargne de précaution manquante", type: "number" },
  { value: "capacite_emprunt", label: "Capacité d'emprunt calculée", type: "number" },
  { value: "lmnp_economie", label: "Économie LMNP", type: "number" },
];

const OPERATORS = [
  { value: ">", label: "Supérieur à (>)" },
  { value: ">=", label: "Supérieur ou égal (≥)" },
  { value: "<", label: "Inférieur à (<)" },
  { value: "<=", label: "Inférieur ou égal (≤)" },
  { value: "=", label: "Égal à (=)" },
  { value: "!=", label: "Différent de (≠)" },
];

export function RecommendationsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<RecommendationRule[]>([]);
  const [editingRule, setEditingRule] = useState<RecommendationRule | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from("recommendation_rules")
        .select("*")
        .order("priority", { ascending: true });

      if (error) throw error;
      
      setRules(data?.map(r => ({
        ...r,
        condition_config: r.condition_config as Record<string, any> || {}
      })) || []);
    } catch (error) {
      console.error("Error fetching rules:", error);
      toast.error("Erreur lors du chargement des règles");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (rule: RecommendationRule) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("recommendation_rules")
        .update({
          internal_name: rule.internal_name || generateRecommendationInternalName(rule.condition_type, rule.title, rule.priority),
          rule_name: rule.rule_name,
          description: rule.description,
          is_active: rule.is_active,
          priority: rule.priority,
          condition_type: rule.condition_type,
          condition_config: rule.condition_config,
          title: rule.title,
          message: rule.message,
          icon: rule.icon,
          cta_text: rule.cta_text,
          cta_action_type: rule.cta_action_type,
          cta_action_value: rule.cta_action_value,
          display_priority: rule.display_priority
        })
        .eq("id", rule.id);

      if (error) throw error;
      
      toast.success("Règle enregistrée");
      setEditingRule(null);
      fetchRules();
    } catch (error) {
      console.error("Error saving rule:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    try {
      const priority = rules.length + 1;
      const internalName = generateRecommendationInternalName('always', 'Nouvelle recommandation', priority);
      const newRule = {
        internal_name: internalName,
        rule_key: `custom_${Date.now()}`,
        rule_name: "Nouvelle recommandation",
        description: "",
        is_active: false,
        priority: priority,
        condition_type: "always",
        condition_config: {},
        title: "Titre de la recommandation",
        message: "Message de la recommandation",
        icon: "Star",
        cta_text: "Action",
        cta_action_type: "navigate",
        cta_action_value: "/",
        display_priority: "medium"
      };

      const { data, error } = await supabase
        .from("recommendation_rules")
        .insert(newRule)
        .select()
        .single();

      if (error) throw error;

      toast.success("Recommandation créée");
      fetchRules();
      if (data) {
        setEditingRule({
          ...data,
          condition_config: data.condition_config as Record<string, any> || {}
        });
      }
    } catch (error) {
      console.error("Error creating rule:", error);
      toast.error("Erreur lors de la création");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette recommandation ?")) return;
    
    try {
      const { error } = await supabase
        .from("recommendation_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Recommandation supprimée");
      setEditingRule(null);
      fetchRules();
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleToggleActive = async (rule: RecommendationRule) => {
    try {
      const { error } = await supabase
        .from("recommendation_rules")
        .update({ is_active: !rule.is_active })
        .eq("id", rule.id);

      if (error) throw error;
      
      fetchRules();
    } catch (error) {
      console.error("Error toggling rule:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const updateConditionConfig = (key: string, value: any) => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      condition_config: { ...editingRule.condition_config, [key]: value }
    });
  };

  const getConditionTypeInfo = (type: string) => {
    return CONDITION_TYPES.find(t => t.value === type);
  };

  const renderConditionEditor = () => {
    if (!editingRule) return null;

    const conditionType = editingRule.condition_type;

    return (
      <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Zap className="h-4 w-4" />
          Configuration de la condition
        </div>

        {/* Nouveau: Conditions avancées unifiées */}
        {conditionType === "unified" && (
          <ConditionEditor
            value={editingRule.condition_config as UnifiedConditionConfig || { type: 'always', conditions: [], logic: 'AND' }}
            onChange={(config) => setEditingRule({
              ...editingRule,
              condition_config: config
            })}
            maxConditions={5}
            showAlwaysOption={true}
          />
        )}

        {/* Simulation threshold */}
        {conditionType === "simulation_threshold" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Définissez les seuils de résultats de simulation qui déclenchent cette recommandation.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Seuil économie PER (€)</Label>
                <Input
                  type="number"
                  value={editingRule.condition_config.per_threshold || 0}
                  onChange={(e) => updateConditionConfig("per_threshold", Number(e.target.value))}
                  placeholder="1500"
                />
                <p className="text-xs text-muted-foreground">Si économie PER &gt; ce seuil</p>
              </div>
              <div className="space-y-2">
                <Label>Seuil optimisation fiscale (€)</Label>
                <Input
                  type="number"
                  value={editingRule.condition_config.optim_threshold || 0}
                  onChange={(e) => updateConditionConfig("optim_threshold", Number(e.target.value))}
                  placeholder="2000"
                />
                <p className="text-xs text-muted-foreground">Si économie optimisation &gt; ce seuil</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Seuil épargne manquante (€)</Label>
                <Input
                  type="number"
                  value={editingRule.condition_config.epargne_threshold || 0}
                  onChange={(e) => updateConditionConfig("epargne_threshold", Number(e.target.value))}
                  placeholder="5000"
                />
                <p className="text-xs text-muted-foreground">Si épargne manquante &gt; ce seuil</p>
              </div>
              <div className="space-y-2">
                <Label>Seuil capacité emprunt (€)</Label>
                <Input
                  type="number"
                  value={editingRule.condition_config.capacite_threshold || 0}
                  onChange={(e) => updateConditionConfig("capacite_threshold", Number(e.target.value))}
                  placeholder="100000"
                />
                <p className="text-xs text-muted-foreground">Si capacité &gt; ce seuil</p>
              </div>
            </div>
          </div>
        )}

        {/* Financial threshold */}
        {conditionType === "financial_threshold" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Basez la condition sur les données du profil financier de l'utilisateur.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Clé à évaluer</Label>
                <Select
                  value={editingRule.condition_config.key || ""}
                  onValueChange={(value) => updateConditionConfig("key", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une clé" />
                  </SelectTrigger>
                  <SelectContent>
                    {FINANCIAL_KEYS.map((key) => (
                      <SelectItem key={key.value} value={key.value}>
                        {key.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Opérateur</Label>
                <Select
                  value={editingRule.condition_config.operator || ">"}
                  onValueChange={(value) => updateConditionConfig("operator", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valeur</Label>
                <Input
                  type="number"
                  value={editingRule.condition_config.value || 0}
                  onChange={(e) => updateConditionConfig("value", Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Module progress */}
        {conditionType === "module_progress" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Condition basée sur la progression dans les modules de formation.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Opérateur</Label>
                <Select
                  value={editingRule.condition_config.operator || "<"}
                  onValueChange={(value) => updateConditionConfig("operator", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nombre de modules</Label>
                <Input
                  type="number"
                  value={editingRule.condition_config.module_count || 0}
                  onChange={(e) => updateConditionConfig("module_count", Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Financial profile incomplete */}
        {conditionType === "financial_profile_incomplete" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Déclenche si le profil financier n'est pas complet au pourcentage spécifié.
            </p>
            <div className="space-y-2">
              <Label>Seuil de complétion (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={editingRule.condition_config.completeness_threshold || 100}
                onChange={(e) => updateConditionConfig("completeness_threshold", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                La recommandation s'affiche si le profil est complété à moins de ce pourcentage
              </p>
            </div>
          </div>
        )}

        {/* Custom condition */}
        {conditionType === "custom" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Définissez une ou plusieurs conditions personnalisées.
            </p>
            <div className="space-y-3">
              {(editingRule.condition_config.conditions || []).map((cond: any, index: number) => (
                <div key={index} className="grid grid-cols-4 gap-2 items-end">
                  <Select
                    value={cond.key || ""}
                    onValueChange={(value) => {
                      const conditions = [...(editingRule.condition_config.conditions || [])];
                      conditions[index] = { ...conditions[index], key: value };
                      updateConditionConfig("conditions", conditions);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Clé" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...FINANCIAL_KEYS, ...SIMULATION_KEYS].map((key) => (
                        <SelectItem key={key.value} value={key.value}>
                          {key.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={cond.operator || ">"}
                    onValueChange={(value) => {
                      const conditions = [...(editingRule.condition_config.conditions || [])];
                      conditions[index] = { ...conditions[index], operator: value };
                      updateConditionConfig("conditions", conditions);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={cond.value || 0}
                    onChange={(e) => {
                      const conditions = [...(editingRule.condition_config.conditions || [])];
                      conditions[index] = { ...conditions[index], value: Number(e.target.value) };
                      updateConditionConfig("conditions", conditions);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const conditions = (editingRule.condition_config.conditions || []).filter((_: any, i: number) => i !== index);
                      updateConditionConfig("conditions", conditions);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const conditions = [...(editingRule.condition_config.conditions || []), { key: "", operator: ">", value: 0 }];
                  updateConditionConfig("conditions", conditions);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une condition
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Logique combinatoire</Label>
              <Select
                value={editingRule.condition_config.logic || "AND"}
                onValueChange={(value) => updateConditionConfig("logic", value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">Toutes les conditions (ET)</SelectItem>
                  <SelectItem value="OR">Au moins une condition (OU)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Simple conditions without config */}
        {["no_risk_profile", "no_modules", "no_appointment", "no_simulation", "no_diagnostic", "diagnostic_incomplete", "diagnostic_completed", "always"].includes(conditionType) && (
          <p className="text-sm text-muted-foreground italic">
            Cette condition ne nécessite pas de configuration supplémentaire.
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight hero-gradient">Recommandations</h2>
          <p className="text-muted-foreground">
            Configurez les recommandations personnalisées affichées aux utilisateurs
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle règle
        </Button>
      </div>

      {/* Legend */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-700">Haute</Badge>
              <span className="text-muted-foreground">Priorité haute (rouge)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-100 text-orange-700">Moyenne</Badge>
              <span className="text-muted-foreground">Priorité moyenne (orange)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700">Basse</Badge>
              <span className="text-muted-foreground">Priorité basse (bleu)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className={!rule.is_active ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {getConditionTypeInfo(rule.condition_type)?.label || rule.condition_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {rule.internal_name || rule.rule_key}
                      </code>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{rule.description || "Aucune description"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={() => handleToggleActive(rule)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingRule(editingRule?.id === rule.id ? null : rule)}
                  >
                    {editingRule?.id === rule.id ? "Fermer" : "Modifier"}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {editingRule?.id === rule.id && (
              <CardContent className="border-t pt-4">
                <Tabs defaultValue="condition" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="condition" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Condition
                    </TabsTrigger>
                    <TabsTrigger value="display" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Affichage
                    </TabsTrigger>
                    <TabsTrigger value="action" className="gap-2">
                      <Zap className="h-4 w-4" />
                      Action
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="condition" className="space-y-4 pt-4">
                    {/* Nom interne - en premier */}
                    <div className="md:col-span-2 space-y-2">
                      <Label className="flex items-center gap-2">
                        Nom interne
                        <span className="text-xs text-muted-foreground">(identifiant unique)</span>
                      </Label>
                      <Input
                        value={editingRule.internal_name || generateRecommendationInternalName(editingRule.condition_type, editingRule.title, editingRule.priority)}
                        onChange={(e) => setEditingRule({ ...editingRule, internal_name: e.target.value })}
                        className="font-mono text-sm"
                        placeholder="reco_no_risk_profile_complete_votre_0"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom de la règle</Label>
                        <Input
                          value={editingRule.rule_name}
                          onChange={(e) => setEditingRule({ ...editingRule, rule_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description (admin)</Label>
                        <Input
                          value={editingRule.description || ""}
                          onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Type de condition</Label>
                      <Select
                        value={editingRule.condition_type}
                        onValueChange={(value) => setEditingRule({ 
                          ...editingRule, 
                          condition_type: value,
                          condition_config: {}, // Reset config when changing type
                          internal_name: generateRecommendationInternalName(value, editingRule.title, editingRule.priority)
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex flex-col">
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {getConditionTypeInfo(editingRule.condition_type)?.description}
                      </p>
                    </div>

                    {renderConditionEditor()}
                  </TabsContent>

                  <TabsContent value="display" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Titre affiché</Label>
                      <Input
                        value={editingRule.title}
                        onChange={(e) => setEditingRule({ ...editingRule, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea
                        value={editingRule.message}
                        onChange={(e) => setEditingRule({ ...editingRule, message: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Icône</Label>
                        <IconSelector
                          value={editingRule.icon}
                          onChange={(value) => setEditingRule({ ...editingRule, icon: value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Priorité d'affichage</Label>
                        <Select
                          value={editingRule.display_priority}
                          onValueChange={(value) => setEditingRule({ ...editingRule, display_priority: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">Haute (rouge)</SelectItem>
                            <SelectItem value="medium">Moyenne (orange)</SelectItem>
                            <SelectItem value="low">Basse (bleu)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Ordre de priorité</Label>
                        <Input
                          type="number"
                          value={editingRule.priority}
                          onChange={(e) => setEditingRule({ ...editingRule, priority: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="mt-4 p-4 border rounded-lg bg-background">
                      <p className="text-xs text-muted-foreground mb-2">Aperçu</p>
                      <div className={`p-3 rounded-lg border-2 ${
                        editingRule.display_priority === "high" 
                          ? "border-red-200 bg-red-50/50" 
                          : editingRule.display_priority === "medium"
                          ? "border-orange-200 bg-orange-50/50"
                          : "border-blue-200 bg-blue-50/50"
                      }`}>
                        <h4 className="font-semibold">{editingRule.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{editingRule.message}</p>
                        <Button size="sm" className="mt-2">{editingRule.cta_text}</Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="action" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Texte du bouton</Label>
                      <Input
                        value={editingRule.cta_text}
                        onChange={(e) => setEditingRule({ ...editingRule, cta_text: e.target.value })}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type d'action</Label>
                        <Select
                          value={editingRule.cta_action_type}
                          onValueChange={(value) => setEditingRule({ ...editingRule, cta_action_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="navigate">Navigation interne</SelectItem>
                            <SelectItem value="external_url">Lien externe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>{editingRule.cta_action_type === "navigate" ? "Route" : "URL"}</Label>
                        <Input
                          value={editingRule.cta_action_value}
                          onChange={(e) => setEditingRule({ ...editingRule, cta_action_value: e.target.value })}
                          placeholder={editingRule.cta_action_type === "navigate" ? "/parcours" : "https://..."}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2 pt-6 border-t mt-6">
                  <Button onClick={() => handleSave(editingRule)} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </Button>
                  <Button variant="destructive" onClick={() => handleDelete(editingRule.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
