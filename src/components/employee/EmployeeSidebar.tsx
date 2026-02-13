import { useNavigate } from "react-router-dom";
import { Lock, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useSidebarConfig, getIconComponent } from "@/hooks/useSidebarConfig";
import { SimulationQuotaBanner } from "@/components/SimulationQuotaBanner";
import { useOfferViewTracking } from "@/hooks/useOffers";

interface EmployeeSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  companyId?: string | null;
  hasPartnership?: boolean;
  webinarCount?: number;
  enablePointsRanking?: boolean;
  primaryColor?: string;
}

export const EmployeeSidebar = ({ activeSection, onSectionChange, companyId, hasPartnership, webinarCount = 0, enablePointsRanking = false, primaryColor }: EmployeeSidebarProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const { config, loading, getItemsByCategory } = useSidebarConfig("employee");
  const { hasNewOffers } = useOfferViewTracking();

  // Items that should be hidden when points/ranking is disabled
  const rankingItems = ["leaderboard", "progression"];
  
  // Items to hide (help/visite guidée removed)
  const hiddenItems = ["help"];

  useEffect(() => {
    if (user) {
      fetchAppointmentCount();
    }
  }, [user]);

  const fetchAppointmentCount = async () => {
    const { count } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .eq("status", "scheduled")
      .gte("event_start_time", new Date().toISOString());
    
    setAppointmentCount(count || 0);
  };

  // Note: "simulations" removed - users now have 10 free simulations before being limited
  // "company" and "forum" (Communauté) are locked for non-partner users
  const lockedItems = ["progression", "company", "forum"];
  
  // State for locked dialogs
  const [showCompanyLockedDialog, setShowCompanyLockedDialog] = useState(false);
  const [showCommunityLockedDialog, setShowCommunityLockedDialog] = useState(false);
  
  const handleItemClick = (itemId: string) => {
    const isLocked = lockedItems.includes(itemId) && !hasPartnership;
    
    // Special handling for company - show dialog instead of redirecting
    if (itemId === "company" && isLocked) {
      setShowCompanyLockedDialog(true);
      return;
    }
    
    // Special handling for community (forum) - show dialog instead of redirecting
    if (itemId === "forum" && isLocked) {
      setShowCommunityLockedDialog(true);
      return;
    }
    
    if (isLocked) {
      navigate("/proposer-partenariat");
      return;
    }

    switch (itemId) {
      case "parcours":
        navigate("/parcours");
        break;
      case "simulations":
        navigate("/employee/simulations");
        break;
      case "profile":
      case "profile-info":
      case "financial-profile":
        navigate("/employee/profile");
        break;
      case "company":
        if (companyId) {
          navigate(`/company/${companyId}`);
        } else {
          navigate("/proposer-partenariat");
        }
        break;
      case "forum":
        navigate("/forum");
        break;
      case "offers":
        navigate("/employee");
        setTimeout(() => onSectionChange("offers"), 100);
        break;
      case "contacts":
        onSectionChange("contacts");
        break;
      default:
        onSectionChange(itemId);
    }
  };

  const getBadge = (itemId: string) => {
    if (itemId === "appointments") return appointmentCount;
    if (itemId === "webinars") return webinarCount;
    if (itemId === "offers") return hasNewOffers ? 1 : 0; // Show dot badge for new offers
    return 0;
  };

  const { uncategorized, categories } = getItemsByCategory();

  // Filter items
  const filterItems = (items: { id: string; label: string; icon: string; dataCoach?: string }[]) => {
    return items.filter(item => {
      // Hide help item
      if (hiddenItems.includes(item.id)) return false;
      // Hide ranking items if disabled
      if (rankingItems.includes(item.id) && !enablePointsRanking) return false;
      return true;
    });
  };

  const renderMenuItem = (item: { id: string; label: string; icon: string; dataCoach?: string }) => {
    const Icon = getIconComponent(item.icon);
    const isLocked = lockedItems.includes(item.id) && !hasPartnership;
    const badge = getBadge(item.id);

    // Compute dynamic styles for active state using company primary color
    const activeStyle = activeSection === item.id && primaryColor ? {
      backgroundColor: `color-mix(in srgb, ${primaryColor} 15%, transparent)`,
      color: primaryColor
    } : undefined;

    const buttonContent = (
      <Button
        variant={activeSection === item.id ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-3 transition-colors relative",
          activeSection === item.id && !primaryColor && "bg-primary/10 text-primary font-medium",
          activeSection === item.id && primaryColor && "font-medium",
          collapsed && "justify-center px-2",
          isLocked && "text-muted-foreground"
        )}
        style={activeStyle}
        onClick={() => handleItemClick(item.id)}
      >
        <div className="relative">
          {isLocked && !collapsed ? (
            <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <Icon className="h-4 w-4 shrink-0" />
          )}
          {badge > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </div>
        {!collapsed && <span className="truncate">{item.label}</span>}
        {isLocked && collapsed && (
          <Lock className="h-3 w-3 absolute bottom-1 right-1 text-muted-foreground" />
        )}
      </Button>
    );

    if (isLocked) {
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[250px]">
            <p>Pour activer cette fonctionnalité, rapprochez-vous de votre entreprise pour créer un partenariat officiel</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    if (collapsed) {
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.id}>{buttonContent}</div>;
  };

  if (loading) {
    return (
      <aside className={cn("sticky top-20 h-fit bg-card border rounded-lg", collapsed ? "w-14" : "w-56")}>
        <div className="p-4 animate-pulse">
          <div className="h-8 bg-muted rounded mb-2" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside 
      className={cn(
        "sticky top-20 h-fit bg-card border rounded-lg transition-all duration-300",
        collapsed ? "w-14" : "w-56"
      )}
    >
      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-end mb-2"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        <nav className="space-y-1">
          <TooltipProvider delayDuration={300}>
            {/* Render uncategorized items first */}
            {filterItems(uncategorized).map(renderMenuItem)}
            
            {/* Render categorized items */}
            {categories.map(({ category, items }) => {
              const filteredItems = filterItems(items);
              if (filteredItems.length === 0) return null;
              
              return (
                <div key={category.id} className="pt-3">
                  {!collapsed && (
                    <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {category.name}
                    </p>
                  )}
                  {collapsed && <div className="border-t my-2" />}
                  <div className="space-y-1">
                    {filteredItems.map(renderMenuItem)}
                  </div>
                </div>
              );
            })}
          </TooltipProvider>
        </nav>

        {/* Simulation quota banner for non-partner users */}
        {!hasPartnership && !collapsed && (
          <div className="mt-4 pt-4 border-t">
            <SimulationQuotaBanner variant="full" />
          </div>
        )}
        {!hasPartnership && collapsed && (
          <div className="mt-4 pt-4 border-t flex justify-center">
            <SimulationQuotaBanner variant="compact" className="w-full" />
          </div>
        )}
      </div>

      {/* Company locked dialog for non-partner users */}
      <Dialog open={showCompanyLockedDialog} onOpenChange={setShowCompanyLockedDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Espace Entreprise réservé aux partenaires</DialogTitle>
            <DialogDescription className="text-center">
              Pour bénéficier de parcours de formation spécifiques à votre entreprise, 
              il faut que votre entreprise soit partenaire officiel de FinCare.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              className="w-full gap-2"
              onClick={() => {
                setShowCompanyLockedDialog(false);
                navigate("/proposer-partenariat");
              }}
            >
              <Building2 className="h-4 w-4" />
              Proposer un partenariat à mon entreprise
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowCompanyLockedDialog(false)}
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Community locked dialog for non-partner users */}
      <Dialog open={showCommunityLockedDialog} onOpenChange={setShowCommunityLockedDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Communauté réservée aux partenaires</DialogTitle>
            <DialogDescription className="text-center">
              Pour accéder à la communauté et échanger avec d'autres collaborateurs, 
              il faut que votre entreprise soit partenaire officiel de FinCare.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              className="w-full gap-2"
              onClick={() => {
                setShowCommunityLockedDialog(false);
                navigate("/proposer-partenariat");
              }}
            >
              <Building2 className="h-4 w-4" />
              Proposer un partenariat à mon entreprise
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowCommunityLockedDialog(false)}
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
};
