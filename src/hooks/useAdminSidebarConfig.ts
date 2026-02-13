import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { 
  Building2, Users, Route, BookOpen, Shield, Zap, Mail, 
  Handshake, HardDrive, Bell, Layout, CheckCircle2, MousePointerClick, 
  UserPlus, Palette, Paintbrush, FileText, Sparkles, 
  Target, Database, Sword, Calendar, Lightbulb, Calculator, Video,
  Plus, List, UserCheck, Circle, Settings, PartyPopper, Wallet,
  FlaskConical, MessageSquare, Crown, Image, HelpCircle, FileWarning,
  Search, Receipt, Briefcase, Gift,
  type LucideIcon
} from "lucide-react";

export interface AdminMenuItem {
  id: string;
  label: string;
  url: string;
  icon: string;
  order: number;
  visible: boolean;
  categoryId?: string;
  subItems?: AdminSubItem[];
}

export interface AdminSubItem {
  id: string;
  label: string;
  url: string;
  icon: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  order: number;
}

export interface AdminSidebarConfig {
  menuItems: AdminMenuItem[];
  categories: AdminCategory[];
}

// Default categories
const defaultAdminCategories: AdminCategory[] = [
  { id: "general", name: "General", order: 0 },
  { id: "companies", name: "Companies", order: 1 },
  { id: "content", name: "Content", order: 2 },
  { id: "gamification", name: "Gamification", order: 3 },
  { id: "community", name: "Communauté", order: 4 },
  { id: "settings", name: "Settings", order: 5 },
];

