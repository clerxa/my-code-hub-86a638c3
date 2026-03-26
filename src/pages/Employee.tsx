import { useState, useEffect } from "react";
import { OnboardingGuide } from "@/components/employee/OnboardingGuide";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Mail, Phone, TrendingUp, Award, Upload, ChevronDown, Building2, Sword, Handshake, Shield, User, Users, Trophy } from "lucide-react";
import { Footer } from "@/components/Footer";
import { DraggableSection } from "@/components/DraggableSection";

import { HubSpotMeetingWidget } from "@/components/HubSpotMeetingWidget";
import { PartnershipRequestDialog } from "@/components/PartnershipRequestDialog";
import { SimulationsTable } from "@/components/SimulationsTable";
import { UpcomingWebinars } from "@/components/UpcomingWebinars";
import { RiskProfileDialog } from "@/components/risk-profile/RiskProfileDialog";
import { useBlockLayoutConfig } from "@/hooks/useBlockLayoutConfig";
import { RiskProfile } from "@/types/risk-profile";
import { ProgressionBlock } from "@/components/ProgressionBlock";
import { Recommendations } from "@/components/dashboard/Recommendations";
import ProfileBanner from "@/components/employee/ProfileBanner";

import type { ProfileWithCompanyId, Company } from "@/types/database";
import { InvitationsTracker } from "@/components/employee/InvitationsTracker";
import { hasActivePartnership } from "@/lib/partnership";
import { hasEquityDevices as hasEquityDevicesFn } from "@/lib/equityDevices";
import { EmployeeSidebar } from "@/components/employee/EmployeeSidebar";
import { MobileEmployeeNav } from "@/components/employee/MobileEmployeeNav";
import { StatsDashboard } from "@/components/employee/StatsDashboard";

import { useExpertBookingUrl } from "@/hooks/useExpertBookingUrl";
import { PersonalInfoSection } from "@/components/employee/PersonalInfoSection";
import { MyAppointmentsBlock } from "@/components/employee/MyAppointmentsBlock";

import { MyWebinarsBlock } from "@/components/employee/MyWebinarsBlock";
import { FinancialProfileProgress } from "@/components/employee/FinancialProfileProgress";
import { CompanyLeaderboard } from "@/components/company/CompanyLeaderboard";
import { MyTaxDeclarationsBlock } from "@/components/employee/MyTaxDeclarationsBlock";
import { BetaDisclaimerModal } from "@/components/employee/BetaDisclaimerModal";
import { EmployeeContactsSection } from "@/components/employee/EmployeeContactsSection";
import { OffersSection } from "@/components/offers";

