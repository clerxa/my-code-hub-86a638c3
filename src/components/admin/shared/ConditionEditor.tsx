/**
 * Éditeur de conditions unifié pour Recommandations, CTAs et Notifications
 * Utilise le registre centralisé des clés d'évaluation
 */

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Info, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  getAllEvaluationKeys,
  loadDynamicKeys,
  EvaluationKey,
  ValueType
} from '@/components/admin/workflow-hub/EvaluationKeysRegistry';

// Types pour les conditions
export type ConditionOperator = '>' | '<' | '>=' | '<=' | '=' | '!=' | 'between' | 'exists' | 'not_exists';

export interface ConditionConfig {
  key: string;
  operator: ConditionOperator;
  value: number | string | boolean;
  value2?: number | string;
}

export interface UnifiedConditionConfig {
  type: 'always' | 'simple' | 'compound';
  conditions: ConditionConfig[];
  logic?: 'AND' | 'OR';
}

// Labels
const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  '>': 'supérieur à',
  '<': 'inférieur à',
  '>=': 'supérieur ou égal à',
  '<=': 'inférieur ou égal à',
  '=': 'égal à',
  '!=': 'différent de',
  'between': 'entre',
  'exists': 'existe',
  'not_exists': 'n\'existe pas',
};

const TYPE_OPERATORS: Record<ValueType, ConditionOperator[]> = {
  number: ['>', '<', '>=', '<=', '=', '!=', 'between'],
  currency: ['>', '<', '>=', '<=', '=', '!=', 'between'],
  percentage: ['>', '<', '>=', '<=', '=', '!=', 'between'],
  boolean: ['=', '!='],
  string: ['=', '!=', 'exists', 'not_exists'],
  date: ['>', '<', '>=', '<=', '=', '!='],
};

const CATEGORY_ICONS: Record<string, string> = {
  'Spécial': '⚡',
  'Revenus': '💰',
  'Fiscal': '📋',
  'Charges': '💳',
  'Épargne': '🐷',
  'Patrimoine': '🏛️',
  'Situation': '👤',
  'Equity': '📈',
  'Projets': '🏠',
  'Résultats PER': '📊',
  'Résultats Optimisation': '🎯',
  'Résultats Épargne': '🛡️',
  'Résultats LMNP': '🏢',
  'Résultats Emprunt': '🏦',
  'Calculé': '🔢',
  'Progression': '📈',
  'Statut': '✅',
};

interface ConditionEditorProps {
  value: UnifiedConditionConfig;
  onChange: (config: UnifiedConditionConfig) => void;
  maxConditions?: number;
  showAlwaysOption?: boolean;
  filterCategories?: string[];
  filterSources?: string[];
}