// Default menu items
const defaultAdminItems: AdminMenuItem[] = [
  // General
  { id: "documentation", label: "Documentation", url: "/admin/documentation", icon: "FileText", order: 0, visible: true, categoryId: "general" },
  { id: "landing-pages", label: "Landing Pages", url: "/admin/landing-pages", icon: "Layout", order: 1, visible: true, categoryId: "general" },
  { id: "expert-booking", label: "Gestion des liens de rdv", url: "/admin/expert-booking", icon: "Calendar", order: 2, visible: true, categoryId: "general" },
  { 
    id: "webinars", 
    label: "Webinars", 
    url: "#", 
    icon: "Video", 
    order: 4, 
    visible: true, 
    categoryId: "general",
    subItems: [
      { id: "create-webinar", label: "Créer webinar", url: "/admin/create-livestorm-webinar", icon: "Plus" },
      { id: "webinars-list", label: "Liste & Suivi", url: "/admin/livestorm-webinars", icon: "List" },
      { id: "livestorm-owner", label: "Owner Livestorm", url: "/admin/get-livestorm-owner", icon: "UserCheck" },
    ]
  },
  // Companies
  { id: "companies", label: "Companies", url: "/admin/companies", icon: "Building2", order: 0, visible: true, categoryId: "companies" },
  { id: "company-ranking", label: "Configuration des rangs", url: "/admin/company-ranking", icon: "Crown", order: 1, visible: true, categoryId: "companies" },
  { id: "users", label: "Utilisateurs", url: "/admin/users", icon: "Users", order: 2, visible: true, categoryId: "companies" },
  { id: "advisors", label: "Conseillers", url: "/admin/advisors", icon: "UserCheck", order: 3, visible: true, categoryId: "companies" },
  // Content
  { id: "modules", label: "Modules", url: "/admin/modules", icon: "BookOpen", order: 0, visible: true, categoryId: "content" },
  { id: "parcours", label: "Parcours", url: "/admin/parcours", icon: "Route", order: 1, visible: true, categoryId: "content" },
  { id: "formations", label: "Formations", url: "/admin/formations", icon: "BookOpen", order: 2, visible: true, categoryId: "content" },
  { id: "financial-products", label: "Produits Financiers", url: "/admin/financial-products", icon: "Wallet", order: 3, visible: true, categoryId: "content" },
  // Gamification
  { id: "features", label: "Features de partenariat", url: "/admin/features", icon: "Sparkles", order: 0, visible: true, categoryId: "gamification" },
  { id: "celebration", label: "Célébration Parcours", url: "/admin/celebration", icon: "PartyPopper", order: 1, visible: true, categoryId: "gamification" },
  // Settings
  { id: "permissions", label: "Permissions", url: "/admin/permissions", icon: "Shield", order: 0, visible: true, categoryId: "settings" },
  { id: "risk-profile", label: "Risk Profile", url: "/admin/risk-profile", icon: "Target", order: 1, visible: true, categoryId: "settings" },
  { id: "validation", label: "Points & Validation", url: "/admin/validation", icon: "Trophy", order: 2, visible: true, categoryId: "settings" },
  { id: "notifications", label: "Notifications", url: "/admin/notifications", icon: "Bell", order: 3, visible: true, categoryId: "settings" },
  { id: "storage", label: "Storage", url: "/admin/storage", icon: "Database", order: 4, visible: true, categoryId: "settings" },
  { id: "design-navigation", label: "Design & Navigation", url: "/admin/design-navigation", icon: "Palette", order: 5, visible: true, categoryId: "settings" },
  { id: "layout", label: "Layout", url: "/admin/layout", icon: "Layout", order: 6, visible: false, categoryId: "settings" },
  { id: "sidebar-config", label: "Menus latéraux", url: "/admin/sidebar-config", icon: "Layout", order: 7, visible: false, categoryId: "settings" },
  { id: "admin-sidebar-config", label: "Menu admin", url: "/admin/admin-sidebar-config", icon: "Layout", order: 8, visible: false, categoryId: "settings" },
  { id: "footer", label: "Footer", url: "/admin/footer", icon: "FileText", order: 9, visible: false, categoryId: "settings" },
  
  { 
    id: "communication", 
    label: "Communication", 
    url: "#", 
    icon: "Mail", 
    order: 11, 
    visible: true, 
    categoryId: "settings",
    subItems: [
      { id: "communication-kit", label: "Kit de Communication", url: "/admin/communication", icon: "Mail" },
      { id: "communication-templates", label: "Templates", url: "/admin/communication-templates", icon: "FileEdit" },
      { id: "visual-resources", label: "Ressources visuelles", url: "/admin/visual-resources", icon: "Image" },
      { id: "company-faqs", label: "FAQ Entreprises", url: "/admin/company-faqs", icon: "HelpCircle" },
      { id: "community", label: "Communauté", url: "/admin/community", icon: "MessageSquare" },
    ]
  },
  { id: "partnership", label: "Partnership", url: "/admin/partnership", icon: "Handshake", order: 14, visible: false, categoryId: "settings" },
  { id: "employee-partnership", label: "Employee Partnership", url: "/admin/landing-employee-partnership", icon: "UserPlus", order: 13, visible: false, categoryId: "settings" },
  { id: "business-development", label: "Business Development", url: "/admin/business-development", icon: "Briefcase", order: 14, visible: true, categoryId: "settings" },
  
  { id: "onboarding-cms", label: "Onboarding CMS", url: "/admin/onboarding-cms", icon: "BookOpen", order: 16, visible: true, categoryId: "settings" },
  { id: "simulator-ctas", label: "CTAs Simulateurs", url: "/admin/simulator-ctas", icon: "MousePointerClick", order: 17, visible: true, categoryId: "settings" },
  { id: "simulators", label: "Simulateurs", url: "/admin/simulators", icon: "Calculator", order: 18, visible: true, categoryId: "settings" },
  { id: "simulation-logs", label: "Simulations réalisées", url: "/admin/simulation-logs", icon: "Calculator", order: 19, visible: true, categoryId: "settings" },
  { id: "financial-profiles", label: "Profils Financiers", url: "/admin/financial-profiles", icon: "Users", order: 20, visible: true, categoryId: "settings" },
  { id: "financial-profile-settings", label: "Page Profil Financier", url: "/admin/financial-profile-settings", icon: "Wallet", order: 21, visible: true, categoryId: "settings" },
  { id: "recommendations", label: "Recommandations", url: "/admin/recommendations", icon: "Lightbulb", order: 22, visible: true, categoryId: "settings" },
  { id: "non-partner-welcome", label: "Non-Partner Welcome", url: "/admin/non-partner-welcome", icon: "UserPlus", order: 23, visible: true, categoryId: "settings" },
  { id: "global-settings", label: "Paramètres Globaux", url: "/admin/global-settings", icon: "Settings", order: 24, visible: true, categoryId: "settings" },
  { id: "beta-lab", label: "Beta Lab", url: "/admin/beta-lab", icon: "FlaskConical", order: 25, visible: true, categoryId: "settings" },
  { id: "workflow-hub", label: "Workflow Hub", url: "/admin/workflow-hub", icon: "Zap", order: 26, visible: true, categoryId: "settings" },
  { id: "email-config", label: "Configuration Email", url: "/admin/email-config", icon: "Mail", order: 27, visible: true, categoryId: "settings" },
  { id: "not-found-config", label: "Page 404", url: "/admin/not-found-config", icon: "FileWarning", order: 28, visible: true, categoryId: "settings" },
  { id: "company-search-api", label: "Test API Entreprises", url: "/admin/company-search-api", icon: "Search", order: 29, visible: true, categoryId: "settings" },
  { id: "tax-help", label: "Aide Fiscale", url: "/admin/tax-help", icon: "Receipt", order: 30, visible: true, categoryId: "settings" },
  { id: "offers", label: "Offres du moment", url: "/admin/offers", icon: "Gift", order: 31, visible: true, categoryId: "settings" },
  // Community
  { id: "community", label: "Gestion du Forum", url: "/admin/community", icon: "MessageSquare", order: 0, visible: true, categoryId: "community" },
];

