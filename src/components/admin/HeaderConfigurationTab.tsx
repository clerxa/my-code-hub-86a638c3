import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";
import {
  GripVertical, Plus, Trash2, Save, Eye, EyeOff,
  LogOut, Users, Shield, Building2, Handshake, UserPlus, FlaskConical, Bell,
  Home, Settings, Calendar, Video, MessageSquare, Star, Heart, Bookmark,
  type LucideIcon
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

const iconMap: Record<string, LucideIcon> = {
  LogOut, Users, Shield, Building2, Handshake, UserPlus, FlaskConical, Bell,
  Home, Settings, Calendar, Video, MessageSquare, Star, Heart, Bookmark,
};

const iconOptions = Object.keys(iconMap);

interface HeaderButton {
  id: string;
  label: string;
  icon: string;
  url: string;
  visible: boolean;
  order: number;
  variant: "default" | "outline" | "ghost" | "destructive";
  requiresAuth: boolean;
  requiresAdmin: boolean;
  requiresCompany: boolean;
  dataCoach?: string;
}

const defaultButtons: HeaderButton[] = [
  { id: "notifications", label: "Notifications", icon: "Bell", url: "", visible: true, order: 0, variant: "ghost", requiresAuth: true, requiresAdmin: false, requiresCompany: false, dataCoach: "" },
  { id: "invite-colleague", label: "Inviter un collègue", icon: "UserPlus", url: "", visible: true, order: 1, variant: "default", requiresAuth: true, requiresAdmin: false, requiresCompany: true, dataCoach: "" },
  { id: "admin", label: "Accès Backoffice", icon: "Shield", url: "/admin", visible: true, order: 2, variant: "default", requiresAuth: true, requiresAdmin: true, requiresCompany: false, dataCoach: "" },
  { id: "company", label: "Espace Entreprise", icon: "Building2", url: "/company", visible: true, order: 3, variant: "default", requiresAuth: true, requiresAdmin: false, requiresCompany: true, dataCoach: "" },
  { id: "partnership", label: "Proposer un partenariat", icon: "Handshake", url: "", visible: true, order: 4, variant: "outline", requiresAuth: true, requiresAdmin: false, requiresCompany: false, dataCoach: "" },
  { id: "forum", label: "Communauté", icon: "Users", url: "/forum", visible: true, order: 5, variant: "outline", requiresAuth: true, requiresAdmin: false, requiresCompany: false, dataCoach: "forum" },
  { id: "logout", label: "Se déconnecter", icon: "LogOut", url: "", visible: true, order: 6, variant: "outline", requiresAuth: true, requiresAdmin: false, requiresCompany: false, dataCoach: "" },
];

interface SortableButtonProps {
  button: HeaderButton;
  onUpdate: (id: string, field: keyof HeaderButton, value: any) => void;
  onDelete: (id: string) => void;
}

const SortableButton = ({ button, onUpdate, onDelete }: SortableButtonProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: button.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconComponent = iconMap[button.icon] || Users;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-3 p-4 bg-card border rounded-lg mb-3"
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        
        <Input
          value={button.label}
          onChange={(e) => onUpdate(button.id, "label", e.target.value)}
          className="flex-1"
          placeholder="Label"
        />
        
        <Select
          value={button.icon}
          onValueChange={(value) => onUpdate(button.id, "icon", value)}
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
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onUpdate(button.id, "visible", !button.visible)}
          title={button.visible ? "Masquer" : "Afficher"}
        >
          {button.visible ? (
            <Eye className="h-4 w-4 text-green-500" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        
        <Button variant="ghost" size="icon" onClick={() => onDelete(button.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-7">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">URL de redirection</Label>
          <Input
            value={button.url}
            onChange={(e) => onUpdate(button.id, "url", e.target.value)}
            placeholder="/page"
            className="h-8 text-sm"
          />
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Variante</Label>
          <Select
            value={button.variant}
            onValueChange={(value) => onUpdate(button.id, "variant", value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="ghost">Ghost</SelectItem>
              <SelectItem value="destructive">Destructive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">data-coach</Label>
          <Input
            value={button.dataCoach || ""}
            onChange={(e) => onUpdate(button.id, "dataCoach", e.target.value)}
            placeholder="selector"
            className="h-8 text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Conditions</Label>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-1 text-xs">
              <Switch
                checked={button.requiresAdmin}
                onCheckedChange={(checked) => onUpdate(button.id, "requiresAdmin", checked)}
                className="scale-75"
              />
              Admin
            </label>
            <label className="flex items-center gap-1 text-xs">
              <Switch
                checked={button.requiresCompany}
                onCheckedChange={(checked) => onUpdate(button.id, "requiresCompany", checked)}
                className="scale-75"
              />
              Entreprise
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export function HeaderConfigurationTab() {
  const [buttons, setButtons] = useState<HeaderButton[]>([]);
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
      .eq("sidebar_type", "header")
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error loading header configuration:", error);
    }

    if (data?.menu_items) {
      setButtons(data.menu_items as unknown as HeaderButton[]);
    } else {
      setButtons(defaultButtons);
    }
    setLoading(false);
  };

  const saveConfiguration = async () => {
    const orderedButtons = buttons.map((btn, index) => ({ ...btn, order: index }));
    
    try {
      // Use upsert to handle both insert and update in one call
      const { error } = await supabase
        .from("sidebar_configurations")
        .upsert({
          sidebar_type: "header",
          menu_items: orderedButtons as unknown as Json,
          categories: [] as unknown as Json,
        }, {
          onConflict: "sidebar_type",
        });

      if (error) {
        console.error("Save error:", error);
        toast.error(`Erreur: ${error.message}`);
      } else {
        toast.success("Configuration du header sauvegardée");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Erreur inattendue lors de la sauvegarde");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setButtons((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateButton = (id: string, field: keyof HeaderButton, value: any) => {
    setButtons((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const deleteButton = (id: string) => {
    setButtons((items) => items.filter((item) => item.id !== id));
  };

  const addButton = () => {
    const newButton: HeaderButton = {
      id: `btn-${Date.now()}`,
      label: "Nouveau bouton",
      icon: "Star",
      url: "/",
      visible: true,
      order: buttons.length,
      variant: "outline",
      requiresAuth: true,
      requiresAdmin: false,
      requiresCompany: false,
      dataCoach: "",
    };
    setButtons([...buttons, newButton]);
  };

  const resetToDefaults = () => {
    setButtons(defaultButtons);
    toast.info("Configuration réinitialisée (non sauvegardée)");
  };

  if (loading) {
    return <div className="p-4 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Boutons du Header</CardTitle>
          <CardDescription>
            Configurez les boutons affichés dans le header. L'ordre de haut en bas correspond à l'ordre d'affichage de gauche à droite.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={buttons.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {buttons.map((button) => (
                <SortableButton
                  key={button.id}
                  button={button}
                  onUpdate={updateButton}
                  onDelete={deleteButton}
                />
              ))}
            </SortableContext>
          </DndContext>
          
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={addButton} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un bouton
            </Button>
            <Button onClick={resetToDefaults} variant="ghost">
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aperçu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-background border rounded-lg p-4">
            <div className="flex items-center justify-end gap-2 flex-wrap">
              {buttons
                .filter((b) => b.visible)
                .sort((a, b) => a.order - b.order)
                .map((button) => {
                  const Icon = iconMap[button.icon] || Users;
                  return (
                    <Button
                      key={button.id}
                      variant={button.variant}
                      size="sm"
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{button.label}</span>
                    </Button>
                  );
                })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveConfiguration} className="gap-2">
          <Save className="h-4 w-4" />
          Sauvegarder
        </Button>
      </div>
    </div>
  );
}
