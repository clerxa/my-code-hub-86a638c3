import { useState, useEffect } from "react";
import { RefreshCw, Check, AlertCircle, Database, Download, Plus, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  STATIC_EVALUATION_KEYS,
  getAllEvaluationKeys,
  loadDynamicKeys,
  addKeysToRegistry,
  removeKeyFromRegistry,
  DataSource,
  EvaluationKey,
  ValueType
} from "./EvaluationKeysRegistry";

interface SyncResult {
  source: DataSource;
  registeredKeys: string[];
  dbColumns: string[];
  missingInRegistry: string[];
  missingInDb: string[];
  status: 'ok' | 'warning' | 'error';
}

const SOURCE_TABLES: Record<DataSource, string> = {
  user_financial_profiles: 'user_financial_profiles',
  per_simulations: 'per_simulations',
  optimisation_fiscale_simulations: 'optimisation_fiscale_simulations',
  epargne_precaution_simulations: 'epargne_precaution_simulations',
  lmnp_simulations: 'lmnp_simulations',
  capacite_emprunt_simulations: 'capacite_emprunt_simulations',
  espp_lots: 'espp_lots',
  risk_profile: 'risk_profile',
  module_validations: 'module_validations',
  appointments: 'appointments',
  onboarding_responses: 'onboarding_responses',
  global_settings: 'global_settings',
  diagnostic_results: 'diagnostic_results',
};

// Mapping pour deviner le type à partir du nom de colonne
function guessTypeFromColumnName(columnName: string): { type: ValueType; unit?: string; category: string } {
  const lowerName = columnName.toLowerCase();
  
  // Currency patterns
  if (lowerName.includes('montant') || lowerName.includes('prix') || lowerName.includes('valeur') ||
      lowerName.includes('revenu') || lowerName.includes('charge') || lowerName.includes('credit') ||
      lowerName.includes('loyer') || lowerName.includes('epargne') || lowerName.includes('patrimoine') ||
      lowerName.includes('budget') || lowerName.includes('salaire') || lowerName.includes('apport') ||
      lowerName.includes('economie') || lowerName.includes('impot') || lowerName.includes('reduction') ||
      lowerName.includes('plafond') || lowerName.includes('capacite') || lowerName.includes('mensualite') ||
      lowerName.includes('reste_a_vivre') || lowerName.includes('pension') || lowerName.includes('frais') ||
      lowerName.includes('amort') || lowerName.includes('fiscalite') || lowerName.includes('resultat') ||
      lowerName.includes('recettes') || lowerName.includes('total')) {
    return { type: 'currency', unit: '€', category: 'Auto-détecté' };
  }
  
  // Percentage patterns
  if (lowerName.includes('taux') || lowerName.includes('tmi') || lowerName.includes('pourcentage') ||
      lowerName.includes('pct') || lowerName.includes('ratio') || lowerName.includes('indice') ||
      lowerName.includes('completion')) {
    return { type: 'percentage', unit: '%', category: 'Auto-détecté' };
  }
  
  // Boolean patterns
  if (lowerName.startsWith('has_') || lowerName.startsWith('is_') || lowerName.startsWith('can_') ||
      lowerName.includes('enable') || lowerName.includes('active') || lowerName.startsWith('projet_') ||
      lowerName.startsWith('objectif_')) {
    return { type: 'boolean', category: 'Auto-détecté' };
  }
  
  // Number patterns
  if (lowerName.includes('nb_') || lowerName.includes('nombre') || lowerName.includes('count') ||
      lowerName.includes('annee') || lowerName.includes('mois') || lowerName.includes('duree') ||
      lowerName.includes('age') || lowerName.includes('anciennete') || lowerName.includes('parts') ||
      lowerName.includes('horizon')) {
    const unit = lowerName.includes('annee') || lowerName.includes('age') || lowerName.includes('anciennete') || lowerName.includes('horizon') 
      ? 'ans' 
      : lowerName.includes('mois') ? 'mois' : undefined;
    return { type: 'number', unit, category: 'Auto-détecté' };
  }
  
  // String patterns
  if (lowerName.includes('type') || lowerName.includes('statut') || lowerName.includes('status') ||
      lowerName.includes('situation') || lowerName.includes('secteur') || lowerName.includes('regime') ||
      lowerName.includes('niveau') || lowerName.includes('nom') || lowerName.includes('message')) {
    return { type: 'string', category: 'Auto-détecté' };
  }
  
  // Date patterns
  if (lowerName.includes('date') || lowerName.includes('_at')) {
    return { type: 'date', category: 'Auto-détecté' };
  }
  
  // Default
  return { type: 'string', category: 'Auto-détecté' };
}

