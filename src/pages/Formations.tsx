/**
 * ===========================================================
 * 📄 File: Formations.tsx
 * 📌 Rôle : Page d'affichage des formations avec support multi-thèmes
 * 🧩 Dépendances : ThemeContext, Supabase, UI components
 * 🔁 Logiques : Affichage des formations selon le thème utilisateur
 * ===========================================================
 */

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Shield, Zap, Trophy, BookOpen, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import type { Villain, VillainThemeData } from "@/types/theme";

// On garde le type Villain pour la compatibilité avec la table DB existante mais le concept est renommé "Formation"
type Formation = Villain;
type FormationThemeData = VillainThemeData;

interface Module {
  id: number;
  title: string;
  theme: string[] | null;
  points: number;
  description?: string;
  type: string;
}

interface Profile {
  completed_modules: number[];
  total_points: number;
}

interface FinalBossThemeData {
  nom: string;
  description: string;
  image_url: string;
}

interface FinalBossSettings {
  id: string;
  nom: string;
  description: string;
  image_url: string;
  theme_data: Record<string, FinalBossThemeData>;
}

export default function Formations() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentTheme, getVillainData } = useTheme();
  const [villains, setVillains] = useState<Villain[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVillain, setSelectedVillain] = useState<Villain | null>(null);
  const [selectedVillainData, setSelectedVillainData] = useState<VillainThemeData | null>(null);
  const [villainModules, setVillainModules] = useState<Module[]>([]);
  const [finalBoss, setFinalBoss] = useState<FinalBossSettings | null>(null);
  const defaultTab = searchParams.get("tab") || "list";

  useEffect(() => {
    fetchData();
    fetchFinalBoss();
  }, []);

  const fetchFinalBoss = async () => {
    try {
      const { data, error } = await supabase
        .from("final_boss_settings")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setFinalBoss(data as unknown as FinalBossSettings);
      }
    } catch (error) {
      console.error("Error fetching final boss:", error);
    }
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Get user profile first to get company_id
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("completed_modules, total_points, company_id")
        .eq("id", user.id)
        .single();

      if (!userProfile) {
        toast.error("Profil utilisateur non trouvé");
        return;
      }

      // Get active parcours for the user's company
      const { data: parcoursCompanies } = await supabase
        .from("parcours_companies")
        .select(`
          parcours_id,
          parcours:parcours_id (
            id,
            title
          )
        `)
        .eq("company_id", userProfile.company_id);

      // Also get parcours assigned directly to the user (from onboarding)
      const { data: userParcours } = await supabase
        .from("user_parcours")
        .select(`
          parcours_id,
          parcours:parcours_id (
            id,
            title
          )
        `)
        .eq("user_id", user.id);

      // Combine both sources of parcours (company + user direct)
      const companyParcoursIds = parcoursCompanies?.map(pc => pc.parcours_id) || [];
      const userParcoursIds = userParcours?.map(up => up.parcours_id) || [];
      const parcoursIds = [...new Set([...companyParcoursIds, ...userParcoursIds])];

      if (parcoursIds.length === 0) {
        toast.error("Aucun parcours actif pour votre profil");
        setLoading(false);
        return;
      }

      // Get modules from active parcours
      const { data: parcoursModules } = await supabase
        .from("parcours_modules")
        .select(`
          module_id,
          modules:module_id (
            id,
            title,
            theme,
            points,
            description,
            type
          )
        `)
        .in("parcours_id", parcoursIds);

      const activeModules = (parcoursModules || [])
        .map(pm => pm.modules)
        .filter(Boolean) as Module[];

      // Get all villains
      const { data: allVillains } = await supabase
        .from("villains")
        .select("*")
        .order("order_num");

      // Filter villains to only show those with modules in active parcours
      const activeThemes = new Set(
        activeModules.flatMap(m => m.theme || [])
      );

      const filteredVillains = (allVillains || []).filter(villain => 
        activeThemes.has(villain.theme)
      );

      setVillains(filteredVillains as unknown as Villain[]);
      setModules(activeModules);
      setProfile(userProfile);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des vilains");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🔹 Calcule les points obtenus pour un thème donné
   */
  const calculateVillainPoints = (theme: string) => {
    if (!profile || !modules) return 0;
    const themeModules = modules.filter(m => m.theme && m.theme.includes(theme));
    const completedThemeModules = themeModules.filter(m => profile.completed_modules.includes(m.id));
    return completedThemeModules.reduce((sum, m) => sum + m.points, 0);
  };

  /**
   * 🔹 Calcule le total des points disponibles pour un thème
   */
  const getTotalVillainPoints = (theme: string) => {
    if (!modules) return 0;
    const themeModules = modules.filter(m => m.theme && m.theme.includes(theme));
    return themeModules.reduce((sum, m) => sum + m.points, 0);
  };

  /**
   * 🔹 Détermine si un vilain est vaincu
   */
  const isVillainDefeated = (villain: Villain) => {
    const villainData = getVillainData(villain);
    const points = calculateVillainPoints(villainData.theme);
    const totalPoints = getTotalVillainPoints(villainData.theme);
    return totalPoints > 0 && points >= totalPoints;
  };

  const getDefeatedCount = () => {
    return villains.filter(v => isVillainDefeated(v)).length;
  };

  const getModuleActionVerb = (moduleType: string) => {
    switch (moduleType) {
      case 'webinar':
        return 'Participer au webinar';
      case 'quiz':
        return 'Réaliser le quiz';
      case 'guide':
      case 'formation':
        return 'Lire le document';
      case 'video':
        return 'Regarder la vidéo';
      case 'appointment':
        return 'Prendre rendez-vous avec un expert';
      default:
        return 'Commencer le module';
    }
  };

  /**
   * 🔹 Gère le clic sur un vilain pour afficher les détails
   */
  const handleVillainClick = (villain: Villain) => {
    setSelectedVillain(villain);
    const villainData = getVillainData(villain);
    setSelectedVillainData(villainData);
    const relatedModules = modules.filter(m => m.theme && m.theme.includes(villainData.theme));
    setVillainModules(relatedModules);
  };

  const handleModuleClick = async (moduleId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's company
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!userProfile?.company_id) return;

      // Find the parcours containing this module for the user's company
      const { data: parcoursModules } = await supabase
        .from("parcours_modules")
        .select(`
          parcours_id,
          parcours:parcours_id (
            id,
            title
          )
        `)
        .eq("module_id", moduleId);

      if (!parcoursModules || parcoursModules.length === 0) return;

      // Check which parcours is active for the company
      const { data: activeParcoursForCompany } = await supabase
        .from("parcours_companies")
        .select("parcours_id")
        .eq("company_id", userProfile.company_id)
        .in("parcours_id", parcoursModules.map(pm => pm.parcours_id));

      if (activeParcoursForCompany && activeParcoursForCompany.length > 0) {
        const parcoursId = activeParcoursForCompany[0].parcours_id;
        navigate(`/parcours/${parcoursId}?module=${moduleId}`);
      }
    } catch (error) {
      console.error("Error navigating to module:", error);
      toast.error("Erreur lors de la navigation vers le module");
    }
  };

  const getVillainPosition = (index: number, total: number) => {
    const angle = (index * 360) / total - 90;
    const radius = 45;
    const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
    const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
    return { x, y };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary text-xl animate-pulse">Chargement des vilains...</div>
      </div>
    );
  }

  const defeatedCount = getDefeatedCount();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/employee")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 mx-auto mb-4 text-primary animate-pulse" />
          <h1 className="text-5xl font-bold mb-4 hero-gradient">
            Vos Missions FinCare
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Accomplissez vos missions pour maîtriser la finance et débloquer des superpouvoirs pour votre entreprise !
          </p>
          <Badge variant="outline" className="text-lg px-6 py-2">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
            {defeatedCount} / {villains.length} {currentTheme?.labels.villainLabelPlural.toLowerCase() || "vilains"} {currentTheme?.labels.defeatedLabel.toLowerCase() || "vaincus"}
          </Badge>
        </div>

        {/* Tabs for List/Map views */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="list">Liste</TabsTrigger>
            <TabsTrigger value="map">Carte</TabsTrigger>
          </TabsList>

          {/* List View */}
          <TabsContent value="list">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {villains.map((villain) => {
                const villainData = getVillainData(villain);
                const points = calculateVillainPoints(villainData.theme);
                const totalPoints = getTotalVillainPoints(villainData.theme);
                const defeated = isVillainDefeated(villain);
                const progress = totalPoints > 0 ? Math.min((points / totalPoints) * 100, 100) : 0;
                const pointsRemaining = Math.max(totalPoints - points, 0);

                return (
                  <div
                    key={villain.id}
                    onClick={() => handleVillainClick(villain)}
                    className={`relative group bg-card border-2 ${
                      defeated ? "border-green-500/30" : "border-primary/30"
                    } rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer`}
                  >
                    {defeated && (
                      <div className="absolute top-4 right-4 z-20">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50 animate-pulse">
                          <Zap className="h-3 w-3 mr-1" />
                          Vaincu
                        </Badge>
                      </div>
                    )}

                    <div className={`relative h-80 flex items-center justify-center ${
                      defeated ? "opacity-40" : ""
                    }`}>
                      <img
                        src={villainData.image_url}
                        alt={villainData.nom}
                        className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                      />
                      {defeated && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-1 bg-red-500 rotate-45 shadow-2xl shadow-red-500" />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-2xl font-bold mb-2 text-primary">{villainData.nom}</h3>
                      <Badge variant="outline" className="mb-3 border-primary/50">
                        {villainData.theme}
                      </Badge>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        {villainData.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progression</span>
                          <span className="text-primary font-bold">{points} / {totalPoints}</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                      </div>

                      <div className={`text-center py-2 rounded-lg ${
                        defeated 
                          ? "bg-green-500/10 text-green-400" 
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        <span className="text-sm font-semibold">
                          {defeated ? "Boss vaincu !" : `Points restants : ${pointsRemaining}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Map View */}
          <TabsContent value="map">
            <div className="relative w-full max-w-5xl mx-auto aspect-square">
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                {villains.map((villain, index) => {
                  const pos = getVillainPosition(index, villains.length);
                  return (
                    <line
                      key={villain.id}
                      x1="50%"
                      y1="50%"
                      x2={`${pos.x}%`}
                      y2={`${pos.y}%`}
                      stroke={isVillainDefeated(villain) ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                      strokeWidth="1"
                      strokeOpacity="0.3"
                      strokeDasharray="4 4"
                    />
                  );
                })}
              </svg>

              {/* Boss Central */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                {(() => {
                  // Récupérer les données du boss selon le thème actuel
                  const themeId = currentTheme?.id;
                  const bossData = themeId && finalBoss?.theme_data?.[themeId] 
                    ? finalBoss.theme_data[themeId]
                    : { nom: finalBoss?.nom || "BOSS FINAL", image_url: finalBoss?.image_url || "/villains/dominius-complexus.png" };
                  
                  return (
                    <div className="relative group cursor-pointer">
                      <div className="absolute inset-0 bg-destructive/20 rounded-full blur-3xl animate-pulse" />
                      <div className="relative w-48 h-48 rounded-full border-4 border-destructive/50 overflow-hidden bg-background flex items-center justify-center shadow-2xl">
                        <img
                          src={bossData.image_url}
                          alt={bossData.nom}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <span className="text-destructive font-bold text-lg tracking-wider drop-shadow-lg">
                          {bossData.nom}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Villains Circle */}
              {villains.map((villain, index) => {
                const villainData = getVillainData(villain);
                const pos = getVillainPosition(index, villains.length);
                const defeated = isVillainDefeated(villain);
                const points = calculateVillainPoints(villainData.theme);
                const totalPoints = getTotalVillainPoints(villainData.theme);
                const progress = totalPoints > 0 ? Math.min((points / totalPoints) * 100, 100) : 0;
                const pointsRemaining = Math.max(totalPoints - points, 0);

                return (
                  <div
                    key={villain.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{ left: `${pos.x}%`, top: `${pos.y}%`, zIndex: 20 }}
                    onClick={() => handleVillainClick(villain)}
                  >
                    <div className="relative">
                      <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-300 ${
                        defeated 
                          ? "bg-primary/30 group-hover:bg-primary/50" 
                          : "bg-destructive/30 group-hover:bg-destructive/50"
                      }`} />
                      
                      <div className={`relative w-20 h-20 rounded-full border-3 overflow-hidden transition-all duration-300 transform group-hover:scale-150 ${
                        defeated 
                          ? "border-primary shadow-lg shadow-primary/50" 
                          : "border-destructive shadow-lg shadow-destructive/50"
                      }`}>
                        <img
                          src={villainData.image_url}
                          alt={villainData.nom}
                          className={`w-full h-full object-cover ${defeated ? "opacity-50" : "opacity-90"}`}
                        />
                        {defeated && (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                            <Trophy className="h-8 w-8 text-primary" />
                          </div>
                        )}
                      </div>

                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-24">
                        <Progress value={progress} className="h-1" />
                      </div>

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                        <div className="bg-card border-2 border-primary/50 rounded-lg px-4 py-3 shadow-2xl min-w-[200px]">
                          <div className="text-center space-y-2">
                            <h4 className="font-bold text-primary text-lg">{villainData.nom}</h4>
                            <Badge variant="outline" className="border-primary/50 text-xs">
                              {villain.theme}
                            </Badge>
                            <div className={`text-sm font-semibold ${
                              defeated ? "text-green-500" : "text-destructive"
                            }`}>
                              {defeated 
                                ? "Boss vaincu !" 
                                : `${pointsRemaining} points restants`
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Villain Detail Dialog */}
      <Dialog open={!!selectedVillain} onOpenChange={() => setSelectedVillain(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold hero-gradient">
              {selectedVillainData?.nom}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-base">
              {selectedVillainData?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedVillain && selectedVillainData && (
            <div className="space-y-6">
              {/* Origine / Histoire */}
              {selectedVillainData.origine && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {currentTheme?.labels.originLabel || "Origine"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedVillainData.origine}
                  </p>
                </div>
              )}

              {/* Pouvoirs */}
              {selectedVillainData.pouvoirs && selectedVillainData.pouvoirs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5 text-destructive" />
                    {currentTheme?.labels.powerLabel || "Pouvoirs"}
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {selectedVillainData.pouvoirs.map((pouvoir, i) => (
                      <li key={i}>{pouvoir}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Faiblesses */}
              {selectedVillainData.faiblesses && selectedVillainData.faiblesses.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {currentTheme?.labels.weaknessLabel || "Faiblesses"}
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {selectedVillainData.faiblesses.map((faiblesse, i) => (
                      <li key={i}>{faiblesse}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="text-primary font-bold">
                    {calculateVillainPoints(selectedVillainData.theme)} / {getTotalVillainPoints(selectedVillainData.theme)} points
                  </span>
                </div>
                <Progress 
                  value={getTotalVillainPoints(selectedVillainData.theme) > 0 
                    ? Math.min((calculateVillainPoints(selectedVillainData.theme) / getTotalVillainPoints(selectedVillainData.theme)) * 100, 100)
                    : 0
                  } 
                  className="h-3"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Modules disponibles
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {villainModules.length > 0 ? (
                    villainModules.map((module) => {
                      const isCompleted = profile?.completed_modules.includes(module.id);
                      return (
                        <div
                          key={module.id}
                          onClick={() => handleModuleClick(module.id)}
                          className={`p-4 rounded-lg border transition-all cursor-pointer hover:border-primary/50 ${
                            isCompleted 
                              ? "bg-green-500/10 border-green-500/30" 
                              : "bg-card border-border hover:bg-card/80"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{module.title}</h4>
                              <p className="text-sm text-primary mt-1">{getModuleActionVerb(module.type)}</p>
                              <p className="text-sm text-muted-foreground mt-1">+{module.points} points</p>
                            </div>
                            {isCompleted && (
                              <Badge variant="outline" className="border-green-500/50 text-green-500">
                                ✓ Complété
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Aucune mission disponible pour ce vilain
                    </p>
                  )}
                </div>
              </div>

              <Button 
                onClick={() => {
                  setSelectedVillain(null);
                  navigate("/employee");
                }} 
                className="w-full"
                size="lg"
              >
                Voir mes parcours
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
