import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  GripVertical, Plus, Trash2, FolderPlus, Save,
  User, TrendingUp, GraduationCap, Calculator, Users, 
  UserCircle, Building2, Trophy, Calendar, Video,
  Settings, MessageSquareText, UserCheck
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Available icons mapping
const iconMap: Record<string, React.ElementType> = {
  User, TrendingUp, GraduationCap, Calculator, Users, 
  UserCircle, Building2, Trophy, Calendar, Video,
  Settings, MessageSquareText, UserCheck
};

const iconOptions = Object.keys(iconMap);

// Default menu items for each sidebar type
const defaultEmployeeItems = [
  { id: "dashboard", label: "Mon tableau de bord", icon: "User", categoryId: null, dataCoach: "" },
  { id: "profile-info", label: "Mes informations", icon: "UserCircle", categoryId: null, dataCoach: "userinfos" },
  { id: "progression", label: "La quête Fincare", icon: "TrendingUp", categoryId: null, dataCoach: "" },
  { id: "parcours", label: "Mes parcours", icon: "GraduationCap", categoryId: null, dataCoach: "parcours" },
  { id: "simulations", label: "Mes simulations", icon: "Calculator", categoryId: null, dataCoach: "simulations" },
  { id: "leaderboard", label: "Classement", icon: "Trophy", categoryId: null, dataCoach: "" },
  { id: "appointments", label: "Mes rendez-vous", icon: "Calendar", categoryId: null, dataCoach: "rdvexpert" },
  { id: "webinars", label: "Mes webinaires", icon: "Video", categoryId: null, dataCoach: "webinars" },
  { id: "invitations", label: "Mes invitations", icon: "Users", categoryId: null, dataCoach: "invitations" },
  { id: "company", label: "Mon entreprise", icon: "Building2", categoryId: null, dataCoach: "company" },
  { id: "forum", label: "Communauté", icon: "MessageSquareText", categoryId: null, dataCoach: "forum" },
  { id: "atlas", label: "ATLAS by FinCare", icon: "FileText", categoryId: null, dataCoach: "" },
];

const defaultCompanyItems = [
  { id: "webinars", label: "Webinars", icon: "Video", categoryId: null, dataCoach: "" },
  { id: "parcours", label: "Parcours de formation", icon: "GraduationCap", categoryId: null, dataCoach: "" },
  { id: "leaderboard", label: "Classement", icon: "Trophy", categoryId: null, dataCoach: "" },
  
  { id: "configuration", label: "Configuration", icon: "Settings", categoryId: null, dataCoach: "" },
  { id: "communication-kit", label: "Kit de communication", icon: "MessageSquareText", categoryId: null, dataCoach: "" },
];

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  categoryId: string | null;
  dataCoach?: string;
}

interface Category {
  id: string;
  label: string;
  order: number;
}

interface SortableItemProps {
  item: MenuItem;
  categories: Category[];
  onUpdate: (id: string, field: string, value: string | null) => void;
  onDelete: (id: string) => void;
}