// Générer un label lisible à partir du nom de colonne
function generateLabel(columnName: string): string {
  return columnName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/Nb /g, 'Nombre de ')
    .replace(/Tmi/g, 'TMI')
    .replace(/Per /g, 'PER ')
    .replace(/Pea/g, 'PEA')
    .replace(/Scpi/g, 'SCPI')
    .replace(/Lmnp/g, 'LMNP')
    .replace(/Espp/g, 'ESPP')
    .replace(/Rsu/g, 'RSU')
    .replace(/Aga/g, 'AGA')
    .replace(/Bspce/g, 'BSPCE')
    .replace(/Pee/g, 'PEE')
    .replace(/Perco/g, 'PERCO');
}

// Mapper la catégorie selon la source
function getCategoryFromSource(source: DataSource): string {
  const categoryMap: Record<DataSource, string> = {
    user_financial_profiles: 'Profil financier',
    per_simulations: 'Résultats PER',
    optimisation_fiscale_simulations: 'Résultats Optimisation',
    epargne_precaution_simulations: 'Résultats Épargne',
    lmnp_simulations: 'Résultats LMNP',
    capacite_emprunt_simulations: 'Résultats Emprunt',
    espp_lots: 'ESPP',
    risk_profile: 'Profil de risque',
    module_validations: 'Progression',
    appointments: 'Rendez-vous',
    onboarding_responses: 'Onboarding',
    global_settings: 'Paramètres',
    diagnostic_results: 'Diagnostic',
  };
  return categoryMap[source] || 'Autre';
}

