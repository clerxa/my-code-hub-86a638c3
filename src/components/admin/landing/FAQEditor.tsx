import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

interface FAQEditorProps {
  data: any[];
  onChange: (data: any[]) => void;
}

export const FAQEditor = ({ data, onChange }: FAQEditorProps) => {
  const handleAdd = () => {
    onChange([
      ...data,
      {
        question: "Nouvelle question ?",
        answer: "Réponse"
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
        <h3 className="text-lg font-semibold">Questions fréquentes</h3>
        <Button type="button" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {data.map((item, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Question {index + 1}</CardTitle>
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
              <Label>Question</Label>
              <Input
                value={item.question}
                onChange={(e) => handleChange(index, "question", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Réponse</Label>
              <Textarea
                value={item.answer}
                onChange={(e) => handleChange(index, "answer", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};