const SortableItem = ({ item, categories, onUpdate, onDelete }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = iconMap[item.icon] || User;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card border rounded-lg mb-2"
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <IconComponent className="h-4 w-4 text-muted-foreground" />
      
      <Input
        value={item.label}
        onChange={(e) => onUpdate(item.id, "label", e.target.value)}
        className="flex-1"
        placeholder="Label"
      />
      
      <Select
        value={item.icon}
        onValueChange={(value) => onUpdate(item.id, "icon", value)}
      >
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {iconOptions.map((icon) => {
            const Icon = iconMap[icon];
            return (
              <SelectItem key={icon} value={icon}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{icon}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      <Select
        value={item.categoryId || "none"}
        onValueChange={(value) => onUpdate(item.id, "categoryId", value === "none" ? null : value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Sans catégorie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sans catégorie</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Input
        value={item.dataCoach || ""}
        onChange={(e) => onUpdate(item.id, "dataCoach", e.target.value || null)}
        className="w-28"
        placeholder="data-coach"
        title="Sélecteur pour les coach marks"
      />
      
      <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
};

interface SortableCategoryProps {
  category: Category;
  onUpdateLabel: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}

const SortableCategory = ({ category, onUpdateLabel, onDelete }: SortableCategoryProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-secondary rounded-lg mb-2"
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Input
        value={category.label}
        onChange={(e) => onUpdateLabel(category.id, e.target.value)}
        className="flex-1 h-8"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onDelete(category.id)}
      >
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
    </div>
  );
};

interface SidebarEditorProps {
  type: "employee" | "company";
}

const SidebarEditor = ({ type }: SidebarEditorProps) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadConfiguration();
  }, [type]);

  const loadConfiguration = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sidebar_configurations")
      .select("*")
      .eq("sidebar_type", type)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error loading configuration:", error);
    }

    if (data) {
      const dbItems = data.menu_items as unknown as MenuItem[];
      const defaults = type === "employee" ? defaultEmployeeItems : defaultCompanyItems;
      
      // Merge missing default items that aren't in DB config
      const dbIds = new Set(dbItems.map((item) => item.id));
      const missingDefaults = defaults.filter((d) => !dbIds.has(d.id));
      
      setMenuItems([...dbItems, ...missingDefaults]);
      setCategories(data.categories as unknown as Category[]);
    } else {
      // Use defaults
      setMenuItems(type === "employee" ? defaultEmployeeItems : defaultCompanyItems);
      setCategories([]);
    }
    setLoading(false);
  };

  const saveConfiguration = async () => {
    try {
      const { error } = await supabase
        .from("sidebar_configurations")
        .upsert({
          sidebar_type: type,
          menu_items: menuItems as unknown as Json,
          categories: categories as unknown as Json,
        }, {
          onConflict: "sidebar_type",
        });

      if (error) {
        console.error("Save error:", error);
        toast.error(`Erreur: ${error.message}`);
      } else {
        toast.success("Configuration sauvegardée");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Erreur inattendue lors de la sauvegarde");
    }
  };

  const handleMenuItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMenuItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCategories((cats) => {
        const oldIndex = cats.findIndex((c) => c.id === active.id);
        const newIndex = cats.findIndex((c) => c.id === over.id);
        const reordered = arrayMove(cats, oldIndex, newIndex);
        // Update order values
        return reordered.map((cat, idx) => ({ ...cat, order: idx }));
      });
    }
  };

  const updateItem = (id: string, field: string, value: string | null) => {
    setMenuItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setMenuItems((items) => items.filter((item) => item.id !== id));
  };

  const addCategory = () => {
    if (!newCategoryLabel.trim()) return;
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      label: newCategoryLabel,
      order: categories.length,
    };
    setCategories([...categories, newCategory]);
    setNewCategoryLabel("");
  };

  const updateCategoryLabel = (id: string, label: string) => {
    setCategories((cats) =>
      cats.map((cat) => (cat.id === id ? { ...cat, label } : cat))
    );
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter((cat) => cat.id !== id));
    // Remove category assignment from items
    setMenuItems((items) =>
      items.map((item) =>
        item.categoryId === id ? { ...item, categoryId: null } : item
      )
    );
  };

  const resetToDefaults = () => {
    setMenuItems(type === "employee" ? defaultEmployeeItems : defaultCompanyItems);
    setCategories([]);
  };

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  // Group items by category for preview
  const groupedItems = () => {
    const uncategorized = menuItems.filter((item) => !item.categoryId);
    const categorized: Record<string, MenuItem[]> = {};
    
    categories.forEach((cat) => {
      categorized[cat.id] = menuItems.filter((item) => item.categoryId === cat.id);
    });

    return { uncategorized, categorized };
  };

  const { uncategorized, categorized } = groupedItems();

  return (
    <div className="space-y-6">
      {/* Categories management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Catégories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newCategoryLabel}
              onChange={(e) => setNewCategoryLabel(e.target.value)}
              placeholder="Nom de la nouvelle catégorie"
            />
            <Button onClick={addCategory}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
          
          {categories.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCategoryDragEnd}
            >
              <SortableContext
                items={categories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {categories
                  .sort((a, b) => a.order - b.order)
                  .map((cat) => (
                    <SortableCategory
                      key={cat.id}
                      category={cat}
                      onUpdateLabel={updateCategoryLabel}
                      onDelete={deleteCategory}
                    />
                  ))}
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Menu items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Éléments du menu</CardTitle>
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            Réinitialiser
          </Button>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleMenuItemDragEnd}
          >
            <SortableContext
              items={menuItems.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {menuItems.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  categories={categories}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                />
              ))}
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aperçu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-card border rounded-lg p-4 max-w-xs">
            {categories.map((cat) => (
              <div key={cat.id} className="mb-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                  {cat.label}
                </h4>
                {categorized[cat.id]?.map((item) => {
                  const Icon = iconMap[item.icon] || User;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            ))}
            
            {uncategorized.length > 0 && (
              <div>
                {categories.length > 0 && (
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                    Autres
                  </h4>
                )}
                {uncategorized.map((item) => {
                  const Icon = iconMap[item.icon] || User;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={saveConfiguration}>
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder
        </Button>
      </div>
    </div>
  );
};

export const SidebarConfigurationTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuration des menus latéraux</h2>
        <p className="text-muted-foreground">
          Organisez et personnalisez les menus des pages Employé et Entreprise
        </p>
      </div>

      <Tabs defaultValue="employee">
        <TabsList>
          <TabsTrigger value="employee">Menu Employé</TabsTrigger>
          <TabsTrigger value="company">Menu Entreprise</TabsTrigger>
        </TabsList>
        <TabsContent value="employee" className="mt-4">
          <SidebarEditor type="employee" />
        </TabsContent>
        <TabsContent value="company" className="mt-4">
          <SidebarEditor type="company" />
        </TabsContent>
      </Tabs>
    </div>
  );
};
