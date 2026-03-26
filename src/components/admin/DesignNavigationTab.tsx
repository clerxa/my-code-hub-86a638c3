import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Layout, PanelLeft, PanelTop, FileText, 
  Settings2, Menu, ChevronRight, Image
} from "lucide-react";
import { LayoutCustomizationTab } from "./LayoutCustomizationTab";
import { SidebarConfigurationTab } from "./SidebarConfigurationTab";
import { AdminSidebarConfigurationTab } from "./AdminSidebarConfigurationTab";
import { HeaderConfigurationTab } from "./HeaderConfigurationTab";
import { FooterTab } from "./FooterTab";

interface SectionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  isActive: boolean;
}

const SectionCard = ({ icon: Icon, title, description, onClick, isActive }: SectionCardProps) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
      isActive 
        ? "border-primary bg-primary/5 shadow-md" 
        : "border-border hover:border-primary/50"
    }`}
  >
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${isActive ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
      </div>
      <ChevronRight className={`h-5 w-5 flex-shrink-0 transition-transform ${isActive ? "text-primary rotate-90" : "text-muted-foreground"}`} />
    </div>
  </button>
);

const sections = [
  {
    id: "layout",
    icon: Layout,
    title: "Mise en page",
    description: "Configurez l'ordre et l'affichage des blocs sur les pages utilisateur et entreprise",
  },
  {
    id: "header",
    icon: PanelTop,
    title: "Header",
    description: "Gérez les boutons, liens et éléments affichés dans le header de l'application",
  },
  {
    id: "sidebars",
    icon: PanelLeft,
    title: "Menus latéraux",
    description: "Personnalisez les sidebars employé et entreprise avec leurs catégories et éléments",
  },
  {
    id: "admin-sidebar",
    icon: Menu,
    title: "Menu admin",
    description: "Configurez la navigation du back-office administrateur",
  },
  {
    id: "footer",
    icon: FileText,
    title: "Footer",
    description: "Modifiez les textes légaux, liens et informations du pied de page",
  },
];

export function DesignNavigationTab() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const renderContent = () => {
    switch (activeSection) {
      case "layout":
        return <LayoutCustomizationTab />;
      case "header":
        return <HeaderConfigurationTab />;
      case "sidebars":
        return <SidebarConfigurationTab />;
      case "admin-sidebar":
        return <AdminSidebarConfigurationTab />;
      case "footer":
        return <FooterTab />;
      default:
        return null;
    }
  };

  const activeTitle = sections.find(s => s.id === activeSection)?.title;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Settings2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Design & Navigation</h1>
          <p className="text-muted-foreground">
            Configurez l'apparence et la structure de navigation de votre application
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar - Navigation entre sections */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sections</CardTitle>
              <CardDescription>Sélectionnez une section à configurer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {sections.map((section) => (
                <SectionCard
                  key={section.id}
                  icon={section.icon}
                  title={section.title}
                  description={section.description}
                  onClick={() => setActiveSection(section.id)}
                  isActive={activeSection === section.id}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8 xl:col-span-9">
          {activeSection ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Settings2 className="h-4 w-4" />
                <span>Design & Navigation</span>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground font-medium">{activeTitle}</span>
              </div>
              
              <div className="bg-card rounded-lg border p-6">
                {renderContent()}
              </div>
            </div>
          ) : (
            <Card className="h-full min-h-[400px] flex items-center justify-center">
              <CardContent className="text-center py-12">
                <div className="p-4 bg-muted rounded-full inline-block mb-4">
                  <Settings2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Sélectionnez une section</h3>
                <p className="text-muted-foreground max-w-sm">
                  Choisissez une section dans le menu de gauche pour commencer à configurer 
                  l'apparence et la navigation de votre application.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
