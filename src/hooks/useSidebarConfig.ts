import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { 
  User, UserCircle, TrendingUp, GraduationCap, Calculator, Trophy, 
  Calendar, Video, Users, Building2, UserCheck, Settings, MessageSquareText,
  Circle, Lock, Home, FileText, Bell, Mail, Star, Heart, Bookmark, Wallet,
  HelpCircle, Contact, Gift, Compass, MessageSquarePlus, Info, Search, PiggyBank,
  LayoutDashboard,
  type LucideIcon
} from "lucide-react";

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: string;
  order: number;
  visible: boolean;
  categoryId?: string;
}

export interface SidebarCategory {
  id: string;
  /** display name */
  name: string;
  order: number;
}

export interface SidebarConfig {
  menuItems: SidebarMenuItem[];
  categories: SidebarCategory[];
}

const defaultEmployeeItems: SidebarMenuItem[] = [
  { id: "panorama", label: "PANORAMA", icon: "LayoutDashboard", order: -1, visible: true },
  { id: "dashboard", label: "Mon tableau de bord", icon: "User", order: 0, visible: true },
  { id: "profile", label: "Mon profil", icon: "UserCircle", order: 1, visible: true, categoryId: "mon-espace" },
  { id: "progression", label: "La quête Fincare", icon: "TrendingUp", order: 2, visible: true, categoryId: "mon-espace" },
  { id: "parcours", label: "Mes parcours", icon: "GraduationCap", order: 3, visible: true, categoryId: "mon-espace" },
  { id: "simulations", label: "Mes simulations", icon: "Calculator", order: 4, visible: true, categoryId: "mon-espace" },
  { id: "vega", label: "VEGA by FinCare", icon: "TrendingUp", order: 5, visible: true, categoryId: "programme-fincare" },
  { id: "horizon", label: "Horizon Patrimonial", icon: "Compass", order: 6, visible: true, categoryId: "programme-fincare" },
  { id: "budget", label: "ZENITH by FinCare", icon: "PiggyBank", order: 7, visible: true, categoryId: "programme-fincare" },
  { id: "leaderboard", label: "Classement", icon: "Trophy", order: 8, visible: true, categoryId: "mon-espace" },
  { id: "offers", label: "Offres du moment", icon: "Gift", order: 9, visible: true, categoryId: "mon-espace" },
  { id: "appointments", label: "Mes rendez-vous", icon: "Calendar", order: 10, visible: true, categoryId: "mon-espace" },
  { id: "webinars", label: "Mes webinaires", icon: "Video", order: 11, visible: true, categoryId: "mon-espace" },
  { id: "invitations", label: "Mes invitations", icon: "Users", order: 12, visible: true, categoryId: "mon-espace" },
  { id: "contacts", label: "Mes contacts", icon: "Contact", order: 13, visible: true, categoryId: "mon-espace" },
  { id: "company", label: "Mon entreprise", icon: "Building2", order: 14, visible: true },
  { id: "forum", label: "Communauté", icon: "MessageSquareText", order: 15, visible: true },
  { id: "pension-tracker", label: "PensionTracker", icon: "Search", order: 16, visible: true, categoryId: "programme-fincare" },
  { id: "atlas", label: "ATLAS by FinCare", icon: "FileText", order: 17, visible: true, categoryId: "programme-fincare" },
  { id: "decryptez-per", label: "Décryptez votre PER", icon: "FileText", order: 18, visible: true, categoryId: "programme-fincare" },
  { id: "feedback", label: "Feedback", icon: "MessageSquarePlus", order: 19, visible: true },
  { id: "profil-risque", label: "Profil de risque", icon: "UserCheck", order: 20, visible: true, categoryId: "mes-outils" },
];

const defaultCompanyItems: SidebarMenuItem[] = [
  { id: "informations", label: "Informations", icon: "Info", order: 0, visible: true },
  { id: "webinars", label: "Webinars", icon: "Video", order: 1, visible: true },
  { id: "parcours", label: "Parcours de formation", icon: "GraduationCap", order: 2, visible: true },
  { id: "leaderboard", label: "Classement", icon: "Trophy", order: 3, visible: true },
  { id: "advisors", label: "Conseillers dédiés", icon: "UserCheck", order: 4, visible: true },
  { id: "company-dashboard", label: "Dashboard entreprise", icon: "Building2", order: 5, visible: true, categoryId: "settings" },
  { id: "contacts", label: "Mes contacts", icon: "Contact", order: 6, visible: true, categoryId: "settings" },
  { id: "communication-kit", label: "Kit de communication", icon: "MessageSquareText", order: 7, visible: true, categoryId: "settings" },
];

const iconMap: Record<string, LucideIcon> = {
  User, UserCircle, TrendingUp, GraduationCap, Calculator, Trophy,
  Calendar, Video, Users, Building2, UserCheck, Settings, MessageSquareText,
  Circle, Lock, Home, FileText, Bell, Mail, Star, Heart, Bookmark, Wallet,
  HelpCircle, Contact, Gift, Compass, MessageSquarePlus, Info, Search, PiggyBank,
  LayoutDashboard,
};

