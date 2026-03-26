import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  GripVertical, Trash2, FolderPlus, Save, Eye, EyeOff,
  Building2, Users, Route, BookOpen, Shield, Zap, Mail, 
  Handshake, Bell, Layout, CheckCircle2, MousePointerClick, 
  UserPlus, Palette, Paintbrush, FileText, Sparkles, 
  Target, Database, Sword, Calendar, Lightbulb, Calculator, Video,
  Plus, List, UserCheck, Circle
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { defaultAdminItems, defaultAdminCategories, type AdminMenuItem, type AdminCategory } from "@/hooks/useAdminSidebarConfig";

const iconMap: Record<string, React.ElementType> = {
  Building2, Users, Route, BookOpen, Shield, Zap, Mail, 
  Handshake, Bell, Layout, CheckCircle2, MousePointerClick, 
  UserPlus, Palette, Paintbrush, FileText, Sparkles, 
  Target, Database, Sword, Calendar, Lightbulb, Calculator, Video,
  Plus, List, UserCheck, Circle
};

const iconOptions = Object.keys(iconMap);

interface SortableItemProps {
  item: AdminMenuItem;
  categories: AdminCategory[];
  onUpdate: (id: string, field: string, value: any) => void;
}

const SortableItem = ({ item, categories, onUpdate }: SortableItemProps) => {
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

  const IconComponent = iconMap[item.icon] || Circle;

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
      />
      
      <Select
        value={item.icon}
        onValueChange={(value) => onUpdate(item.id, "icon", value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {iconOptions.map((icon) => {
            const Icon = iconMap[icon];
            return (
              <SelectItem key={icon} value={icon}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{icon}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      <Select
        value={item.categoryId || "none"}
        onValueChange={(value) => onUpdate(item.id, "categoryId", value === "none" ? undefined : value)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Sans catégorie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sans catégorie</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onUpdate(item.id, "visible", !item.visible)}
        title={item.visible ? "Masquer" : "Afficher"}
      >
        {item.visible ? (
          <Eye className="h-4 w-4 text-green-600" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
};

interface SortableCategoryProps {
  category: AdminCategory;
  onUpdateName: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

const SortableCategory = ({ category, onUpdateName, onDelete }: SortableCategoryProps) => {
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
        value={category.name}
        onChange={(e) => onUpdateName(category.id, e.target.value)}
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

export const AdminSidebarConfigurationTab = () => {
  const [menuItems, setMenuItems] = useState<AdminMenuItem[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sidebar_configurations")
      .select("*")
      .eq("sidebar_type", "admin")
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error loading configuration:", error);
    }

    if (data) {
      setMenuItems(data.menu_items as unknown as AdminMenuItem[]);
      setCategories(data.categories as unknown as AdminCategory[]);
    } else {
      setMenuItems(defaultAdminItems);
      setCategories(defaultAdminCategories);
    }
    setLoading(false);
  };

  const saveConfiguration = async () => {
    try {
      const { error } = await supabase
        .from("sidebar_configurations")
        .upsert({
          sidebar_type: "admin",
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
        window.dispatchEvent(new CustomEvent("admin-sidebar-config-updated"));
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
        const reordered = arrayMove(items, oldIndex, newIndex);
        return reordered.map((item, idx) => ({ ...item, order: idx }));
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
        return reordered.map((cat, idx) => ({ ...cat, order: idx }));
      });
    }
  };

  const updateItem = (id: string, field: string, value: any) => {
    setMenuItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCategory: AdminCategory = {
      id: `cat-${Date.now()}`,
      name: newCategoryName,
      order: categories.length,
    };
    setCategories([...categories, newCategory]);
    setNewCategoryName("");
  };

  const updateCategoryName = (id: string, name: string) => {
    setCategories((cats) =>
      cats.map((cat) => (cat.id === id ? { ...cat, name } : cat))
    );
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter((cat) => cat.id !== id));
    setMenuItems((items) =>
      items.map((item) =>
        item.categoryId === id ? { ...item, categoryId: undefined } : item
      )
    );
  };

  const resetToDefaults = () => {
    setMenuItems(defaultAdminItems);
    setCategories(defaultAdminCategories);
  };

  if (loading) {
    return <div className="p-4">Chargement...</div>;
  }

  // Group items by category for preview
  const groupedItems = () => {
    const uncategorized = menuItems.filter((item) => !item.categoryId && item.visible);
    const categorized: Record<string, AdminMenuItem[]> = {};
    
    categories.forEach((cat) => {
      categorized[cat.id] = menuItems
        .filter((item) => item.categoryId === cat.id && item.visible)
        .sort((a, b) => a.order - b.order);
    });

    return { uncategorized, categorized };
  };

  const { uncategorized, categorized } = groupedItems();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuration du menu admin</h2>
        <p className="text-muted-foreground">
          Organisez et personnalisez le menu latéral de l'administration
        </p>
      </div>

      {/* Categories management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Catégories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
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
                      onUpdateName={updateCategoryName}
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
              {menuItems
                .sort((a, b) => a.order - b.order)
                .map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    categories={categories}
                    onUpdate={updateItem}
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
            {categories
              .sort((a, b) => a.order - b.order)
              .map((cat) => (
                <div key={cat.id} className="mb-4">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wider">
                    {cat.name}
                  </h4>
                  {categorized[cat.id]?.map((item) => {
                    const Icon = iconMap[item.icon] || Circle;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-sm"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            
            {uncategorized.length > 0 && (
              <div>
                {categories.length > 0 && (
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wider">
                    Autres
                  </h4>
                )}
                {uncategorized.map((item) => {
                  const Icon = iconMap[item.icon] || Circle;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-sm"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
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
