import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebarConfig, getIconComponent } from "@/hooks/useSidebarConfig";

interface CompanySidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  upcomingWebinarsCount?: number;
  isCompanyContact?: boolean;
  companyId?: string;
  enablePointsRanking?: boolean;
  primaryColor?: string | null;
}

export const CompanySidebar = ({ 
  activeSection, 
  onSectionChange, 
  upcomingWebinarsCount = 0,
  isCompanyContact = false,
  companyId,
  enablePointsRanking = false,
  primaryColor
}: CompanySidebarProps) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { config, loading, getItemsByCategory } = useSidebarConfig("company");

  // Items that should only be visible to company contacts
  const contactOnlyItems = ["company-dashboard"];
  
  // Items that should be hidden on company pages (already in dashboard or removed features)
  const hiddenItems = ["communication-kit", "help"];
  
  // Items that should be hidden when points/ranking is disabled
  const rankingItems = ["leaderboard"];

  const handleItemClick = (itemId: string) => {
    if (itemId === "company-dashboard" && companyId) {
      navigate(`/company/${companyId}/dashboard`);
    } else if (itemId === "contacts" && companyId) {
      navigate(`/company/${companyId}/contacts`);
    } else {
      onSectionChange(itemId);
    }
  };

  const getBadge = (itemId: string) => {
    if (itemId === "webinars") return upcomingWebinarsCount;
    return 0;
  };

  const { uncategorized, categories } = getItemsByCategory();

  // Filter items based on isCompanyContact and enablePointsRanking
  const filterItems = (items: { id: string; label: string; icon: string }[]) => {
    return items.filter(item => {
      // Hide items that are already in the dashboard or removed
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

  const renderMenuItem = (item: { id: string; label: string; icon: string; dataCoach?: string }) => {
    const Icon = getIconComponent(item.icon);
    const badge = getBadge(item.id);
    const isActive = activeSection === item.id;
    const activeColor = primaryColor || 'hsl(var(--primary))';

    const buttonContent = (
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-3 transition-all relative",
          isActive && "font-medium",
          collapsed && "justify-center px-2"
        )}
        style={isActive ? {
          backgroundColor: `color-mix(in srgb, ${activeColor} 15%, transparent)`,
          color: activeColor,
          borderLeftWidth: collapsed ? undefined : '3px',
          borderLeftColor: collapsed ? undefined : activeColor
        } : undefined}
        onClick={() => handleItemClick(item.id)}
      >
        <div className="relative">
          <Icon className="h-4 w-4 shrink-0" style={isActive ? { color: activeColor } : undefined} />
          {badge > 0 && (
            <span 
              className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-[10px] font-bold px-1"
              style={{ backgroundColor: activeColor }}
            >
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </div>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Button>
    );

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
            {[1, 2, 3, 4].map(i => (
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
      </div>
    </aside>
  );
};
