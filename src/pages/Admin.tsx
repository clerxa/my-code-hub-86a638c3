import { Fragment, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { toast } from "sonner";

import { ModulesTab } from "@/components/admin/ModulesTab";
import { ModuleEditorPage } from "@/components/admin/ModuleEditorPage";
import { UsersAndEmployeesTab } from "@/components/admin/UsersAndEmployeesTab";
import { CompaniesTab } from "@/components/admin/CompaniesTab";
import { AdminCompanyEditPage } from "@/components/admin/AdminCompanyEditPage";
import { CompanyRankingTab } from "@/components/admin/CompanyRankingTab";
import { CommunicationKitTab } from "@/components/admin/CommunicationKitTab";
import { CommunicationTemplatesEditor } from "@/components/admin/CommunicationTemplatesEditor";
import { VisualResourcesTab } from "@/components/admin/VisualResourcesTab";
import { CompanyFAQsTab } from "@/components/admin/CompanyFAQsTab";

import FeaturesTab from "@/components/admin/FeaturesTab";
import { ParcoursTab } from "@/components/admin/ParcoursTab";
import { FormationsTab } from "@/components/admin/FormationsTab";



import { RiskProfileTab } from "@/components/admin/RiskProfileTab";
import { PointsAndValidationTab } from "@/components/admin/PointsAndValidationTab";

import { DesignNavigationTab } from "@/components/admin/DesignNavigationTab";

import { DocumentationTab } from "@/components/admin/DocumentationTab";
import { ReferralBlockTab } from "@/components/admin/ReferralBlockTab";
import { SimulatorsTab } from "@/components/admin/SimulatorsTab";

import { UserFinancialProfilesTab } from "@/components/admin/UserFinancialProfilesTab";

import { FinancialProfileSettingsTab } from "@/components/admin/FinancialProfileSettingsTab";
import { GlobalSettingsTab } from "@/components/admin/GlobalSettingsTab";
import { BetaLabTab } from "@/components/admin/BetaLabTab";

import { ExpertBookingTab } from "@/components/admin/ExpertBookingTab";
import { AppointmentsTab } from "@/components/admin/AppointmentsTab";
import { CelebrationSettingsTab } from "@/components/admin/CelebrationSettingsTab";
import { LandingPagesTab } from "@/components/admin/LandingPagesTab";

import { NonPartnerWelcomeTab } from "@/components/admin/NonPartnerWelcomeTab";
import { SimulationLogsTab } from "@/components/admin/SimulationLogsTab";
import { NotificationsTab } from "@/components/admin/NotificationsTab";
import { RecommendationsTab } from "@/components/admin/RecommendationsTab";
import { SimulatorCTAsTab } from "@/components/admin/SimulatorCTAsTab";
import { OnboardingCMSTab } from "@/components/admin/OnboardingCMSTab";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate, Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

// Workflow Hub - Centre unifié de configuration des workflows
import { WorkflowHubTab } from "@/components/admin/workflow-hub";
import { FinancialProductsTab } from "@/components/admin/FinancialProductsTab";
import { ProductObjectiveMatrixTab } from "@/components/admin/ProductObjectiveMatrixTab";
import { CommunityManagementTab } from "@/components/admin/CommunityManagementTab";
import { EmailConfigTab } from "@/components/admin/EmailConfigTab";
import { WebinarReminderConfig } from "@/components/admin/WebinarReminderConfig";
import { NotFoundConfigTab } from "@/components/admin/NotFoundConfigTab";

import { TaxHelpAdminTab } from "@/components/admin/TaxHelpAdminTab";
import { OffersManagementTab } from "@/components/admin/offers";
import { DiagnosticCMSTab } from "@/components/admin/DiagnosticCMSTab";
import { AnalyticsDashboardTab } from "@/components/admin/AnalyticsDashboardTab";
import { IntentionScoringTab } from "@/components/admin/IntentionScoringTab";
import { IntentionScoreConfigTab } from "@/components/admin/IntentionScoreConfigTab";
import { FeedbackAdminTab } from "@/components/admin/FeedbackAdminTab";
import { ProspectPresentationsTab } from "@/components/admin/ProspectPresentationsTab";

import type { UserProfile, Company, Parcours } from "@/types/database";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
interface Module {
  id: number;
  order_num: number;
  title: string;
  type: string;
  description: string;
  points: number;
  duration: string;
}
// Utilisation du type UserProfile unifié
type Profile = UserProfile;
const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [modules, setModules] = useState<Module[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [parcours, setParcours] = useState<Parcours[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("user");

  // Breadcrumb mapping
  const breadcrumbMap: Record<string, string> = {
    documentation: "Documentation",
    "landing-pages": "Landing Pages",
    "expert-booking": "RDV Expert",
    companies: "Companies",
    "company-ranking": "Configuration des rangs",
    parcours: "Parcours",
    modules: "Modules",
    formations: "Formations",
    features: "Gestion des Features",
    communication: "Communication",
    partnership: "Partnership",
    users: "Utilisateurs",
    "risk-profile": "Risk Profile",
    validation: "Validation",
    
    
    "design-navigation": "Design & Navigation",
    "business-development": "Business Development",
    
    simulators: "Simulateurs",
    "simulation-logs": "Simulations réalisées",
    "non-partner-welcome": "Paramètres Non-Partenaires",
    
    "financial-profile-settings": "Page Profil Financier",
    "workflow-hub": "Workflow Hub",
    "celebration": "Célébration Parcours",
    
    "notifications": "Notifications",
    "recommendations": "Recommandations",
    "simulator-ctas": "CTAs Simulateurs",
    "onboarding-cms": "Onboarding CMS",
    "financial-profiles": "Profils Financiers",
    "branding": "Branding",
    "global-settings": "Paramètres Globaux",
    "email-config": "Configuration Email",
    "not-found-config": "Page 404",
    
    "offers": "Gestion des Offres",
    "diagnostic-cms": "Diagnostic CMS",
    "analytics": "Analytics & Engagement",
    "scoring": "Scoring d'intention",
    "scoring-config": "Config Scoring",
    "presentations": "Présentations Prospects",
  };

  const getBreadcrumbs = () => {
    const paths = location.pathname.split("/").filter(Boolean);
    if (paths[0] !== "admin") return [];
    
    const breadcrumbs = [{ label: "Admin", path: "/admin" }];
    
    if (paths.length > 1) {
      const currentPage = paths[1];
      breadcrumbs.push({
        label: breadcrumbMap[currentPage] || currentPage,
        path: `/admin/${currentPage}`,
      });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  useEffect(() => {
    fetchData();
    fetchCurrentUser();
  }, [user]);

  const fetchCurrentUser = async () => {
    if (!user) return;
    
    try {
      // Récupérer le profil
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setCurrentUserProfile(profile);

      // Récupérer le rôle
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleData) {
        setCurrentUserRole(roleData.role);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchData = async () => {
    try {
      const [modulesRes, profilesRes, companiesRes, parcoursRes] = await Promise.all([
        supabase.from("modules").select("*").order("order_num"),
        supabase.from("profiles").select("*"),
        (supabase as any).from("companies").select("*").order("name"),
        (supabase as any)
          .from("parcours")
          .select(
            `
          *,
          modules:parcours_modules(
            id,
            module_id,
            order_num,
            module:modules(*)
          ),
          companies:parcours_companies(
            id,
            company_id
          )
        `,
          )
          .order("created_at"),
      ]);
      if (modulesRes.error) throw modulesRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (companiesRes.error) throw companiesRes.error;
      if (parcoursRes.error) throw parcoursRes.error;
      setModules((modulesRes.data as Module[]) || []);
      setProfiles((profilesRes.data as Profile[]) || []);
      setCompanies((companiesRes.data as Company[]) || []);
      setParcours((parcoursRes.data as any[]) || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }
  const totalPoints = modules.reduce((sum, m) => sum + m.points, 0);
  const avgProgress =
    profiles.length > 0
      ? profiles.reduce((sum, p) => sum + (p.total_points / totalPoints) * 100, 0) / profiles.length
      : 0;
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex flex-col bg-background">
        <Header />
        
        <div className="flex flex-1">
          <AdminSidebar />
          
          <div className="flex-1 flex flex-col">
            <header className="border-b bg-card sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <SidebarTrigger />
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl hero-gradient truncate">Back-Office</h1>
                    <Breadcrumb className="mt-1">
                      <BreadcrumbList>
                        {breadcrumbs.map((crumb, index) => {
                          const isLast = index === breadcrumbs.length - 1;
                          return (
                            <Fragment key={crumb.path}>
                              <BreadcrumbItem>
                                {isLast ? (
                                  <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                                ) : (
                                  <BreadcrumbLink asChild>
                                    <Link to={crumb.path}>{crumb.label}</Link>
                                  </BreadcrumbLink>
                                )}
                              </BreadcrumbItem>
                              {!isLast && <BreadcrumbSeparator />}
                            </Fragment>
                          );
                        })}
                      </BreadcrumbList>
                    </Breadcrumb>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-8">
              {/* Statistics Cards */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-5 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Partenaires FinCare</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{companies.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{profiles.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Modules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{modules.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Parcours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{parcours.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Progression moyenne</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{avgProgress.toFixed(0)}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Routes */}
              <Routes>
                <Route index element={<Navigate to="companies" replace />} />
                <Route path="plans" element={<Navigate to="/admin/plans-features" replace />} />
                <Route path="employees" element={<Navigate to="/admin/users" replace />} />
                
                {/* General */}
                <Route path="documentation" element={<DocumentationTab />} />
                <Route path="landing-pages" element={<LandingPagesTab />} />
                <Route path="expert-booking" element={<ExpertBookingTab />} />
                <Route path="appointments" element={<AppointmentsTab />} />
                
                
                {/* Companies */}
                <Route path="companies" element={<CompaniesTab companies={companies} modules={modules} onRefresh={fetchData} />} />
                <Route path="companies/:companyId" element={<AdminCompanyEditPage />} />
                <Route path="company-ranking" element={<CompanyRankingTab />} />
                <Route path="users" element={<UsersAndEmployeesTab profiles={profiles} companies={companies} onRefresh={fetchData} />} />
                
                
                {/* Content */}
                <Route path="modules" element={<ModulesTab modules={modules} onRefresh={fetchData} />} />
                <Route path="modules/edit/:moduleId" element={<ModuleEditorPage />} />
                <Route path="parcours" element={<ParcoursTab parcours={parcours} companies={companies} modules={modules} onRefresh={fetchData} />} />
                <Route path="formations" element={<FormationsTab onRefresh={fetchData} />} />
                <Route path="financial-products" element={<FinancialProductsTab />} />
                <Route path="product-objective-matrix" element={<ProductObjectiveMatrixTab />} />
                
                {/* Gamification */}
                <Route path="features" element={<FeaturesTab onRefresh={fetchData} />} />
                <Route path="celebration" element={<CelebrationSettingsTab />} />
                
                {/* Settings */}
                
                <Route path="risk-profile" element={<RiskProfileTab />} />
                <Route path="validation" element={<PointsAndValidationTab />} />
                <Route path="notifications" element={<NotificationsTab />} />
                
                <Route path="design-navigation" element={<DesignNavigationTab />} />
                <Route path="communication" element={<CommunicationKitTab />} />
                <Route path="communication-templates" element={<CommunicationTemplatesEditor />} />
                <Route path="visual-resources" element={<VisualResourcesTab />} />
                <Route path="company-faqs" element={<CompanyFAQsTab />} />
                <Route path="business-development" element={<ReferralBlockTab />} />
                
                <Route path="onboarding-cms" element={<OnboardingCMSTab />} />
                <Route path="simulator-ctas" element={<SimulatorCTAsTab />} />
                <Route path="simulators" element={<SimulatorsTab />} />
                <Route path="simulation-logs" element={<SimulationLogsTab />} />
                <Route path="financial-profiles" element={<UserFinancialProfilesTab />} />
                <Route path="financial-profile-settings" element={<FinancialProfileSettingsTab />} />
                <Route path="recommendations" element={<RecommendationsTab />} />
                <Route path="non-partner-welcome" element={<NonPartnerWelcomeTab />} />
                
                
                <Route path="global-settings" element={<GlobalSettingsTab />} />
                <Route path="beta-lab" element={<BetaLabTab />} />
                
                {/* Community Management - Gestion du Forum */}
                <Route path="community" element={<CommunityManagementTab />} />
                
                {/* Workflow Hub - Centre unifié regroupant Onboarding, Recommandations, CTAs, Notifications */}
                <Route path="workflow-hub" element={<WorkflowHubTab />} />
                
                {/* Configuration Email */}
                <Route path="email-config" element={<EmailConfigTab />} />
                <Route path="webinar-reminders" element={<WebinarReminderConfig />} />
                
                {/* Configuration Page 404 */}
                <Route path="not-found-config" element={<NotFoundConfigTab />} />
                
                
                {/* Aide Déclaration Fiscale */}
                <Route path="tax-help" element={<TaxHelpAdminTab />} />
                
                {/* Gestion des Offres */}
                <Route path="offers" element={<OffersManagementTab />} />
                
                {/* Diagnostic CMS */}
                <Route path="diagnostic-cms" element={<DiagnosticCMSTab />} />
                
                {/* Analytics Dashboard */}
                <Route path="analytics" element={<AnalyticsDashboardTab />} />
                
                {/* Scoring d'intention */}
                <Route path="scoring" element={<IntentionScoringTab />} />
                <Route path="scoring-config" element={<IntentionScoreConfigTab />} />
                
                {/* Feedbacks utilisateurs */}
                <Route path="feedbacks" element={<FeedbackAdminTab />} />
                
                {/* Présentations prospects */}
                <Route path="presentations" element={<ProspectPresentationsTab />} />
                
              </Routes>
            </div>
          </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};
export default Admin;
