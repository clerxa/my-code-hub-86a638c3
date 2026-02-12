import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "../ImageUpload";
import { Plus, Trash2 } from "lucide-react";

interface DemoEditorProps {
  data: any;
  onChange: (data: any) => void;
}

export const DemoEditor = ({ data, onChange }: DemoEditorProps) => {
  const handleAddScreenshot = () => {
    const newScreenshots = [...(data?.screenshots || []), ""];
    onChange({ ...data, screenshots: newScreenshots });
  };

  const handleRemoveScreenshot = (index: number) => {
    const newScreenshots = data?.screenshots?.filter((_: any, i: number) => i !== index);
    onChange({ ...data, screenshots: newScreenshots });
  };

  const handleScreenshotChange = (index: number, url: string) => {
    const newScreenshots = [...(data?.screenshots || [])];
    newScreenshots[index] = url;
    onChange({ ...data, screenshots: newScreenshots });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Section Démonstration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Titre</Label>
          <Input
            value={data?.title || ""}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            placeholder="Ex: Découvrez FinCare en action"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            value={data?.description || ""}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            placeholder="Ex: Une plateforme intuitive et complète"
          />
        </div>

        <div className="space-y-2">
          <Label>Layout</Label>
          <Select
            value={data?.layout || "2-columns"}
            onValueChange={(value) => onChange({ ...data, layout: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir un layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2-columns">2 colonnes</SelectItem>
              <SelectItem value="carousel">Carousel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Captures d'écran</Label>
            <Button
              type="button"
              size="sm"
              onClick={handleAddScreenshot}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>

          {data?.screenshots?.map((screenshot: string, index: number) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1">
                <ImageUpload
                  value={screenshot}
                  onChange={(url) => handleScreenshotChange(index, url)}
                  label={`Capture ${index + 1}`}
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => handleRemoveScreenshot(index)}
                className="mt-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {(!data?.screenshots || data?.screenshots?.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune capture d'écran. Cliquez sur "Ajouter" pour commencer.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
