import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Award, Lock, CheckCircle, Building2, User, Sparkles, Globe } from "lucide-react";
import { WebinarModule } from "@/components/modules/WebinarModule";
import { QuizModule } from "@/components/modules/QuizModule";
import { AppointmentModule } from "@/components/modules/AppointmentModule";
import { GuideModule } from "@/components/modules/GuideModule";
import { VideoModule } from "@/components/modules/VideoModule";
import { FinancialProfileModule } from "@/components/modules/FinancialProfileModule";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { ParcoursCompletionCelebration } from "@/components/parcours/ParcoursCompletionCelebration";
import { ParcoursFilter, type ParcoursFilterValue, filterParcours } from "@/components/parcours/ParcoursFilter";
import { stripHtml } from "@/components/ui/rich-text";

interface Module {
  id: number;
  title: string;
  description: string;
  type: string;
  points: number;
  content_url: string | null;
  order_num: number;
  webinar_date: string | null;
  webinar_registration_url: string | null;
  webinar_image_url: string | null;
  quiz_questions: any | null;
  appointment_calendar_url: string | null;
  content_type?: string | null;
  embed_code?: string | null;
  content_data?: any | null;
  pedagogical_objectives?: string[] | null;
  estimated_time?: number | null;
  difficulty_level?: number | null;
  key_takeaways?: string[] | null;
  auto_validate?: boolean | null;
  is_optional?: boolean | null;
}

interface ParcoursModule {
  id: string;
  module_id: number;
  order_num: number;
  is_optional?: boolean;
  module: Module;
}

interface Parcours {
  id: string;
  title: string;
  description: string | null;
  modules: ParcoursModule[];
}

interface ParcoursCardProps {
  parcours: {
    id: string;
    title: string;
    description: string | null;
    moduleCount: number;
    moduleIds: number[];
    totalPoints: number;
    source: 'company' | 'personal' | 'generic';
  };
  completedModules: number[];
  onNavigate: (id: string) => void;
}

