import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, Calculator } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { SlideEditor } from "./slides/SlideEditor";
import { SlideTemplateSelector } from "./slides/SlideTemplateSelector";
import { QuizEditor } from "./QuizEditor";
import { FormationContentEditor } from "./FormationContentEditor";

import { WebinarCompanyAssignment } from "./WebinarCompanyAssignment";
import { WebinarSessionsManager } from "./WebinarSessionsManager";
import { WebinarCatalogPicker } from "./WebinarCatalogPicker";
import { WebinarVisualGenerator } from "./WebinarVisualGenerator";
import { LivestormPublishButton } from "./LivestormPublishButton";
import { ModulePreviewDialog } from "./ModulePreviewDialog";
import { SlidesData, SLIDE_TEMPLATES, applyTemplate } from "@/types/slides";

interface QuizAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  title: string;
  description?: string;
  points?: number; // Deprecated: points are now managed globally
  type: "single" | "multiple";
  answers: QuizAnswer[];
}

interface Simulator {
  id: string;
  name: string;
  slug: string;
  route: string;
  is_active: boolean;
}

interface Module {
  id: number;
  order_num: number;
  title: string;
  type: string;
  description: string;
  points: number;
  content_url?: string;
  webinar_image_url?: string;
  quiz_questions?: any[];
  appointment_calendar_url?: string;
  content_type?: string;
  embed_code?: string;
  content_data?: any;
  pedagogical_objectives?: string[];
  estimated_time?: number;
  difficulty_level?: number;
  key_takeaways?: string[];
  theme?: string[] | null;
  is_optional?: boolean;
}

// Helper to convert datetime-local value to ISO with timezone
const toISOWithTimezone = (localDatetime: string): string | null => {
  if (!localDatetime) return null;
  const date = new Date(localDatetime);
  return date.toISOString();
};

// Helper to convert ISO/UTC datetime to datetime-local format for input
const toDatetimeLocal = (isoString: string | null | undefined): string => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const availableThemes = [
  "Les bases financières",
  "Fiscalité personnelle",
  "Optimisation fiscale",
  "Épargne salariale",
  "Enveloppes d'investissement",
  "Bourse",
  "Immobilier",
  "Vie familiale",
  "Retraite",
  "Assurances",
  "Stratégie patrimoniale",
  "Entrepreneurs",
  "Réglementation",
  "Thèmes avancés cadres supérieurs"
];

