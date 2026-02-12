/**
 * Vue complète du registre des clés d'évaluation
 * Affiche toutes les clés, leurs utilisations, et permet la gestion
 */

import { useState, useEffect, useMemo } from "react";
import { 
  Database, Search, Filter, RefreshCw, ChevronDown, ChevronRight,
  Calculator, Zap, AlertCircle, Check, FileText, Target, Bell,
  TrendingUp, PiggyBank, User, Home, DollarSign, CreditCard, Building,
  Activity, Shield, Landmark, Building2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getAllEvaluationKeys,
  loadDynamicKeys,
  STATIC_EVALUATION_KEYS,
  EvaluationKey,
  DataSource,
  ValueType,
} from "./EvaluationKeysRegistry";

interface KeyUsage {
  key: string;
  usedInCTAs: number;
  usedInRecommendations: number;
  usedInNotifications: number;
}

// Icônes par catégorie
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Spécial': Zap,
  'Revenus': DollarSign,
  'Fiscal': FileText,
  'Charges': CreditCard,
  'Épargne': PiggyBank,
  'Patrimoine': Building,
  'Situation': User,
  'Equity': TrendingUp,
  'Projets': Home,
  'Résultats PER': Calculator,
  'Résultats Optimisation': Target,
  'Résultats Épargne': Shield,
  'Résultats LMNP': Building2,
  'Résultats Emprunt': Landmark,
  'Calculé': Calculator,
  'Progression': Activity,
  'Auto-détecté': Database,
};

// Couleurs par catégorie
const CATEGORY_COLORS: Record<string, string> = {
  'Spécial': 'bg-purple-100 text-purple-800 border-purple-200',
  'Revenus': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Fiscal': 'bg-blue-100 text-blue-800 border-blue-200',
  'Charges': 'bg-red-100 text-red-800 border-red-200',
  'Épargne': 'bg-amber-100 text-amber-800 border-amber-200',
  'Patrimoine': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Situation': 'bg-gray-100 text-gray-800 border-gray-200',
  'Equity': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Projets': 'bg-orange-100 text-orange-800 border-orange-200',
  'Résultats PER': 'bg-primary/10 text-primary border-primary/20',
  'Résultats Optimisation': 'bg-primary/10 text-primary border-primary/20',
  'Résultats Épargne': 'bg-primary/10 text-primary border-primary/20',
  'Résultats LMNP': 'bg-primary/10 text-primary border-primary/20',
  'Résultats Emprunt': 'bg-primary/10 text-primary border-primary/20',
  'Calculé': 'bg-violet-100 text-violet-800 border-violet-200',
  'Progression': 'bg-teal-100 text-teal-800 border-teal-200',
  'Auto-détecté': 'bg-slate-100 text-slate-800 border-slate-200',
};

const TYPE_COLORS: Record<ValueType, string> = {
  number: 'bg-blue-100 text-blue-800',
  currency: 'bg-emerald-100 text-emerald-800',
  percentage: 'bg-amber-100 text-amber-800',
  string: 'bg-purple-100 text-purple-800',
  boolean: 'bg-pink-100 text-pink-800',
  date: 'bg-orange-100 text-orange-800',
};

const TYPE_LABELS: Record<ValueType, string> = {
  number: 'Nombre',
  currency: 'Montant',
  percentage: 'Pourcentage',
  string: 'Texte',
  boolean: 'Booléen',
  date: 'Date',
};

