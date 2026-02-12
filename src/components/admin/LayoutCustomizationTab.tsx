import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueteFinCareEditor } from "./QueteFinCareEditor";
import { PageLayoutEditor } from "./PageLayoutEditor";

const EMPLOYEE_BLOCKS = [
  { id: "profile", label: "Profil utilisateur" },
  { id: "progression", label: "La Quête FinCare" },
  { id: "personalInfo", label: "Informations personnelles" },
  { id: "inviteColleague", label: "Inviter un collègue" },
  { id: "referral", label: "Programme de parrainage (RDV Expert)" },
  { id: "invitationsTracker", label: "Suivi des invitations et parrainages" },
  { id: "expertBooking", label: "Rendez-vous expert" },
  { id: "simulations", label: "Mes simulations" },
  { id: "upcomingWebinars", label: "Webinaires à venir" },
  { id: "recommendations", label: "Recommandations personnalisées" },
];

const COMPANY_BLOCKS = [
  { id: "parcours", label: "Parcours de formation" },
  { id: "upcomingWebinars", label: "Webinaires à venir" },
  { id: "leaderboard", label: "Classement des collaborateurs" },
  { id: "referral", label: "Programme de parrainage (RDV Expert)" },
  { id: "inviteColleague", label: "Inviter un collègue" },
  { id: "simulators", label: "Simulateurs financiers" },
  { id: "expertBooking", label: "Rendez-vous expert" },
  { id: "documents", label: "Documents et ressources" },
  { id: "webinars", label: "Rediffusions de webinaires" },
];

export const LayoutCustomizationTab = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="quest" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quest">La Quête FinCare</TabsTrigger>
          <TabsTrigger value="employee">Page Utilisateur</TabsTrigger>
          <TabsTrigger value="company">Page Entreprise</TabsTrigger>
        </TabsList>

        <TabsContent value="quest">
          <QueteFinCareEditor />
        </TabsContent>

        <TabsContent value="employee">
          <PageLayoutEditor pageName="employee" availableBlocks={EMPLOYEE_BLOCKS} />
        </TabsContent>

        <TabsContent value="company">
          <PageLayoutEditor pageName="company" availableBlocks={COMPANY_BLOCKS} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
