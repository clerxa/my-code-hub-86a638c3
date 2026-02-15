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
import ProtectedRoute from "@/components/ProtectedRoute";
import PartnershipRoute from "@/components/PartnershipRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
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
import Employee from "./pages/Employee";
import EmployeeProfile from "./pages/EmployeeProfile";
import EmployeeSimulations from "./pages/EmployeeSimulations";
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
import TaxDeclarationHelp from "./pages/TaxDeclarationHelp";
import Diagnostic from "./pages/Diagnostic";
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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/partenariat" element={<Partnership />} />
            <Route path="/proposer-partenariat" element={<EmployeePartnership />} />
            <Route path="/rdv-expert" element={<ExpertBookingLanding />} />
            <Route path="/onboarding" element={<PublicOnboarding />} />
            
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
                  <SimulateurImpots />
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-espp"
              element={
                <ProtectedRoute>
                  <SimulateurESPP />
                </ProtectedRoute>
              }
            />
            <Route
              path="/optimisation-fiscale"
              element={
                <ProtectedRoute>
                  <OptimisationFiscale />
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-per"
              element={
                <ProtectedRoute>
                  <SimulateurPER />
                </ProtectedRoute>
              }
            />
            {/* Compat: éviter une 404 si un submit HTML navigue sur /simulateur-per/save */}
            <Route path="/simulateur-per/save" element={<Navigate to="/simulateur-per" replace />} />
            <Route
              path="/simulateur-epargne-precaution"
              element={
                <ProtectedRoute>
                  <SimulateurEpargnePrecaution />
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-interets-composes"
              element={
                <ProtectedRoute>
                  <SimulateurInteretsComposes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-lmnp"
              element={
                <ProtectedRoute>
                  <SimulateurLMNP />
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-pret-immobilier"
              element={
                <ProtectedRoute>
                  <SimulateurPretImmobilier />
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-capacite-emprunt"
              element={
                <ProtectedRoute>
                  <SimulateurCapaciteEmprunt />
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulateur-pvi"
              element={
                <ProtectedRoute>
                  <SimulateurPVI />
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
            
            {/* Route 404 - Capture toutes les routes non définies */}
            {/* Route 404 - Capture toutes les routes non définies */}
            <Route path="*" element={<NotFound />} />
          </Routes>
            </GlobalSettingsProvider>
          </MultiThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
