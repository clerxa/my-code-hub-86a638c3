import { useState, useMemo, useEffect } from "react";
import { Check, ChevronsUpDown, Search, Info, Database, Zap, Calculator, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getAllEvaluationKeys,
  loadDynamicKeys,
  KEY_CATEGORIES,
  EvaluationKey,
  getKeyByName,
  DataSource,
  ValueType,
} from "./EvaluationKeysRegistry";

interface EvaluationKeySelectorProps {
  value: string;
  onChange: (value: string, keyInfo?: EvaluationKey) => void;
  placeholder?: string;
  filterSources?: DataSource[];
  filterTypes?: ValueType[];
  showSpecialKeys?: boolean;
  showCalculated?: boolean;
  className?: string;
  disabled?: boolean;
}

const SOURCE_LABELS: Record<DataSource, string> = {
  user_financial_profiles: "Profil financier",
  per_simulations: "Simulation PER",
  optimisation_fiscale_simulations: "Optimisation fiscale",
  epargne_precaution_simulations: "Épargne précaution",
  lmnp_simulations: "Simulation LMNP",
  capacite_emprunt_simulations: "Capacité emprunt",
  espp_lots: "Lots ESPP",
  risk_profile: "Profil de risque",
  module_validations: "Modules validés",
  appointments: "Rendez-vous",
  onboarding_responses: "Réponses onboarding",
  global_settings: "Paramètres globaux",
};

const TYPE_COLORS: Record<string, string> = {
  number: "bg-blue-100 text-blue-800",
  currency: "bg-emerald-100 text-emerald-800",
  percentage: "bg-amber-100 text-amber-800",
  string: "bg-purple-100 text-purple-800",
  boolean: "bg-pink-100 text-pink-800",
  date: "bg-orange-100 text-orange-800",
};

const TYPE_ICONS: Record<ValueType, string> = {
  currency: '€',
  percentage: '%',
  number: '#',
  string: 'Aa',
  boolean: '✓',
  date: '📅',
};

export function EvaluationKeySelector({
  value,
  onChange,
  placeholder = "Sélectionner une clé...",
  filterSources,
  filterTypes,
  showSpecialKeys = true,
  showCalculated = true,
  className,
  disabled = false,
}: EvaluationKeySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [allKeys, setAllKeys] = useState<EvaluationKey[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les clés dynamiques au montage
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await loadDynamicKeys();
      setAllKeys(getAllEvaluationKeys());
      setLoading(false);
    };
    load();
  }, []);

  const filteredKeys = useMemo(() => {
    let keys = allKeys;
    
    // Filtrer par source si spécifié
    if (filterSources?.length) {
      keys = keys.filter(k => filterSources.includes(k.source));
    }
    
    // Filtrer par type si spécifié
    if (filterTypes?.length) {
      keys = keys.filter(k => filterTypes.includes(k.type));
    }
    
    // Retirer les clés spéciales si demandé
    if (!showSpecialKeys) {
      keys = keys.filter(k => k.category !== 'Spécial');
    }

    // Retirer les clés calculées si demandé
    if (!showCalculated) {
      keys = keys.filter(k => !k.isCalculated);
    }
    
    return keys;
  }, [allKeys, filterSources, filterTypes, showSpecialKeys, showCalculated]);

  const groupedKeys = useMemo(() => {
    const groups: Record<string, EvaluationKey[]> = {};
    
    filteredKeys.forEach(key => {
      if (!groups[key.category]) {
        groups[key.category] = [];
      }
      groups[key.category].push(key);
    });
    
    return groups;
  }, [filteredKeys]);

  const selectedKey = getKeyByName(value);

  const handleSelect = (keyName: string) => {
    const keyInfo = getKeyByName(keyName);
    onChange(keyName, keyInfo);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedKey ? (
            <div className="flex items-center gap-2 truncate">
              <span className="truncate">{selectedKey.label}</span>
              <Badge variant="outline" className={cn("text-[10px] px-1 py-0", TYPE_COLORS[selectedKey.type])}>
                {selectedKey.unit || selectedKey.type}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Rechercher une clé..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ScrollArea className="h-[400px]">
            <CommandList>
              <CommandEmpty>Aucune clé trouvée.</CommandEmpty>
              
              {Object.entries(groupedKeys).map(([category, keys]) => {
                const categoryConfig = KEY_CATEGORIES.find(c => c.id === category);
                const filteredCategoryKeys = keys.filter(k => 
                  k.label.toLowerCase().includes(search.toLowerCase()) ||
                  k.key.toLowerCase().includes(search.toLowerCase()) ||
                  k.description?.toLowerCase().includes(search.toLowerCase())
                );
                
                if (filteredCategoryKeys.length === 0) return null;
                
                return (
                  <CommandGroup 
                    key={category} 
                    heading={
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-medium", categoryConfig?.color)}>
                          {categoryConfig?.label || category}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1">
                          {filteredCategoryKeys.length}
                        </Badge>
                      </div>
                    }
                  >
                    {filteredCategoryKeys.map((keyItem) => (
                      <CommandItem
                        key={keyItem.key}
                        value={keyItem.key}
                        onSelect={() => handleSelect(keyItem.key)}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Check
                            className={cn(
                              "h-4 w-4 shrink-0",
                              value === keyItem.key ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="truncate font-medium text-sm">
                              {keyItem.label}
                            </span>
                            <code className="text-[10px] text-muted-foreground truncate">
                              {keyItem.key}
                            </code>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          {keyItem.isCalculated && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Zap className="h-3 w-3 text-violet-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Valeur calculée</p>
                                  {keyItem.formula && (
                                    <code className="text-[10px] block mt-1">
                                      {keyItem.formula}
                                    </code>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          
                          <Badge 
                            variant="outline" 
                            className={cn("text-[10px] px-1.5 py-0", TYPE_COLORS[keyItem.type])}
                          >
                            {keyItem.unit || keyItem.type}
                          </Badge>
                          
                          {keyItem.description && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs max-w-[200px]">{keyItem.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </CommandList>
          </ScrollArea>
          
          <CommandSeparator />
          
          <div className="p-2 text-[10px] text-muted-foreground flex items-center gap-1">
            <Database className="h-3 w-3" />
            {filteredKeys.length} clés disponibles
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
