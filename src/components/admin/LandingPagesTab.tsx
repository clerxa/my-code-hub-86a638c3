import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Handshake, UserPlus, ExternalLink, ArrowLeft, Home } from "lucide-react";
import { cn } from "@/lib/utils";

// Import the actual tab components
import { ExpertBookingTab } from "./ExpertBookingTab";
import { PartnershipTab } from "./PartnershipTab";
import { EmployeePartnershipEditor } from "./EmployeePartnershipEditor";
import { IndexPageEditor } from "./IndexPageEditor";

interface LandingPageSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  previewUrl: string;
}

const sections: LandingPageSection[] = [
  {
    id: "index",
    title: "Page d'accueil",
    description: "Page principale du site — logos clients et configuration",
    icon: Home,
    previewUrl: "/",
  },
  {
    id: "expert-booking",
    title: "LP RDV Experts",
    description: "Page de réservation de rendez-vous avec les experts financiers",
    icon: Calendar,
    previewUrl: "/rdv-expert",
  },
  {
    id: "partnership",
    title: "Partnership B2B",
    description: "Page de partenariat pour les entreprises (demandes entrantes)",
    icon: Handshake,
    previewUrl: "/partenariat",
  },
  {
    id: "employee-partnership",
    title: "Employee Partnership",
    description: "Page pour les employés souhaitant proposer MyFinCare à leur entreprise",
    icon: UserPlus,
    previewUrl: "/proposer-partenariat",
  },
];

interface SectionCardProps {
  section: LandingPageSection;
  onClick: () => void;
  isActive: boolean;
}

const SectionCard = ({ section, onClick, isActive }: SectionCardProps) => {
  const Icon = section.icon;
  
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isActive && "ring-2 ring-primary bg-primary/5"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            isActive ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{section.title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>{section.description}</CardDescription>
        <div className="mt-3">
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation();
              window.open(section.previewUrl, '_blank');
            }}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Voir la page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export function LandingPagesTab() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const renderContent = () => {
    switch (activeSection) {
      case "index":
        return <IndexPageEditor />;
      case "expert-booking":
        return <ExpertBookingTab />;
      case "partnership":
        return <PartnershipTab />;
      case "employee-partnership":
        return <EmployeePartnershipEditor />;
      default:
        return (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Sélectionnez une landing page à configurer</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Landing Pages</h1>
          <p className="text-muted-foreground">
            Configuration centralisée de toutes les landing pages
          </p>
        </div>
      </div>

      {/* Section selector when no section is active */}
      {!activeSection && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onClick={() => setActiveSection(section.id)}
              isActive={activeSection === section.id}
            />
          ))}
        </div>
      )}

      {/* Active section content */}
      {activeSection && (
        <div className="space-y-4">
          {/* Back button + section info */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setActiveSection(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="flex items-center gap-3">
              {(() => {
                const section = sections.find(s => s.id === activeSection);
                if (!section) return null;
                const Icon = section.icon;
                return (
                  <>
                    <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold">{section.title}</h2>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Content */}
          {renderContent()}
        </div>
      )}
    </div>
  );
}
