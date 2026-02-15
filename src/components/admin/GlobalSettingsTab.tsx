import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, RefreshCw, Plus, Trash2, AlertCircle, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { toast } from 'sonner';
import { SETTING_CATEGORIES, GlobalSetting, TaxBracket } from '@/types/global-settings';
import { invalidateSettingsCache } from '@/hooks/useGlobalSettings';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface EditableValue {
  id: string;
  value: string | number | boolean | TaxBracket[];
  isDirty: boolean;
}

// Sous-catégories pour une meilleure organisation
const SUBCATEGORIES: Record<string, Record<string, string>> = {
  fiscal_rules: {
    'tax_': 'Tranches d\'imposition',
    'social_charges': 'Charges sociales',
    'pfu_': 'Flat Tax / PFU',
    'csg_': 'CSG',
    'niche_': 'Plafonds niches fiscales',
    'girardin_': 'Girardin Industriel',
    'pinel_': 'Pinel',
    'micro_bic': 'Micro-BIC / LMNP',
    'dons_': 'Dons & Réductions IR',
    'aide_': 'Crédits d\'impôt',
    'garde_': 'Crédits d\'impôt',
    'pme_': 'PME & Investissements',
    'esus_': 'PME & Investissements',
    'per_': 'PER',
    'qf_': 'Quotient familial',
    'pvi_abattement': 'PVI - Abattements',
    'pvi_surtaxe': 'PVI - Surtaxe',
    'pvi_': 'PVI - Taux de base',
    'default': 'Autres règles fiscales',
  },
  recommendation_thresholds: {
    'cta_tmi': 'Seuils TMI',
    'cta_per': 'Seuils PER',
    'cta_epargne': 'Seuils Épargne',
    'cta_capacite': 'Seuils Capacité d\'emprunt',
    'cta_reste': 'Reste à vivre',
    'cta_lmnp': 'Seuils LMNP',
    'cta_espp': 'Seuils ESPP',
    'cta_girardin': 'Seuils Girardin',
    'cta_pme': 'Seuils PME',
    'lead_': 'Qualification leads',
    'default': 'Autres seuils',
  },
  simulation_defaults: {
    'default_': 'Paramètres par défaut',
    'max_': 'Limites',
    'min_': 'Limites',
    'epargne_niveau': 'Épargne - Niveaux de sécurité',
    'epargne_coef': 'Épargne - Coefficients métier',
    'epargne_seuil': 'Épargne - Seuils scoring',
    'epargne_objectif': 'Épargne - Objectifs',
    'brut_net': 'Capacité d\'épargne',
    'optimisation_': 'Capacité d\'épargne',
    'budget_rule': 'Règle budgétaire (50/30/20)',
    'endettement_': 'Seuils endettement',
    'default': 'Autres paramètres',
  },
  lead_qualification: {
    'rang_1': 'Rang 1 (faible potentiel)',
    'rang_2': 'Rang 2 (potentiel moyen)',
    'rang_3': 'Rang 3 (haut potentiel)',
    'default': 'Autres',
  },
  product_constants: {
    'espp_': 'ESPP',
    'return_rate': 'Taux de rendement',
    'retirement_': 'Retraite',
    'rsu_': 'RSU',
    'expected_': 'Projections marché',
    'default': 'Autres constantes',
  },
};

const getSubcategory = (category: string, key: string): string => {
  const subcats = SUBCATEGORIES[category] || {};
  for (const [prefix, label] of Object.entries(subcats)) {
    if (prefix !== 'default' && key.startsWith(prefix)) {
      return label;
    }
  }
  return subcats['default'] || 'Autres';
};

