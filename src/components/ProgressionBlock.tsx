import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, Skull, Check, Lock, Target, Swords } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@/components/CircularProgress";
import { VictoryAnimation } from "@/components/VictoryAnimation";
import { useTheme } from "@/contexts/ThemeContext";
interface ProgressionBlockProps {
  totalPoints: number;
}
interface Villain {
  id: string;
  nom: string;
  theme: string;
  description: string;
  score_a_battre: number;
  image_url: string;
  order_num: number;
}
interface Module {
  id: number;
  title: string;
  theme: string[] | null;
  points: number;
  type: string;
  description: string;
}
interface Profile {
  completed_modules: number[];
}
export const ProgressionBlock = ({
  totalPoints
}: ProgressionBlockProps) => {
  const {
    user
  } = useAuth();
  const {
    currentTheme
  } = useTheme();
  const navigate = useNavigate();
  const [villains, setVillains] = useState<Villain[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedVillain, setSelectedVillain] = useState<Villain | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userParcours, setUserParcours] = useState<number[]>([]);
  const [victoryVillain, setVictoryVillain] = useState<Villain | null>(null);
  const [showVictory, setShowVictory] = useState(false);
  const [blockConfig, setBlockConfig] = useState<any>({
    background_image_url: "/quete-fincare-default.png",
    background_position: "center",
    background_size: "cover",
    overlay_opacity: 0.3,
    title_text: "La Quête FinCare",
    title_color: "#FFFFFF",
    title_align: "center",
    description_text: "Partez à l'aventure et complétez vos formations financières !",
    description_color: "#FFFFFF",
    description_align: "center"
  });
  useEffect(() => {
    fetchVillainsData();
  }, [user]);
  useEffect(() => {
    if (currentTheme) {
      fetchBlockConfig();
    }
  }, [currentTheme]);
  const fetchBlockConfig = async () => {
    try {
      const {
        data
      } = await supabase.from("settings").select("metadata").eq("key", "quete_fincare_block").single();
      if (data?.metadata && typeof data.metadata === 'object') {
        const configs = data.metadata as unknown as Record<string, any>;
        const themeConfig = configs[currentTheme?.id || "villains"];
        if (themeConfig) {
          console.log(`[QueteFinCare] Configuration chargée pour le thème: ${currentTheme?.id}`, themeConfig);
          setBlockConfig({
            ...themeConfig
          });
        } else {
          console.warn(`[QueteFinCare] Pas de configuration pour le thème: ${currentTheme?.id}, utilisation des valeurs par défaut`);
          setBlockConfig({
            background_image_url: "/quete-fincare-default.png",
            background_position: "center",
            background_size: "cover",
            overlay_opacity: 0.3,
            title_text: "La Quête FinCare",
            title_color: "#FFFFFF",
            title_align: "center",
            description_text: "Partez à l'aventure et complétez vos formations financières !",
            description_color: "#FFFFFF",
            description_align: "center"
          });
        }
      }
    } catch (error) {
      console.error("Error fetching block config:", error);
    }
  };
  const fetchVillainsData = async () => {
    if (!user) return;
    try {
      // Get user's profile with company
      const {
        data: profileData
      } = await supabase.from("profiles").select("completed_modules, company_id").eq("id", user.id).single();
      if (!profileData) return;
      setProfile({
        completed_modules: profileData.completed_modules
      });

      // Get user's parcours IDs
      const {
        data: parcoursCompanies
      } = await supabase.from("parcours_companies").select("parcours_id").eq("company_id", profileData.company_id);
      const parcoursIds = parcoursCompanies?.map(pc => pc.parcours_id) || [];

      // Get modules for these parcours
      const {
        data: parcoursModules
      } = await supabase.from("parcours_modules").select("module_id").in("parcours_id", parcoursIds);
      const userModuleIds = parcoursModules?.map(pm => pm.module_id) || [];
      setUserParcours(userModuleIds);

      // Fetch all data
      const [villainsResponse, modulesResponse] = await Promise.all([supabase.from("villains").select("*").order("order_num"), supabase.from("modules").select("id, title, theme, points, type, description")]);
      if (!villainsResponse.error) {
        // Filter villains to only show those with modules in user's parcours
        const filteredVillains = villainsResponse.data.filter(villain => {
          const villainModules = modulesResponse.data?.filter(m => m.theme && m.theme.includes(villain.theme)) || [];
          return villainModules.some(m => userModuleIds.includes(m.id));
        });
        setVillains(filteredVillains);
      }
      if (!modulesResponse.error) {
        // Filter modules to only user's parcours
        const filteredModules = modulesResponse.data.filter(m => userModuleIds.includes(m.id));
        setModules(filteredModules);
      }
    } catch (error) {
      console.error("Error fetching villains data:", error);
    }
  };
  const calculateThemePoints = (theme: string) => {
    if (!profile || !modules) return 0;
    const themeModules = modules.filter(m => m.theme && m.theme.includes(theme));
    const completedThemeModules = themeModules.filter(m => profile.completed_modules.includes(m.id));
    return completedThemeModules.reduce((sum, m) => sum + m.points, 0);
  };
  const isVillainDefeated = (villain: Villain) => {
    const points = calculateThemePoints(villain.theme);
    return points >= villain.score_a_battre;
  };
  const getRemainingPoints = (villain: Villain) => {
    const points = calculateThemePoints(villain.theme);
    return Math.max(0, villain.score_a_battre - points);
  };
  const getVillainModules = (villainTheme: string) => {
    return modules.filter(m => m.theme && m.theme.includes(villainTheme));
  };
  const handleVillainClick = (villain: Villain) => {
    setSelectedVillain(villain);
    setIsDialogOpen(true);
  };
  const handleModuleClick = (moduleId: number) => {
    setIsDialogOpen(false);
    navigate("/parcours");
  };

  // Check if villain was just defeated
  useEffect(() => {
    if (!profile) return;
    villains.forEach(villain => {
      const wasDefeated = isVillainDefeated(villain);
      if (wasDefeated && !sessionStorage.getItem(`victory-${villain.id}`)) {
        setVictoryVillain(villain);
        setShowVictory(true);
        sessionStorage.setItem(`victory-${villain.id}`, "true");
      }
    });
  }, [profile, villains]);
  const hasStartedQuest = profile?.completed_modules && profile.completed_modules.length > 0;
  return <>
      <VictoryAnimation isVisible={showVictory} villainName={victoryVillain?.nom || ""} onComplete={() => {
      setShowVictory(false);
      setVictoryVillain(null);
    }} />

      <Card className="overflow-hidden border-primary/20">
        {/* Hero Section avec image de fond configurée */}
        <div key={currentTheme?.id || 'default'} className="relative min-h-[300px] flex items-center justify-center p-8" style={{
        backgroundImage: `url(${blockConfig.background_image_url}?theme=${currentTheme?.id})`,
        backgroundPosition: blockConfig.background_position,
        backgroundSize: blockConfig.background_size,
        backgroundRepeat: "no-repeat"
      }}>
          <div className="absolute inset-0 bg-black pointer-events-none" style={{
          opacity: blockConfig.overlay_opacity
        }} />
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl font-bold" style={{
            color: blockConfig.title_color,
            textAlign: blockConfig.title_align as any
          }}>
              {blockConfig.title_text}
            </h2>
            <p className="text-lg" style={{
            color: blockConfig.description_color,
            textAlign: blockConfig.description_align as any
          }}>
              {blockConfig.description_text}
            </p>

            {/* Bouton CTA */}
            <div className="flex items-center justify-center pt-4">
              <Button size="lg" onClick={() => navigate("/villains")} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all">
                <Swords className="h-5 w-5 mr-2" />
                {hasStartedQuest ? "Reprendre la quête" : "Commencer la quête"}
              </Button>
            </div>
          </div>
        </div>

        <div>

          {/* Dialog des modules de la mission */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
              {selectedVillain && <>
                  <DialogHeader className="overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-2">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-4 border-primary flex-shrink-0">
                        <img src={selectedVillain.image_url} alt={selectedVillain.nom} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 text-center sm:text-left overflow-hidden">
                        <DialogTitle className="text-xl sm:text-2xl truncate">{selectedVillain.nom}</DialogTitle>
                        <DialogDescription className="text-sm sm:text-base mt-1 truncate">
                          {selectedVillain.theme}
                        </DialogDescription>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-4 p-3 bg-muted/50 rounded-lg">
                      <div className="text-center flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">Score à battre</p>
                        <p className="text-lg sm:text-xl font-bold text-foreground truncate">
                          {selectedVillain.score_a_battre} pts
                        </p>
                      </div>
                      <div className="text-center flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">Vos points</p>
                        <p className="text-lg sm:text-xl font-bold text-primary truncate">
                          {calculateThemePoints(selectedVillain.theme)} pts
                        </p>
                      </div>
                      <div className="text-center flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">Restants</p>
                        <p className="text-lg sm:text-xl font-bold text-muted-foreground truncate">
                          {getRemainingPoints(selectedVillain)} pts
                        </p>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="space-y-3 mt-4 overflow-hidden">
                    <h4 className="font-semibold text-base sm:text-lg flex items-center gap-2 truncate">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <span className="truncate">Modules pour compléter la formation</span>
                    </h4>
                    {getVillainModules(selectedVillain.theme).length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">
                        Aucun module disponible pour ce thème
                      </p> : <div className="space-y-2">
                        {getVillainModules(selectedVillain.theme).map(module => {
                    const isCompleted = profile?.completed_modules.includes(module.id);
                    return <Button key={module.id} variant="outline" className="w-full justify-start h-auto p-3 sm:p-4 hover:bg-primary/5 hover:border-primary transition-all overflow-hidden" onClick={() => handleModuleClick(module.id)}>
                              <div className="flex items-start gap-2 sm:gap-3 w-full min-w-0">
                                <div className={`
                                flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center
                                ${isCompleted ? "bg-primary" : "bg-muted"}
                              `}>
                                  {isCompleted ? <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" /> : <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />}
                                </div>
                                <div className="flex-1 text-left min-w-0 overflow-hidden">
                                  <h5 className="font-medium text-sm sm:text-base text-foreground truncate">
                                    {module.title}
                                  </h5>
                                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 break-words" dangerouslySetInnerHTML={{
                            __html: module.description
                          }} />
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
                                    <Badge variant="secondary" className="text-[10px] sm:text-xs truncate max-w-[120px]">
                                      {module.type}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0">
                                      +{module.points} pts
                                    </Badge>
                                    {isCompleted && <Badge variant="default" className="text-[10px] sm:text-xs bg-primary flex-shrink-0">
                                        Complété
                                      </Badge>}
                                  </div>
                                </div>
                              </div>
                            </Button>;
                  })}
                      </div>}
                  </div>
                </>}
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </>;
};