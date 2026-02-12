import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSidebarConfig, getIconComponent } from "@/hooks/useSidebarConfig";

interface MobileCompanyNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  upcomingWebinarsCount?: number;
  isCompanyContact?: boolean;
  companyId?: string;
  enablePointsRanking?: boolean;
}

export const MobileCompanyNav = ({ 
  activeSection, 
  onSectionChange,
  upcomingWebinarsCount = 0,
  isCompanyContact = false,
  companyId,
  enablePointsRanking = false
}: MobileCompanyNavProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { config, loading, getItemsByCategory } = useSidebarConfig("company");

  // Items that should only be visible to company contacts
  const contactOnlyItems = ["configuration", "company-dashboard"];
  
  // Items that should be hidden when points/ranking is disabled
  const rankingItems = ["leaderboard"];
  
  // Items that should be hidden on company pages (already in dashboard or removed)
  const hiddenItems = ["communication-kit", "help"];

  const handleItemClick = (itemId: string) => {
    switch (itemId) {
      case "configuration":
        if (companyId) navigate(`/company/${companyId}/settings`);
        break;
      case "company-dashboard":
        if (companyId) navigate(`/company/${companyId}/dashboard`);
        break;
      case "contacts":
        if (companyId) navigate(`/company/${companyId}/contacts`);
        break;
      default:
        onSectionChange(itemId);
    }
    setOpen(false);
  };

  const getBadge = (itemId: string) => {
    if (itemId === "webinars") return upcomingWebinarsCount;
    return 0;
  };

  const { uncategorized, categories } = getItemsByCategory();

  // Filter items based on isCompanyContact, enablePointsRanking, and hide help on mobile
  const filterItems = (items: { id: string; label: string; icon: string }[]) => {
    return items.filter(item => {
      // Hide help on mobile
      if (item.id === "help") {
        return false;
      }
      // Hide items that are already in the dashboard
      if (hiddenItems.includes(item.id)) {
        return false;
      }
      // Hide ranking items if points/ranking is disabled
      if (rankingItems.includes(item.id) && !enablePointsRanking) {
        return false;
      }
      // Hide contact-only items for non-contacts
      if (contactOnlyItems.includes(item.id)) {
        return isCompanyContact;
      }
      return true;
    });
  };

  const allItems = [...filterItems(uncategorized), ...categories.flatMap(c => filterItems(c.items))];
  const activeItem = allItems.find(item => item.id === activeSection) || allItems[0];
  const ActiveIcon = activeItem ? getIconComponent(activeItem.icon) : Menu;

  const renderMenuItem = (item: { id: string; label: string; icon: string }) => {
    const Icon = getIconComponent(item.icon);
    const badge = getBadge(item.id);

    return (
      <Button
        key={item.id}
        variant={activeSection === item.id ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-3",
          activeSection === item.id && "bg-primary/10 text-primary font-medium"
        )}
        onClick={() => handleItemClick(item.id)}
      >
        <div className="relative">
          <Icon className="h-4 w-4" />
          {badge > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </div>
        <span>{item.label}</span>
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full justify-between gap-2">
          <div className="flex items-center gap-2">
            <ActiveIcon className="h-4 w-4" />
            <span>{activeItem?.label || "Menu"}</span>
          </div>
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 space-y-1">
          {/* Render uncategorized items first */}
          {filterItems(uncategorized).map(renderMenuItem)}
          
          {/* Render categorized items */}
          {categories.map(({ category, items }) => {
            const filteredItems = filterItems(items);
            if (filteredItems.length === 0) return null;
            
            return (
              <div key={category.id} className="pt-3">
                <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {category.name}
                </p>
                <div className="space-y-1">
                  {filteredItems.map(renderMenuItem)}
                </div>
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
};
