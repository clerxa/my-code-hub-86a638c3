/**
 * ===========================================================
 * 📄 File: App.tsx
 * 📌 Rôle du fichier : Composant racine de l'application avec routing
 * 🧩 Dépendances importantes : 
 *   - react-router-dom (BrowserRouter, Routes, Route)
 *   - @tanstack/react-query (QueryClient)
 *   - AuthProvider pour la gestion de l'authentification
 *   - NotificationManager pour les notifications temps réel
 * 🔁 Logiques principales :
 *   - Configuration des routes publiques et protégées
 *   - Gestion de l'authentification via AuthProvider
 *   - Configuration de React Query pour les requêtes API
 *   - Intégration des toasters et tooltips
 * ===========================================================
 */

import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider as MultiThemeProvider } from "@/contexts/ThemeContext";
import { GlobalSettingsProvider } from "@/contexts/GlobalSettingsContext";
import { NotificationManager } from "@/components/notifications/NotificationManager";

import { useFaviconAnimation } from "@/hooks/useFaviconAnimation";
import TestOcr from "./pages/TestOcr";
import AtlasPage from "./pages/AtlasPage";
import TestPayslip from "./pages/TestPayslip";
import ProtectedRoute from "@/components/ProtectedRoute";
import PartnershipRoute from "@/components/PartnershipRoute";
import { CheckPlanAccess } from "@/components/CheckPlanAccess";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CompanySignup from "./pages/CompanySignup";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/Admin";
import Company from "./pages/Company";
import CompanyContacts from "./pages/CompanyContacts";
import CompanyDashboard from "./pages/CompanyDashboard";
import SimulateurImpots from "./pages/SimulateurImpots";
import SimulateurESPP from "./pages/SimulateurESPP";
import OptimisationFiscale from "./pages/OptimisationFiscale";
import SimulateurPER from "./pages/SimulateurPER";
import SimulateurEpargnePrecaution from "./pages/SimulateurEpargnePrecaution";
import SimulateurInteretsComposes from "./pages/SimulateurInteretsComposes";
import SimulateurLMNP from "./pages/SimulateurLMNP";
import SimulateurPretImmobilier from "./pages/SimulateurPretImmobilier";
import SimulateurCapaciteEmprunt from "./pages/SimulateurCapaciteEmprunt";
import SimulateurPVI from "./pages/SimulateurPVI";
import SimulateurGestionPilotee from "./pages/SimulateurGestionPilotee";
import SimulateurCapaciteEpargne from "./pages/SimulateurCapaciteEpargne";
import SimulateurRSU from "./pages/SimulateurRSU";
import SimulateurBSPCE from "./pages/SimulateurBSPCE";
import Employee from "./pages/Employee";
import EmployeeProfile from "./pages/EmployeeProfile";
import EmployeeSimulations from "./pages/EmployeeSimulations";
import VegaPage from "./pages/VegaPage";
import VegaRecapPage from "./pages/VegaRecapPage";
import Parcours from "./pages/Parcours";
import ParcoursPreview from "./pages/ParcoursPreview";
import Forum from "./pages/Forum";
import ForumCategory from "./pages/ForumCategory";
import ForumPost from "./pages/ForumPost";

import NonPartnerWelcome from "./pages/NonPartnerWelcome";
import Formations from "./pages/Formations";
import DynamicOnboarding from "./pages/DynamicOnboarding";
import PublicOnboarding from "./pages/PublicOnboarding";
import WebhookTest from "./pages/WebhookTest";

import CreateLivestormWebinar from "./pages/CreateLivestormWebinar";
import LivestormWebinarsList from "./pages/LivestormWebinarsList";
import GetLivestormOwner from "./pages/GetLivestormOwner";
import Partnership from "./pages/Partnership";
import EmployeePartnership from "./pages/EmployeePartnership";
import RiskProfile from "./pages/RiskProfile";
import ExpertBookingLanding from "./pages/ExpertBookingLanding";
import NotFound from "./pages/NotFound";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import LandingPageDynamic from "./pages/LandingPageDynamic";
import TaxDeclarationHelp from "./pages/TaxDeclarationHelp";
import Diagnostic from "./pages/Diagnostic";
import Horizon from "./pages/Horizon";
import EmployeeFeedback from "./pages/EmployeeFeedback";
import PensionTracker from "./pages/PensionTracker";
import BudgetPage from "./pages/BudgetPage";
import DecryptezPER from "./pages/DecryptezPER";
import ProspectPresentation from "./pages/ProspectPresentation";
import WebinarCatalogDetail from "./pages/WebinarCatalogDetail";
import { Navigate } from "react-router-dom";

/**
 * 🔹 Instance de QueryClient pour React Query
 * 🔸 Gère le cache et la synchronisation des requêtes API
 */
const queryClient = new QueryClient();

/**
 * 🔹 Composant qui gère l'animation du favicon
 */
const FaviconAnimator = () => {
  useFaviconAnimation('/favicon.gif');
  return null;
};