const iconMap: Record<string, LucideIcon> = {
  Building2, Users, Route, BookOpen, Shield, Zap, Mail, 
  Handshake, HardDrive, Bell, Layout, CheckCircle2, MousePointerClick, 
  UserPlus, Palette, Paintbrush, FileText, Sparkles, 
  Target, Database, Sword, Calendar, Lightbulb, Calculator, Video,
  Plus, List, UserCheck, Circle, Settings, PartyPopper, Wallet, FlaskConical,
  MessageSquare, Crown, FileWarning, Search, Receipt, Briefcase, Gift,
};

export const getAdminIconComponent = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Circle;
};

type RawMenuItem = {
  id?: string;
  label?: string;
  url?: string;
  icon?: string;
  order?: number;
  visible?: boolean;
  categoryId?: string | null;
  subItems?: AdminSubItem[];
};

type RawCategory = {
  id?: string;
  name?: string;
  label?: string;
  order?: number;
};

const normalizeMenuItems = (raw: RawMenuItem[], defaults: AdminMenuItem[]): AdminMenuItem[] => {
  // If there is no persisted config yet, just use defaults.
  if (!Array.isArray(raw) || raw.length === 0) return defaults;

  const defaultsById = new Map(defaults.map((d) => [d.id, d]));
  const rawById = new Map(
    raw
      .map((r) => (r?.id ? [r.id, r] as const : null))
      .filter(Boolean) as Array<readonly [string, RawMenuItem]>
  );

  // 1) Start with defaults, overridden by persisted fields when present.
  const mergedDefaults = defaults.map((d) => {
    const r = rawById.get(d.id);

    return {
      id: d.id,
      label: r?.label ?? d.label,
      url: r?.url ?? d.url,
      icon: r?.icon ?? d.icon,
      order: typeof r?.order === "number" ? r!.order! : d.order,
      visible: typeof r?.visible === "boolean" ? r!.visible! : d.visible,
      categoryId: r?.categoryId ?? d.categoryId,
      subItems: r?.subItems ?? d.subItems,
    } satisfies AdminMenuItem;
  });

  // 2) Append custom items that exist in persisted config but not in defaults.
  const customItems: AdminMenuItem[] = raw
    .filter((r) => !!r?.id && !defaultsById.has(r.id!))
    .map((r, index) => {
      const id = r.id as string;
      return {
        id,
        label: r.label ?? id,
        url: r.url ?? "#",
        icon: r.icon ?? "Circle",
        order: typeof r.order === "number" ? r.order : defaults.length + index,
        visible: typeof r.visible === "boolean" ? r.visible : true,
        categoryId: r.categoryId ?? null,
        subItems: r.subItems,
      } satisfies AdminMenuItem;
    });

  return [...mergedDefaults, ...customItems];
};

