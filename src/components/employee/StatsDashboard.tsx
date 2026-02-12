import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Route, TrendingUp, Users, CheckCircle2, Calendar, Award, Trophy, Calculator, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { stripHtml } from "@/components/ui/rich-text";

interface StatsDashboardProps {
  completedModules: number;
  completedParcours: number;
  totalPoints: number;
  colleaguesReferred: number;
  completedModuleIds?: number[];
  onNavigateToInvitations?: () => void;
  onNavigateToLeaderboard?: () => void;
  onNavigateToSimulations?: () => void;
  userRank?: { rank: number; total: number } | null;
  enablePointsRanking?: boolean;
  simulationsCount?: number;
}

interface ModuleWithDate {
  id: number;
  title: string;
  description: string;
  points: number;
  type: string;
  completedAt: string | null;
}

interface ParcoursWithDate {
  id: string;
  title: string;
  description: string | null;
  moduleCount: number;
  completedAt: string | null;
}

export function StatsDashboard({
  completedModules,
  completedParcours,
  totalPoints,
  colleaguesReferred,
  completedModuleIds = [],
  onNavigateToInvitations,
  onNavigateToLeaderboard,
  onNavigateToSimulations,
  userRank,
  enablePointsRanking = false,
  simulationsCount = 0,
}: StatsDashboardProps) {
  const navigate = useNavigate();
  const [modulesDialogOpen, setModulesDialogOpen] = useState(false);
  const [parcoursDialogOpen, setParcoursDialogOpen] = useState(false);
  const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
  const [completedModulesData, setCompletedModulesData] = useState<ModuleWithDate[]>([]);
  const [completedParcoursData, setCompletedParcoursData] = useState<ParcoursWithDate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCompletedModules = async () => {
    if (completedModuleIds.length === 0) return;
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Fetch modules
      const { data: modules } = await supabase
        .from("modules")
        .select("id, title, description, points, type")
        .in("id", completedModuleIds);

      // Fetch validation dates
      const { data: validations } = await supabase
        .from("module_validations")
        .select("module_id, attempted_at")
        .eq("user_id", user.user.id)
        .eq("success", true)
        .in("module_id", completedModuleIds);

      if (modules) {
        const modulesWithDates = modules.map(module => {
          const validation = validations?.find(v => v.module_id === module.id);
          return {
            ...module,
            completedAt: validation?.attempted_at || null,
          };
        });
        // Sort by date, most recent first
        modulesWithDates.sort((a, b) => {
          if (!a.completedAt) return 1;
          if (!b.completedAt) return -1;
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
        });
        setCompletedModulesData(modulesWithDates);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedParcours = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("completed_modules")
        .eq("id", user.user.id)
        .single();

      if (!profile) return;

      const completedModulesArray = profile.completed_modules || [];
      if (completedModulesArray.length === 0) {
        setCompletedParcoursData([]);
        return;
      }

      // Fetch all parcours_modules to group by parcours
      const { data: parcoursModulesData } = await supabase
        .from("parcours_modules")
        .select("parcours_id, module_id");

      if (!parcoursModulesData || parcoursModulesData.length === 0) {
        setCompletedParcoursData([]);
        return;
      }

      // Group modules by parcours
      const parcourModulesMap = new Map<string, number[]>();
      parcoursModulesData.forEach((pm) => {
        const modules = parcourModulesMap.get(pm.parcours_id) || [];
        modules.push(pm.module_id);
        parcourModulesMap.set(pm.parcours_id, modules);
      });

      // Find completed parcours IDs
      const completedParcoursIds: string[] = [];
      parcourModulesMap.forEach((modules, parcoursId) => {
        const allCompleted = modules.every((m) => completedModulesArray.includes(m));
        if (allCompleted && modules.length > 0) {
          completedParcoursIds.push(parcoursId);
        }
      });

      if (completedParcoursIds.length === 0) {
        setCompletedParcoursData([]);
        return;
      }

      // Fetch parcours details
      const { data: parcoursData } = await supabase
        .from("parcours")
        .select("id, title, description")
        .in("id", completedParcoursIds);

      if (!parcoursData) {
        setCompletedParcoursData([]);
        return;
      }

      // Fetch all validations for the user to get completion dates
      const { data: validations } = await supabase
        .from("module_validations")
        .select("module_id, attempted_at")
        .eq("user_id", user.user.id)
        .eq("success", true);

      // Build completed parcours list with dates
      const completedParcoursList: ParcoursWithDate[] = parcoursData.map((parcours) => {
        const moduleIds = parcourModulesMap.get(parcours.id) || [];
        
        // Find the latest completion date among all modules of this parcours
        const moduleValidations = validations?.filter(v => moduleIds.includes(v.module_id)) || [];
        const latestDate = moduleValidations.reduce((latest, v) => {
          if (!v.attempted_at) return latest;
          if (!latest) return v.attempted_at;
          return new Date(v.attempted_at) > new Date(latest) ? v.attempted_at : latest;
        }, null as string | null);

        return {
          id: parcours.id,
          title: parcours.title,
          description: parcours.description,
          moduleCount: moduleIds.length,
          completedAt: latestDate,
        };
      });

      // Sort by date, most recent first
      completedParcoursList.sort((a, b) => {
        if (!a.completedAt) return 1;
        if (!b.completedAt) return -1;
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      });

      setCompletedParcoursData(completedParcoursList);
    } catch (error) {
      console.error("Error fetching parcours:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (modulesDialogOpen) fetchCompletedModules();
  }, [modulesDialogOpen, completedModuleIds]);

  useEffect(() => {
    if (parcoursDialogOpen) fetchCompletedParcours();
  }, [parcoursDialogOpen]);

  useEffect(() => {
    if (pointsDialogOpen && completedModulesData.length === 0) {
      fetchCompletedModules();
    }
  }, [pointsDialogOpen]);

  const getModuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      video: "Vidéo",
      quiz: "Quiz",
      formation: "Formation",
      webinar: "Webinaire",
      guide: "Guide",
      appointment: "Rendez-vous",
      meeting: "Rendez-vous",
      simulator: "Simulateur",
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Date inconnue";
    try {
      return format(new Date(dateString), "d MMMM yyyy", { locale: fr });
    } catch {
      return "Date inconnue";
    }
  };

  // Build stats array based on enablePointsRanking
  const stats = [
    ...(enablePointsRanking ? [{
      id: "rank",
      label: "Mon classement dans l'entreprise",
      value: userRank ? `${userRank.rank}/${userRank.total}` : "-",
      icon: Trophy,
      color: "text-orange-500 dark:text-orange-400",
      bgColor: "bg-orange-500/20",
      gradientFrom: "from-orange-500/10",
      gradientTo: "to-orange-500/5",
      onClick: onNavigateToLeaderboard,
    }] : []),
    {
      id: "modules",
      label: "Modules terminés",
      value: completedModules,
      icon: BookOpen,
      color: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-blue-500/20",
      gradientFrom: "from-blue-500/10",
      gradientTo: "to-blue-500/5",
      onClick: () => setModulesDialogOpen(true),
      zeroLabel: "Découvrir les modules",
      zeroAction: () => navigate("/parcours"),
    },
    {
      id: "parcours",
      label: "Parcours terminés",
      value: completedParcours,
      icon: Route,
      color: "text-emerald-500 dark:text-emerald-400",
      bgColor: "bg-emerald-500/20",
      gradientFrom: "from-emerald-500/10",
      gradientTo: "to-emerald-500/5",
      onClick: () => setParcoursDialogOpen(true),
      zeroLabel: "Découvrir les parcours",
      zeroAction: () => navigate("/parcours"),
    },
    {
      id: "simulations",
      label: "Simulations réalisées",
      value: simulationsCount,
      icon: Calculator,
      color: "text-cyan-500 dark:text-cyan-400",
      bgColor: "bg-cyan-500/20",
      gradientFrom: "from-cyan-500/10",
      gradientTo: "to-cyan-500/5",
      onClick: onNavigateToSimulations,
      zeroLabel: "Mes simulations",
      zeroAction: () => navigate("/employee/simulations"),
    },
    ...(enablePointsRanking ? [{
      id: "points",
      label: "Points obtenus",
      value: totalPoints.toLocaleString("fr-FR"),
      icon: TrendingUp,
      color: "text-amber-500 dark:text-amber-400",
      bgColor: "bg-amber-500/20",
      gradientFrom: "from-amber-500/10",
      gradientTo: "to-amber-500/5",
      onClick: () => setPointsDialogOpen(true),
    }] : []),
    {
      id: "colleagues",
      label: "Collègues parrainés",
      value: colleaguesReferred,
      icon: Users,
      color: "text-violet-500 dark:text-violet-400",
      bgColor: "bg-violet-500/20",
      gradientFrom: "from-violet-500/10",
      gradientTo: "to-violet-500/5",
      onClick: onNavigateToInvitations,
      zeroLabel: "Inviter un collègue",
      zeroAction: onNavigateToInvitations,
    },
  ];

  // Dynamic grid classes based on number of stats
  const getGridClasses = () => {
    const count = stats.length;
    if (count <= 3) return "grid-cols-1 sm:grid-cols-3";
    if (count === 4) return "grid-cols-2 sm:grid-cols-4";
    if (count === 5) return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6";
  };

  return (
    <>
      <div className={`grid ${getGridClasses()} gap-3 sm:gap-4`}>
        {stats.map((stat) => {
          const isZero = stat.value === 0 && 'zeroLabel' in stat && stat.zeroLabel;
          return (
            <Card 
              key={stat.id} 
              className={`transition-all duration-300 ${isZero ? 'bg-muted/50' : ''} ${(isZero ? stat.zeroAction : stat.onClick) ? 'cursor-pointer hover:shadow-lg' : ''}`}
              onClick={isZero ? stat.zeroAction : stat.onClick}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradientFrom} ${stat.gradientTo} opacity-60`} />
              <CardContent className="relative p-3 sm:p-4">
                <div className="flex flex-col items-start gap-2">
                  <div className={`p-2 sm:p-2.5 rounded-xl ${stat.bgColor} flex-shrink-0`}>
                    <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                  </div>
                  <div className="min-w-0 w-full">
                    {isZero ? (
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                        {stat.zeroLabel}
                        <ArrowRight className="h-3 w-3 flex-shrink-0 opacity-60" />
                      </p>
                    ) : (
                      <>
                        <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground leading-snug break-words hyphens-auto">{stat.label}</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modules Dialog */}
      <Dialog open={modulesDialogOpen} onOpenChange={setModulesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Modules terminés
            </DialogTitle>
            <DialogDescription>
              Récapitulatif de tous les modules que vous avez complétés
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : completedModulesData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun module terminé pour le moment
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {completedModulesData.map((module) => (
                  <Card key={module.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <h4 className="font-medium text-foreground">{module.title}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {stripHtml(module.description)}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Terminé le {formatDate(module.completedAt)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="secondary">{getModuleTypeLabel(module.type)}</Badge>
                          <span className="text-sm font-medium text-amber-500 dark:text-amber-400">
                            +{module.points} pts
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Parcours Dialog */}
      <Dialog open={parcoursDialogOpen} onOpenChange={setParcoursDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-emerald-500" />
              Parcours terminés
            </DialogTitle>
            <DialogDescription>
              Récapitulatif de tous les parcours que vous avez complétés
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : completedParcoursData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun parcours terminé pour le moment
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {completedParcoursData.map((parcours) => (
                  <Card key={parcours.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <h4 className="font-medium text-foreground">{parcours.title}</h4>
                          </div>
                          {parcours.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {stripHtml(parcours.description)}
                            </p>
                          )}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Terminé le {formatDate(parcours.completedAt)}</span>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {parcours.moduleCount} modules
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Points Dialog */}
      <Dialog open={pointsDialogOpen} onOpenChange={setPointsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Points obtenus
            </DialogTitle>
            <DialogDescription>
              Détail de tous les points que vous avez gagnés
            </DialogDescription>
          </DialogHeader>
          <div className="mb-4 p-4 bg-amber-500/10 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total des points</span>
              <span className="text-2xl font-bold text-amber-500 dark:text-amber-400">
                {totalPoints.toLocaleString("fr-FR")} pts
              </span>
            </div>
          </div>
          <ScrollArea className="max-h-[50vh]">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : completedModulesData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun point obtenu pour le moment
              </div>
            ) : (
              <div className="space-y-2 pr-4">
                {completedModulesData.map((module) => (
                  <div 
                    key={module.id} 
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <Award className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="font-medium text-sm">{module.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{getModuleTypeLabel(module.type)}</span>
                          <span>•</span>
                          <span>{formatDate(module.completedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <span className="font-semibold text-amber-500">
                      +{module.points} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
