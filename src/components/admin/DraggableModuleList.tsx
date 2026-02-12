import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Module {
  id: number;
  order_num: number;
  title: string;
  type: string;
  description: string;
  points: number;
  theme?: string[] | null;
}

interface DraggableModuleListProps {
  modules: Module[];
  onReorder: (modules: Module[]) => void;
  onEdit: (module: Module) => void;
  onDelete: (id: number) => void;
}

const SortableModuleItem = ({ module, onEdit, onDelete }: { module: Module; onEdit: (module: Module) => void; onDelete: (id: number) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium truncate">{module.title}</h4>
          <Badge variant="secondary" className="text-xs">{module.type}</Badge>
          <Badge variant="outline" className="text-xs">+{module.points} pts</Badge>
        </div>
        {module.theme && module.theme.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {module.theme.map((t, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(module)}>
          Modifier
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(module.id)}>
          Supprimer
        </Button>
      </div>
    </div>
  );
};

export const DraggableModuleList = ({ modules, onReorder, onEdit, onDelete }: DraggableModuleListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = modules.findIndex((m) => m.id === active.id);
      const newIndex = modules.findIndex((m) => m.id === over.id);

      const reorderedModules = arrayMove(modules, oldIndex, newIndex).map((module, index) => ({
        ...module,
        order_num: index + 1,
      }));

      onReorder(reorderedModules);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {modules.map((module) => (
            <SortableModuleItem
              key={module.id}
              module={module}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
