import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export type ParcoursFilterValue = "all" | "not_started" | "in_progress" | "completed";

interface ParcoursFilterProps {
  value: ParcoursFilterValue;
  onChange: (value: ParcoursFilterValue) => void;
}

export const ParcoursFilter = ({ value, onChange }: ParcoursFilterProps) => {
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={(v) => onChange(v as ParcoursFilterValue)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrer par statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les parcours</SelectItem>
          <SelectItem value="not_started">Non commencé</SelectItem>
          <SelectItem value="in_progress">En cours</SelectItem>
          <SelectItem value="completed">Terminé</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export const filterParcours = <T extends { moduleIds?: number[] }>(
  parcoursList: T[],
  filter: ParcoursFilterValue,
  completedModules: number[]
): T[] => {
  if (filter === "all") return parcoursList;

  return parcoursList.filter((p) => {
    const moduleIds = p.moduleIds || [];
    if (moduleIds.length === 0) {
      return filter === "not_started";
    }

    const completedInParcours = moduleIds.filter((id) => completedModules.includes(id)).length;

    if (completedInParcours === 0) {
      return filter === "not_started";
    } else if (completedInParcours === moduleIds.length) {
      return filter === "completed";
    } else {
      return filter === "in_progress";
    }
  });
};
