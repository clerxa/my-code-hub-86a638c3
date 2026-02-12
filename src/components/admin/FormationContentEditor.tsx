import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, MoveUp, MoveDown } from "lucide-react";

interface TextSection {
  type: "heading" | "subheading" | "paragraph" | "list" | "image";
  content: string;
  items?: string[];
  imageUrl?: string;
  imageAlt?: string;
}

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: "pdf" | "link" | "checklist" | "case-study";
  url: string;
}

interface ContentData {
  sections?: TextSection[];
  resources?: Resource[];
}

interface FormationContentEditorProps {
  contentType: string;
  contentData: ContentData;
  onChange: (contentData: ContentData) => void;
}

export const FormationContentEditor = ({
  contentType,
  contentData,
  onChange,
}: FormationContentEditorProps) => {
  const [activeTab, setActiveTab] = useState<"sections" | "resources">("sections");

  // Ensure contentData has the required structure
  const safeContentData: ContentData = {
    sections: contentData?.sections || [],
    resources: contentData?.resources || [],
  };

  const addSection = () => {
    const newSection: TextSection = {
      type: "paragraph",
      content: "",
    };
    onChange({
      ...safeContentData,
      sections: [...safeContentData.sections, newSection],
    });
  };

  const updateSection = (index: number, updates: Partial<TextSection>) => {
    const sections = [...safeContentData.sections];
    sections[index] = { ...sections[index], ...updates };
    onChange({ ...safeContentData, sections });
  };

  const removeSection = (index: number) => {
    const sections = safeContentData.sections.filter((_, i) => i !== index);
    onChange({ ...safeContentData, sections });
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const sections = [...safeContentData.sections];
    [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];
    onChange({ ...safeContentData, sections });
  };

  const moveSectionDown = (index: number) => {
    if (index === safeContentData.sections.length - 1) return;
    const sections = [...safeContentData.sections];
    [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
    onChange({ ...safeContentData, sections: sections });
  };

  const addResource = () => {
    const newResource: Resource = {
      id: crypto.randomUUID(),
      title: "",
      type: "link",
      url: "",
    };
    onChange({
      ...safeContentData,
      resources: [...safeContentData.resources, newResource],
    });
  };

  const updateResource = (index: number, updates: Partial<Resource>) => {
    const resources = [...safeContentData.resources];
    resources[index] = { ...resources[index], ...updates };
    onChange({ ...safeContentData, resources });
  };

  const removeResource = (index: number) => {
    const resources = safeContentData.resources.filter((_, i) => i !== index);
    onChange({ ...safeContentData, resources });
  };

  // Only show editor for text and mixed types
  if (contentType !== "text" && contentType !== "resources" && contentType !== "mixed") {
    return null;
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Contenu pédagogique</CardTitle>
        <div className="flex gap-2 mt-2">
          {(contentType === "text" || contentType === "mixed") && (
            <Button
              type="button"
              variant={activeTab === "sections" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("sections")}
            >
              Sections de texte
            </Button>
          )}
          {(contentType === "resources" || contentType === "mixed") && (
            <Button
              type="button"
              variant={activeTab === "resources" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("resources")}
            >
              Ressources
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTab === "sections" && (
          <div className="space-y-4">
            {safeContentData.sections.map((section, index) => (
              <Card key={index} className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <Select
                      value={section.type}
                      onValueChange={(value: any) => updateSection(index, { type: value })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="heading">Titre</SelectItem>
                        <SelectItem value="subheading">Sous-titre</SelectItem>
                        <SelectItem value="paragraph">Paragraphe</SelectItem>
                        <SelectItem value="list">Liste</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moveSectionUp(index)}
                        disabled={index === 0}
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moveSectionDown(index)}
                        disabled={index === safeContentData.sections.length - 1}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSection(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {section.type === "image" ? (
                    <>
                      <Input
                        placeholder="URL de l'image"
                        value={section.imageUrl || ""}
                        onChange={(e) => updateSection(index, { imageUrl: e.target.value })}
                      />
                      <Input
                        placeholder="Texte alternatif"
                        value={section.imageAlt || ""}
                        onChange={(e) => updateSection(index, { imageAlt: e.target.value })}
                      />
                    </>
                  ) : section.type === "list" ? (
                    <Textarea
                      placeholder="Un élément par ligne"
                      value={section.items?.join("\n") || ""}
                      onChange={(e) =>
                        updateSection(index, { items: e.target.value.split("\n").filter(Boolean) })
                      }
                      rows={4}
                    />
                  ) : (
                    <Textarea
                      placeholder="Contenu"
                      value={section.content}
                      onChange={(e) => updateSection(index, { content: e.target.value })}
                      rows={section.type === "paragraph" ? 4 : 2}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={addSection} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une section
            </Button>
          </div>
        )}

        {activeTab === "resources" && (
          <div className="space-y-4">
            {safeContentData.resources.map((resource, index) => (
              <Card key={resource.id} className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Ressource #{index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeResource(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <Label>Titre</Label>
                      <Input
                        value={resource.title}
                        onChange={(e) => updateResource(index, { title: e.target.value })}
                        placeholder="Nom de la ressource"
                      />
                    </div>

                    <div>
                      <Label>Type</Label>
                      <Select
                        value={resource.type}
                        onValueChange={(value: any) => updateResource(index, { type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="link">Lien externe</SelectItem>
                          <SelectItem value="checklist">Checklist</SelectItem>
                          <SelectItem value="case-study">Cas pratique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>URL</Label>
                      <Input
                        type="url"
                        value={resource.url}
                        onChange={(e) => updateResource(index, { url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <Label>Description (optionnel)</Label>
                      <Textarea
                        value={resource.description || ""}
                        onChange={(e) => updateResource(index, { description: e.target.value })}
                        placeholder="Courte description..."
                        rows={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={addResource} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une ressource
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