export default function Employee() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileWithCompanyId | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [simulationsOpen, setSimulationsOpen] = useState(false);
  const [partnershipDialogOpen, setPartnershipDialogOpen] = useState(false);
  const [userRank, setUserRank] = useState<{
    rank: number;
    total: number;
  } | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [riskProfileDialogOpen, setRiskProfileDialogOpen] = useState(false);
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [completedParcours, setCompletedParcours] = useState(0);
  const [colleaguesReferred, setColleaguesReferred] = useState(0);
  const [upcomingWebinarCount, setUpcomingWebinarCount] = useState(0);
  const [simulationsCount, setSimulationsCount] = useState(0);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  // Expert booking hook will be called after we have company_id from profile
  const urlParams = new URLSearchParams(window.location.search);
  const viewingUserId = urlParams.get("userId");
  const sectionParam = urlParams.get("section");
  const [activeSection, setActiveSection] = useState(sectionParam || "dashboard");
  const targetUserId = viewingUserId || user?.id;
  const {
    blocks,
    layoutConfig,
    loading: configLoading,
    updateBlockOrder
  } = useBlockLayoutConfig("employee");
  
  // Use the hook with profile's company_id (will be null initially, then updated)
  const { embedCode: expertBookingEmbed, fallbackUrl: expertBookingFallback } = useExpertBookingUrl(profile?.company_id || null);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const {
        data
      } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
      setIsAdmin(data?.role === "admin");
      setUserRole(data?.role || null);
    };
    checkAdmin();
  }, [user]);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    job_title: "",
    phone_number: "",
    birth_date: "",
    net_taxable_income: "",
    marital_status: "",
    children_count: ""
  });
  useEffect(() => {
    if (!user && !viewingUserId) {
      navigate("/login");
      return;
    }
    fetchProfile();
  }, [user, viewingUserId, navigate]);
  const fetchProfile = async () => {
    try {
      const targetUserId = viewingUserId || user?.id;
      if (!targetUserId) return;
      const {
        data: profileData,
        error: profileError
      } = await (supabase as any).from("profiles").select("*").eq("id", targetUserId).single();
      if (profileError) throw profileError;
      setProfile(profileData);
      setFormData({
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        job_title: profileData.job_title || "",
        phone_number: profileData.phone_number || "",
        birth_date: profileData.birth_date || "",
        net_taxable_income: profileData.net_taxable_income || "",
        marital_status: profileData.marital_status || "",
        children_count: profileData.children_count?.toString() || ""
      });
      if (profileData.company_id) {
        const {
          data: companyData,
          error: companyError
        } = await (supabase as any).from("companies").select("*").eq("id", profileData.company_id).single();
        if (companyError) throw companyError;
        setCompany(companyData);

        // Fetch user rank in company leaderboard
        const {
          data: leaderboardData
        } = await (supabase as any).from("profiles").select("id, total_points").eq("company_id", profileData.company_id).order("total_points", {
          ascending: false
        });
        if (leaderboardData) {
          const userIndex = leaderboardData.findIndex((p: any) => p.id === targetUserId);
          if (userIndex !== -1) {
            setUserRank({
              rank: userIndex + 1,
              total: leaderboardData.length
            });
          }
        }
      }

      // Set user profile for partnership dialog
      setUserProfile({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email
      });

      // Fetch risk profile
      const {
        data: riskProfileData
      } = await supabase.from('risk_profile').select('*').eq('user_id', targetUserId).maybeSingle();
      if (riskProfileData) {
        setRiskProfile(riskProfileData as any);
      }

      // Fetch completed parcours count
      const completedModulesArray = profileData.completed_modules || [];
      if (completedModulesArray.length > 0) {
        const { data: parcoursData } = await supabase
          .from("parcours_modules")
          .select("parcours_id, module_id");
        
        if (parcoursData) {
          // Group modules by parcours
          const parcourModulesMap = new Map<string, number[]>();
          parcoursData.forEach((pm: any) => {
            const modules = parcourModulesMap.get(pm.parcours_id) || [];
            modules.push(pm.module_id);
            parcourModulesMap.set(pm.parcours_id, modules);
          });
          
          // Count completed parcours
          let completedCount = 0;
          parcourModulesMap.forEach((modules) => {
            const allCompleted = modules.every((m) => completedModulesArray.includes(m));
            if (allCompleted && modules.length > 0) completedCount++;
          });
          setCompletedParcours(completedCount);
        }
      }

      // Fetch colleagues referred count
      const { count: referredCount } = await supabase
        .from("colleague_invitations")
        .select("*", { count: "exact", head: true })
        .eq("inviter_id", targetUserId);
      setColleaguesReferred(referredCount || 0);

      // Fetch simulations count from unified simulations table
      const { count: simsCount } = await supabase
        .from("simulations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", targetUserId);
      setSimulationsCount(simsCount || 0);

      // Generate recommendations
      await generateRecommendations(profileData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };
  const generateRecommendations = async (profileData: any) => {
    const recs: any[] = [];

    // Fetch recommendation rules from database
    const { data: rules } = await supabase
      .from("recommendation_rules")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: true });

    if (!rules || rules.length === 0) {
      setRecommendations([]);
      return;
    }

    // Fetch unified simulations data
    const { data: simulations } = await supabase
      .from("simulations")
      .select("type, data")
      .eq("user_id", targetUserId);
    
    const { data: modules } = await supabase
      .from("module_validations")
      .select("module_id")
      .eq("user_id", targetUserId)
      .eq("success", true);

    const { data: riskProfile } = await supabase
      .from("risk_profile")
      .select("id")
      .eq("user_id", targetUserId)
      .maybeSingle();

    // Fetch diagnostic status from DB
    const { data: diagnosticResult } = await supabase
      .from("diagnostic_results")
      .select("status, score_percent")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    const hasDiagnosticStarted = !!diagnosticResult;
    const hasDiagnosticCompleted = diagnosticResult?.status === "completed";

    // Fetch financial profile
    const { data: financialProfile } = await supabase
      .from("user_financial_profiles")
      .select("*")
      .eq("user_id", targetUserId)
      .maybeSingle();

    // Calculate financial profile completeness
    const requiredFields = ['revenu_mensuel_net', 'revenu_fiscal_annuel', 'charges_fixes_mensuelles', 'epargne_livrets', 'type_contrat'];
    let financialProfileCompleteness = 0;
    if (financialProfile) {
      const filledCount = requiredFields.filter((key) => {
        const value = (financialProfile as any)[key];
        return value !== null && value !== undefined && value !== 0 && value !== '';
      }).length;
      financialProfileCompleteness = Math.round((filledCount / requiredFields.length) * 100);
    }

    // Extract simulation results for unified conditions
    const perSims = simulations?.filter(s => s.type === 'per') || [];
    const optSims = simulations?.filter(s => s.type === 'optimisation_fiscale') || [];
    const hasSimulations = simulations && simulations.length > 0;

    // Build context for unified condition evaluation
    const evaluationContext: Record<string, any> = {
      // From financial profile
      tmi: financialProfile?.tmi,
      revenu_mensuel_net: financialProfile?.revenu_mensuel_net,
      revenu_fiscal_annuel: financialProfile?.revenu_fiscal_annuel,
      charges_fixes_mensuelles: financialProfile?.charges_fixes_mensuelles,
      epargne_actuelle: financialProfile?.epargne_actuelle,
      epargne_livrets: financialProfile?.epargne_livrets,
      capacite_epargne_mensuelle: financialProfile?.capacite_epargne_mensuelle,
      nb_enfants: financialProfile?.nb_enfants,
      age: financialProfile?.age,
      // Computed values
      financial_profile_completeness: financialProfileCompleteness,
      has_simulations: hasSimulations,
      simulations_count: simulations?.length || 0,
      modules_completed: modules?.length || 0,
      has_risk_profile: !!riskProfile,
      // Diagnostic keys for unified conditions
      diagnostic_not_started: !hasDiagnosticStarted,
      diagnostic_in_progress: hasDiagnosticStarted && !hasDiagnosticCompleted,
      diagnostic_completed: hasDiagnosticCompleted,
      diagnostic_score_percent: diagnosticResult?.status === 'completed' ? (diagnosticResult as any)?.score_percent : null,
    };

    // Helper function to evaluate unified conditions
    const evaluateUnifiedCondition = (config: any): boolean => {
      if (!config || !config.conditions || !Array.isArray(config.conditions)) {
        return false;
      }

      const logic = config.logic || 'AND';
      const results = config.conditions.map((cond: any) => {
        const actualValue = evaluationContext[cond.key];
        
        if (actualValue === undefined || actualValue === null) return false;

        // Handle boolean comparisons
        if (typeof actualValue === 'boolean') {
          const boolValue = cond.value === true || cond.value === 'true';
          if (cond.operator === '=') return actualValue === boolValue;
          if (cond.operator === '!=') return actualValue !== boolValue;
          return false;
        }

        const conditionValue = parseFloat(cond.value);
        
        switch (cond.operator) {
          case '>': return actualValue > conditionValue;
          case '<': return actualValue < conditionValue;
          case '>=': return actualValue >= conditionValue;
          case '<=': return actualValue <= conditionValue;
          case '=': return actualValue === conditionValue;
          case '!=': return actualValue !== conditionValue;
          default: return false;
        }
      });

      return logic === 'AND' 
        ? results.every((r: boolean) => r) 
        : results.some((r: boolean) => r);
    };

    // Evaluate each rule
    for (const rule of rules) {
      let shouldShow = false;
      const config = rule.condition_config as Record<string, any> || {};

      switch (rule.condition_type) {
        case "no_risk_profile":
          shouldShow = !riskProfile;
          break;
        case "simulation_threshold":
          const perThreshold = config.per_threshold || 1500;
          const optimThreshold = config.optim_threshold || 2000;
          const hasHighPer = perSims.some((s: any) => {
            const data = s.data as Record<string, any>;
            return data?.economie_impots > perThreshold;
          });
          const hasHighOptim = optSims.some((s: any) => {
            const data = s.data as Record<string, any>;
            return (data?.economie_totale || 0) > optimThreshold;
          });
          shouldShow = hasHighPer || hasHighOptim;
          break;
        case "no_modules":
          shouldShow = !modules || modules.length === 0;
          break;
        case "no_simulation":
          shouldShow = !hasSimulations;
          break;
        case "no_diagnostic":
          // Show if user never started the diagnostic (no cache and hasn't completed)
          shouldShow = !hasDiagnosticStarted;
          break;
        case "diagnostic_incomplete":
          // Show if user started but didn't finish (cache exists = in progress)
          shouldShow = hasDiagnosticStarted && !hasDiagnosticCompleted;
          break;
        case "diagnostic_completed":
          shouldShow = hasDiagnosticCompleted;
          break;
        case "financial_profile_incomplete":
          shouldShow = financialProfileCompleteness < 100;
          break;
        case "unified":
          // New unified condition system with advanced conditions
          shouldShow = evaluateUnifiedCondition(config);
          break;
        case "always":
          shouldShow = true;
          break;
        default:
          console.warn(`[Recommendations] Unknown condition type: ${rule.condition_type}`);
          shouldShow = false;
      }

      console.log(`[Recommendations] Rule "${rule.rule_name}" (${rule.condition_type}):`, { shouldShow, config, evaluationContext });

      if (shouldShow) {
        const iconMap: Record<string, "target" | "calendar" | "book"> = {
          Target: "target",
          Calendar: "calendar",
          BookOpen: "book",
          target: "target",
          calendar: "calendar",
          book: "book"
        };

        recs.push({
          id: `rec-${rule.rule_key}`,
          title: rule.title,
          description: rule.message,
          icon: iconMap[rule.icon] || "target",
          cta_text: rule.cta_text,
          cta_action: rule.cta_action_type === "navigate" 
            ? () => navigate(rule.cta_action_value)
            : () => window.open(rule.cta_action_value, "_blank"),
          priority: rule.display_priority as "high" | "medium" | "low"
        });
      }
    }

    setRecommendations(recs);
  };
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!targetUserId) {
        toast.error("Utilisateur non identifié");
        return;
      }
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) {
        toast.error("Aucun fichier sélectionné");
        return;
      }
      if (!file.type || !file.type.startsWith("image/")) {
        toast.error("Le fichier doit être une image");
        return;
      }
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${targetUserId}/${fileName}`;
      const {
        error: uploadError
      } = await supabase.storage.from("avatars").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false
      });
      if (uploadError) {
        if (uploadError.message.includes("The resource already exists")) {
          const uniqueFileName = `${Date.now()}.${fileExt}`;
          const uniqueFilePath = `${targetUserId}/${uniqueFileName}`;
          const {
            error: retryError
          } = await supabase.storage.from("avatars").upload(uniqueFilePath, file, {
            cacheControl: "3600",
            upsert: false
          });
          if (retryError) throw retryError;
          const {
            data: {
              publicUrl
            }
          } = supabase.storage.from("avatars").getPublicUrl(uniqueFilePath);
          const {
            error: updateError
          } = await (supabase as any).from("profiles").update({
            avatar_url: publicUrl
          }).eq("id", targetUserId);
          if (updateError) throw updateError;
        } else {
          throw uploadError;
        }
      } else {
        const {
          data: {
            publicUrl
          }
        } = supabase.storage.from("avatars").getPublicUrl(filePath);
        const {
          error: updateError
        } = await (supabase as any).from("profiles").update({
          avatar_url: publicUrl
        }).eq("id", targetUserId);
        if (updateError) throw updateError;
      }
      toast.success("Photo de profil mise à jour avec succès");
      fetchProfile();
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(error.message || "Erreur lors du téléchargement");
    } finally {
      setUploading(false);
    }
  };
  const handleUpdateProfile = async () => {
    try {
      if (!targetUserId) return;
      const {
        error
      } = await (supabase as any).from("profiles").update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        job_title: formData.job_title,
        phone_number: formData.phone_number,
        birth_date: formData.birth_date || null,
        net_taxable_income: formData.net_taxable_income ? parseFloat(formData.net_taxable_income) : null,
        marital_status: formData.marital_status || null,
        children_count: formData.children_count ? parseInt(formData.children_count) : null
      }).eq("id", targetUserId);
      if (error) throw error;
      toast.success("Profil mis à jour avec succès");
      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    }
  };
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
        </div>
      </div>;
  }
  if (!profile) {
    return <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p>Profil non trouvé</p>
        </div>
      </div>;
  }
  const renderBlock = (blockId: string) => {
    const blockConfig = layoutConfig[blockId];
    if (blockConfig && blockConfig.visible === false) return null;
    switch (blockId) {
      case "profile":
        return <DraggableSection key="profile" id="profile" isAdmin={isAdmin}>
            <div data-coach="welcome">
              <ProfileBanner
                profile={profile}
                company={company}
                riskProfile={riskProfile}
                userRole={userRole}
                uploading={uploading}
                onAvatarUpload={handleAvatarUpload}
                onNavigatePartnership={() => navigate("/proposer-partenariat")}
                onOpenRiskProfile={() => setRiskProfileDialogOpen(true)}
              />
            </div>
          </DraggableSection>;
      case "progression":
        // Masquer si points/ranking désactivé
        if (!company?.enable_points_ranking) return null;
        return profile ? <DraggableSection key="progression" id="progression" isAdmin={isAdmin}>
            <ProgressionBlock totalPoints={profile.total_points} />
          </DraggableSection> : null;
      case "statsDashboard":
        return profile ? (
          <DraggableSection key="statsDashboard" id="statsDashboard" isAdmin={isAdmin}>
            <div data-coach="stats">
              <StatsDashboard
                completedModules={profile.completed_modules?.length || 0}
                completedParcours={completedParcours}
                totalPoints={profile.total_points}
                colleaguesReferred={colleaguesReferred}
                completedModuleIds={profile.completed_modules || []}
                onNavigateToInvitations={() => setActiveSection("invitations")}
                onNavigateToLeaderboard={() => setActiveSection("leaderboard")}
                onNavigateToSimulations={() => navigate("/employee/simulations?tab=historique")}
                userRank={userRank}
                enablePointsRanking={company?.enable_points_ranking || false}
                simulationsCount={simulationsCount}
              />
            </div>
          </DraggableSection>
        ) : null;
      case "leaderboard":
        return company?.enable_points_ranking ? (
          <DraggableSection key="leaderboard" id="leaderboard" isAdmin={isAdmin}>
            <CompanyLeaderboard 
              companyId={company.id} 
              currentUserId={user?.id}
              limit={10}
            />
          </DraggableSection>
        ) : null;
      case "theme_selector":
        // Thème fixe - pas de sélecteur
        return null;
      case "personalInfo":
        return profile ? (
          <DraggableSection key="personalInfo" id="personalInfo" isAdmin={isAdmin}>
            <PersonalInfoSection 
              profile={{
                id: profile.id,
                first_name: profile.first_name,
                last_name: profile.last_name,
                email: profile.email,
                phone_number: profile.phone_number,
                birth_date: profile.birth_date,
                marital_status: profile.marital_status,
                children_count: profile.children_count,
                job_title: profile.job_title,
                net_taxable_income: profile.net_taxable_income,
              }}
              companyName={company?.name}
              onProfileUpdate={fetchProfile}
            />
          </DraggableSection>
        ) : null;
      case "expertBooking":
        // Priority is handled by useExpertBookingUrl hook
        const hasBookingOption = expertBookingEmbed || expertBookingFallback;
        return hasBookingOption ? <DraggableSection key="expertBooking" id="expertBooking" isAdmin={isAdmin}>
            <Card data-coach="experthome" className="relative overflow-hidden border-primary/30">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
              <CardContent className="pt-6 relative">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      {blockConfig?.title || "Réserver un rendez-vous avec un expert"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {blockConfig?.description || "Prenez rendez-vous pour bénéficier de conseils personnalisés"}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <HubSpotMeetingWidget 
                      redirectToLanding
                      primaryColor={company?.primary_color} 
                      triggerText="Réserver un créneau"
                      utmCampaign="dashboard_employe"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </DraggableSection> : null;
      case "simulations":
        return targetUserId ? <DraggableSection key="simulations" id="simulations" isAdmin={isAdmin}>
            <Card data-coach="simulations">
              <Collapsible open={simulationsOpen} onOpenChange={setSimulationsOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <CardTitle className="py-[5px] my-[5px] flex items-center gap-2">
                          {blockConfig?.title || "Historique des simulations"}
                          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${simulationsOpen ? "rotate-180" : ""}`} />
                        </CardTitle>
                        <CardDescription>{blockConfig?.description || "Consultez et gérez vos simulations"}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <Button onClick={() => navigate("/employee/simulations")} className="w-full md:w-auto my-[10px]">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Accéder aux simulateurs
                    </Button>
                    <SimulationsTable userId={targetUserId} />
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </DraggableSection> : null;
      case "upcomingWebinars":
        return <DraggableSection key="upcomingWebinars" id="upcomingWebinars" isAdmin={isAdmin}>
            <UpcomingWebinars />
          </DraggableSection>;
      case "myWebinars":
        return (
          <DraggableSection key="myWebinars" id="myWebinars" isAdmin={isAdmin}>
            <MyWebinarsBlock onUpcomingCountChange={setUpcomingWebinarCount} />
          </DraggableSection>
        );
      case "financialProfileProgress":
        return (
          <DraggableSection key="financialProfileProgress" id="financialProfileProgress" isAdmin={isAdmin}>
            <FinancialProfileProgress />
          </DraggableSection>
        );
      case "recommendations":
        return (
          <DraggableSection key="recommendations" id="recommendations" isAdmin={isAdmin}>
            <div className="space-y-6">
              {recommendations.length > 0 && <Recommendations recommendations={recommendations} />}
            </div>
          </DraggableSection>
        );
      case "invitationsTracker":
        return targetUserId ? (
          <DraggableSection key="invitationsTracker" id="invitationsTracker" isAdmin={isAdmin}>
            <InvitationsTracker 
              userId={targetUserId} 
              companyId={profile?.company_id || undefined}
              companyName={company?.name}
              blockConfig={blockConfig}
              hasActivePartnership={hasActivePartnership(company?.partnership_type)}
            />
          </DraggableSection>
        ) : null;
      case "inviteColleague":
        // Déplacé dans le Header - bouton "Inviter un collègue"
        return null;
      case "referral":
        // Bloc désactivé - fonctionnalité retirée
        return null;
      case "personalInfoFull":
        return profile ? (
          <DraggableSection key="personalInfoFull" id="personalInfoFull" isAdmin={isAdmin}>
            <PersonalInfoSection 
              profile={{
                id: profile.id,
                first_name: profile.first_name,
                last_name: profile.last_name,
                email: profile.email,
                phone_number: profile.phone_number,
                birth_date: profile.birth_date,
                marital_status: profile.marital_status,
                children_count: profile.children_count,
                job_title: profile.job_title,
                net_taxable_income: profile.net_taxable_income,
              }}
              companyName={company?.name}
              avatarUrl={profile.avatar_url}
              onAvatarUpload={handleAvatarUpload}
              uploading={uploading}
              onProfileUpdate={fetchProfile}
            />
          </DraggableSection>
        ) : null;
      case "myAppointments":
        return (
          <DraggableSection key="myAppointments" id="myAppointments" isAdmin={isAdmin}>
            <MyAppointmentsBlock />
          </DraggableSection>
        );
      case "upcomingAppointmentBanner":
        return null;
      case "taxDeclaration":
        return (
          <DraggableSection key="taxDeclaration" id="taxDeclaration" isAdmin={isAdmin}>
            <MyTaxDeclarationsBlock />
          </DraggableSection>
        );
      case "contacts":
        return profile?.company_id ? (
          <EmployeeContactsSection
            key="contacts"
            companyId={profile.company_id}
            companyName={company?.name}
            primaryColor={company?.primary_color || undefined}
          />
        ) : null;
      case "offers":
        return (
          <DraggableSection key="offers" id="offers" isAdmin={isAdmin}>
            <OffersSection />
          </DraggableSection>
        );
      default:
        return null;
    }
  };
  // Filtrer les blocs selon la section active
  const getVisibleBlocks = () => {
    if (activeSection === "dashboard") {
      return ["profile", "statsDashboard", "financialProfileProgress", "recommendations", "upcomingAppointmentBanner", "taxDeclaration", "upcomingWebinars", "expertBooking"];
    }
    if (activeSection === "profile-info") {
      return ["personalInfoFull"];
    }
    if (activeSection === "progression") {
      return ["profile", "progression"];
    }
    if (activeSection === "invitations") {
      return ["profile", "invitationsTracker"];
    }
    if (activeSection === "leaderboard") {
      return ["leaderboard"];
    }
    if (activeSection === "appointments") {
      return ["myAppointments"];
    }
    if (activeSection === "webinars") {
      return ["myWebinars"];
    }
    if (activeSection === "contacts") {
      return ["contacts"];
    }
    if (activeSection === "offers") {
      return ["offers"];
    }
    return blocks;
  };

  const visibleBlocks = getVisibleBlocks();

  return <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Mobile navigation - Sticky below header */}
      <div className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-2">
          <MobileEmployeeNav
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            companyId={company?.id}
            hasPartnership={!!company?.partnership_type}
            webinarCount={upcomingWebinarCount}
            enablePointsRanking={company?.enable_points_ranking || false}
            primaryColor={company?.primary_color || undefined}
            hasEquityDevices={hasEquityDevicesFn(company?.compensation_devices)}
          />
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-4 md:py-8 flex-1">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Sidebar - Hidden on mobile */}
          <div className="hidden md:block" data-coach="sidebar">
            <EmployeeSidebar 
              activeSection={activeSection} 
              onSectionChange={setActiveSection}
              companyId={company?.id}
              hasPartnership={!!company?.partnership_type}
              webinarCount={upcomingWebinarCount}
              enablePointsRanking={company?.enable_points_ranking || false}
              primaryColor={company?.primary_color || undefined}
              onShowGuide={() => setShowGuide(true)}
              hasEquityDevices={hasEquityDevicesFn(company?.compensation_devices)}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 max-w-4xl">
            <div className="space-y-4 md:space-y-6">{visibleBlocks.map(blockId => renderBlock(blockId))}</div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Onboarding Guide */}
      <OnboardingGuide forceShow={showGuide} onClose={() => setShowGuide(false)} />

      {/* Partnership Request Dialog */}
      {company && userProfile && <PartnershipRequestDialog open={partnershipDialogOpen} onOpenChange={setPartnershipDialogOpen} companyId={company.id} companyName={company.name} userFirstName={userProfile.first_name} userLastName={userProfile.last_name} userEmail={userProfile.email} />}

      {/* Risk Profile Dialog */}
      {targetUserId && <RiskProfileDialog open={riskProfileDialogOpen} onOpenChange={setRiskProfileDialogOpen} userId={targetUserId} existingProfile={riskProfile} onProfileUpdated={fetchProfile} />}

      {/* Beta Disclaimer Modal */}
      {user?.id && !disclaimerAccepted && (
        <BetaDisclaimerModal 
          userId={user.id} 
          onAccepted={() => setDisclaimerAccepted(true)} 
        />
      )}
    </div>;
}