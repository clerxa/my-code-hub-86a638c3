import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GripVertical, Save, Settings, AlertCircle, CheckCircle2 } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface RequiredField {
  id: string;
  field_key: string;
  field_label: string;
  is_required: boolean;
  display_order: number;
}

interface SortableRowProps {
  field: RequiredField;
  onToggle: (id: string, checked: boolean) => void;
  onLabelChange: (id: string, label: string) => void;
}

function SortableRow({ field, onToggle, onLabelChange }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? "bg-muted" : ""}>
      <TableCell className="w-10">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
          {field.field_key}
        </code>
      </TableCell>
      <TableCell>
        <Input
          value={field.field_label}
          onChange={(e) => onLabelChange(field.id, e.target.value)}
          className="max-w-[250px]"
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={field.is_required}
            onCheckedChange={(checked) => onToggle(field.id, checked)}
          />
          <Badge variant={field.is_required ? "default" : "secondary"}>
            {field.is_required ? "Requis" : "Optionnel"}
          </Badge>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function FinancialProfileProgressConfigTab() {
  const queryClient = useQueryClient();
  const [localFields, setLocalFields] = useState<RequiredField[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: fields, isLoading } = useQuery({
    queryKey: ['financial-profile-required-fields'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_profile_required_fields')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as RequiredField[];
    },
  });

  // Update local fields when server data changes (only if no local changes)
  if (fields && localFields.length === 0 && !hasChanges) {
    setLocalFields(fields);
  }

  const saveMutation = useMutation({
    mutationFn: async (updatedFields: RequiredField[]) => {
      // Update each field
      for (let i = 0; i < updatedFields.length; i++) {
        const field = updatedFields[i];
        const { error } = await supabase
          .from('financial_profile_required_fields')
          .update({
            field_label: field.field_label,
            is_required: field.is_required,
            display_order: i + 1
          })
          .eq('id', field.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-profile-required-fields'] });
      toast.success("Configuration enregistrée avec succès");
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('Error saving config:', error);
      toast.error("Erreur lors de l'enregistrement");
    }
  });

  const handleToggle = (id: string, checked: boolean) => {
    setLocalFields(prev => 
      prev.map(f => f.id === id ? { ...f, is_required: checked } : f)
    );
    setHasChanges(true);
  };

  const handleLabelChange = (id: string, label: string) => {
    setLocalFields(prev => 
      prev.map(f => f.id === id ? { ...f, field_label: label } : f)
    );
    setHasChanges(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalFields((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    saveMutation.mutate(localFields);
  };

  const requiredCount = localFields.filter(f => f.is_required).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration de la barre de progression
              </CardTitle>
              <CardDescription>
                Définissez quels champs sont requis pour calculer le pourcentage de complétion du profil financier
              </CardDescription>
            </div>
            {hasChanges && (
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{requiredCount}</p>
                    <p className="text-xs text-muted-foreground">Champs requis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-amber-500/10">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{localFields.length - requiredCount}</p>
                    <p className="text-xs text-muted-foreground">Champs optionnels</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-500/10">
                    <Settings className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{requiredCount > 0 ? Math.round(100 / requiredCount) : 0}%</p>
                    <p className="text-xs text-muted-foreground">Par champ requis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Comment ça marche :</strong> Chaque champ marqué comme "Requis" contribue équitablement au pourcentage de complétion. 
              Par exemple, avec {requiredCount} champs requis, chaque champ vaut {requiredCount > 0 ? Math.round(100 / requiredCount) : 0}% de progression.
              Les champs "Optionnels" n'affectent pas la barre de progression.
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Clé technique</TableHead>
                    <TableHead>Libellé affiché</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={localFields.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {localFields.map((field) => (
                      <SortableRow
                        key={field.id}
                        field={field}
                        onToggle={handleToggle}
                        onLabelChange={handleLabelChange}
                      />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