export function SyncKeysButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<SyncResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Charger les clés dynamiques à l'ouverture
  useEffect(() => {
    if (open) {
      loadDynamicKeys();
    }
  }, [open]);

  const fetchTableColumns = async (tableName: string): Promise<string[]> => {
    try {
      const { data: sampleData } = await supabase
        .from(tableName as any)
        .select('*')
        .limit(1);
      
      if (sampleData && sampleData.length > 0) {
        return Object.keys(sampleData[0]);
      }
      return [];
    } catch (err) {
      console.warn(`Could not fetch columns for ${tableName}:`, err);
      return [];
    }
  };

  const runSync = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    
    try {
      // Recharger les clés dynamiques d'abord
      await loadDynamicKeys();
      const allKeys = getAllEvaluationKeys();
      
      const syncResults: SyncResult[] = [];
      
      const keysBySource = allKeys.reduce((acc, key) => {
        if (!acc[key.source]) acc[key.source] = [];
        acc[key.source].push(key);
        return acc;
      }, {} as Record<DataSource, EvaluationKey[]>);
      
      for (const [source, keys] of Object.entries(keysBySource)) {
        const tableName = SOURCE_TABLES[source as DataSource];
        if (!tableName || source === 'global_settings') continue;
        
        const dbColumns = await fetchTableColumns(tableName);
        const registeredKeys = keys.filter(k => !k.isCalculated).map(k => k.key);
        
        const missingInRegistry = dbColumns.filter(col => 
          !registeredKeys.includes(col) && 
          !['id', 'user_id', 'created_at', 'updated_at', 'nom_simulation'].includes(col)
        );
        
        const missingInDb = registeredKeys.filter(key => 
          !dbColumns.includes(key)
        );
        
        syncResults.push({
          source: source as DataSource,
          registeredKeys,
          dbColumns,
          missingInRegistry,
          missingInDb,
          status: missingInRegistry.length > 0 || missingInDb.length > 0 ? 'warning' : 'ok'
        });
      }
      
      setResults(syncResults);
      
      const warnings = syncResults.filter(r => r.status === 'warning').length;
      if (warnings > 0) {
        toast.warning(`Synchronisation terminée avec ${warnings} avertissement(s)`);
      } else {
        toast.success("Toutes les clés sont synchronisées !");
      }
    } catch (err) {
      console.error("Sync error:", err);
      setError("Erreur lors de la synchronisation");
      toast.error("Erreur lors de la synchronisation");
    } finally {
      setLoading(false);
    }
  };

  // Ajouter automatiquement toutes les clés manquantes au registre DB
  const autoAddMissingKeys = async () => {
    setSyncing(true);
    
    try {
      const keysToAdd: Omit<EvaluationKey, 'isFromDb'>[] = [];
      
      results.forEach(result => {
        result.missingInRegistry.forEach(col => {
          const { type, unit } = guessTypeFromColumnName(col);
          const label = generateLabel(col);
          const category = getCategoryFromSource(result.source);
          
          keysToAdd.push({
            key: col,
            label,
            type,
            unit,
            source: result.source,
            category,
          });
        });
      });
      
      if (keysToAdd.length === 0) {
        toast.info("Aucune clé à ajouter");
        return;
      }
      
      const result = await addKeysToRegistry(keysToAdd);
      
      if (result.success) {
        toast.success(`${result.count} clé(s) ajoutée(s) au registre !`);
        // Relancer la synchronisation pour mettre à jour l'affichage
        await runSync();
      } else {
        toast.error(`Erreur: ${result.error}`);
      }
    } catch (err) {
      console.error("Error adding keys:", err);
      toast.error("Erreur lors de l'ajout des clés");
    } finally {
      setSyncing(false);
    }
  };

  // Supprimer les clés qui n'existent pas en DB
  const removeOrphanedKeys = async () => {
    setSyncing(true);
    
    try {
      let removedCount = 0;
      
      for (const result of results) {
        for (const key of result.missingInDb) {
          // Ne supprimer que les clés dynamiques (pas les statiques)
          const staticKey = STATIC_EVALUATION_KEYS.find(k => k.key === key);
          if (!staticKey) {
            const success = await removeKeyFromRegistry(key);
            if (success) removedCount++;
          }
        }
      }
      
      if (removedCount > 0) {
        toast.success(`${removedCount} clé(s) supprimée(s) du registre`);
        await runSync();
      } else {
        toast.info("Aucune clé dynamique à supprimer (les clés statiques ne peuvent pas être supprimées)");
      }
    } catch (err) {
      console.error("Error removing keys:", err);
      toast.error("Erreur lors de la suppression");
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: SyncResult['status']) => {
    switch (status) {
      case 'ok':
        return <Badge className="bg-emerald-500"><Check className="h-3 w-3 mr-1" />OK</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800"><AlertCircle className="h-3 w-3 mr-1" />À vérifier</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Erreur</Badge>;
    }
  };

  const hasMissingInRegistry = results.some(r => r.missingInRegistry.length > 0);
  const hasMissingInDb = results.some(r => r.missingInDb.length > 0);
  const totalMissingInRegistry = results.reduce((sum, r) => sum + r.missingInRegistry.length, 0);
  const totalMissingInDb = results.reduce((sum, r) => sum + r.missingInDb.length, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Synchroniser les clés
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Synchronisation des clés d'évaluation
          </DialogTitle>
          <DialogDescription>
            Vérifie et synchronise automatiquement les colonnes de la base de données avec le registre des clés.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {results.length > 0 ? (
          <div className="space-y-4">
            {/* Actions correctives automatiques */}
            {(hasMissingInRegistry || hasMissingInDb) && (
              <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <div className="flex flex-col gap-3">
                    <span className="font-medium">Actions automatiques :</span>
                    <div className="flex gap-2 flex-wrap">
                      {hasMissingInRegistry && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                                onClick={autoAddMissingKeys}
                                disabled={syncing}
                              >
                                {syncing ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Plus className="h-3 w-3" />
                                )}
                                Ajouter {totalMissingInRegistry} clé(s) manquante(s)
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ajoute automatiquement les colonnes DB au registre</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {hasMissingInDb && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
                                onClick={removeOrphanedKeys}
                                disabled={syncing}
                              >
                                <Trash2 className="h-3 w-3" />
                                Nettoyer {totalMissingInDb} clé(s) orpheline(s)
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Supprime les clés dynamiques qui n'existent plus en DB</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Résultats */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {results.map((result) => (
                  <div 
                    key={result.source} 
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {SOURCE_TABLES[result.source]}
                        </code>
                        <span className="text-muted-foreground text-sm">
                          ({result.registeredKeys.length} clés)
                        </span>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                    
                    {result.missingInRegistry.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-3">
                        <p className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1">
                          <Database className="h-3.5 w-3.5" />
                          Colonnes DB à ajouter ({result.missingInRegistry.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {result.missingInRegistry.map(col => (
                            <code 
                              key={col} 
                              className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded"
                            >
                              {col}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {result.missingInDb.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-sm font-medium text-red-800 mb-2 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Clés orphelines ({result.missingInDb.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {result.missingInDb.map(key => {
                            const isStatic = STATIC_EVALUATION_KEYS.some(k => k.key === key);
                            return (
                              <code 
                                key={key} 
                                className={`text-xs px-1.5 py-0.5 rounded ${
                                  isStatic 
                                    ? 'bg-gray-100 text-gray-600' 
                                    : 'bg-red-100 text-red-800'
                                }`}
                                title={isStatic ? 'Clé statique (ne peut pas être supprimée)' : 'Clé dynamique (peut être supprimée)'}
                              >
                                {key}
                                {isStatic && ' (statique)'}
                              </code>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {result.status === 'ok' && (
                      <p className="text-sm text-emerald-600">
                        ✓ Toutes les colonnes sont synchronisées
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Cliquez sur "Lancer la synchronisation" pour vérifier les clés</p>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fermer
          </Button>
          <Button onClick={runSync} disabled={loading || syncing} className="gap-2">
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {loading ? "Analyse..." : "Lancer la synchronisation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
