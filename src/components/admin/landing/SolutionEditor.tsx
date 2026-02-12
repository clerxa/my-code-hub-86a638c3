import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface SolutionEditorProps {
  data: any;
  onChange: (data: any) => void;
}

const iconOptions = [
  "Video", "Calculator", "Brain", "UserCheck", "BookOpen", "Users",
  "Sparkles", "Check", "Target", "Trophy", "Award", "Star"
];

export const SolutionEditor = ({ data, onChange }: SolutionEditorProps) => {
  const handlePillarAdd = () => {
    onChange({
      ...data,
      pillars: [
        ...(data.pillars || []),
        {
          title: "Nouveau pilier",
          description: "Description",
          icon: "Check"
        }
      ]
    });
  };

  const handlePillarRemove = (index: number) => {
    onChange({
      ...data,
      pillars: data.pillars.filter((_: any, i: number) => i !== index)
    });
  };

  const handlePillarChange = (index: number, field: string, value: any) => {
    const newPillars = [...data.pillars];
    newPillars[index] = { ...newPillars[index], [field]: value };
    onChange({ ...data, pillars: newPillars });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Titre</Label>
        <Input
          value={data?.title || ""}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={data?.description || ""}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Piliers de la solution</Label>
          <Button type="button" size="sm" onClick={handlePillarAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {data?.pillars?.map((pillar: any, index: number) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Pilier {index + 1}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handlePillarRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={pillar.title}
                  onChange={(e) => handlePillarChange(index, "title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={pillar.description}
                  onChange={(e) => handlePillarChange(index, "description", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Icône</Label>
                <Select
                  value={pillar.icon}
                  onValueChange={(value) => handlePillarChange(index, "icon", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((icon) => {
                      const Icon = (LucideIcons as any)[icon];
                      return (
                        <SelectItem key={icon} value={icon}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {icon}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};