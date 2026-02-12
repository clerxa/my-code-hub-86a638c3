import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Info, Calculator, Layers, Scale, Hash, GitBranch } from "lucide-react";
import {
  CalculationConfig,
  CalculationMode,
  ThresholdRange,
  WeightedCondition,
  MappingRule,
  OnboardingScreen,
} from "@/types/onboarding-cms";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalculationConfigEditorProps {
  config: CalculationConfig | undefined;
  allScreens: OnboardingScreen[];
  onChange: (config: CalculationConfig) => void;
}

const MODE_INFO: Record<CalculationMode, { label: string; description: string; icon: any }> = {
  fixed: {
    label: "Valeur fixe",
    description: "Affiche toujours la même valeur",
    icon: Hash,
  },
  formula: {
    label: "Formule",
    description: "Calcul basé sur une formule mathématique avec les réponses",
    icon: Calculator,
  },
  thresholds: {
    label: "Seuils",
    description: "Résultat différent selon la plage de valeur d'une réponse",
    icon: Layers,
  },
  weighted: {
    label: "Points pondérés",
    description: "Somme de points attribués selon les réponses",
    icon: Scale,
  },
  mapping: {
    label: "Table de correspondance",
    description: "Résultat basé sur une combinaison précise de réponses",
    icon: GitBranch,
  },
};

