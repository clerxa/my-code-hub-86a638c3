import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, Info, Building2, RefreshCw, Check, Users, Briefcase, Calculator, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Types des dispositifs
type DeviceKey = 'rsu' | 'espp' | 'stock_options' | 'bspce' | 'pee' | 'perco' | 'pero' | 'variable_compensation';

// Règle pour un dispositif
interface DeviceRule {
  enabled: boolean;
  // Impact sur le rang: si présent, bonifie ou pénalise
  rankBonus: number; // -2, -1, 0, +1, +2 (négatif = améliore le rang)
  // Conditions optionnelles
  requiresMinSize?: number; // Taille minimum pour que le bonus s'applique
  requiresPartnership?: boolean; // Uniquement pour partenaires
  category: 'equity' | 'savings' | 'variable';
  priority: number; // Pour l'ordre d'affichage
}

// Configuration complète
interface RankingConfig {
  // Rang de base selon la taille
  baseSizeRanks: {
    enterprise: 1 | 2 | 3;  // > 1000
    large: 1 | 2 | 3;       // 250-1000
    medium: 1 | 2 | 3;      // 50-250
    small: 1 | 2 | 3;       // < 50
  };
  // Seuils de taille
  sizeThresholds: {
    small: number;
    medium: number;
    large: number;
    enterprise: number;
  };
  // Règles par dispositif
  deviceRules: Record<DeviceKey, DeviceRule>;
  // Config sans partenariat
  nonPartnerConfig: {
    enabled: boolean;
    baseRank: 3 | 4;
    applyDeviceRules: boolean; // Appliquer aussi les règles de dispositifs
  };
  // Rang minimum et maximum
  rankBounds: {
    min: 1;
    max: 4;
  };
}

interface Company {
  id: string;
  name: string;
  partnership_type: string | null;
  company_size: number | null;
  compensation_devices: any;
  rang: number | null;
  calculatedRank?: number;
  appliedRules?: string[];
}

interface NonPartnerStats {
  companyId: string;
  companyName: string;
  userCount: number;
  devices: Record<string, number>; // device -> count of users with this device
  calculatedRank: number;
  appliedRules: string[];
}

const DEVICE_LABELS: Record<DeviceKey, string> = {
  rsu: "RSU / AGA",
  espp: "ESPP",
  stock_options: "Stock Options",
  bspce: "BSPCE",
  pee: "PEE",
  perco: "PERCO / PERCOL",
  pero: "PERO (Article 83)",
  variable_compensation: "Rémunération variable",
};

const DEVICE_DESCRIPTIONS: Record<DeviceKey, string> = {
  rsu: "Restricted Stock Units / Attribution Gratuite d'Actions",
  espp: "Employee Stock Purchase Plan",
  stock_options: "Options d'achat d'actions",
  bspce: "Bons de Souscription de Parts de Créateur d'Entreprise",
  pee: "Plan d'Épargne Entreprise",
  perco: "Plan d'Épargne Retraite Collectif",
  pero: "Plan d'Épargne Retraite Obligatoire",
  variable_compensation: "Bonus, primes sur objectifs, etc.",
};

const CATEGORY_LABELS: Record<string, string> = {
  equity: "Rémunération Equity",
  savings: "Épargne salariale",
  variable: "Rémunération variable",
};

const RANK_COLORS: Record<number, string> = {
  1: "bg-primary text-primary-foreground",
  2: "bg-secondary text-secondary-foreground",
  3: "bg-muted text-muted-foreground",
  4: "bg-orange-500 text-white",
};

const RANK_LABELS: Record<number, string> = {
  1: "Rang 1 - Premium",
  2: "Rang 2 - Standard",
  3: "Rang 3 - Basic",
  4: "Rang 4 - Sans partenariat",
};

