import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface ComparisonEditorProps {
  data: any;
  onChange: (data: any) => void;
}

export const ComparisonEditor = ({ data, onChange }: ComparisonEditorProps) => {
  const addRow = () => {
    onChange({
      ...data,
      rows: [...(data.rows || []), {
        feature: "Nouvelle fonctionnalité",
        without: "Sans FinCare",
        with: "Avec FinCare"
      }]
    });
  };

  const updateRow = (index: number, field: string, value: string) => {
    const newRows = [...(data.rows || [])];
    newRows[index] = { ...newRows[index], [field]: value };
    onChange({ ...data, rows: newRows });
  };

  const removeRow = (index: number) => {
    onChange({
      ...data,
      rows: data.rows.filter((_: any, i: number) => i !== index)
    });
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

      <div className="flex items-center space-x-2">
        <Switch
          checked={data?.enabled !== false}
          onCheckedChange={(checked) => onChange({ ...data, enabled: checked })}
        />
        <Label>Afficher cette section</Label>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Lignes du tableau comparatif</Label>
          <Button type="button" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une ligne
          </Button>
        </div>

        {data?.rows?.map((row: any, index: number) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Ligne {index + 1}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRow(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fonctionnalité</Label>
                <Input
                  value={row.feature}
                  onChange={(e) => updateRow(index, "feature", e.target.value)}
                  placeholder="Ex: Compréhension de la paie"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sans FinCare</Label>
                  <Input
                    value={row.without}
                    onChange={(e) => updateRow(index, "without", e.target.value)}
                    placeholder="Ex: ❌ Complexe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Avec FinCare</Label>
                  <Input
                    value={row.with}
                    onChange={(e) => updateRow(index, "with", e.target.value)}
                    placeholder="Ex: ✅ Simple et clair"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