export function CalculationConfigEditor({
  config,
  allScreens,
  onChange,
}: CalculationConfigEditorProps) {
  const currentConfig: CalculationConfig = config || { mode: "fixed", resultType: "number", fixedValue: 1000 };

  const handleModeChange = (mode: CalculationMode) => {
    const resultType = currentConfig.resultType || "number";
    const newConfig: CalculationConfig = { mode, resultType };
    switch (mode) {
      case "fixed":
        newConfig.fixedValue = resultType === "number" ? 1000 : "Résultat";
        break;
      case "formula":
        newConfig.formula = "";
        break;
      case "thresholds":
        newConfig.thresholds = { sourceField: "", ranges: [] };
        break;
      case "weighted":
        newConfig.weightedConditions = [];
        newConfig.baseValue = 0;
        break;
      case "mapping":
        newConfig.mappingRules = [];
        newConfig.defaultResult = resultType === "number" ? 0 : "";
        break;
    }
    onChange(newConfig);
  };

  const handleResultTypeChange = (resultType: "number" | "text") => {
    onChange({ ...currentConfig, resultType });
  };

  const sliderScreens = allScreens.filter((s) => s.type === "SLIDER");
  const choiceScreens = allScreens.filter((s) =>
    ["SINGLE_CHOICE", "MULTI_CHOICE", "TOGGLE"].includes(s.type)
  );

  const renderModeEditor = () => {
    switch (currentConfig.mode) {
      case "fixed":
        return (
          <div className="space-y-4">
            <div>
              <Label>Valeur fixe</Label>
              <Input
                type={currentConfig.resultType === "text" ? "text" : "number"}
                value={currentConfig.fixedValue ?? (currentConfig.resultType === "text" ? "" : 0)}
                onChange={(e) =>
                  onChange({ 
                    ...currentConfig, 
                    fixedValue: currentConfig.resultType === "text" 
                      ? e.target.value 
                      : parseFloat(e.target.value) 
                  })
                }
                placeholder={currentConfig.resultType === "text" ? "Texte à afficher..." : ""}
              />
            </div>
          </div>
        );

      case "formula":
        return (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>Formule</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>
                        Utilisez les ID d'écran entre accolades comme variables.
                        <br />
                        Exemple: <code>{"{screen_id}"} * 0.08 + 500</code>
                        <br />
                        Opérateurs: +, -, *, /, (, )
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                value={currentConfig.formula || ""}
                onChange={(e) => onChange({ ...currentConfig, formula: e.target.value })}
                placeholder="{ecran_revenu} * 0.08 + 500"
                className="font-mono"
              />
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground mb-2">Variables disponibles :</p>
              <div className="flex flex-wrap gap-2">
                {sliderScreens.map((s) => (
                  <Badge
                    key={s.id}
                    variant="secondary"
                    className="cursor-pointer font-mono"
                    onClick={() =>
                      onChange({
                        ...currentConfig,
                        formula: (currentConfig.formula || "") + `{${s.id}}`,
                      })
                    }
                  >
                    {`{${s.id.slice(0, 8)}...}`}
                    <span className="ml-1 text-muted-foreground">({s.title})</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case "thresholds":
        const thresholds = currentConfig.thresholds || { sourceField: "", ranges: [] };
        return (
          <div className="space-y-4">
            <div>
              <Label>Écran source (curseur)</Label>
              <Select
                value={thresholds.sourceField || "_none"}
                onValueChange={(v) =>
                  onChange({
                    ...currentConfig,
                    thresholds: { ...thresholds, sourceField: v === "_none" ? "" : v },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un écran..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">-- Sélectionner --</SelectItem>
                  {sliderScreens.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.order_num}. {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Plages de valeurs</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newRange: ThresholdRange = { min: 0, max: 100, result: 0 };
                    onChange({
                      ...currentConfig,
                      thresholds: {
                        ...thresholds,
                        ranges: [...thresholds.ranges, newRange],
                      },
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              {thresholds.ranges.map((range, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Min</Label>
                      <Input
                        type="number"
                        value={range.min ?? ""}
                        onChange={(e) => {
                          const newRanges = [...thresholds.ranges];
                          newRanges[index] = {
                            ...range,
                            min: e.target.value ? parseFloat(e.target.value) : undefined,
                          };
                          onChange({
                            ...currentConfig,
                            thresholds: { ...thresholds, ranges: newRanges },
                          });
                        }}
                        placeholder="-∞"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Max</Label>
                      <Input
                        type="number"
                        value={range.max ?? ""}
                        onChange={(e) => {
                          const newRanges = [...thresholds.ranges];
                          newRanges[index] = {
                            ...range,
                            max: e.target.value ? parseFloat(e.target.value) : undefined,
                          };
                          onChange({
                            ...currentConfig,
                            thresholds: { ...thresholds, ranges: newRanges },
                          });
                        }}
                        placeholder="+∞"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Résultat</Label>
                      <Input
                        type="number"
                        value={range.result}
                        onChange={(e) => {
                          const newRanges = [...thresholds.ranges];
                          newRanges[index] = { ...range, result: parseFloat(e.target.value) };
                          onChange({
                            ...currentConfig,
                            thresholds: { ...thresholds, ranges: newRanges },
                          });
                        }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        const newRanges = thresholds.ranges.filter((_, i) => i !== index);
                        onChange({
                          ...currentConfig,
                          thresholds: { ...thresholds, ranges: newRanges },
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case "weighted":
        const conditions = currentConfig.weightedConditions || [];
        return (
          <div className="space-y-4">
            <div>
              <Label>Valeur de base</Label>
              <Input
                type="number"
                value={currentConfig.baseValue || 0}
                onChange={(e) =>
                  onChange({ ...currentConfig, baseValue: parseFloat(e.target.value) })
                }
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Conditions de points</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newCondition: WeightedCondition = {
                      screenId: "",
                      value: "",
                      points: 0,
                    };
                    onChange({
                      ...currentConfig,
                      weightedConditions: [...conditions, newCondition],
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              {conditions.map((cond, index) => {
                const sourceScreen = allScreens.find((s) => s.id === cond.screenId);
                return (
                  <Card key={index} className="p-3">
                    <div className="grid grid-cols-4 gap-2 items-end">
                      <div className="col-span-2">
                        <Label className="text-xs">Écran</Label>
                        <Select
                          value={cond.screenId || "_none"}
                          onValueChange={(v) => {
                            const newConditions = [...conditions];
                            newConditions[index] = {
                              ...cond,
                              screenId: v === "_none" ? "" : v,
                              value: "",
                            };
                            onChange({
                              ...currentConfig,
                              weightedConditions: newConditions,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">-- Sélectionner --</SelectItem>
                            {choiceScreens.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.order_num}. {s.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Valeur</Label>
                        {sourceScreen?.type === "TOGGLE" ? (
                          <Select
                            value={String(cond.value)}
                            onValueChange={(v) => {
                              const newConditions = [...conditions];
                              newConditions[index] = {
                                ...cond,
                                value: v === "true",
                              };
                              onChange({
                                ...currentConfig,
                                weightedConditions: newConditions,
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Oui</SelectItem>
                              <SelectItem value="false">Non</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Select
                            value={String(cond.value) || "_none"}
                            onValueChange={(v) => {
                              const newConditions = [...conditions];
                              newConditions[index] = { ...cond, value: v === "_none" ? "" : v };
                              onChange({
                                ...currentConfig,
                                weightedConditions: newConditions,
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_none">-- Sélectionner --</SelectItem>
                              {sourceScreen?.options.map((opt) => (
                                <SelectItem key={String(opt.value)} value={String(opt.value)}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Points</Label>
                          <Input
                            type="number"
                            value={cond.points}
                            onChange={(e) => {
                              const newConditions = [...conditions];
                              newConditions[index] = {
                                ...cond,
                                points: parseFloat(e.target.value),
                              };
                              onChange({
                                ...currentConfig,
                                weightedConditions: newConditions,
                              });
                            }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive mt-5"
                          onClick={() => {
                            onChange({
                              ...currentConfig,
                              weightedConditions: conditions.filter((_, i) => i !== index),
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case "mapping":
        const rules = currentConfig.mappingRules || [];
        return (
          <div className="space-y-4">
            <div>
              <Label>Résultat par défaut</Label>
              <Input
                type="number"
                value={currentConfig.defaultResult || 0}
                onChange={(e) =>
                  onChange({ ...currentConfig, defaultResult: parseFloat(e.target.value) })
                }
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Règles de correspondance</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newRule: MappingRule = { conditions: [], result: 0 };
                    onChange({
                      ...currentConfig,
                      mappingRules: [...rules, newRule],
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              {rules.map((rule, ruleIndex) => (
                <Card key={ruleIndex} className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Règle {ruleIndex + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        onChange({
                          ...currentConfig,
                          mappingRules: rules.filter((_, i) => i !== ruleIndex),
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {rule.conditions.map((cond, condIndex) => {
                      const sourceScreen = allScreens.find((s) => s.id === cond.screenId);
                      return (
                        <div key={condIndex} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Label className="text-xs">Écran</Label>
                            <Select
                              value={cond.screenId || "_none"}
                              onValueChange={(v) => {
                                const newRules = [...rules];
                                const newConditions = [...rule.conditions];
                                newConditions[condIndex] = {
                                  ...cond,
                                  screenId: v === "_none" ? "" : v,
                                  value: "",
                                };
                                newRules[ruleIndex] = { ...rule, conditions: newConditions };
                                onChange({ ...currentConfig, mappingRules: newRules });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_none">-- Sélectionner --</SelectItem>
                                {choiceScreens.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.order_num}. {s.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">= Valeur</Label>
                            {sourceScreen?.type === "TOGGLE" ? (
                              <Select
                                value={String(cond.value)}
                                onValueChange={(v) => {
                                  const newRules = [...rules];
                                  const newConditions = [...rule.conditions];
                                  newConditions[condIndex] = { ...cond, value: v === "true" };
                                  newRules[ruleIndex] = { ...rule, conditions: newConditions };
                                  onChange({ ...currentConfig, mappingRules: newRules });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Oui</SelectItem>
                                  <SelectItem value="false">Non</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Select
                                value={String(cond.value) || "_none"}
                                onValueChange={(v) => {
                                  const newRules = [...rules];
                                  const newConditions = [...rule.conditions];
                                  newConditions[condIndex] = {
                                    ...cond,
                                    value: v === "_none" ? "" : v,
                                  };
                                  newRules[ruleIndex] = { ...rule, conditions: newConditions };
                                  onChange({ ...currentConfig, mappingRules: newRules });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="_none">-- Sélectionner --</SelectItem>
                                  {sourceScreen?.options.map((opt) => (
                                    <SelectItem key={String(opt.value)} value={String(opt.value)}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              const newRules = [...rules];
                              newRules[ruleIndex] = {
                                ...rule,
                                conditions: rule.conditions.filter((_, i) => i !== condIndex),
                              };
                              onChange({ ...currentConfig, mappingRules: newRules });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        const newRules = [...rules];
                        newRules[ruleIndex] = {
                          ...rule,
                          conditions: [...rule.conditions, { screenId: "", value: "" }],
                        };
                        onChange({ ...currentConfig, mappingRules: newRules });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter condition
                    </Button>
                  </div>

                  <div>
                    <Label className="text-xs">→ Résultat</Label>
                    <Input
                      type="number"
                      value={rule.result}
                      onChange={(e) => {
                        const newRules = [...rules];
                        newRules[ruleIndex] = { ...rule, result: parseFloat(e.target.value) };
                        onChange({ ...currentConfig, mappingRules: newRules });
                      }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Result Type Selection */}
      <div>
        <Label>Type de résultat</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Card
            onClick={() => handleResultTypeChange("number")}
            className={`p-3 cursor-pointer transition-all ${
              currentConfig.resultType === "number"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Hash className={`h-4 w-4 ${currentConfig.resultType === "number" ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-sm font-medium">Nombre</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ex: 1500 €, 25 ans</p>
          </Card>
          <Card
            onClick={() => handleResultTypeChange("text")}
            className={`p-3 cursor-pointer transition-all ${
              currentConfig.resultType === "text"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-sm ${currentConfig.resultType === "text" ? "text-primary" : "text-muted-foreground"}`}>Aa</span>
              <span className="text-sm font-medium">Texte</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ex: "Profil prudent"</p>
          </Card>
        </div>
      </div>

      {/* Mode Selection */}
      <div>
        <Label>Mode de calcul</Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
          {(Object.keys(MODE_INFO) as CalculationMode[])
            .filter(mode => {
              // Filter modes based on result type
              if (currentConfig.resultType === "text") {
                return ["fixed", "thresholds", "mapping"].includes(mode);
              }
              return true;
            })
            .map((mode) => {
              const info = MODE_INFO[mode];
              const Icon = info.icon;
              const isSelected = currentConfig.mode === mode;
              return (
                <Card
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={`p-3 cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium">{info.label}</span>
                  </div>
                </Card>
              );
            })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {MODE_INFO[currentConfig.mode].description}
        </p>
      </div>

      {renderModeEditor()}
    </div>
  );
}