export const getIconComponent = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Circle;
};

type RawMenuItem = {
  id?: string;
  label?: string;
  icon?: string;
  order?: number;
  visible?: boolean;
  categoryId?: string | null;
  category_id?: string | null;
};

type RawCategory = {
  id?: string;
  name?: string;
  label?: string;
  order?: number;
};

const normalizeMenuItems = (raw: RawMenuItem[], defaults: SidebarMenuItem[]): SidebarMenuItem[] => {
  if (!Array.isArray(raw) || raw.length === 0) return defaults;

  const defaultsById = new Map(defaults.map((d) => [d.id, d]));

  const mapped = raw
    .map((item, index) => {
      const id = item.id;
      if (!id) return null;

      const d = defaultsById.get(id);

      const order = typeof item.order === "number" ? item.order : index;
      const visible = typeof item.visible === "boolean" ? item.visible : true;
      const categoryId = (item.categoryId ?? item.category_id ?? undefined) || undefined;

      return {
        id,
        label: item.label ?? d?.label ?? id,
        icon: item.icon ?? d?.icon ?? "Circle",
        order,
        visible,
        categoryId,
      } satisfies SidebarMenuItem;
    })
    .filter(Boolean) as SidebarMenuItem[];

  // Merge missing default items that aren't in DB config
  const mappedIds = new Set(mapped.map((m) => m.id));
  for (const d of defaults) {
    if (!mappedIds.has(d.id)) {
      mapped.push(d);
    }
  }

  return mapped;
};

const normalizeCategories = (raw: RawCategory[]): SidebarCategory[] => {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  return raw
    .map((c, index) => {
      const id = c.id;
      if (!id) return null;
      const order = typeof c.order === "number" ? c.order : index;
      const name = c.name ?? c.label ?? "";
      if (!name) return null;
      return { id, name, order } satisfies SidebarCategory;
    })
    .filter(Boolean) as SidebarCategory[];
};

export const useSidebarConfig = (sidebarType: "employee" | "company") => {
  const [config, setConfig] = useState<SidebarConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from("sidebar_configurations")
          .select("*")
          .eq("sidebar_type", sidebarType)
          .maybeSingle();

        if (error) {
          console.error("Error fetching sidebar config:", error);
          setConfig({
            menuItems: sidebarType === "employee" ? defaultEmployeeItems : defaultCompanyItems,
            categories: [],
          });
        } else if (data) {
          const rawMenuItems = ((data.menu_items as unknown as Json[]) || []) as unknown as RawMenuItem[];
          const rawCategories = ((data.categories as unknown as Json[]) || []) as unknown as RawCategory[];

          const defaults = sidebarType === "employee" ? defaultEmployeeItems : defaultCompanyItems;

          const normalizedMenuItems = normalizeMenuItems(rawMenuItems, defaults);
          const normalizedCategories = normalizeCategories(rawCategories);

          // Safety: if everything got hidden or empty, fallback to defaults.
          const hasAnyVisible = normalizedMenuItems.some((i) => i.visible);

          // Add default categories if none exist
          const finalCategories = normalizedCategories.length > 0 
            ? normalizedCategories 
            : sidebarType === "employee" 
              ? [
                  { id: "mon-espace", name: "Mon espace", order: 0 },
                  { id: "programme-fincare", name: "Le programme Fincare", order: 1 },
                ]
              : [];

          setConfig({
            menuItems: hasAnyVisible ? normalizedMenuItems : defaults,
            categories: finalCategories,
          });
        } else {
          // Use defaults if no config found
          const defaultCategories = sidebarType === "employee" 
            ? [
                { id: "mon-espace", name: "Mon espace", order: 0 },
                { id: "programme-fincare", name: "Le programme Fincare", order: 1 },
              ]
            : [];
          setConfig({
            menuItems: sidebarType === "employee" ? defaultEmployeeItems : defaultCompanyItems,
            categories: defaultCategories,
          });
        }
      } catch (err) {
        console.error("Error:", err);
        setConfig({
          menuItems: sidebarType === "employee" ? defaultEmployeeItems : defaultCompanyItems,
          categories: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [sidebarType]);

  const getVisibleItems = () => {
    if (!config) return [];
    return config.menuItems
      .filter((item) => item.visible !== false)
      .sort((a, b) => a.order - b.order);
  };

  const getItemsByCategory = () => {
    if (!config) return { uncategorized: [], categories: [] };
    
    const visibleItems = getVisibleItems();
    const uncategorized = visibleItems.filter(item => !item.categoryId);
    
    const categorizedItems = config.categories
      .sort((a, b) => a.order - b.order)
      .map((category) => ({
        category,
        items: visibleItems.filter((item) => item.categoryId === category.id),
      }))
      .filter((group) => group.items.length > 0);

    return { uncategorized, categories: categorizedItems };
  };

  return {
    config,
    loading,
    getVisibleItems,
    getItemsByCategory,
  };
};