export const ConditionEditor = ({
  value,
  onChange,
  maxConditions = 5,
  showAlwaysOption = true,
  filterCategories,
  filterSources,
}: ConditionEditorProps) => {
  const [keys, setKeys] = useState<EvaluationKey[]>([]);
  const [loading, setLoading] = useState(true);

  // Normaliser la valeur pour éviter les erreurs sur conditions undefined
  const normalizedValue: UnifiedConditionConfig = {
    type: value?.type || 'always',
    conditions: value?.conditions || [],
    logic: value?.logic || 'AND',
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadDynamicKeys();
      let allKeys = getAllEvaluationKeys();
      
      // Filtrer par catégories si spécifié
      if (filterCategories && filterCategories.length > 0) {
        allKeys = allKeys.filter(k => filterCategories.includes(k.category));
      }
      
      // Filtrer par sources si spécifié
      if (filterSources && filterSources.length > 0) {
        allKeys = allKeys.filter(k => filterSources.includes(k.source));
      }
      
      setKeys(allKeys);
      setLoading(false);
    };
    load();
  }, [filterCategories, filterSources]);

  // Grouper les clés par catégorie
  const keysByCategory = keys.reduce((acc, key) => {
    if (!acc[key.category]) acc[key.category] = [];
    acc[key.category].push(key);
    return acc;
  }, {} as Record<string, EvaluationKey[]>);

  const handleAlwaysToggle = (checked: boolean) => {
    onChange({
      type: checked ? 'always' : 'simple',
      conditions: checked ? [] : normalizedValue.conditions,
      logic: normalizedValue.logic,
    });
  };

  const handleAddCondition = () => {
    if (normalizedValue.conditions.length >= maxConditions) return;
    const firstKey = keys[0];
    const newCondition: ConditionConfig = {
      key: firstKey?.key || '',
      operator: '>',
      value: firstKey?.type === 'boolean' ? true : 0,
    };
    onChange({
      ...normalizedValue,
      type: 'simple',
      conditions: [...normalizedValue.conditions, newCondition],
    });
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = normalizedValue.conditions.filter((_, i) => i !== index);
    onChange({
      ...normalizedValue,
      type: newConditions.length === 0 && showAlwaysOption ? 'always' : 'simple',
      conditions: newConditions,
    });
  };

  const handleConditionChange = (index: number, field: keyof ConditionConfig, fieldValue: any) => {
    const newConditions = [...normalizedValue.conditions];
    newConditions[index] = { ...newConditions[index], [field]: fieldValue };
    
    // Si on change la clé, adapter l'opérateur et la valeur
    if (field === 'key') {
      const selectedKey = keys.find(k => k.key === fieldValue);
      if (selectedKey) {
        const validOperators = TYPE_OPERATORS[selectedKey.type] || TYPE_OPERATORS.number;
        if (!validOperators.includes(newConditions[index].operator)) {
          newConditions[index].operator = validOperators[0];
        }
        if (selectedKey.type === 'boolean') {
          newConditions[index].value = true;
        } else if (typeof newConditions[index].value === 'boolean') {
          newConditions[index].value = 0;
        }
      }
    }
    
    onChange({ ...normalizedValue, conditions: newConditions });
  };

  const handleLogicChange = (logic: 'AND' | 'OR') => {
    onChange({ ...normalizedValue, logic, type: normalizedValue.conditions.length > 1 ? 'compound' : 'simple' });
  };

  const getKeyInfo = (keyName: string): EvaluationKey | undefined => {
    return keys.find(k => k.key === keyName);
  };

  const getAvailableOperators = (keyName: string): ConditionOperator[] => {
    const key = getKeyInfo(keyName);
    if (!key) return TYPE_OPERATORS.number;
    return TYPE_OPERATORS[key.type] || TYPE_OPERATORS.number;
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground p-4">Chargement des métriques...</div>;
  }

  const isAlways = normalizedValue.type === 'always';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Zap className="h-4 w-4" />
        Configuration des conditions
      </div>

      {/* Option Toujours */}
      {showAlwaysOption && (
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-2">
            <Switch
              checked={isAlways}
              onCheckedChange={handleAlwaysToggle}
            />
            <Label className="cursor-pointer">Toujours afficher (aucune condition)</Label>
          </div>
          {isAlways && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
              Actif
            </Badge>
          )}
        </div>
      )}

      {/* Conditions */}
      {!isAlways && (
        <div className="space-y-3">
          {/* Logique ET/OU */}
          {normalizedValue.conditions.length > 1 && (
            <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm text-blue-800">Logique :</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={normalizedValue.logic === 'AND' ? 'default' : 'outline'}
                  onClick={() => handleLogicChange('AND')}
                  className="h-7 text-xs"
                >
                  ET (toutes)
                </Button>
                <Button
                  size="sm"
                  variant={normalizedValue.logic === 'OR' ? 'default' : 'outline'}
                  onClick={() => handleLogicChange('OR')}
                  className="h-7 text-xs"
                >
                  OU (au moins une)
                </Button>
              </div>
            </div>
          )}

          {/* Liste des conditions */}
          {normalizedValue.conditions.map((condition, index) => {
            const keyInfo = getKeyInfo(condition.key);
            const operators = getAvailableOperators(condition.key);

            return (
              <Card key={index} className="border-dashed border-2">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      {/* Sélection de la métrique */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Métrique</Label>
                          <Select
                            value={condition.key}
                            onValueChange={(v) => handleConditionChange(index, 'key', v)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Choisir..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                              {Object.entries(keysByCategory)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([category, categoryKeys]) => (
                                  <div key={category}>
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                                      {CATEGORY_ICONS[category] || '📌'} {category}
                                    </div>
                                    {categoryKeys.map((key) => (
                                      <SelectItem key={key.key} value={key.key}>
                                        <div className="flex items-center gap-2">
                                          <span className="truncate">{key.label}</span>
                                          {key.unit && (
                                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                                              {key.unit}
                                            </Badge>
                                          )}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </div>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Opérateur */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Opérateur</Label>
                          <Select
                            value={condition.operator}
                            onValueChange={(v) => handleConditionChange(index, 'operator', v as ConditionOperator)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {operators.map((op) => (
                                <SelectItem key={op} value={op}>
                                  {OPERATOR_LABELS[op]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Valeur */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">
                            Valeur {keyInfo?.unit && `(${keyInfo.unit})`}
                          </Label>
                          {keyInfo?.type === 'boolean' ? (
                            <Select
                              value={String(condition.value)}
                              onValueChange={(v) => handleConditionChange(index, 'value', v === 'true')}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Oui / Vrai</SelectItem>
                                <SelectItem value="false">Non / Faux</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : condition.operator === 'between' ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={condition.value as number}
                                onChange={(e) => handleConditionChange(index, 'value', parseFloat(e.target.value) || 0)}
                                className="h-9 w-20"
                              />
                              <span className="text-xs text-muted-foreground">et</span>
                              <Input
                                type="number"
                                value={condition.value2 as number || 0}
                                onChange={(e) => handleConditionChange(index, 'value2', parseFloat(e.target.value) || 0)}
                                className="h-9 w-20"
                              />
                            </div>
                          ) : (
                            <Input
                              type={keyInfo?.type === 'string' ? 'text' : 'number'}
                              value={condition.value as number | string}
                              onChange={(e) => handleConditionChange(
                                index, 
                                'value', 
                                keyInfo?.type === 'string' ? e.target.value : (parseFloat(e.target.value) || 0)
                              )}
                              className="h-9"
                            />
                          )}
                        </div>
                      </div>

                      {/* Résumé lisible */}
                      {keyInfo && (
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded flex items-center gap-2">
                          <Info className="h-3 w-3 flex-shrink-0" />
                          <span>
                            Si <strong>{keyInfo.label}</strong> est {OPERATOR_LABELS[condition.operator]}{' '}
                            <strong>
                              {condition.operator === 'between'
                                ? `${condition.value} et ${condition.value2}`
                                : keyInfo.type === 'boolean'
                                  ? (condition.value ? 'Vrai' : 'Faux')
                                  : `${condition.value}${keyInfo.unit ? ` ${keyInfo.unit}` : ''}`
                              }
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bouton supprimer */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCondition(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Bouton ajouter */}
          {normalizedValue.conditions.length < maxConditions && (
            <Button
              variant="outline"
              onClick={handleAddCondition}
              className="w-full border-dashed gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter une condition
            </Button>
          )}

          {/* Info si aucune condition */}
          {normalizedValue.conditions.length === 0 && !showAlwaysOption && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">Aucune condition configurée</p>
              <p className="text-xs mt-1">Cliquez sur "Ajouter une condition" pour commencer</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper pour convertir l'ancien format vers le nouveau
export function migrateOldConditionConfig(
  conditionType: string,
  conditionConfig: Record<string, any>
): UnifiedConditionConfig {
  // Si déjà au nouveau format
  if (conditionConfig.type && conditionConfig.conditions) {
    return conditionConfig as UnifiedConditionConfig;
  }

  // Migration des anciens formats
  switch (conditionType) {
    case 'always':
      return { type: 'always', conditions: [], logic: 'AND' };
    
    case 'no_risk_profile':
      return {
        type: 'simple',
        conditions: [{ key: 'has_risk_profile', operator: '=', value: false }],
        logic: 'AND'
      };
    
    case 'financial_profile_incomplete':
      return {
        type: 'simple',
        conditions: [{ key: 'is_complete', operator: '=', value: false }],
        logic: 'AND'
      };
    
    case 'no_modules':
      return {
        type: 'simple',
        conditions: [{ key: 'modules_valides_count', operator: '=', value: 0 }],
        logic: 'AND'
      };
    
    case 'simulation_threshold':
      const conditions: ConditionConfig[] = [];
      if (conditionConfig.per_threshold) {
        conditions.push({ key: 'economie_impots', operator: '>', value: conditionConfig.per_threshold });
      }
      if (conditionConfig.optim_threshold) {
        conditions.push({ key: 'economie_totale', operator: '>', value: conditionConfig.optim_threshold });
      }
      return { type: 'compound', conditions, logic: 'OR' };
    
    case 'financial_threshold':
      return {
        type: 'simple',
        conditions: [{
          key: conditionConfig.key || '',
          operator: (conditionConfig.operator || '>') as ConditionOperator,
          value: conditionConfig.value || 0
        }],
        logic: 'AND'
      };
    
    default:
      return { type: 'always', conditions: [], logic: 'AND' };
  }
}

// Helper pour évaluer les conditions (côté client pour preview)
export function evaluateConditions(
  config: UnifiedConditionConfig,
  values: Record<string, number | string | boolean>
): boolean {
  if (config.type === 'always') return true;
  if (config.conditions.length === 0) return true;

  const results = config.conditions.map(cond => {
    const actualValue = values[cond.key];
    if (actualValue === undefined) return false;

    switch (cond.operator) {
      case '>': return actualValue > cond.value;
      case '<': return actualValue < cond.value;
      case '>=': return actualValue >= cond.value;
      case '<=': return actualValue <= cond.value;
      case '=': return actualValue === cond.value;
      case '!=': return actualValue !== cond.value;
      case 'between': return actualValue >= cond.value && actualValue <= (cond.value2 || cond.value);
      case 'exists': return actualValue !== null && actualValue !== undefined && actualValue !== '';
      case 'not_exists': return actualValue === null || actualValue === undefined || actualValue === '';
      default: return false;
    }
  });

  return config.logic === 'OR' 
    ? results.some(r => r)
    : results.every(r => r);
}