const normalizeCategories = (raw: RawCategory[], defaults: AdminCategory[]): AdminCategory[] => {
  // If there is no persisted config yet, just use defaults.
  if (!Array.isArray(raw) || raw.length === 0) return defaults;

  const defaultsById = new Map(defaults.map((d) => [d.id, d]));
  const rawById = new Map(
    raw
      .map((r) => (r?.id ? [r.id, r] as const : null))
      .filter(Boolean) as Array<readonly [string, RawCategory]>
  );

  const mergedDefaults = defaults.map((d) => {
    const r = rawById.get(d.id);
    const name = r?.name ?? r?.label ?? d.name;

    return {
      id: d.id,
      name,
      order: typeof r?.order === "number" ? r!.order! : d.order,
    } satisfies AdminCategory;
  });

  const customCategories: AdminCategory[] = raw
    .filter((r) => !!r?.id && !defaultsById.has(r.id!))
    .map((r, index) => {
      const id = r.id as string;
      const name = r.name ?? r.label ?? id;
      return {
        id,
        name,
        order: typeof r.order === "number" ? r.order : defaults.length + index,
      } satisfies AdminCategory;
    });

  return [...mergedDefaults, ...customCategories];
};

export const useAdminSidebarConfig = () => {
  const [config, setConfig] = useState<AdminSidebarConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sidebar_configurations")
      .select("*")
      .eq("sidebar_type", "admin")
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching admin sidebar config:", error);
      setConfig({
        menuItems: defaultAdminItems,
        categories: defaultAdminCategories,
      });
    } else if (data) {
      const rawMenuItems = ((data.menu_items as unknown as Json[]) || []) as unknown as RawMenuItem[];
      const rawCategories = ((data.categories as unknown as Json[]) || []) as unknown as RawCategory[];

      const normalizedMenuItems = normalizeMenuItems(rawMenuItems, defaultAdminItems);
      const normalizedCategories = normalizeCategories(rawCategories, defaultAdminCategories);

      const hasAnyVisible = normalizedMenuItems.some((i) => i.visible);

      setConfig({
        menuItems: hasAnyVisible ? normalizedMenuItems : defaultAdminItems,
        categories: normalizedCategories.length > 0 ? normalizedCategories : defaultAdminCategories,
      });
    } else {
      setConfig({
        menuItems: defaultAdminItems,
        categories: defaultAdminCategories,
      });
    }
    setLoading(false);
  };

  const getVisibleItems = () => {
    if (!config) return [];
    return config.menuItems
      .filter((item) => item.visible !== false)
      .sort((a, b) => a.order - b.order);
  };

  const getItemsByCategory = () => {
    if (!config) return { uncategorized: [], categories: [] };

    const visibleItems = getVisibleItems();
    const uncategorized = visibleItems.filter((item) => !item.categoryId);

    const categorizedItems = config.categories
      .sort((a, b) => a.order - b.order)
      .map((category) => ({
        category,
        items: visibleItems.filter((item) => item.categoryId === category.id).sort((a, b) => a.order - b.order),
      }))
      .filter((group) => group.items.length > 0);

    return { uncategorized, categories: categorizedItems };
  };

  return {
    config,
    loading,
    getVisibleItems,
    getItemsByCategory,
    refetch: fetchConfig,
  };
};

export { defaultAdminItems, defaultAdminCategories };
