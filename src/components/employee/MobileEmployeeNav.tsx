import { useNavigate } from "react-router-dom";
import { Building2, Lock, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebarActiveItem } from "@/hooks/useSidebarActiveItem";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useSidebarConfig, getIconComponent } from "@/hooks/useSidebarConfig";
import { useOfferViewTracking } from "@/hooks/useOffers";

interface MobileEmployeeNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  companyId?: string | null;
  hasPartnership?: boolean;
  webinarCount?: number;
  enablePointsRanking?: boolean;
  primaryColor?: string;
}

export const MobileEmployeeNav = ({ activeSection, onSectionChange, companyId, hasPartnership, webinarCount = 0, enablePointsRanking = false, primaryColor }: MobileEmployeeNavProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [lockedDialog, setLockedDialog] = useState<null | "company" | "forum">(null);
  const { config, loading, getItemsByCategory } = useSidebarConfig("employee");
  const { hasNewOffers } = useOfferViewTracking();

  // Items that should be hidden when points/ranking is disabled
  const rankingItems = ["leaderboard", "progression"];

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

  // Keep mobile consistent with sidebar: lock company + community (forum) for non-partner users
  const lockedItems = ["progression", "company", "forum", "vega", "horizon"];
  
  const handleItemClick = (itemId: string) => {
    const isLocked = lockedItems.includes(itemId) && !hasPartnership;

    if (isLocked && (itemId === "company" || itemId === "forum")) {
      setOpen(false);
      setLockedDialog(itemId);
      return;
    }

    // Vega & Horizon locked for non-partner users
    if ((itemId === "vega" || itemId === "horizon") && isLocked) {
      setOpen(false);
      navigate("/proposer-partenariat");
      return;
    }
    
    if (isLocked) {
      navigate("/proposer-partenariat");
      setOpen(false);
      return;
    }

    switch (itemId) {
      case "parcours":
        navigate("/parcours");
        break;
      case "simulations":
        navigate("/employee/simulations");
        break;
      case "vega":
        navigate("/employee/vega");
        break;
      case "horizon":
        navigate("/employee/horizon");
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
      case "feedback":
        navigate("/employee/feedback");
        break;
      case "pension-tracker":
        navigate("/employee/pension-tracker");
        break;
      case "decryptez-per":
        navigate("/employee/decryptez-per");
        break;
      case "budget":
        navigate("/employee/budget");
        break;
      case "offers":
        navigate("/employee");
        setTimeout(() => onSectionChange("offers"), 100);
        break;
      case "contacts":
        onSectionChange("contacts");
        break;
      case "profile-info":
      case "profile":
      case "financial-profile":
        navigate("/employee/profile");
        break;
      default:
        onSectionChange(itemId);
    }
    setOpen(false);
  };

  const getBadge = (itemId: string) => {
    if (itemId === "appointments") return appointmentCount;
    if (itemId === "webinars") return webinarCount;
    if (itemId === "offers") return hasNewOffers ? 1 : 0;
    return 0;
  };

  const { uncategorized, categories } = getItemsByCategory();
  
  // Filter out ranking items if disabled, and filter out "help" on mobile
  const filterItems = (items: { id: string; label: string; icon: string }[]) => {
    return items.filter(item => {
      // Hide help on mobile
      if (item.id === "help") return false;
      // Hide ranking items if disabled
      if (rankingItems.includes(item.id) && !enablePointsRanking) return false;
      return true;
    });
  };
  
  const filteredUncategorized = filterItems(uncategorized);
  const filteredCategories = categories.map(c => ({ ...c, items: filterItems(c.items) })).filter(c => c.items.length > 0);
  
  const allItems = [...filteredUncategorized, ...filteredCategories.flatMap(c => c.items)];
  const { isItemActive } = useSidebarActiveItem(activeSection, "employee", companyId);

  const activeItem = allItems.find(item => isItemActive(item.id));
  const ActiveIcon = activeItem ? getIconComponent(activeItem.icon) : Menu;

  const renderMenuItem = (item: { id: string; label: string; icon: string }) => {
    const Icon = getIconComponent(item.icon);
    const isLocked = lockedItems.includes(item.id) && !hasPartnership;
    const badge = getBadge(item.id);
    const isActive = isItemActive(item.id);

    // Compute dynamic styles for active state using company primary color
    const activeStyle = isActive && primaryColor ? {
      backgroundColor: `color-mix(in srgb, ${primaryColor} 15%, transparent)`,
      color: primaryColor
    } : undefined;

    return (
      <Button
        key={item.id}
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-3",
          isActive && !primaryColor && "bg-primary/10 text-primary font-medium",
          isActive && primaryColor && "font-medium",
          isLocked && "text-muted-foreground"
        )}
        style={activeStyle}
        onClick={() => handleItemClick(item.id)}
      >
        <div className="relative">
          {isLocked ? (
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
        <span className="truncate">{item.label}</span>
      </Button>
    );
  };

  if (loading) {
    return (
      <Button variant="outline" className="w-full justify-between" disabled>
        <span>Chargement...</span>
        <Menu className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <ActiveIcon className="h-4 w-4" />
              <span>{activeItem?.label || "Menu"}</span>
            </span>
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[320px]">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 space-y-1">
            {/* Render uncategorized items first */}
            {filteredUncategorized.map(renderMenuItem)}
            
            {/* Render categorized items */}
            {filteredCategories.map(({ category, items }) => (
              <div key={category.id} className="pt-3">
                <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {category.name}
                </p>
                <div className="space-y-1">
                  {items.map(renderMenuItem)}
                </div>
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <Dialog open={lockedDialog !== null} onOpenChange={(open) => !open && setLockedDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">
              {lockedDialog === "company" ? "Espace Entreprise réservé aux partenaires" : "Communauté réservée aux partenaires"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {lockedDialog === "company"
                ? "Pour bénéficier de parcours de formation spécifiques à votre entreprise, il faut que votre entreprise soit partenaire officiel de FinCare."
                : "Pour accéder à la communauté et échanger avec d'autres collaborateurs, il faut que votre entreprise soit partenaire officiel de FinCare."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              className="w-full gap-2"
              onClick={() => {
                setLockedDialog(null);
                navigate("/proposer-partenariat");
              }}
            >
              <Building2 className="h-4 w-4" />
              Proposer un partenariat à mon entreprise
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setLockedDialog(null)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