export const ModuleEditorPage = () => {
  const navigate = useNavigate();
  const { moduleId } = useParams<{ moduleId: string }>();
  const isEditing = moduleId && moduleId !== 'new';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [simulators, setSimulators] = useState<Simulator[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    type: "guide",
    description: "",
    points: 0,
    content_url: "",
    webinar_image_url: "",
    quiz_questions: [] as QuizQuestion[],
    appointment_calendar_url: "",
    content_type: "mixed" as "video" | "slides" | "text" | "resources" | "mixed",
    embed_code: "",
    content_data: {} as any,
    pedagogical_objectives: [] as string[],
    estimated_time: 15,
    difficulty_level: 1,
    key_takeaways: [] as string[],
    video_url: "",
    video_embed: "",
    themes: [] as string[],
    simulator_id: "",
    is_optional: false,
    webinar_category: "a_la_demande" as string,
    assigned_companies: [] as string[],
    slides_data: { slides: [], transition: 'fade' } as SlidesData,
    catalog_id: null as string | null,
    webinar_source: "new" as "catalog" | "new",
    livestorm_event_id: null as string | null,
  });

  // Fetch module data if editing
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch simulators
      const { data: simData } = await supabase
        .from('simulators')
        .select('id, name, slug, route, is_active')
        .eq('is_active', true)
        .order('name');
      if (simData) setSimulators(simData);
      
      // Fetch all modules for order calculation
      const { data: modulesData } = await supabase
        .from('modules')
        .select('*')
        .order('order_num');
      if (modulesData) setModules(modulesData as unknown as Module[]);
      
      // Fetch specific module if editing
      if (isEditing && moduleId) {
        const { data: module, error } = await supabase
          .from('modules')
          .select('*')
          .eq('id', parseInt(moduleId))
          .single();
        
        if (error) {
          toast.error("Erreur lors du chargement du module");
          navigate('/admin/modules');
          return;
        }
        
        if (module) {
          // Convert quiz format if needed
          let convertedQuestions: QuizQuestion[] = [];
          if (module.quiz_questions && Array.isArray(module.quiz_questions)) {
            convertedQuestions = module.quiz_questions.map((q: any, index: number) => {
              if (q.id && q.title && q.answers && typeof q.answers[0] === 'object') {
                return q as QuizQuestion;
              }
              return {
                id: q.id || crypto.randomUUID(),
                title: q.question || `Question ${index + 1}`,
                description: "",
                points: 10,
                type: q.multipleChoice ? "multiple" as const : "single" as const,
                answers: (q.answers || []).map((text: string, i: number) => ({
                  id: crypto.randomUUID(),
                  text,
                  isCorrect: (q.correctAnswers || []).includes(i)
                }))
              };
            });
          }
          
          const contentData = module.content_data as Record<string, any> || {};
          
          setFormData({
            title: module.title,
            type: module.type,
            description: module.description,
            points: module.points,
            content_url: module.content_url || "",
            webinar_image_url: module.webinar_image_url || "",
            quiz_questions: convertedQuestions,
            appointment_calendar_url: module.appointment_calendar_url || "",
            content_type: (module.content_type as any) || "mixed",
            embed_code: module.embed_code || "",
            content_data: contentData,
            pedagogical_objectives: module.pedagogical_objectives || [],
            estimated_time: module.estimated_time || 15,
            difficulty_level: module.difficulty_level || 1,
            key_takeaways: module.key_takeaways || [],
            video_url: module.type === "video" ? (module.content_url || "") : "",
            video_embed: module.type === "video" ? (module.embed_code || "") : "",
            themes: module.theme || [],
            simulator_id: contentData.simulator_id || "",
            is_optional: module.is_optional || false,
            webinar_category: (module as any).webinar_category || "a_la_demande",
            assigned_companies: [],
            slides_data: contentData.slides_data || { slides: [], transition: 'fade' },
            catalog_id: (module as any).catalog_id || null,
            webinar_source: (module as any).catalog_id ? "catalog" : "new",
          });
        }
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [moduleId, isEditing, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Calculate order_num for new modules
      let orderNum = 0;
      if (!isEditing) {
        const maxOrderNum = modules.reduce((max, m) => Math.max(max, m.order_num), -1);
        orderNum = maxOrderNum + 1;
      }
      
      // Points are now managed globally via Points & Validation settings
      // Quiz points come from points_configuration.quiz_completion
      const dataToSave = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        points: formData.points, // Keep for legacy, but not used for quiz
        order_num: isEditing ? undefined : orderNum,
        content_url: formData.type === "video" ? (formData.video_url || null) : (formData.content_url || null),
        webinar_image_url: formData.webinar_image_url || null,
        appointment_calendar_url: formData.appointment_calendar_url || null,
        embed_code: formData.type === "video" ? (formData.video_embed || null) : (formData.embed_code || null),
        quiz_questions: formData.quiz_questions as any,
        content_data: formData.type === "guide" 
          ? { ...formData.content_data, slides_data: formData.slides_data }
          : formData.content_data || null,
        content_type: formData.content_type || null,
        estimated_time: formData.estimated_time || null,
        difficulty_level: formData.difficulty_level || 1,
        pedagogical_objectives: formData.pedagogical_objectives.length > 0 ? formData.pedagogical_objectives : null,
        key_takeaways: formData.key_takeaways.length > 0 ? formData.key_takeaways : null,
        theme: formData.themes.length > 0 ? formData.themes : null,
        is_optional: formData.is_optional,
        webinar_category: formData.type === "webinar" ? formData.webinar_category : null,
        catalog_id: formData.type === "webinar" ? formData.catalog_id : null,
      };

      if (isEditing && moduleId) {
        const { error } = await supabase
          .from("modules")
          .update(dataToSave)
          .eq("id", parseInt(moduleId));
        if (error) throw error;
        toast.success("Module mis à jour");
      } else {
        const { error } = await supabase
          .from("modules")
          .insert([dataToSave]);
        if (error) throw error;
        toast.success("Module créé");
      }
      
      navigate('/admin/modules');
    } catch (error: any) {
      console.error("Error saving module:", error);
      toast.error("Erreur lors de l'enregistrement: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = SLIDE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      const newSlides = applyTemplate(template);
      const existingSlides = formData.slides_data.slides || [];
      setFormData({
        ...formData,
        slides_data: {
          ...formData.slides_data,
          slides: [...existingSlides, ...newSlides]
        }
      });
      toast.success(`Template "${template.name}" ajouté`);
    }
  };

  // Build preview module object
  const previewModule: Module | null = {
    id: isEditing && moduleId ? parseInt(moduleId) : 0,
    order_num: 0,
    title: formData.title,
    type: formData.type,
    description: formData.description,
    points: formData.points,
    content_url: formData.content_url,
    webinar_image_url: formData.webinar_image_url,
    quiz_questions: formData.quiz_questions,
    appointment_calendar_url: formData.appointment_calendar_url,
    content_type: formData.content_type,
    embed_code: formData.embed_code,
    content_data: formData.type === "guide" 
      ? { ...formData.content_data, slides_data: formData.slides_data }
      : formData.content_data,
    pedagogical_objectives: formData.pedagogical_objectives,
    estimated_time: formData.estimated_time,
    difficulty_level: formData.difficulty_level,
    key_takeaways: formData.key_takeaways
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin/modules')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">
                  {isEditing ? "Modifier le module" : "Nouveau module"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {formData.title || "Sans titre"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setPreviewOpen(true)}
                disabled={!formData.title}
              >
                <Eye className="h-4 w-4 mr-2" />
                Prévisualiser
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Enregistrement..." : isEditing ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Base info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type de module</Label>
                  <Select value={formData.type} onValueChange={value => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guide">Guide / Formation</SelectItem>
                      <SelectItem value="webinar">Webinaire</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="meeting">Rendez-vous</SelectItem>
                      <SelectItem value="video">Vidéo</SelectItem>
                      <SelectItem value="simulator">Simulateur</SelectItem>
                      <SelectItem value="financial_profile">Profil Financier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_time">Durée estimée (minutes)</Label>
                  <Input 
                    id="estimated_time" 
                    type="number" 
                    value={formData.estimated_time} 
                    onChange={e => setFormData({ ...formData, estimated_time: parseInt(e.target.value) || 15 })} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  required 
                  placeholder="Titre du module"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <RichTextEditor 
                  value={formData.description} 
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Description du module..."
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="is_optional" className="text-base">Module optionnel</Label>
                  <p className="text-sm text-muted-foreground">
                    Les modules optionnels ne bloquent pas la progression
                  </p>
                </div>
                <Switch
                  id="is_optional"
                  checked={formData.is_optional}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_optional: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Themes section removed - webinar catalog replaces theme selection */}

          {/* Type-specific content */}
          {formData.type === "guide" && (
            <Card className="overflow-visible">
              <CardHeader>
                <CardTitle>Contenu du guide</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="slides" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="slides">📑 Slides interactives</TabsTrigger>
                    <TabsTrigger value="embed">🔗 Embed externe</TabsTrigger>
                    <TabsTrigger value="settings">⚙️ Paramètres</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="slides" className="mt-0 space-y-4">
                    {/* Templates */}
                    <SlideTemplateSelector onSelect={handleApplyTemplate} />
                    
                    {/* Slide Editor */}
                    <SlideEditor
                      slidesData={formData.slides_data}
                      onChange={(slidesData) => setFormData({ 
                        ...formData, 
                        slides_data: slidesData,
                        content_data: { ...formData.content_data, slides_data: slidesData }
                      })}
                    />
                  </TabsContent>
                  
                  <TabsContent value="embed" className="mt-0 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="content_url">URL du guide (optionnel)</Label>
                      <Input 
                        id="content_url" 
                        type="url" 
                        value={formData.content_url} 
                        onChange={e => setFormData({ ...formData, content_url: e.target.value })} 
                        placeholder="https://..." 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content_type">Type de contenu externe</Label>
                      <Select 
                        value={formData.content_type} 
                        onValueChange={(value: any) => setFormData({ ...formData, content_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Vidéo</SelectItem>
                          <SelectItem value="slides">Slides externe (Google, Canva...)</SelectItem>
                          <SelectItem value="text">Texte pédagogique</SelectItem>
                          <SelectItem value="resources">Ressources</SelectItem>
                          <SelectItem value="mixed">Mixte (plusieurs formats)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="embed_code">Code d'intégration (iframe)</Label>
                      <Textarea 
                        id="embed_code" 
                        value={formData.embed_code} 
                        onChange={e => setFormData({ ...formData, embed_code: e.target.value })} 
                        placeholder="<iframe src='...'></iframe> ou URL directe"
                        rows={4}
                      />
                    </div>

                    <FormationContentEditor
                      contentType={formData.content_type}
                      contentData={formData.content_data}
                      onChange={(contentData) => setFormData({ ...formData, content_data: contentData })}
                    />
                  </TabsContent>
                  
                  <TabsContent value="settings" className="mt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="difficulty_level">Niveau de difficulté</Label>
                        <Select 
                          value={String(formData.difficulty_level)} 
                          onValueChange={value => setFormData({ ...formData, difficulty_level: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">⭐ Débutant</SelectItem>
                            <SelectItem value="2">⭐⭐ Intermédiaire</SelectItem>
                            <SelectItem value="3">⭐⭐⭐ Avancé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pedagogical_objectives">Objectifs pédagogiques (un par ligne)</Label>
                      <Textarea 
                        id="pedagogical_objectives" 
                        value={formData.pedagogical_objectives.join('\n')} 
                        onChange={e => setFormData({ 
                          ...formData, 
                          pedagogical_objectives: e.target.value.split('\n').filter(Boolean) 
                        })} 
                        placeholder="Comprendre les bases de...&#10;Savoir calculer...&#10;Maîtriser l'outil..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="key_takeaways">Points clés à retenir (un par ligne)</Label>
                      <Textarea 
                        id="key_takeaways" 
                        value={formData.key_takeaways.join('\n')} 
                        onChange={e => setFormData({ 
                          ...formData, 
                          key_takeaways: e.target.value.split('\n').filter(Boolean) 
                        })} 
                        placeholder="Point clé 1&#10;Point clé 2&#10;Point clé 3"
                        rows={4}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {formData.type === "webinar" && (
            <Card>
              <CardHeader>
                <CardTitle>Configuration du webinaire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Catalog picker */}
                <WebinarCatalogPicker
                  selectedCatalogId={formData.catalog_id}
                  onSelectCatalog={(item) => {
                    setFormData({
                      ...formData,
                      catalog_id: item.id,
                      webinar_source: "catalog",
                      title: item.name,
                      description: item.description,
                      estimated_time: item.duration_minutes,
                      webinar_category: item.category,
                    });
                  }}
                  onSelectNew={() => {
                    setFormData({
                      ...formData,
                      catalog_id: null,
                      webinar_source: "new",
                    });
                  }}
                />

                {/* Category (editable for hors catalogue) */}
                {formData.webinar_source === "new" && (
                  <div className="space-y-2">
                    <Label>Catégorie du webinaire</Label>
                    <Select value={formData.webinar_category} onValueChange={value => setFormData({ ...formData, webinar_category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parcours_fincare">📋 Parcours FinCare</SelectItem>
                        <SelectItem value="a_la_demande">📦 À la demande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.webinar_source === "catalog" && formData.catalog_id && (
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    ✅ Webinar sélectionné depuis le catalogue. Le titre, la description, la durée et la catégorie sont pré-remplis.
                  </p>
                )}

                {/* Auto-generated visual */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Visuel du webinar</Label>
                  <p className="text-xs text-muted-foreground">Visuel généré automatiquement à partir du titre.</p>
                  <WebinarVisualGenerator
                    webinarTitle={formData.title}
                    onVisualGenerated={(dataUrl) => {
                      setFormData(prev => ({ ...prev, webinar_image_url: dataUrl }));
                    }}
                  />
                </div>

                <Tabs defaultValue="sessions" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="sessions">📅 Sessions</TabsTrigger>
                    <TabsTrigger value="attribution">🏢 Attribution</TabsTrigger>
                  </TabsList>

                  <TabsContent value="sessions" className="mt-0 space-y-4">
                    <div className="text-sm text-muted-foreground mb-2">
                      Ajoutez les dates et les liens d'inscription Livestorm pour chaque session de ce webinaire.
                    </div>
                    <WebinarSessionsManager 
                      moduleId={isEditing && moduleId ? parseInt(moduleId) : null}
                      webinarCategory={formData.webinar_category}
                    />
                  </TabsContent>

                  <TabsContent value="attribution" className="mt-0 space-y-4">
                    <div className="text-sm text-muted-foreground mb-2">
                      {formData.webinar_category === "parcours_fincare" 
                        ? "⚡ Ce webinaire Parcours FinCare sera automatiquement attribué à toutes les entreprises lors de l'ajout d'une session."
                        : "Cochez les entreprises concernées par ce webinaire."}
                    </div>
                    <WebinarCompanyAssignment 
                      moduleId={isEditing && moduleId ? parseInt(moduleId) : null}
                      onAssignmentChange={(companyIds) => setFormData({ ...formData, assigned_companies: companyIds })}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {formData.type === "quiz" && (
            <Card>
              <CardHeader>
                <CardTitle>Questions du quiz</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground mb-4">
                  ℹ️ Les points sont attribués globalement via la page <strong>Points & Validation</strong> (onglet Points → Complétion de quiz).
                </div>
                <QuizEditor
                  questions={formData.quiz_questions}
                  onChange={(questions) => setFormData({ ...formData, quiz_questions: questions })}
                />
              </CardContent>
            </Card>
          )}

          {formData.type === "meeting" && (
            <Card>
              <CardHeader>
                <CardTitle>Configuration du rendez-vous</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="appointment_calendar_url">URL du calendrier Hubspot (embed)</Label>
                  <Input 
                    id="appointment_calendar_url" 
                    type="url" 
                    value={formData.appointment_calendar_url} 
                    onChange={e => setFormData({ ...formData, appointment_calendar_url: e.target.value })} 
                    placeholder="https://..." 
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {formData.type === "video" && (
            <Card>
              <CardHeader>
                <CardTitle>Configuration de la vidéo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="video_url">Lien de la vidéo (YouTube, Vimeo, etc.)</Label>
                  <Input 
                    id="video_url" 
                    type="url" 
                    value={formData.video_url} 
                    onChange={e => setFormData({ ...formData, video_url: e.target.value })} 
                    placeholder="https://www.youtube.com/watch?v=..." 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video_embed">Code d'intégration vidéo (iframe)</Label>
                  <Textarea 
                    id="video_embed" 
                    value={formData.video_embed} 
                    onChange={e => setFormData({ ...formData, video_embed: e.target.value })} 
                    placeholder='<iframe width="560" height="315" src="https://www.youtube.com/embed/..." frameborder="0" allowfullscreen></iframe>'
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {formData.type === "simulator" && (
            <Card>
              <CardHeader>
                <CardTitle>Sélection du simulateur</CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={formData.simulator_id} 
                  onValueChange={(value) => {
                    const selectedSim = simulators.find(s => s.id === value);
                    setFormData({ 
                      ...formData, 
                      simulator_id: value,
                      content_url: selectedSim?.route || "",
                      content_data: { simulator_id: value, simulator_route: selectedSim?.route }
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un simulateur..." />
                  </SelectTrigger>
                  <SelectContent>
                    {simulators.map((sim) => (
                      <SelectItem key={sim.id} value={sim.id}>
                        <div className="flex items-center gap-2">
                          <Calculator className="h-4 w-4" />
                          {sim.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}
        </form>
      </div>

      {/* Preview Dialog */}
      <ModulePreviewDialog
        module={previewModule}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
};