export const GlobalSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<GlobalSetting[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, EditableValue>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('fiscal_rules');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('global_settings')
        .select('*')
        .order('category')
        .order('display_order');

      if (error) throw error;
      setSettings((data || []) as unknown as GlobalSetting[]);
      setEditedValues({});
    } catch (err) {
      console.error('Error fetching settings:', err);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Initialiser toutes les sous-catégories comme ouvertes
  useEffect(() => {
    const allSubcats: Record<string, boolean> = {};
    Object.keys(SUBCATEGORIES).forEach(cat => {
      Object.values(SUBCATEGORIES[cat]).forEach(subcat => {
        allSubcats[`${cat}-${subcat}`] = true;
      });
    });
    setExpandedSubcategories(allSubcats);
  }, []);

  const handleValueChange = (setting: GlobalSetting, newValue: string | number | boolean | TaxBracket[]) => {
    setEditedValues(prev => ({
      ...prev,
      [setting.id]: {
        id: setting.id,
        value: newValue,
        isDirty: true,
      },
    }));
  };

  const parseJsonValue = (value: unknown): string | number | boolean | TaxBracket[] => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value as string | number | boolean | TaxBracket[];
  };

  const getCurrentValue = (setting: GlobalSetting): string | number | boolean | TaxBracket[] => {
    if (editedValues[setting.id]) {
      return editedValues[setting.id].value;
    }
    return parseJsonValue(setting.value);
  };

  const saveAllChanges = async () => {
    const dirtySettings = Object.values(editedValues).filter(v => v.isDirty);
    if (dirtySettings.length === 0) {
      toast.info('Aucune modification à sauvegarder');
      return;
    }

    setIsSaving(true);
    try {
      for (const edited of dirtySettings) {
        const jsonValue = typeof edited.value === 'object' 
          ? JSON.stringify(edited.value) 
          : String(edited.value);

        const { error } = await supabase
          .from('global_settings')
          .update({ value: jsonValue })
          .eq('id', edited.id);

        if (error) throw error;
      }

      invalidateSettingsCache();
      toast.success(`${dirtySettings.length} paramètre(s) sauvegardé(s)`);
      await fetchSettings();
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSubcategory = (key: string) => {
    setExpandedSubcategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderTaxBracketsEditor = (setting: GlobalSetting) => {
    const brackets = getCurrentValue(setting) as TaxBracket[];
    
    const updateBracket = (index: number, field: 'seuil' | 'taux', value: number) => {
      const newBrackets = [...brackets];
      newBrackets[index] = { ...newBrackets[index], [field]: value };
      handleValueChange(setting, newBrackets);
    };

    const addBracket = () => {
      const lastBracket = brackets[brackets.length - 1];
      const newBrackets = [...brackets, { seuil: (lastBracket?.seuil || 0) + 10000, taux: 50 }];
      handleValueChange(setting, newBrackets);
    };

    const removeBracket = (index: number) => {
      if (brackets.length <= 2) {
        toast.error('Minimum 2 tranches requises');
        return;
      }
      const newBrackets = brackets.filter((_, i) => i !== index);
      handleValueChange(setting, newBrackets);
    };

    return (
      <Card className="col-span-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{setting.label}</CardTitle>
          {setting.description && <CardDescription className="text-xs">{setting.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_100px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
              <span>Seuil (€)</span>
              <span>Taux (%)</span>
              <span></span>
            </div>
            {brackets.map((bracket, index) => (
              <div key={index} className="grid grid-cols-[1fr_100px_40px] gap-2 items-center">
                <Input
                  type="number"
                  value={bracket.seuil}
                  onChange={(e) => updateBracket(index, 'seuil', parseFloat(e.target.value) || 0)}
                  disabled={index === 0}
                  className="h-8"
                />
                <Input
                  type="number"
                  value={bracket.taux}
                  onChange={(e) => updateBracket(index, 'taux', parseFloat(e.target.value) || 0)}
                  min={0}
                  max={100}
                  className="h-8"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBracket(index)}
                  disabled={index === 0}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addBracket} className="w-full mt-2">
              <Plus className="h-3 w-3 mr-1" />
              Ajouter une tranche
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderInlineValueEditor = (setting: GlobalSetting) => {
    const value = getCurrentValue(setting);
    const isDirty = editedValues[setting.id]?.isDirty;
    const isNumeric = ['number', 'percentage', 'currency'].includes(setting.value_type);
    const isBoolean = setting.value_type === 'boolean';

    const suffix = setting.value_type === 'percentage' ? '%' : 
                   setting.value_type === 'currency' ? '€' : '';

    if (isBoolean) {
      return (
        <input
          type="checkbox"
          checked={typeof value === 'boolean' ? value : false}
          onChange={(e) => handleValueChange(setting, e.target.checked)}
          className={`h-4 w-4 ${isDirty ? 'ring-2 ring-primary' : ''}`}
        />
      );
    }

    return (
      <div className="relative w-36">
        <Input
          type="text"
          inputMode="decimal"
          value={typeof value === 'boolean' ? '' : String(value).replace('.', ',')}
          onChange={(e) => {
            if (isNumeric) {
              // Support des virgules françaises
              let inputVal = e.target.value.replace(',', '.');
              // Permettre la saisie en cours (vide, moins, point seul)
              if (inputVal === '' || inputVal === '-' || inputVal === '.' || inputVal === '-.') {
                return; // Ne pas mettre à jour, laisser l'utilisateur taper
              }
              const parsed = parseFloat(inputVal);
              if (!isNaN(parsed)) {
                handleValueChange(setting, parsed);
              }
            } else {
              handleValueChange(setting, e.target.value);
            }
          }}
          onBlur={(e) => {
            // Sur blur, s'assurer qu'on a une valeur valide
            if (isNumeric) {
              const inputVal = e.target.value.replace(',', '.');
              const parsed = parseFloat(inputVal);
              if (isNaN(parsed) || inputVal === '') {
                handleValueChange(setting, 0);
              }
            }
          }}
          className={`h-8 text-sm text-right ${suffix ? 'pr-7' : ''} ${isDirty ? 'border-primary ring-1 ring-primary/30 bg-primary/5' : ''}`}
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
            {suffix}
          </span>
        )}
      </div>
    );
  };

  // Filtrage et groupement
  const filteredAndGroupedSettings = useMemo(() => {
    const filtered = settings.filter(s => {
      const categoryMatch = s.category === activeCategory;
      const yearMatch = selectedYear === 'all' || s.year === null || String(s.year) === selectedYear;
      const searchMatch = !searchQuery || 
        s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return categoryMatch && yearMatch && searchMatch;
    });

    // Grouper par sous-catégorie
    const grouped: Record<string, GlobalSetting[]> = {};
    filtered.forEach(setting => {
      const subcat = getSubcategory(setting.category, setting.key);
      if (!grouped[subcat]) grouped[subcat] = [];
      grouped[subcat].push(setting);
    });

    // Trier les settings dans chaque groupe
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    });

    return grouped;
  }, [settings, activeCategory, selectedYear, searchQuery]);

  const dirtyCount = Object.values(editedValues).filter(v => v.isDirty).length;
  const totalSettings = settings.filter(s => s.category === activeCategory).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Paramètres Globaux</h2>
          <p className="text-sm text-muted-foreground">
            {totalSettings} paramètres configurables
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 w-48"
            />
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchSettings} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={saveAllChanges} disabled={isSaving || dirtyCount === 0}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Sauvegarder {dirtyCount > 0 && `(${dirtyCount})`}
          </Button>
        </div>
      </div>

      {dirtyCount > 0 && (
        <Alert variant="default" className="border-primary/50 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            {dirtyCount} modification(s) non sauvegardée(s)
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {Object.entries(SETTING_CATEGORIES).map(([key, label]) => {
            const count = settings.filter(s => s.category === key).length;
            return (
              <TabsTrigger key={key} value={key} className="text-xs whitespace-nowrap">
                {label}
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.keys(SETTING_CATEGORIES).map((category) => (
          <TabsContent key={category} value={category} className="mt-4 space-y-3">
            {Object.entries(filteredAndGroupedSettings).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Aucun paramètre trouvé
              </div>
            ) : (
              Object.entries(filteredAndGroupedSettings).map(([subcategory, subcatSettings]) => {
                const collapsibleKey = `${category}-${subcategory}`;
                const isExpanded = expandedSubcategories[collapsibleKey] !== false;
                const hasTaxBrackets = subcatSettings.some(s => s.key === 'tax_brackets');

                return (
                  <Collapsible key={subcategory} open={isExpanded}>
                    <Card>
                      <CollapsibleTrigger 
                        onClick={() => toggleSubcategory(collapsibleKey)}
                        className="w-full"
                      >
                        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <CardTitle className="text-sm font-medium">{subcategory}</CardTitle>
                            <Badge variant="outline" className="text-[10px]">
                              {subcatSettings.length}
                            </Badge>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-2 px-2">
                          {hasTaxBrackets ? (
                            <div className="grid gap-4">
                              {subcatSettings.map(setting => 
                                setting.key === 'tax_brackets' 
                                  ? renderTaxBracketsEditor(setting)
                                  : null
                              )}
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                  <TableHead className="text-xs h-8 w-[40%]">Paramètre</TableHead>
                                  <TableHead className="text-xs h-8 w-[15%]">Année</TableHead>
                                  <TableHead className="text-xs h-8 w-[15%]">Type</TableHead>
                                  <TableHead className="text-xs h-8 w-[30%] text-right">Valeur</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {subcatSettings.filter(s => s.key !== 'tax_brackets').map((setting) => {
                                  const isDirty = editedValues[setting.id]?.isDirty;
                                  return (
                                    <TableRow 
                                      key={setting.id} 
                                      className={`${isDirty ? 'bg-primary/5' : ''} hover:bg-muted/30`}
                                    >
                                      <TableCell className="py-2">
                                        <div>
                                          <p className="text-sm font-medium">{setting.label}</p>
                                          {setting.description && (
                                            <p className="text-xs text-muted-foreground truncate max-w-[300px]" title={setting.description}>
                                              {setting.description}
                                            </p>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-2">
                                        {setting.year ? (
                                          <Badge variant="secondary" className="text-[10px]">
                                            {setting.year}
                                          </Badge>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="py-2">
                                        <Badge variant="outline" className="text-[10px]">
                                          {setting.value_type}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="py-2 text-right">
                                        {renderInlineValueEditor(setting)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default GlobalSettingsTab;