const ParcoursCard = ({ parcours: p, completedModules, onNavigate }: ParcoursCardProps) => {
  const completedCount = p.moduleIds.filter(id => completedModules.includes(id)).length;
  const actualEarnedPoints = p.moduleCount > 0 
    ? Math.round((completedCount / p.moduleCount) * p.totalPoints)
    : 0;
  
  const status = completedCount === 0 
    ? 'non_commence' 
    : completedCount === p.moduleCount 
      ? 'termine' 
      : 'en_cours';

  return (
    <Card 
      className={`p-3 sm:p-6 hover:shadow-lg cursor-pointer transition-all ${
        status === 'termine' 
          ? 'border-green-500/50 bg-green-500/5' 
          : 'hover:border-primary/50'
      }`}
      onClick={() => onNavigate(p.id)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <h3 className="text-base sm:text-xl font-semibold">{p.title}</h3>
            {status === 'termine' && (
              <Badge className="bg-green-500 text-white text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Terminé
              </Badge>
            )}
            {status === 'en_cours' && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                En cours
              </Badge>
            )}
            {status === 'non_commence' && (
              <Badge variant="outline" className="text-muted-foreground text-xs">
                Non commencé
              </Badge>
            )}
          </div>
          {p.description && (
            <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">{stripHtml(p.description)}</p>
          )}
          <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Progress value={p.moduleCount > 0 ? (completedCount / p.moduleCount) * 100 : 0} className="w-16 sm:w-24 h-2" />
              <span className={`text-xs sm:text-sm ${status === 'termine' ? 'text-green-600 font-semibold' : 'text-muted-foreground'}`}>
                {completedCount}/{p.moduleCount}
              </span>
            </div>
          </div>
        </div>
        <Button variant={status === 'termine' ? 'outline' : 'default'} className="shrink-0 w-full sm:w-auto" size="sm">
          {status === 'termine' ? 'Revoir' : status === 'en_cours' ? 'Continuer' : 'Commencer'}
        </Button>
      </div>
    </Card>
  );
};
const Parcours = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedModuleId = searchParams.get("module");
  const { user } = useAuth();
  const [parcours, setParcours] = useState<Parcours | null>(null);
  const [parcoursList, setParcoursList] = useState<Array<{ 
    id: string; 
    title: string; 
    description: string | null; 
    moduleCount: number;
    moduleIds: number[];
    totalPoints: number;
    source: 'company' | 'personal' | 'generic';
  }>>([]);
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [showGuideModule, setShowGuideModule] = useState(false);
  const [showVideoModule, setShowVideoModule] = useState(false);
  const [showFinancialProfileModule, setShowFinancialProfileModule] = useState(false);
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  const [parcoursFilter, setParcoursFilter] = useState<ParcoursFilterValue>("all");
  const [enablePointsRanking, setEnablePointsRanking] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      fetchParcoursData();
    } else {
      fetchParcoursList();
    }
  }, [id]);

  // Scroll to highlighted module
  useEffect(() => {
    if (highlightedModuleId && parcours) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`module-${highlightedModuleId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [highlightedModuleId, parcours]);

  const fetchParcoursList = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's company_id
      const { data: profileData } = await supabase
        .from("profiles")
        .select("completed_modules, company_id")
        .eq("id", user.id)
        .maybeSingle();

      setCompletedModules(profileData?.completed_modules || []);
      const companyId = profileData?.company_id;

      // Get all parcours with modules - ordered by display_order for consistent ordering
      const { data: allParcours, error } = await supabase
        .from("parcours")
        .select(`
          id,
          title,
          description,
          is_default,
          display_order,
          modules:parcours_modules(
            id,
            module_id,
            module:modules(id, points)
          )
        `)
        .order("display_order", { ascending: true });

      if (error) throw error;

      // Get company parcours IDs and enable_points_ranking
      let companyParcoursIds: string[] = [];
      if (companyId) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("enable_points_ranking")
          .eq("id", companyId)
          .maybeSingle();
        
        setEnablePointsRanking(companyData?.enable_points_ranking ?? true);

        const { data: companyParcours } = await supabase
          .from("parcours_companies")
          .select("parcours_id")
          .eq("company_id", companyId);
        companyParcoursIds = (companyParcours || []).map(cp => cp.parcours_id);
      }

      // Get personal parcours IDs (from user_parcours)
      const { data: personalParcours } = await supabase
        .from("user_parcours")
        .select("parcours_id")
        .eq("user_id", user.id);
      const personalParcoursIds = (personalParcours || []).map(pp => pp.parcours_id);

      // Get all parcours that are linked to ANY company (to identify generic ones)
      const { data: allLinkedParcours } = await supabase
        .from("parcours_companies")
        .select("parcours_id");
      const allLinkedParcoursIds = (allLinkedParcours || []).map(lp => lp.parcours_id);

      // Build the list with source information
      const list = (allParcours || [])
        .filter((p: any) => {
          const isCompany = companyParcoursIds.includes(p.id);
          const isPersonal = personalParcoursIds.includes(p.id);
          const isGeneric = !allLinkedParcoursIds.includes(p.id); // Not linked to any company
          return isCompany || isPersonal || isGeneric;
        })
        .map((p: any) => {
          // Determine source - personal takes priority, then company, then generic
          const isPersonal = personalParcoursIds.includes(p.id);
          const isCompany = companyParcoursIds.includes(p.id);
          const isGeneric = !allLinkedParcoursIds.includes(p.id);
          
          let source: 'personal' | 'company' | 'generic' = 'generic';
          if (isPersonal) source = 'personal';
          else if (isCompany) source = 'company';
          
          return {
            id: p.id,
            title: p.title,
            description: p.description,
            moduleCount: p.modules?.length || 0,
            moduleIds: (p.modules || []).map((m: any) => m.module?.id).filter(Boolean),
            totalPoints: (p.modules || []).reduce((sum: number, m: any) => sum + (m.module?.points || 0), 0),
            source
          };
        });
      
      setParcoursList(list);
    } catch (error) {
      console.error("Error fetching parcours list:", error);
      toast.error("Erreur lors du chargement des parcours");
    } finally {
      setLoading(false);
    }
  };

  const fetchParcoursData = async () => {
    try {
      const { data: parcoursData, error: parcoursError } = await supabase
        .from("parcours")
        .select(`
          id,
          title,
          description,
          modules:parcours_modules(
            id,
            module_id,
            order_num,
            is_optional,
            module:modules(*)
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (parcoursError) throw parcoursError;
      
      if (!parcoursData) {
        setParcours(null);
        setLoading(false);
        return;
      }

      if (parcoursData.modules) {
        parcoursData.modules.sort((a: any, b: any) => a.order_num - b.order_num);
      }

      setParcours(parcoursData as any);

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("completed_modules")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        setCompletedModules(profileData?.completed_modules || []);
      }
    } catch (error) {
      console.error("Error fetching parcours data:", error);
      toast.error("Erreur lors du chargement du parcours");
    } finally {
      setLoading(false);
    }
  };

  const isModuleAccessible = (moduleOrderNum: number): boolean => {
    if (moduleOrderNum === 1) return true; // Le premier module est toujours accessible
    
    // Vérifier si tous les modules précédents OBLIGATOIRES sont complétés
    const previousModules = parcours?.modules.filter(pm => pm.order_num < moduleOrderNum) || [];
    // Les modules optionnels (is_optional sur parcours_modules) ne bloquent pas la progression
    return previousModules
      .filter(pm => !pm.is_optional)
      .every(pm => completedModules.includes(pm.module.id));
  };

  const handleModuleClick = (parcoursModule: ParcoursModule) => {
    const module = parcoursModule.module;
    const isCompleted = completedModules.includes(module.id);
    
    // Permettre de refaire un module déjà complété
    if (isCompleted) {
      toast.info("Vous pouvez refaire ce module");
      // On continue quand même pour permettre de le refaire
    }
    
    if (!isModuleAccessible(parcoursModule.order_num) && !isCompleted) {
      toast.error("Vous devez compléter les modules obligatoires précédents avant d'accéder à celui-ci");
      return;
    }
    
    setCurrentModule(module);
    
    // Pour les guides, afficher le GuideModule en plein écran
    if (module.type === "guide") {
      setShowGuideModule(true);
    }
    // Pour les webinars, afficher le WebinarModule en plein écran
    else if (module.type === "webinar") {
      setShowGuideModule(true); // On réutilise le même état pour afficher en plein écran
    }
    // Pour les vidéos, afficher le VideoModule en plein écran
    else if (module.type === "video" && module.embed_code) {
      setShowVideoModule(true);
    }
    // Pour les quiz, afficher le QuizModule dans une dialog
    else if (module.type === "quiz" && module.quiz_questions) {
      setShowQuizDialog(true);
    }
    // Pour les simulateurs, naviguer vers la page du simulateur
    else if (module.type === "simulator") {
      // Récupérer la route du simulateur depuis content_url ou content_data
      const simulatorRoute = module.content_url || 
        (module.content_data as any)?.simulator_route;
      
      if (simulatorRoute) {
        navigate(simulatorRoute);
      } else {
        toast.error("Ce simulateur n'est pas correctement configuré");
      }
    }
    // Pour les modules profil financier, afficher le wizard
    else if (module.type === "financial_profile") {
      setShowFinancialProfileModule(true);
    }
    // Pour les modules sans quiz ni code (appointment)
    else {
      completeModule();
    }
  };

  const completeModule = async () => {
    if (!user || !currentModule) return;

    if (!completedModules.includes(currentModule.id)) {
      try {
        const newCompletedModules = [...completedModules, currentModule.id];
        const { data: profileData } = await supabase
          .from("profiles")
          .select("total_points")
          .eq("id", user.id)
          .maybeSingle();

        const newTotalPoints = (profileData?.total_points || 0) + currentModule.points;

        const { error } = await supabase
          .from("profiles")
          .update({
            completed_modules: newCompletedModules,
            total_points: newTotalPoints,
          })
          .eq("id", user.id);

        if (error) throw error;

        await supabase.from("module_validations").insert({
          user_id: user.id,
          module_id: currentModule.id,
          success: true,
        });

        setCompletedModules(newCompletedModules);
        toast.success(`Module complété ! +${currentModule.points} points`);

        // Check if all modules in the parcours are now completed
        if (parcours) {
          const allModuleIds = parcours.modules.map(pm => pm.module.id);
          const allCompleted = allModuleIds.every(id => newCompletedModules.includes(id));
          if (allCompleted) {
            // Delay slightly to let the toast show first
            setTimeout(() => {
              setShowCompletionCelebration(true);
            }, 500);
          }
        }
      } catch (error) {
        console.error("Error completing module:", error);
        toast.error("Erreur lors de la complétion du module");
      }
    }
  };

  const calculateProgress = () => {
    if (!parcours || !parcours.modules || parcours.modules.length === 0) return 0;
    const completedCount = parcours.modules.filter((pm) =>
      completedModules.includes(pm.module.id)
    ).length;
    return (completedCount / parcours.modules.length) * 100;
  };

  const getTotalPoints = () => {
    if (!parcours || !parcours.modules) return 0;
    return parcours.modules.reduce((sum, pm) => sum + pm.module.points, 0);
  };

  const getEarnedPoints = () => {
    if (!parcours || !parcours.modules) return 0;
    return parcours.modules
      .filter((pm) => completedModules.includes(pm.module.id))
      .reduce((sum, pm) => sum + pm.module.points, 0);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  // Affichage de la liste des parcours si aucun ID n'est fourni
  if (!id) {
    return (
      <EmployeeLayout activeSection="parcours">
        <div className="max-w-5xl">
          <div className="flex flex-col gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl hero-gradient mb-2">Mes parcours de formation</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Développez vos compétences financières avec nos parcours personnalisés
              </p>
            </div>
            <ParcoursFilter value={parcoursFilter} onChange={setParcoursFilter} />
          </div>

          {parcoursList.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Aucun parcours disponible pour le moment</p>
            </Card>
          ) : (
            <div className="space-y-10">
              {/* Parcours personnalisés (individuels) */}
              {(() => {
                const personalParcours = filterParcours(
                  parcoursList.filter(p => p.source === 'personal'),
                  parcoursFilter,
                  completedModules
                );
                if (personalParcours.length === 0 && parcoursFilter === 'all') return null;
                
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Mes parcours personnalisés</h2>
                        <p className="text-sm text-muted-foreground">Recommandés selon votre profil et vos objectifs</p>
                      </div>
                    </div>
                    
                    {personalParcours.length === 0 ? (
                      <Card className="p-6 text-center border-dashed">
                        <p className="text-muted-foreground text-sm">
                          {parcoursFilter !== 'all' 
                            ? "Aucun parcours personnalisé ne correspond au filtre"
                            : "Complétez votre profil pour recevoir des recommandations personnalisées"}
                        </p>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {personalParcours.map((p) => (
                          <ParcoursCard 
                            key={p.id} 
                            parcours={p} 
                            completedModules={completedModules} 
                            onNavigate={(id) => navigate(`/parcours/${id}`)} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Parcours entreprise */}
              {(() => {
                const companyParcours = filterParcours(
                  parcoursList.filter(p => p.source === 'company'),
                  parcoursFilter,
                  completedModules
                );
                
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-muted">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Parcours de mon entreprise</h2>
                        <p className="text-sm text-muted-foreground">Formations sélectionnées par votre entreprise</p>
                      </div>
                    </div>
                    
                    {companyParcours.length === 0 ? (
                      <Card className="p-6 text-center border-dashed">
                      <p className="text-muted-foreground text-sm">
                          {parcoursFilter !== 'all' 
                            ? "Aucun parcours entreprise ne correspond au filtre"
                            : "Aucun parcours spécifique à votre entreprise"}
                        </p>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {companyParcours.map((p) => (
                          <ParcoursCard 
                            key={p.id} 
                            parcours={p} 
                            completedModules={completedModules} 
                            onNavigate={(id) => navigate(`/parcours/${id}`)} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Parcours génériques (disponibles pour tous) */}
              {(() => {
                const genericParcours = filterParcours(
                  parcoursList.filter(p => p.source === 'generic'),
                  parcoursFilter,
                  completedModules
                );
                
                if (genericParcours.length === 0 && parcoursFilter === 'all') return null;
                
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5">
                        <Globe className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Parcours en libre accès</h2>
                        <p className="text-sm text-muted-foreground">Formations ouvertes à tous les utilisateurs</p>
                      </div>
                    </div>
                    
                    {genericParcours.length === 0 ? (
                      <Card className="p-6 text-center border-dashed">
                        <p className="text-muted-foreground text-sm">
                          {parcoursFilter !== 'all' 
                            ? "Aucun parcours en libre accès ne correspond au filtre"
                            : "Aucun parcours en libre accès disponible"}
                        </p>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {genericParcours.map((p) => (
                          <ParcoursCard 
                            key={p.id} 
                            parcours={p} 
                            completedModules={completedModules} 
                            onNavigate={(id) => navigate(`/parcours/${id}`)} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </EmployeeLayout>
    );
  }

  if (!parcours) {
    return (
      <EmployeeLayout activeSection="parcours">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <p className="text-muted-foreground">Parcours introuvable</p>
        </div>
      </EmployeeLayout>
    );
  }

  const progress = calculateProgress();
  const totalPoints = getTotalPoints();
  const earnedPoints = getEarnedPoints();

  const getModuleTypeLabel = (type: string) => {
    switch (type) {
      case "webinar": return "Webinaire";
      case "quiz": return "Quiz";
      case "guide": return "Guide";
      case "video": return "Vidéo";
      case "meeting": return "Rendez-vous";
      case "simulator": return "Simulateur";
      case "financial_profile": return "Profil Financier";
      default: return type;
    }
  };

  // Si on affiche un module en plein écran (Guide ou Webinar)
  if (showGuideModule && currentModule && user) {
    // Module de type Guide
    if (currentModule.type === "guide") {
      return (
        <GuideModule
          title={currentModule.title}
          description={currentModule.description}
          contentUrl={currentModule.content_url}
          estimatedTime={currentModule.estimated_time || 15}
          points={currentModule.points}
          contentType={currentModule.content_type as any || "mixed"}
          embedCode={currentModule.embed_code || undefined}
          contentData={currentModule.content_data}
          pedagogicalObjectives={currentModule.pedagogical_objectives || []}
          difficultyLevel={(currentModule.difficulty_level as 1 | 2 | 3) || 1}
          keyTakeaways={currentModule.key_takeaways || []}
          autoValidate={currentModule.auto_validate || false}
          onValidate={() => {
            completeModule();
            setShowGuideModule(false);
            setCurrentModule(null);
          }}
          moduleId={currentModule.id}
          userId={user.id}
        />
      );
    }
    
    // Module de type Webinar
    if (currentModule.type === "webinar") {
      return (
        <WebinarModule
          title={currentModule.title}
          description={currentModule.description}
          webinarDate={currentModule.webinar_date}
          webinarImageUrl={currentModule.webinar_image_url}
          webinarRegistrationUrl={currentModule.webinar_registration_url}
          estimatedTime={currentModule.estimated_time || 60}
          points={currentModule.points}
          pedagogicalObjectives={currentModule.pedagogical_objectives || []}
          keyTakeaways={currentModule.key_takeaways || []}
          onValidate={() => {
            completeModule();
            setShowGuideModule(false);
            setCurrentModule(null);
          }}
          moduleId={currentModule.id}
          userId={user.id}
        />
      );
    }
  }

  // Si on affiche un module vidéo en plein écran
  if (showVideoModule && currentModule && user && currentModule.embed_code) {
    return (
      <VideoModule
        moduleId={currentModule.id}
        title={currentModule.title}
        description={currentModule.description}
        embedCode={currentModule.embed_code}
        points={currentModule.points}
        userId={user.id}
        onValidate={() => {
          completeModule();
          setShowVideoModule(false);
          setCurrentModule(null);
        }}
        onClose={() => {
          setShowVideoModule(false);
          setCurrentModule(null);
        }}
      />
    );
  }

  // Si on affiche un module profil financier en plein écran
  if (showFinancialProfileModule && currentModule && user) {
    return (
      <FinancialProfileModule
        module={{
          id: currentModule.id,
          title: currentModule.title,
          description: currentModule.description,
        }}
        onBack={() => {
          setShowFinancialProfileModule(false);
          setCurrentModule(null);
        }}
        onComplete={() => {
          completeModule();
          setShowFinancialProfileModule(false);
          setCurrentModule(null);
        }}
      />
    );
  }

  return (
    <EmployeeLayout activeSection="parcours">
      <div className="max-w-5xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/parcours')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux parcours
        </Button>

        <Card className="mb-8 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl hero-gradient mb-2">{parcours.title}</h1>
              {parcours.description && (
                <div 
                  className="text-muted-foreground prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: parcours.description }}
                />
              )}
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Award className="mr-2 h-5 w-5" />
              {earnedPoints} / {totalPoints} pts
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </Card>

          <div className="space-y-12 relative">
            <h2 className="text-2xl font-bold mb-6">Parcours de formation</h2>
            {parcours.modules.map((parcoursModule, index) => {
              const module = parcoursModule.module;
              const isCompleted = completedModules.includes(module.id);
              const isAccessible = isModuleAccessible(parcoursModule.order_num);
              const isLocked = !isCompleted && !isAccessible;
              const isHighlighted = highlightedModuleId === String(module.id);

              return (
                <div key={parcoursModule.id} className="relative" id={`module-${module.id}`}>
                  {/* Ligne de connexion verticale */}
                  {index < parcours.modules.length - 1 && (
                    <div 
                      className={`absolute left-6 top-full w-1 h-12 z-0 ${
                        isCompleted 
                          ? 'bg-gradient-to-b from-success/50 to-success/20' 
                          : 'bg-gradient-to-b from-primary/50 to-primary/20'
                      }`} 
                    />
                  )}
                  
                  <Card
                    className={`relative z-10 transition-all duration-300 ${
                      isLocked
                        ? "opacity-60 bg-muted/30 cursor-not-allowed"
                        : isCompleted
                        ? "border-success/50 bg-success/5 hover:shadow-lg cursor-pointer"
                        : "hover:shadow-lg hover:border-primary/50 cursor-pointer"
                    } ${
                      isHighlighted
                        ? "ring-4 ring-yellow-500/50 shadow-xl shadow-yellow-500/20 animate-pulse"
                        : ""
                    } ${
                      parcoursModule.is_optional ? "border-dashed" : ""
                    }`}
                    onClick={() => !isLocked && handleModuleClick(parcoursModule)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Module Icon avec état */}
                        <div className="flex-shrink-0 relative">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                            isCompleted 
                              ? 'bg-success/20' 
                              : isLocked 
                              ? 'bg-muted' 
                              : module.type === 'webinar' ? 'bg-primary/10' :
                                module.type === 'quiz' ? 'bg-success/10' :
                                module.type === 'guide' ? 'bg-accent/10' :
                                module.type === 'video' ? 'bg-primary/10' :
                                module.type === 'financial_profile' ? 'bg-emerald-500/10' :
                                'bg-muted/10'
                          }`}>
                            {isCompleted ? '✅' :
                             isLocked ? '🔒' :
                             module.type === 'webinar' ? '📹' :
                             module.type === 'quiz' ? '❓' :
                             module.type === 'guide' ? '📚' :
                             module.type === 'video' ? '🎬' :
                             module.type === 'appointment' ? '📅' :
                             module.type === 'simulator' ? '🧮' :
                             module.type === 'financial_profile' ? '💰' : '📄'}
                          </div>
                          {isCompleted && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Module Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  Module {parcoursModule.order_num}
                                </Badge>
                                <Badge variant={isCompleted ? "default" : "secondary"} className="text-xs">
                                  {getModuleTypeLabel(module.type)}
                                </Badge>
                                {parcoursModule.is_optional && (
                                  <Badge variant="outline" className="text-xs border-dashed">
                                    Optionnel
                                  </Badge>
                                )}
                                {isLocked && (
                                  <Badge variant="outline" className="text-xs">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Verrouillé
                                  </Badge>
                                )}
                                {isCompleted && (
                                  <Badge variant="default" className="bg-success text-white text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Complété
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-semibold text-xl text-foreground mb-1">
                                {module.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {stripHtml(module.description)}
                              </p>
                            </div>
                          </div>

                          {/* Module Details */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                            {module.estimated_time && (
                              <div className="flex items-center gap-1">
                                <span>⏱️</span>
                                <span>{module.estimated_time} min</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <span>🎯</span>
                              <span>{module.points} points</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Quiz Dialog */}
          {currentModule && currentModule.type === "quiz" && currentModule.quiz_questions && (
            <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{currentModule.title}</DialogTitle>
                </DialogHeader>
                <QuizModule
                  title={currentModule.title}
                  description={currentModule.description}
                  questions={currentModule.quiz_questions}
                  points={currentModule.points}
                  onValidate={() => {
                    completeModule();
                    setShowQuizDialog(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          )}

          {/* Parcours Completion Celebration */}
          <ParcoursCompletionCelebration
            isOpen={showCompletionCelebration}
            onClose={() => setShowCompletionCelebration(false)}
            parcoursTitle={parcours.title}
            totalPoints={totalPoints}
            enablePointsRanking={enablePointsRanking}
          />
        </div>
      </EmployeeLayout>
    );
  }

export default Parcours;
