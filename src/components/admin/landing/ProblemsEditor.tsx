import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";

interface ProblemsEditorProps {
  data: any[];
  onChange: (data: any[]) => void;
}

const iconOptions = [
  "FileQuestion", "AlertCircle", "Eye", "ShieldAlert", "TrendingDown",
  "Ban", "AlertTriangle", "XCircle", "Frown", "HelpCircle"
];

export const ProblemsEditor = ({ data, onChange }: ProblemsEditorProps) => {
  const handleAdd = () => {
    onChange([
      ...data,
      {
        title: "Nouveau problème",
        description: "Description du problème",
        icon: "AlertCircle"
      }
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: string, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onChange(newData);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Problèmes des collaborateurs</h3>
        <Button type="button" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {data.map((problem, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Problème {index + 1}</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input
                value={problem.title}
                onChange={(e) => handleChange(index, "title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={problem.description}
                onChange={(e) => handleChange(index, "description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Icône</Label>
              <Select
                value={problem.icon}
                onValueChange={(value) => handleChange(index, "icon", value)}
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

            <ImageUpload
              label="Image illustrative (optionnelle)"
              value={problem.image || ""}
              onChange={(url) => handleChange(index, "image", url)}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};