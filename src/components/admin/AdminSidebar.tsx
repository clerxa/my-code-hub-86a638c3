import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { useAdminSidebarConfig, getAdminIconComponent } from "@/hooks/useAdminSidebarConfig";

export function AdminSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { config, loading, getItemsByCategory } = useAdminSidebarConfig();

  if (loading) {
    return (
      <Sidebar collapsible="icon" className="top-16 h-[calc(100vh-4rem)]">
        <SidebarContent>
          <div className="p-4 animate-pulse">
            <div className="h-4 bg-muted rounded mb-4 w-20" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 bg-muted rounded" />
              ))}
            </div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  const { uncategorized, categories } = getItemsByCategory();

  return (
    <Sidebar collapsible="icon" className="top-16 h-[calc(100vh-4rem)]">
      <SidebarContent>
        {/* Render categorized items */}
        {categories.map(({ category, items }) => (
          <SidebarGroup key={category.id}>
            <SidebarGroupLabel>{category.name}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  item.subItems && item.subItems.length > 0 ? (
                    <Collapsible
                      key={item.id}
                      defaultOpen={item.subItems.some(sub => location.pathname === sub.url)}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            {(() => {
                              const Icon = getAdminIconComponent(item.icon);
                              return <Icon className="h-4 w-4" />;
                            })()}
                            <span>{item.label}</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => {
                              const SubIcon = getAdminIconComponent(subItem.icon);
                              return (
                                <SidebarMenuSubItem key={subItem.id}>
                                  <SidebarMenuSubButton asChild isActive={location.pathname === subItem.url}>
                                    <NavLink
                                      to={subItem.url}
                                      className="flex items-center gap-2"
                                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                                    >
                                      <SubIcon className="h-3 w-3" />
                                      <span>{subItem.label}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  ) : (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                        <NavLink
                          to={item.url}
                          className="flex items-center gap-2"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                        >
                          {(() => {
                            const Icon = getAdminIconComponent(item.icon);
                            return <Icon className="h-4 w-4" />;
                          })()}
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Render uncategorized items if any */}
        {uncategorized.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Autres</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {uncategorized.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-2"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
                      >
                        {(() => {
                          const Icon = getAdminIconComponent(item.icon);
                          return <Icon className="h-4 w-4" />;
                        })()}
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