/**
 * 🔹 Composant racine de l'application
 * 🔸 Configure tous les providers et le routing de l'application
 * 
 * @component
 * @returns {JSX.Element} L'arbre complet de l'application avec providers et routes
 * 
 * @example
 * // Utilisé dans main.tsx
 * <App />
 */
const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    {/* Favicon animé */}
    <FaviconAnimator />
    {/* Provider pour les tooltips globaux */}
    <TooltipProvider>
      {/* Systèmes de notifications multiples */}
      <Toaster />
      <Sonner />
      
      {/* Configuration du routing */}
      <BrowserRouter>
        {/* Provider d'authentification global */}
        <AuthProvider>
          {/* Provider multi-thèmes - doit être après AuthProvider */}
          <MultiThemeProvider>
            {/* Provider des paramètres globaux configurables */}
            <GlobalSettingsProvider>
            {/* Gestionnaire de notifications temps réel */}
            <NotificationManager />
            
            <Routes>
            {/* Routes publiques - Accessibles sans authentification */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/join/:slug" element={<CompanySignup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/partenariat" element={<Partnership />} />
            <Route path="/proposer-partenariat" element={<EmployeePartnership />} />
            <Route path="/rdv-expert" element={<ExpertBookingLanding />} />
            <Route path="/onboarding" element={<PublicOnboarding />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogArticle />} />
            <Route path="/lp/:slug" element={<LandingPageDynamic />} />
            <Route path="/presentation/:token" element={<ProspectPresentation />} />
            
            {/* Routes administrateur - Nécessitent le rôle admin */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/parcours/:id/preview"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <ParcoursPreview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/webhook-test"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <WebhookTest />
                </ProtectedRoute>
              }
            />
            {/* Redirect old webinar-tracking route to new combined page */}
            <Route
              path="/admin/webinar-tracking"
              element={<Navigate to="/admin/livestorm-webinars" replace />}
            />
            <Route
              path="/admin/create-livestorm-webinar"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <CreateLivestormWebinar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/livestorm-webinars"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <LivestormWebinarsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/get-livestorm-owner"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <GetLivestormOwner />
                </ProtectedRoute>
              }
            />
            
            {/* Routes employé - Accessibles aux utilisateurs authentifiés */}
            <Route path="/employee" element={<ProtectedRoute><Employee /></ProtectedRoute>} />
            <Route
              path="/employee/profile"
              element={
                <ProtectedRoute>
                  <EmployeeProfile />
                </ProtectedRoute>
              }
            />
            {/* Redirect old financial-profile to unified profile */}
            <Route
              path="/employee/financial-profile"
              element={<Navigate to="/employee/profile?tab=financial" replace />}
            />
            <Route
              path="/employee/simulations"
              element={
                <ProtectedRoute>
                  <EmployeeSimulations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/vega"
              element={
                <ProtectedRoute>
                  <VegaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/onboarding"
              element={
                <ProtectedRoute>
                  <DynamicOnboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/diagnostic"
              element={
                <ProtectedRoute>
                  <Diagnostic />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/horizon"
              element={
                <PartnershipRoute featureType="company">
                  <Horizon />
                </PartnershipRoute>
              }
            />
            <Route
              path="/employee/feedback"
              element={
                <ProtectedRoute>
                  <EmployeeFeedback />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/pension-tracker"
              element={
                <ProtectedRoute>
                  <PensionTracker />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/budget"
              element={
                <ProtectedRoute>
                  <BudgetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee/atlas"
              element={
                <PartnershipRoute featureType="company">
                  <AtlasPage />
                </PartnershipRoute>
              }
            />
            <Route
              path="/employee/decryptez-per"
              element={
                <ProtectedRoute>
                  <DecryptezPER />
                </ProtectedRoute>
              }
            />
            <Route
              path="/risk-profile"
              element={
                <ProtectedRoute>
                  <RiskProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expert-booking"
              element={
                <ProtectedRoute>
                  <ExpertBookingLanding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tax-declaration-help"
              element={
                <ProtectedRoute>
                  <TaxDeclarationHelp />
                </ProtectedRoute>
              }
            />
            
            {/* Routes entreprise - Gestion des paramètres entreprise */}
            <Route
              path="/company/:id/dashboard"
              element={
                <ProtectedRoute requireCompanyContact={true}>
                  <CompanyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/:id/dashboard/webinar/:webinarId"
              element={
                <ProtectedRoute requireCompanyContact={true}>
                  <WebinarCatalogDetail />
                </ProtectedRoute>
              }
            />
            {/* Redirect legacy settings route to dashboard */}
            <Route
              path="/company/:id/settings"
              element={<Navigate to={`/company/${window.location.pathname.split('/')[2]}/dashboard`} replace />}
            />
            <Route
              path="/company/:id"
              element={
                <PartnershipRoute featureType="company">
                  <Company />
                </PartnershipRoute>
              }
            />
            <Route
              path="/company/:id/contacts"
              element={
                <PartnershipRoute featureType="company">
                  <CompanyContacts />
                </PartnershipRoute>
              }
            />
            
            {/* Routes des simulateurs - Routes legacy maintenues pour compatibilité */}
            <Route
              path="/simulateur-impots"
              element={
                <ProtectedRoute>
                  <CheckPlanAccess featureKey="simulateur_impots">
                    <SimulateurImpots />
                  </CheckPlanAccess>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-espp"
              element={
                <ProtectedRoute>
                  <CheckPlanAccess featureKey="simulateur_espp">
                    <SimulateurESPP />
                  </CheckPlanAccess>
                </ProtectedRoute>
              }
            />
            <Route
              path="/optimisation-fiscale"
              element={
                <ProtectedRoute>
                  <CheckPlanAccess featureKey="optimisation_fiscale">
                    <OptimisationFiscale />
                  </CheckPlanAccess>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-per"
              element={
                <ProtectedRoute>
                  <CheckPlanAccess featureKey="simulateur_per">
                    <SimulateurPER />
                  </CheckPlanAccess>
                </ProtectedRoute>
              }
            />
            {/* Compat: éviter une 404 si un submit HTML navigue sur /simulateur-per/save */}
            <Route path="/simulateur-per/save" element={<Navigate to="/simulateur-per" replace />} />
            <Route
              path="/simulateur-epargne-precaution"
              element={
                <ProtectedRoute>
                  <CheckPlanAccess featureKey="simulateur_epargne_precaution">
                    <SimulateurEpargnePrecaution />
                  </CheckPlanAccess>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-interets-composes"
              element={
                <ProtectedRoute>
                  <CheckPlanAccess featureKey="simulateur_interets_composes">
                    <SimulateurInteretsComposes />
                  </CheckPlanAccess>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-lmnp"
              element={
                <ProtectedRoute>
                  <CheckPlanAccess featureKey="simulateur_lmnp">
                    <SimulateurLMNP />
                  </CheckPlanAccess>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-pret-immobilier"
              element={
                <ProtectedRoute>
                  <CheckPlanAccess featureKey="simulateur_pret_immobilier">
                    <SimulateurPretImmobilier />
                  </CheckPlanAccess>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-capacite-emprunt"
              element={
                <ProtectedRoute>
                  <CheckPlanAccess featureKey="simulateur_capacite_emprunt">
                    <SimulateurCapaciteEmprunt />
                  </CheckPlanAccess>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-pvi"
              element={
                <ProtectedRoute>
                  <CheckPlanAccess featureKey="simulateur_pvi">
                    <SimulateurPVI />
                  </CheckPlanAccess>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-gestion-pilotee"
              element={
                <ProtectedRoute>
                  <CheckPlanAccess featureKey="simulateur_gestion_pilotee">
                    <SimulateurGestionPilotee />
                  </CheckPlanAccess>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-capacite-epargne"
              element={
                <ProtectedRoute>
                  <CheckPlanAccess featureKey="simulateur_capacite_epargne">
                    <SimulateurCapaciteEpargne />
                  </CheckPlanAccess>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-rsu"
              element={
                <ProtectedRoute>
                  <CheckPlanAccess featureKey="simulateur_rsu">
                    <SimulateurRSU />
                  </CheckPlanAccess>
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-bspce"
              element={
                <ProtectedRoute>
                  <CheckPlanAccess featureKey="simulateur_bspce">
                    <SimulateurBSPCE />
                  </CheckPlanAccess>
                </ProtectedRoute>
              }
            />
            
            {/* Routes parcours de formation - Modules éducatifs */}
            <Route
              path="/parcours"
              element={
                <ProtectedRoute>
                  <Parcours />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parcours/:id"
              element={
                <ProtectedRoute>
                  <Parcours />
                </ProtectedRoute>
              }
            />
            
            {/* Routes forum communautaire - Réservées aux partenaires */}
            <Route
              path="/forum"
              element={
                <PartnershipRoute featureType="community">
                  <Forum />
                </PartnershipRoute>
              }
            />
            <Route
              path="/forum/category/:slug"
              element={
                <PartnershipRoute featureType="community">
                  <ForumCategory />
                </PartnershipRoute>
              }
            />
            <Route
              path="/forum/post/:postId"
              element={
                <PartnershipRoute featureType="community">
                  <ForumPost />
                </PartnershipRoute>
              }
            />
            
            {/* Route Formations - Parcours de formation */}
            <Route
              path="/formations"
              element={
                <ProtectedRoute>
                  <Formations />
                </ProtectedRoute>
              }
            />
            
            {/* Autres routes - bienvenue, etc. */}
            <Route
              path="/non-partner-welcome"
              element={
                <ProtectedRoute>
                  <NonPartnerWelcome />
                </ProtectedRoute>
              }
            />
            
            {/* Route test OCR */}
            <Route path="/test-ocr" element={<TestOcr />} />
            <Route path="/test-payslip" element={<TestPayslip />} />
            
            {/* Route 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
            </GlobalSettingsProvider>
          </MultiThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