const DEFAULT_CONFIG: RankingConfig = {
  baseSizeRanks: {
    enterprise: 1,
    large: 2,
    medium: 2,
    small: 3,
  },
  sizeThresholds: {
    small: 50,
    medium: 250,
    large: 1000,
    enterprise: 1000,
  },
  deviceRules: {
    rsu: {
      enabled: true,
      rankBonus: -1,
      category: 'equity',
      priority: 1,
    },
    espp: {
      enabled: true,
      rankBonus: -1,
      category: 'equity',
      priority: 2,
    },
    stock_options: {
      enabled: true,
      rankBonus: -1,
      category: 'equity',
      priority: 3,
    },
    bspce: {
      enabled: true,
      rankBonus: -1,
      category: 'equity',
      priority: 4,
    },
    pee: {
      enabled: true,
      rankBonus: 0,
      category: 'savings',
      priority: 5,
    },
    perco: {
      enabled: true,
      rankBonus: 0,
      category: 'savings',
      priority: 6,
    },
    pero: {
      enabled: true,
      rankBonus: 0,
      category: 'savings',
      priority: 7,
    },
    variable_compensation: {
      enabled: true,
      rankBonus: 0,
      category: 'variable',
      priority: 8,
    },
  },
  nonPartnerConfig: {
    enabled: true,
    baseRank: 4,
    applyDeviceRules: false,
  },
  rankBounds: {
    min: 1,
    max: 4,
  },
};

