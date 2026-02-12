import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, RefreshCw, Info, Mail, MessageSquare, FileText, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const communicationTypes = [
  { value: "email", label: "Email", icon: Mail },
  { value: "intranet", label: "Article Intranet", icon: FileText },
  { value: "slack", label: "Message Slack", icon: MessageSquare },
  { value: "teams", label: "Message Teams", icon: MessageSquare },
];

const deadlines = [
  { value: "j-30", label: "J-30 (1 mois avant)" },
  { value: "j-14", label: "J-14 (2 semaines avant)" },
  { value: "j-7", label: "J-7 (1 semaine avant)" },
  { value: "j-3", label: "J-3 (3 jours avant)" },
  { value: "j-1", label: "J-1 (veille)" },
  { value: "jour-j", label: "Jour J (jour même)" },
  { value: "today", label: "Date du jour (calcul automatique)" },
];

const variablesInfo = [
  { variable: "${moduleTitle}", description: "Titre du webinar" },
  { variable: "${moduleDescription}", description: "Description du webinar" },
  { variable: "${webinarDate}", description: "Date et heure du webinar" },
  { variable: "${webinar_registration_url}", description: "Lien d'inscription au webinar" },
  { variable: "${companyName}", description: "Nom de l'entreprise" },
  { variable: "${partnershipType}", description: "Type de partenariat" },
  { variable: "${contactName}", description: "Nom du contact référent" },
  { variable: "${bookingUrl}", description: "Lien de prise de rendez-vous (selon rang entreprise)" },
  { variable: "${signature}", description: "Signature : Le/La [partenariat] de [entreprise]" },
  { variable: "${daysUntilWebinar}", description: "J-X calculé (pour date du jour)" },
  { variable: "${todayDate}", description: "Date du jour formatée" },
];

// Sample data for preview
const sampleVariables: Record<string, string> = {
  moduleTitle: "Optimisation fiscale 2025",
  moduleDescription: "Découvrez les meilleures stratégies pour optimiser votre fiscalité en 2025 avec nos experts.",
  webinarDate: "jeudi 30 janvier 2025 à 12h30",
  webinar_registration_url: "https://example.com/inscription-webinar",
  companyName: "Acme Corp",
  partnershipType: "CSE",
  contactName: "Marie Dupont, Responsable RH",
  bookingUrl: "https://example.com/rdv-expert",
  signature: "Le CSE de Acme Corp",
  daysUntilWebinar: "J-14",
  todayDate: "jeudi 16 janvier 2025",
  daysCount: "14",
  additionalInfo: "",
};

interface Template {
  id?: string;
  communication_type: string;
  deadline: string;
  template_content: string;
  is_active: boolean;
}

export const CommunicationTemplatesEditor = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedType, setSelectedType] = useState("email");
  const [selectedDeadline, setSelectedDeadline] = useState("j-14");
  const [currentContent, setCurrentContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    // Update current content when type or deadline changes
    const template = templates.find(
      t => t.communication_type === selectedType && t.deadline === selectedDeadline
    );
    if (template) {
      setCurrentContent(template.template_content);
    } else {
      // Load default template
      loadDefaultTemplate();
    }
  }, [selectedType, selectedDeadline, templates]);

  // Generate preview when content changes
  useEffect(() => {
    if (showPreview) {
      generatePreview();
    }
  }, [currentContent, showPreview]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("communication_templates")
        .select("*")
        .order("deadline");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Erreur lors du chargement des templates");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDefaultTemplate = async () => {
    try {
      const { getDefaultTemplate } = await import("@/lib/communicationTemplates");
      const defaultContent = getDefaultTemplate(selectedType, selectedDeadline);
      setCurrentContent(defaultContent);
    } catch {
      setCurrentContent("");
    }
  };

  const generatePreview = async () => {
    try {
      const { processTemplate } = await import("@/lib/communicationTemplates");
      const rendered = processTemplate(currentContent, sampleVariables);
      setPreviewContent(rendered);
    } catch (error) {
      console.error("Error generating preview:", error);
      setPreviewContent("<p>Erreur lors de la génération de l'aperçu</p>");
    }
  };

  const saveTemplate = async () => {
    setIsSaving(true);
    try {
      const existingTemplate = templates.find(
        t => t.communication_type === selectedType && t.deadline === selectedDeadline
      );

      if (existingTemplate?.id) {
        // Update existing
        const { error } = await supabase
          .from("communication_templates")
          .update({
            template_content: currentContent,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingTemplate.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("communication_templates")
          .insert({
            communication_type: selectedType,
            deadline: selectedDeadline,
            template_content: currentContent,
            is_active: true,
          });

        if (error) throw error;
      }

      toast.success("Template sauvegardé !");
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = async () => {
    await loadDefaultTemplate();
    toast.info("Template réinitialisé à la version par défaut");
  };

  const TypeIcon = communicationTypes.find(t => t.value === selectedType)?.icon || Mail;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Éditeur de Templates de Communication</CardTitle>
          <CardDescription>
            Personnalisez les textes pour chaque type de communication et chaque échéance.
            Les variables seront remplacées automatiquement lors de la génération.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Variables info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Variables disponibles :</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                {variablesInfo.map(v => (
                  <div key={v.variable} className="flex gap-2">
                    <code className="bg-muted px-1 rounded text-xs">{v.variable}</code>
                    <span className="text-muted-foreground">{v.description}</span>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>

          {/* Type selection */}
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="grid grid-cols-4 w-full">
              {communicationTypes.map(type => {
                const Icon = type.icon;
                return (
                  <TabsTrigger key={type.value} value={type.value} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{type.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {communicationTypes.map(type => (
              <TabsContent key={type.value} value={type.value} className="space-y-4 mt-4">
                {/* Deadline selection */}
                <div className="space-y-2">
                  <Label>Échéance</Label>
                  <Select value={selectedDeadline} onValueChange={setSelectedDeadline}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une échéance" />
                    </SelectTrigger>
                    <SelectContent>
                      {deadlines.map(d => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Editor and Preview */}
                <div className={`grid gap-4 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                  {/* Template editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Contenu du template</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        {showPreview ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Masquer l'aperçu
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Aperçu
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      value={currentContent}
                      onChange={(e) => setCurrentContent(e.target.value)}
                      placeholder="Écrivez votre template ici..."
                      className="min-h-[400px] font-mono text-sm"
                    />
                  </div>

                  {/* Preview panel */}
                  {showPreview && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Aperçu (avec données d'exemple)</Label>
                        <span className="text-xs text-muted-foreground">Mise à jour en temps réel</span>
                      </div>
                      <Card className="min-h-[400px] overflow-auto">
                        <CardContent className="p-4">
                          <div 
                            className="prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: previewContent }}
                          />
                        </CardContent>
                      </Card>
                      <p className="text-xs text-muted-foreground">
                        Données d'exemple : {sampleVariables.companyName} • {sampleVariables.moduleTitle} • {sampleVariables.webinarDate}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button onClick={saveTemplate} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>
                  <Button variant="outline" onClick={resetToDefault}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Réinitialiser
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
