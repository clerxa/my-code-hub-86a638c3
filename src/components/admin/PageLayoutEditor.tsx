import { useState, useEffect } from "react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DraggableSection } from "@/components/DraggableSection";
import { useBlockLayoutConfig } from "@/hooks/useBlockLayoutConfig";
import { Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";

interface PageLayoutEditorProps {
  pageName: string;
  availableBlocks: { id: string; label: string }[];
}

export const PageLayoutEditor = ({ pageName, availableBlocks }: PageLayoutEditorProps) => {
  const { blocks, layoutConfig, loading, updateBlockOrder, updateBlockConfig } =
    useBlockLayoutConfig(pageName);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [localConfig, setLocalConfig] = useState<Record<string, any>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setLocalConfig(layoutConfig);
  }, [layoutConfig]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.indexOf(active.id as string);
      const newIndex = blocks.indexOf(over.id as string);
      const newOrder = arrayMove(blocks, oldIndex, newIndex);
      updateBlockOrder(newOrder);
    }
  };

  const handleSaveBlock = async (blockId: string) => {
    await updateBlockConfig(blockId, localConfig[blockId]);
    setEditingBlock(null);
  };

  const handleToggleVisibility = async (blockId: string) => {
    const currentVisibility = localConfig[blockId]?.visible ?? true;
    const newConfig = {
      ...localConfig,
      [blockId]: { ...localConfig[blockId], visible: !currentVisibility },
    };
    setLocalConfig(newConfig);
    await updateBlockConfig(blockId, { visible: !currentVisibility });
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Éditeur de page : {pageName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Glissez-déposez les blocs pour réorganiser la page. Cliquez sur un bloc pour le
            personnaliser.
          </p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {blocks.map((blockId) => {
                  const blockInfo = availableBlocks.find((b) => b.id === blockId);
                  const config = localConfig[blockId] || { visible: true };
                  const isEditing = editingBlock === blockId;

                  return (
                    <DraggableSection key={blockId} id={blockId} isAdmin={true}>
                      <Card className={!config.visible ? "opacity-50" : ""}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{blockInfo?.label || blockId}</h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleVisibility(blockId)}
                                >
                                  {config.visible ? (
                                    <Eye className="h-4 w-4" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>

                              {isEditing ? (
                                <div className="space-y-4">
                                  <div>
                                    <Label>Titre</Label>
                                    <Input
                                      value={config.title || ""}
                                      onChange={(e) =>
                                        setLocalConfig({
                                          ...localConfig,
                                          [blockId]: { ...config, title: e.target.value },
                                        })
                                      }
                                    />
                                  </div>

                                  <div>
                                    <Label>Description</Label>
                                    <Textarea
                                      value={config.description || ""}
                                      onChange={(e) =>
                                        setLocalConfig({
                                          ...localConfig,
                                          [blockId]: { ...config, description: e.target.value },
                                        })
                                      }
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleSaveBlock(blockId)}>
                                      <Save className="h-4 w-4 mr-2" />
                                      Enregistrer
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingBlock(null)}
                                    >
                                      Annuler
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  {config.title && (
                                    <p className="text-sm font-medium mb-1">{config.title}</p>
                                  )}
                                  {config.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {config.description}
                                    </p>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-2"
                                    onClick={() => setEditingBlock(blockId)}
                                  >
                                    Modifier
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </DraggableSection>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  );
};