export function EvaluationKeysView() {
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<EvaluationKey[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ValueType | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [keyUsages, setKeyUsages] = useState<Record<string, KeyUsage>>({});
  const [viewMode, setViewMode] = useState<'categories' | 'table' | 'sources'>('categories');

  // Charger les clés
  const loadKeys = async () => {
    setLoading(true);
    try {
      await loadDynamicKeys();
      setKeys(getAllEvaluationKeys());
      
      // Charger les utilisations des clés
      await loadKeyUsages();
    } catch (err) {
      console.error('Error loading keys:', err);
      toast.error("Erreur lors du chargement des clés");
    } finally {
      setLoading(false);
    }
  };

  // Charger les utilisations
  const loadKeyUsages = async () => {
    try {
      // Charger les CTAs
      const { data: ctas } = await supabase.from('simulator_ctas').select('condition_key');
      
      // Charger les recommandations
      const { data: recommendations } = await supabase.from('recommendation_rules').select('condition_config');
      
      // Charger les notifications
      const { data: notifications } = await supabase.from('notification_rules').select('trigger_condition, threshold_value');
      
      const usages: Record<string, KeyUsage> = {};
      
      // Compter les CTAs
      ctas?.forEach(cta => {
        if (cta.condition_key && cta.condition_key !== 'always') {
          if (!usages[cta.condition_key]) {
            usages[cta.condition_key] = { key: cta.condition_key, usedInCTAs: 0, usedInRecommendations: 0, usedInNotifications: 0 };
          }
          usages[cta.condition_key].usedInCTAs++;
        }
      });
      
      // Compter les recommandations
      recommendations?.forEach(rec => {
        const config = rec.condition_config as Record<string, any>;
        if (config?.key) {
          if (!usages[config.key]) {
            usages[config.key] = { key: config.key, usedInCTAs: 0, usedInRecommendations: 0, usedInNotifications: 0 };
          }
          usages[config.key].usedInRecommendations++;
        }
        // Conditions personnalisées
        if (config?.conditions) {
          (config.conditions as any[]).forEach(cond => {
            if (cond?.key) {
              if (!usages[cond.key]) {
                usages[cond.key] = { key: cond.key, usedInCTAs: 0, usedInRecommendations: 0, usedInNotifications: 0 };
              }
              usages[cond.key].usedInRecommendations++;
            }
          });
        }
      });
      
      setKeyUsages(usages);
    } catch (err) {
      console.error('Error loading usages:', err);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  // Filtrer les clés
  const filteredKeys = useMemo(() => {
    let result = keys;
    
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(k =>
        k.label.toLowerCase().includes(lowerSearch) ||
        k.key.toLowerCase().includes(lowerSearch) ||
        k.category.toLowerCase().includes(lowerSearch) ||
        k.source.toLowerCase().includes(lowerSearch)
      );
    }
    
    if (selectedCategory) {
      result = result.filter(k => k.category === selectedCategory);
    }
    
    if (selectedType) {
      result = result.filter(k => k.type === selectedType);
    }
    
    return result;
  }, [keys, search, selectedCategory, selectedType]);

  // Grouper par catégorie
  const keysByCategory = useMemo(() => {
    return filteredKeys.reduce((acc, key) => {
      if (!acc[key.category]) acc[key.category] = [];
      acc[key.category].push(key);
      return acc;
    }, {} as Record<string, EvaluationKey[]>);
  }, [filteredKeys]);

  // Grouper par source
  const keysBySource = useMemo(() => {
    return filteredKeys.reduce((acc, key) => {
      if (!acc[key.source]) acc[key.source] = [];
      acc[key.source].push(key);
      return acc;
    }, {} as Record<string, EvaluationKey[]>);
  }, [filteredKeys]);

  // Statistiques
  const stats = useMemo(() => {
    return {
      total: keys.length,
      static: keys.filter(k => !k.isFromDb).length,
      dynamic: keys.filter(k => k.isFromDb).length,
      calculated: keys.filter(k => k.isCalculated).length,
      categories: Object.keys(keysByCategory).length,
      usedKeys: Object.keys(keyUsages).length,
    };
  }, [keys, keysByCategory, keyUsages]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(Object.keys(keysByCategory)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const renderUsageBadges = (key: EvaluationKey) => {
    const usage = keyUsages[key.key];
    if (!usage) return null;

    return (
      <div className="flex items-center gap-1">
        {usage.usedInCTAs > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-[10px] px-1 py-0 bg-blue-50">
                  CTA: {usage.usedInCTAs}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Utilisé dans {usage.usedInCTAs} CTA(s)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {usage.usedInRecommendations > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-[10px] px-1 py-0 bg-amber-50">
                  Reco: {usage.usedInRecommendations}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Utilisé dans {usage.usedInRecommendations} recommandation(s)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {usage.usedInNotifications > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-[10px] px-1 py-0 bg-purple-50">
                  Notif: {usage.usedInNotifications}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Utilisé dans {usage.usedInNotifications} notification(s)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Registre des clés d'évaluation
            </CardTitle>
            <CardDescription>
              {stats.total} clés disponibles • {stats.static} statiques • {stats.dynamic} dynamiques • {stats.calculated} calculées
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadKeys} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filtres */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une clé..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Toutes catégories</option>
              {Object.keys(keysByCategory).sort().map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <select
              value={selectedType || ''}
              onChange={(e) => setSelectedType((e.target.value as ValueType) || null)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Tous types</option>
              {Object.entries(TYPE_LABELS).map(([type, label]) => (
                <option key={type} value={type}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Vue */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="categories">Par catégorie</TabsTrigger>
              <TabsTrigger value="sources">Par source</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>
            
            {viewMode === 'categories' && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={expandAll}>
                  Tout déplier
                </Button>
                <Button variant="ghost" size="sm" onClick={collapseAll}>
                  Tout replier
                </Button>
              </div>
            )}
          </div>
          
          {/* Vue par catégorie */}
          <TabsContent value="categories" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {Object.entries(keysByCategory).sort().map(([category, categoryKeys]) => {
                  const Icon = CATEGORY_ICONS[category] || Database;
                  const isExpanded = expandedCategories.has(category);
                  
                  return (
                    <Collapsible 
                      key={category} 
                      open={isExpanded}
                      onOpenChange={() => toggleCategory(category)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className={cn(
                          "flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                          CATEGORY_COLORS[category]
                        )}>
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{category}</span>
                            <Badge variant="secondary" className="text-xs">
                              {categoryKeys.length}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {categoryKeys.some(k => k.isFromDb) && (
                              <Badge variant="outline" className="text-xs bg-blue-50">
                                <Database className="h-3 w-3 mr-1" />
                                {categoryKeys.filter(k => k.isFromDb).length} dyn.
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 ml-6 space-y-1">
                          {categoryKeys.map(key => (
                            <div 
                              key={key.key}
                              className="flex items-center justify-between p-2 rounded border bg-background hover:bg-muted/30"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Badge className={cn("text-xs px-1.5", TYPE_COLORS[key.type])}>
                                  {key.unit || key.type}
                                </Badge>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-medium text-sm truncate">{key.label}</span>
                                  <code className="text-xs text-muted-foreground truncate">{key.key}</code>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {renderUsageBadges(key)}
                                {key.isFromDb && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Database className="h-3.5 w-3.5 text-blue-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>Clé dynamique (DB)</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {key.isCalculated && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Calculator className="h-3.5 w-3.5 text-violet-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Valeur calculée
                                        {key.formula && <code className="block text-xs mt-1">{key.formula}</code>}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Vue par source */}
          <TabsContent value="sources" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(keysBySource).sort().map(([source, sourceKeys]) => (
                  <Card key={source} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{source}</code>
                      <Badge variant="secondary">{sourceKeys.length}</Badge>
                    </div>
                    <div className="space-y-1">
                      {sourceKeys.slice(0, 5).map(key => (
                        <div key={key.key} className="flex items-center gap-2 text-sm">
                          <Badge className={cn("text-[10px] px-1", TYPE_COLORS[key.type])}>
                            {key.unit || key.type}
                          </Badge>
                          <span className="truncate">{key.label}</span>
                        </div>
                      ))}
                      {sourceKeys.length > 5 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          + {sourceKeys.length - 5} autres clés
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Vue table */}
          <TabsContent value="table" className="mt-4">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clé</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Utilisations</TableHead>
                    <TableHead>Flags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKeys.map(key => (
                    <TableRow key={key.key}>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{key.key}</code>
                      </TableCell>
                      <TableCell className="font-medium">{key.label}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", TYPE_COLORS[key.type])}>
                          {key.unit || key.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", CATEGORY_COLORS[key.category])}>
                          {key.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-[10px] text-muted-foreground">{key.source}</code>
                      </TableCell>
                      <TableCell>{renderUsageBadges(key)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {key.isFromDb && <Database className="h-3.5 w-3.5 text-blue-500" />}
                          {key.isCalculated && <Calculator className="h-3.5 w-3.5 text-violet-500" />}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default EvaluationKeysView;
