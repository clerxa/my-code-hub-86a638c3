import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingScreen, SCREEN_TYPE_LABELS } from "@/types/onboarding-cms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  GraduationCap, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Parcours {
  id: string;
  title: string;
}

interface OptionWithContext {
  screenId: string;
  screenTitle: string;
  screenType: string;
  screenOrder: number;
  optionIndex: number;
  optionLabel: string;
  optionValue: string;
  parcoursId: string | null;
  parcoursTitle: string | null;
}

interface ParcoursAssignmentTabProps {
  screens: OnboardingScreen[];
  onUpdateScreen: (screen: OnboardingScreen) => void;
}

export function ParcoursAssignmentTab({ screens, onUpdateScreen }: ParcoursAssignmentTabProps) {
  const [parcoursList, setParcoursList] = useState<Parcours[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "assigned" | "unassigned">("all");

  useEffect(() => {
    fetchParcours();
  }, []);

  const fetchParcours = async () => {
    try {
      const { data, error } = await supabase
        .from("parcours")
        .select("id, title")
        .order("title");
      
      if (error) throw error;
      setParcoursList(data || []);
    } catch (error) {
      console.error("Error fetching parcours:", error);
      toast.error("Erreur lors du chargement des parcours");
    } finally {
      setLoading(false);
    }
  };

  // Build flat list of all options with their context
  const allOptions = useMemo(() => {
    const options: OptionWithContext[] = [];
    
    screens
      .filter(s => s.options && s.options.length > 0)
      .sort((a, b) => a.order_num - b.order_num)
      .forEach(screen => {
        screen.options?.forEach((option, idx) => {
          const parcours = parcoursList.find(p => p.id === option.parcoursId);
          options.push({
            screenId: screen.id,
            screenTitle: screen.title,
            screenType: screen.type,
            screenOrder: screen.order_num,
            optionIndex: idx,
            optionLabel: String(option.label || ''),
            optionValue: String(option.value || ''),
            parcoursId: option.parcoursId || null,
            parcoursTitle: parcours?.title || null,
          });
        });
      });
    
    return options;
  }, [screens, parcoursList]);

  // Filter options based on search and filter mode
  const filteredOptions = useMemo(() => {
    return allOptions.filter(opt => {
      const matchesSearch = searchTerm === "" || 
        opt.optionLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.screenTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opt.parcoursTitle && opt.parcoursTitle.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = 
        filterMode === "all" ||
        (filterMode === "assigned" && opt.parcoursId) ||
        (filterMode === "unassigned" && !opt.parcoursId);
      
      return matchesSearch && matchesFilter;
    });
  }, [allOptions, searchTerm, filterMode]);

  // Stats
  const stats = useMemo(() => {
    const total = allOptions.length;
    const assigned = allOptions.filter(o => o.parcoursId).length;
    return { total, assigned, unassigned: total - assigned };
  }, [allOptions]);

  const handleParcoursChange = (option: OptionWithContext, newParcoursId: string | null) => {
    const screen = screens.find(s => s.id === option.screenId);
    if (!screen || !screen.options) return;

    const newOptions = [...screen.options];
    newOptions[option.optionIndex] = {
      ...newOptions[option.optionIndex],
      parcoursId: newParcoursId || undefined,
    };

    onUpdateScreen({ ...screen, options: newOptions });
    toast.success(newParcoursId 
      ? `Parcours assigné à "${option.optionLabel}"` 
      : `Parcours retiré de "${option.optionLabel}"`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Options totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.assigned}</p>
                <p className="text-xs text-muted-foreground">Avec parcours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unassigned}</p>
                <p className="text-xs text-muted-foreground">Sans parcours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une option, un écran ou un parcours..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterMode} onValueChange={(v) => setFilterMode(v as typeof filterMode)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les options</SelectItem>
            <SelectItem value="assigned">Avec parcours</SelectItem>
            <SelectItem value="unassigned">Sans parcours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Attribution des parcours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Écran</TableHead>
                  <TableHead>Option</TableHead>
                  <TableHead className="w-[250px]">Parcours assigné</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Aucune option trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOptions.map((option, idx) => (
                    <TableRow key={`${option.screenId}-${option.optionIndex}`}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {option.screenOrder + 1}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm line-clamp-1">{option.screenTitle}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {SCREEN_TYPE_LABELS[option.screenType as keyof typeof SCREEN_TYPE_LABELS]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">{option.optionLabel}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={option.parcoursId || "_none"}
                          onValueChange={(v) => handleParcoursChange(option, v === "_none" ? null : v)}
                        >
                          <SelectTrigger className={`w-full ${option.parcoursId ? 'border-green-500/50 bg-green-500/5' : ''}`}>
                            <SelectValue placeholder="Aucun parcours" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_none">
                              <span className="text-muted-foreground">Aucun parcours</span>
                            </SelectItem>
                            {parcoursList.map((parcours) => (
                              <SelectItem key={parcours.id} value={parcours.id}>
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="h-3 w-3 text-primary" />
                                  {parcours.title}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