export function CompanyRankingTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [config, setConfig] = useState<RankingConfig>(DEFAULT_CONFIG);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [nonPartnerStats, setNonPartnerStats] = useState<NonPartnerStats[]>([]);
  const [activeTab, setActiveTab] = useState("rules");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch config from settings
      const { data: settingsData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "company_rank_rules_config")
        .maybeSingle();

      if (settingsData?.value) {
        try {
          const parsed = JSON.parse(settingsData.value);
          setConfig({ ...DEFAULT_CONFIG, ...parsed });
        } catch {
          setConfig(DEFAULT_CONFIG);
        }
      }

      // Fetch companies with compensation_devices
      const { data: companiesData, error } = await supabase
        .from("companies")
        .select("id, name, partnership_type, company_size, compensation_devices, rang")
        .order("name");

      if (error) throw error;
      setCompanies(companiesData || []);

      // Fetch aggregated stats for non-partner companies
      await fetchNonPartnerStats(companiesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const fetchNonPartnerStats = async (companiesData: Company[]) => {
    const nonPartnerCompanies = companiesData.filter(
      c => !c.partnership_type || c.partnership_type === "" || c.partnership_type.toLowerCase() === "aucun"
    );

    if (nonPartnerCompanies.length === 0) {
      setNonPartnerStats([]);
      return;
    }

    const stats: NonPartnerStats[] = [];

    for (const company of nonPartnerCompanies) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id")
        .eq("company_id", company.id);

      if (!profilesData || profilesData.length === 0) {
        stats.push({
          companyId: company.id,
          companyName: company.name,
          userCount: 0,
          devices: {},
          calculatedRank: config.nonPartnerConfig.baseRank,
          appliedRules: [],
        });
        continue;
      }

      const userIds = profilesData.map(p => p.id);
      
      const { data: financialData } = await supabase
        .from("user_financial_profiles")
        .select("has_rsu_aga, has_espp, has_stock_options, has_bspce, has_pee, has_perco, has_pero")
        .in("user_id", userIds);

      if (!financialData || financialData.length === 0) {
        stats.push({
          companyId: company.id,
          companyName: company.name,
          userCount: profilesData.length,
          devices: {},
          calculatedRank: config.nonPartnerConfig.baseRank,
          appliedRules: [],
        });
        continue;
      }

      // Count devices across users
      const deviceCounts: Record<string, number> = {
        rsu: 0,
        espp: 0,
        stock_options: 0,
        bspce: 0,
        pee: 0,
        perco: 0,
        pero: 0,
      };

      financialData.forEach(fp => {
        if (fp.has_rsu_aga) deviceCounts.rsu++;
        if (fp.has_espp) deviceCounts.espp++;
        if (fp.has_stock_options) deviceCounts.stock_options++;
        if (fp.has_bspce) deviceCounts.bspce++;
        if (fp.has_pee) deviceCounts.pee++;
        if (fp.has_perco) deviceCounts.perco++;
        if (fp.has_pero) deviceCounts.pero++;
      });

      // Calculate rank if applicable
      let calculatedRank = config.nonPartnerConfig.baseRank;
      const appliedRules: string[] = [];

      if (config.nonPartnerConfig.applyDeviceRules) {
        // Apply device rules based on majority (>50% of users have the device)
        const threshold = financialData.length / 2;
        Object.entries(deviceCounts).forEach(([device, count]) => {
          if (count > threshold) {
            const rule = config.deviceRules[device as DeviceKey];
            if (rule?.enabled && rule.rankBonus !== 0) {
              const newRank = calculatedRank + rule.rankBonus;
              calculatedRank = Math.max(
                config.rankBounds.min,
                Math.min(config.rankBounds.max, newRank)
              ) as 3 | 4;
              appliedRules.push(`${DEVICE_LABELS[device as DeviceKey]}: ${rule.rankBonus > 0 ? '+' : ''}${rule.rankBonus}`);
            }
          }
        });
      }

      stats.push({
        companyId: company.id,
        companyName: company.name,
        userCount: profilesData.length,
        devices: deviceCounts,
        calculatedRank,
        appliedRules,
      });
    }

    setNonPartnerStats(stats);
  };

  const getSizeCategory = (size: number | null): 'enterprise' | 'large' | 'medium' | 'small' => {
    if (!size) return "small";
    if (size >= config.sizeThresholds.enterprise) return "enterprise";
    if (size >= config.sizeThresholds.large) return "large";
    if (size >= config.sizeThresholds.medium) return "medium";
    return "small";
  };

  const hasDevice = (compensationDevices: Record<string, any> | null, deviceKey: DeviceKey): boolean => {
    if (!compensationDevices) return false;
    const device = compensationDevices[deviceKey];
    if (device === true) return true;
    if (device?.enabled === true) return true;
    if (deviceKey === 'variable_compensation' && device && device !== "") return true;
    return false;
  };

  const calculateRank = (company: Company): { rank: number; appliedRules: string[] } => {
    // Companies without partnership
    if (!company.partnership_type || company.partnership_type === "" || company.partnership_type.toLowerCase() === "aucun") {
      const nonPartnerStat = nonPartnerStats.find(s => s.companyId === company.id);
      return {
        rank: nonPartnerStat?.calculatedRank || config.nonPartnerConfig.baseRank,
        appliedRules: nonPartnerStat?.appliedRules || [],
      };
    }

    // Start with base rank from size
    const sizeCategory = getSizeCategory(company.company_size);
    let rank = config.baseSizeRanks[sizeCategory];
    const appliedRules: string[] = [`Taille (${sizeCategory}): Rang ${rank}`];

    // Apply device rules
    (Object.keys(config.deviceRules) as DeviceKey[]).forEach(deviceKey => {
      const rule = config.deviceRules[deviceKey];
      if (!rule.enabled) return;
      if (rule.rankBonus === 0) return;

      const hasThisDevice = hasDevice(company.compensation_devices, deviceKey);
      if (!hasThisDevice) return;

      // Check conditions
      if (rule.requiresMinSize && (!company.company_size || company.company_size < rule.requiresMinSize)) {
        return;
      }

      // Apply bonus
      const newRank = rank + rule.rankBonus;
      rank = Math.max(config.rankBounds.min, Math.min(config.rankBounds.max, newRank)) as 1 | 2 | 3;
      appliedRules.push(`${DEVICE_LABELS[deviceKey]}: ${rule.rankBonus > 0 ? '+' : ''}${rule.rankBonus}`);
    });

    return { rank, appliedRules };
  };

  const updateDeviceRule = (device: DeviceKey, updates: Partial<DeviceRule>) => {
    setConfig(prev => ({
      ...prev,
      deviceRules: {
        ...prev.deviceRules,
        [device]: {
          ...prev.deviceRules[device],
          ...updates,
        },
      },
    }));
  };

  const updateBaseSizeRank = (size: keyof RankingConfig['baseSizeRanks'], rank: 1 | 2 | 3) => {
    setConfig(prev => ({
      ...prev,
      baseSizeRanks: {
        ...prev.baseSizeRanks,
        [size]: rank,
      },
    }));
  };

  const updateSizeThreshold = (key: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      sizeThresholds: {
        ...prev.sizeThresholds,
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("settings")
        .upsert({
          key: "company_rank_rules_config",
          value: JSON.stringify(config),
        }, { onConflict: "key" });

      if (error) throw error;
      toast.success("Configuration enregistrée");
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleApplyRanks = async () => {
    setApplying(true);
    try {
      const updates = companies.map(company => ({
        id: company.id,
        rang: calculateRank(company).rank,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("companies")
          .update({ rang: update.rang })
          .eq("id", update.id);

        if (error) throw error;
      }

      toast.success(`${updates.length} entreprises mises à jour`);
      fetchData();
    } catch (error) {
      console.error("Error applying ranks:", error);
      toast.error("Erreur lors de l'application des rangs");
    } finally {
      setApplying(false);
    }
  };

  const companiesWithCalculatedRanks = companies.map(company => {
    const { rank, appliedRules } = calculateRank(company);
    return {
      ...company,
      calculatedRank: rank,
      appliedRules,
    };
  });

  const partnerCompanies = companiesWithCalculatedRanks.filter(
    c => c.partnership_type && c.partnership_type !== "" && c.partnership_type.toLowerCase() !== "aucun"
  );

  const nonPartnerCompanies = companiesWithCalculatedRanks.filter(
    c => !c.partnership_type || c.partnership_type === "" || c.partnership_type.toLowerCase() === "aucun"
  );

  const changesCount = companiesWithCalculatedRanks.filter(
    c => c.calculatedRank !== c.rang
  ).length;

  // Group devices by category
  const devicesByCategory = Object.entries(config.deviceRules).reduce((acc, [key, rule]) => {
    if (!acc[rule.category]) acc[rule.category] = [];
    acc[rule.category].push({ key: key as DeviceKey, ...rule });
    return acc;
  }, {} as Record<string, (DeviceRule & { key: DeviceKey })[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight hero-gradient">Configuration des rangs</h2>
        <p className="text-muted-foreground">
          Règles par nature de dispositif + Taille de l'entreprise
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Logique de calcul :</strong> Le rang de base est déterminé par la taille de l'entreprise, 
          puis modifié par les règles de chaque dispositif de rémunération présent. 
          Un bonus négatif (-1, -2) améliore le rang, un bonus positif le dégrade.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rules" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Règles dispositifs
          </TabsTrigger>
          <TabsTrigger value="size" className="gap-2">
            <Building2 className="h-4 w-4" />
            Rang par taille
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Aperçu partenaires
          </TabsTrigger>
          <TabsTrigger value="non-partner" className="gap-2">
            <Users className="h-4 w-4" />
            Sans partenariat
          </TabsTrigger>
        </TabsList>

        {/* Device Rules */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Règles par dispositif</CardTitle>
              <CardDescription>
                Définissez l'impact de chaque dispositif sur le rang de l'entreprise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Accordion type="multiple" defaultValue={['equity', 'savings', 'variable']} className="w-full">
                {Object.entries(devicesByCategory).map(([category, devices]) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{CATEGORY_LABELS[category]}</Badge>
                        <span className="text-muted-foreground text-sm">
                          ({devices.filter(d => d.enabled).length}/{devices.length} actifs)
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        {devices.sort((a, b) => a.priority - b.priority).map(device => (
                          <div key={device.key} className="p-4 border rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <Switch
                                    checked={device.enabled}
                                    onCheckedChange={(checked) => updateDeviceRule(device.key, { enabled: checked })}
                                  />
                                  <div>
                                    <Label className="font-medium">{DEVICE_LABELS[device.key]}</Label>
                                    <p className="text-sm text-muted-foreground">
                                      {DEVICE_DESCRIPTIONS[device.key]}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {device.enabled && (
                              <div className="pl-12 space-y-4">
                                <div className="flex items-center gap-4">
                                  <Label className="w-32">Impact sur rang:</Label>
                                  <Select
                                    value={device.rankBonus.toString()}
                                    onValueChange={(v) => updateDeviceRule(device.key, { rankBonus: parseInt(v) })}
                                  >
                                    <SelectTrigger className="w-48">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="-2">
                                        <span className="text-green-600 font-medium">−2 (Très favorable)</span>
                                      </SelectItem>
                                      <SelectItem value="-1">
                                        <span className="text-green-500 font-medium">−1 (Favorable)</span>
                                      </SelectItem>
                                      <SelectItem value="0">
                                        <span className="text-muted-foreground">0 (Neutre)</span>
                                      </SelectItem>
                                      <SelectItem value="1">
                                        <span className="text-orange-500 font-medium">+1 (Défavorable)</span>
                                      </SelectItem>
                                      <SelectItem value="2">
                                        <span className="text-red-500 font-medium">+2 (Très défavorable)</span>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {device.rankBonus !== 0 && (
                                    <span className="text-sm text-muted-foreground">
                                      {device.rankBonus < 0 
                                        ? `Améliore le rang de ${Math.abs(device.rankBonus)} niveau(x)` 
                                        : `Dégrade le rang de ${device.rankBonus} niveau(x)`}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-4">
                                  <Label className="w-32">Taille min.:</Label>
                                  <Input
                                    type="number"
                                    value={device.requiresMinSize || ""}
                                    onChange={(e) => updateDeviceRule(device.key, { 
                                      requiresMinSize: e.target.value ? parseInt(e.target.value) : undefined 
                                    })}
                                    placeholder="Aucune condition"
                                    className="w-48"
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    employés (laisser vide = pas de condition)
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Size Configuration */}
        <TabsContent value="size" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rang de base par taille</CardTitle>
              <CardDescription>
                Définissez le rang initial selon la taille de l'entreprise (avant application des règles de dispositifs)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Size thresholds */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Seuils de taille</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Petite → Moyenne</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={config.sizeThresholds.small}
                          onChange={(e) => updateSizeThreshold('small', parseInt(e.target.value) || 0)}
                          className="w-24"
                        />
                        <span className="text-muted-foreground text-xs">employés</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Moyenne → Grande</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={config.sizeThresholds.medium}
                          onChange={(e) => updateSizeThreshold('medium', parseInt(e.target.value) || 0)}
                          className="w-24"
                        />
                        <span className="text-muted-foreground text-xs">employés</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Grande → Entreprise</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={config.sizeThresholds.large}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            updateSizeThreshold('large', val);
                            updateSizeThreshold('enterprise', val);
                          }}
                          className="w-24"
                        />
                        <span className="text-muted-foreground text-xs">employés</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Base ranks by size */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Rang de base</Label>
                  <div className="space-y-3">
                    {(['enterprise', 'large', 'medium', 'small'] as const).map(size => (
                      <div key={size} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">
                          {size === 'enterprise' && `> ${config.sizeThresholds.enterprise} employés`}
                          {size === 'large' && `${config.sizeThresholds.medium} - ${config.sizeThresholds.large} employés`}
                          {size === 'medium' && `${config.sizeThresholds.small} - ${config.sizeThresholds.medium} employés`}
                          {size === 'small' && `< ${config.sizeThresholds.small} employés`}
                        </span>
                        <Select
                          value={config.baseSizeRanks[size].toString()}
                          onValueChange={(v) => updateBaseSizeRank(size, parseInt(v) as 1 | 2 | 3)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">
                              <Badge className={RANK_COLORS[1]}>Rang 1</Badge>
                            </SelectItem>
                            <SelectItem value="2">
                              <Badge className={RANK_COLORS[2]}>Rang 2</Badge>
                            </SelectItem>
                            <SelectItem value="3">
                              <Badge className={RANK_COLORS[3]}>Rang 3</Badge>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Partner Companies Preview */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Entreprises partenaires ({partnerCompanies.length})
              </CardTitle>
              <CardDescription>
                Aperçu des rangs calculés avec les règles actuelles
                {changesCount > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {changesCount} changement{changesCount > 1 ? "s" : ""} à appliquer
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Dispositifs actifs</TableHead>
                    <TableHead>Règles appliquées</TableHead>
                    <TableHead>Rang actuel</TableHead>
                    <TableHead>Rang calculé</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partnerCompanies.map(company => {
                    const needsUpdate = company.calculatedRank !== company.rang;
                    const activeDevices = (Object.keys(config.deviceRules) as DeviceKey[])
                      .filter(key => hasDevice(company.compensation_devices, key))
                      .map(key => DEVICE_LABELS[key]);
                    
                    return (
                      <TableRow key={company.id} className={needsUpdate ? "bg-yellow-50/50 dark:bg-yellow-950/20" : ""}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>
                          {company.company_size ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline">{getSizeCategory(company.company_size)}</Badge>
                                </TooltipTrigger>
                                <TooltipContent>{company.company_size} employés</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {activeDevices.length > 0 ? (
                              activeDevices.length <= 2 ? (
                                activeDevices.map(d => (
                                  <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                                ))
                              ) : (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="outline">{activeDevices.length} dispositifs</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <ul className="text-sm">
                                        {activeDevices.map(d => <li key={d}>{d}</li>)}
                                      </ul>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )
                            ) : (
                              <span className="text-muted-foreground text-sm">Aucun</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="secondary" className="text-xs">
                                  {company.appliedRules?.length || 0} règle(s)
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <ul className="text-sm space-y-1">
                                  {company.appliedRules?.map((rule, i) => (
                                    <li key={i}>{rule}</li>
                                  ))}
                                </ul>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          {company.rang ? (
                            <Badge className={RANK_COLORS[company.rang]}>
                              Rang {company.rang}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Non défini</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={RANK_COLORS[company.calculatedRank!]}>
                            Rang {company.calculatedRank}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {needsUpdate ? (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                              À mettre à jour
                            </Badge>
                          ) : (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Non-Partner Companies */}
        <TabsContent value="non-partner" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Entreprises sans partenariat ({nonPartnerCompanies.length})
              </CardTitle>
              <CardDescription>
                Rangs basés sur les avantages déclarés par les utilisateurs dans leur profil financier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Config for non-partners */}
              <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Rang de base sans partenariat</Label>
                    <p className="text-sm text-muted-foreground">
                      Rang attribué par défaut aux entreprises sans partenariat
                    </p>
                  </div>
                  <Select
                    value={config.nonPartnerConfig.baseRank.toString()}
                    onValueChange={(v) => setConfig(prev => ({
                      ...prev,
                      nonPartnerConfig: { ...prev.nonPartnerConfig, baseRank: parseInt(v) as 3 | 4 }
                    }))}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">
                        <Badge className={RANK_COLORS[3]}>Rang 3</Badge>
                      </SelectItem>
                      <SelectItem value="4">
                        <Badge className={RANK_COLORS[4]}>Rang 4</Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Appliquer les règles de dispositifs</Label>
                    <p className="text-sm text-muted-foreground">
                      Utiliser les avantages déclarés par les utilisateurs pour ajuster le rang
                    </p>
                  </div>
                  <Switch
                    checked={config.nonPartnerConfig.applyDeviceRules}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      nonPartnerConfig: { ...prev.nonPartnerConfig, applyDeviceRules: checked }
                    }))}
                  />
                </div>

                {config.nonPartnerConfig.applyDeviceRules && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Les règles de dispositifs seront appliquées si plus de 50% des utilisateurs 
                      de l'entreprise déclarent avoir ce dispositif.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Non-partner companies table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Utilisateurs</TableHead>
                    <TableHead>Dispositifs déclarés</TableHead>
                    <TableHead>Rang actuel</TableHead>
                    <TableHead>Rang calculé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nonPartnerStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Aucune entreprise sans partenariat
                      </TableCell>
                    </TableRow>
                  ) : (
                    nonPartnerStats.map(stat => {
                      const company = nonPartnerCompanies.find(c => c.id === stat.companyId);
                      const needsUpdate = stat.calculatedRank !== company?.rang;
                      const activeDevices = Object.entries(stat.devices)
                        .filter(([, count]) => count > 0)
                        .map(([key, count]) => `${DEVICE_LABELS[key as DeviceKey]} (${count})`);

                      return (
                        <TableRow key={stat.companyId} className={needsUpdate ? "bg-yellow-50/50 dark:bg-yellow-950/20" : ""}>
                          <TableCell className="font-medium">{stat.companyName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{stat.userCount}</Badge>
                          </TableCell>
                          <TableCell>
                            {activeDevices.length > 0 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline">{activeDevices.length} types</Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <ul className="text-sm">
                                      {activeDevices.map(d => <li key={d}>{d}</li>)}
                                    </ul>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <span className="text-muted-foreground text-sm">Aucun</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {company?.rang ? (
                              <Badge className={RANK_COLORS[company.rang]}>
                                Rang {company.rang}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">Non défini</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={RANK_COLORS[stat.calculatedRank]}>
                              Rang {stat.calculatedRank}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Enregistrer la configuration
        </Button>
        <Button 
          onClick={handleApplyRanks} 
          disabled={applying || changesCount === 0}
          variant={changesCount > 0 ? "default" : "secondary"}
        >
          {applying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
          Appliquer aux entreprises ({changesCount})
        </Button>
      </div>
    </div>
  );
}
