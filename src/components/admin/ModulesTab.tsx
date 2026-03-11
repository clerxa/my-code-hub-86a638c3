import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Copy, ArrowUpDown, ArrowUp, ArrowDown, Save, Upload, Eye } from "lucide-react";
import { ModulePreviewDialog } from "./ModulePreviewDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DraggableModuleList } from "./DraggableModuleList";
import { ModulesImportTab } from "./ModulesImportTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// Helper to convert datetime-local value to ISO with timezone
const toISOWithTimezone = (localDatetime: string): string | null => {
  if (!localDatetime) return null;
  // datetime-local gives us "YYYY-MM-DDTHH:mm" in local time
  // We need to create a Date object that interprets this as local time
  // and then convert to ISO string (which will be in UTC)
  const date = new Date(localDatetime);
  return date.toISOString();
};

// Helper to convert ISO/UTC datetime to datetime-local format for input
const toDatetimeLocal = (isoString: string | null | undefined): string => {
  if (!isoString) return "";
  const date = new Date(isoString);
  // Format as YYYY-MM-DDTHH:mm in local timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface Simulator {
  id: string;
  name: string;
  slug: string;
  route: string;
  is_active: boolean;
}

interface WebinarSessionRow {
  id: string;
  session_date: string;
  registration_url: string | null;
  livestorm_session_id: string | null;
  module_id: number;
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
interface ModulesTabProps {
  modules: Module[];
  onRefresh: () => void;
}
interface QuizAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  title: string;
  description?: string;
  points: number;
  type: "single" | "multiple";
  answers: QuizAnswer[];
}
export const ModulesTab = ({
  modules,
  onRefresh
}: ModulesTabProps) => {
  const navigate = useNavigate();
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [sortField, setSortField] = useState<keyof Module | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [bulkThemes, setBulkThemes] = useState<string[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "webinar",
    description: "",
    points: 0,
    content_url: "",
    webinar_date: "",
    webinar_registration_url: "",
    webinar_image_url: "",
    livestorm_session_id: "",
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
    simulator_id: "", // ID du simulateur sélectionné
    is_optional: false,
    assigned_companies: [] as string[],
    slides_data: { slides: [], transition: 'fade' } as any
  });
  const [viewMode, setViewMode] = useState<'table' | 'drag'>('table');
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [previewModule, setPreviewModule] = useState<Module | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTypeTab, setActiveTypeTab] = useState<string>("all");
  const [simulators, setSimulators] = useState<Simulator[]>([]);

  const [webinarSessions, setWebinarSessions] = useState<WebinarSessionRow[]>([]);

  // Fetch simulators and webinar sessions
  useEffect(() => {
    const fetchSimulators = async () => {
      const { data, error } = await supabase
        .from('simulators')
        .select('id, name, slug, route, is_active')
        .eq('is_active', true)
        .order('name');
      if (!error && data) {
        setSimulators(data);
      }
    };
    fetchSimulators();
  }, []);

  useEffect(() => {
    const fetchWebinarSessions = async () => {
      const webinarModuleIds = modules.filter(m => m.type === 'webinar').map(m => m.id);
      if (webinarModuleIds.length === 0) {
        setWebinarSessions([]);
        return;
      }
      const { data, error } = await supabase
        .from('webinar_sessions')
        .select('id, session_date, registration_url, livestorm_session_id, module_id')
        .in('module_id', webinarModuleIds)
        .order('session_date', { ascending: true });
      if (!error && data) {
        setWebinarSessions(data);
      }
    };
    fetchWebinarSessions();
  }, [modules]);

  const moduleTypes = [
    { value: "all", label: "Tous", count: modules.length },
    { value: "webinar", label: "Webinaires", count: modules.filter(m => m.type === "webinar").length },
    { value: "quiz", label: "Quiz", count: modules.filter(m => m.type === "quiz").length },
    { value: "guide", label: "Guides", count: modules.filter(m => m.type === "guide").length },
    { value: "meeting", label: "Rendez-vous", count: modules.filter(m => m.type === "meeting").length },
    { value: "video", label: "Vidéos", count: modules.filter(m => m.type === "video").length },
    { value: "simulator", label: "Simulateurs", count: modules.filter(m => m.type === "simulator").length },
  ];

  const filteredModules = useMemo(() => {
    if (activeTypeTab === "all") return modules;
    return modules.filter(m => m.type === activeTypeTab);
  }, [modules, activeTypeTab]);

  const handleSort = (field: keyof Module) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleReorder = (reorderedModules: Module[]) => {
    // Just update local state, don't save yet
    onRefresh();
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      // Update all modules with their new order
      const updates = sortedModules.map((module, index) => ({
        id: module.id,
        order_num: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('modules')
          .update({ order_num: update.order_num })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success("Ordre des modules enregistré");
      onRefresh();
    } catch (error: any) {
      toast.error("Erreur lors de la sauvegarde: " + error.message);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const sortedModules = [...filteredModules].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const SortButton = ({ field, children }: { field: keyof Module; children: React.ReactNode }) => (
    <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => handleSort(field)}>
      {children}
      {sortField === field ? (
        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
      ) : (
        <ArrowUpDown className="h-4 w-4 opacity-50" />
      )}
    </div>
  );

  const handleSubmitModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculate next order_num for new modules
      let orderNum = editingModule ? editingModule.order_num : 0;
      if (!editingModule) {
        // Find max order_num and add 1
        const maxOrderNum = modules.reduce((max, module) => Math.max(max, module.order_num), -1);
        orderNum = maxOrderNum + 1;
      }
      // Build data object without video_url and video_embed which are temporary form fields
      // Calculate points automatically for quiz based on questions
      const calculatedPoints = formData.type === 'quiz' && formData.quiz_questions?.length > 0
        ? formData.quiz_questions.reduce((sum: number, q: any) => sum + (q.points || 0), 0)
        : formData.points;

      const dataToSave = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        points: calculatedPoints,
        order_num: orderNum,
        content_url: formData.type === "video" ? (formData.video_url || null) : (formData.content_url || null),
        webinar_image_url: formData.webinar_image_url || null,
        appointment_calendar_url: formData.appointment_calendar_url || null,
        embed_code: formData.type === "video" ? (formData.video_embed || null) : (formData.embed_code || null),
        quiz_questions: formData.quiz_questions as any,
        content_data: formData.content_data || null,
        content_type: formData.content_type || null,
        estimated_time: formData.estimated_time || null,
        difficulty_level: formData.difficulty_level || 1,
        pedagogical_objectives: formData.pedagogical_objectives.length > 0 ? formData.pedagogical_objectives : null,
        key_takeaways: formData.key_takeaways.length > 0 ? formData.key_takeaways : null,
        theme: formData.themes.length > 0 ? formData.themes : null,
        is_optional: formData.is_optional
      };
      if (editingModule) {
        const {
          error
        } = await supabase.from("modules").update(dataToSave).eq("id", editingModule.id);
        if (error) throw error;
        toast.success("Module mis à jour");
      } else {
        const {
          error
        } = await supabase.from("modules").insert([dataToSave]);
        if (error) throw error;
        toast.success("Module créé");
      }
      // Navigation is handled by ModuleEditorPage
      setEditingModule(null);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error("Error saving module:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };
  const handleDeleteModule = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce module ?")) return;
    try {
      // Delete related records first to avoid foreign key constraint violations
      const { error: sessionsError } = await supabase.from("webinar_sessions").delete().eq("module_id", id);
      if (sessionsError) throw sessionsError;

      const { error: companyWebinarsError } = await supabase.from("company_webinars").delete().eq("module_id", id);
      if (companyWebinarsError) throw companyWebinarsError;

      const { error: appointmentFormsError } = await supabase.from("appointment_forms").delete().eq("module_id", id);
      if (appointmentFormsError) throw appointmentFormsError;

      const { error: companyModulesError } = await supabase.from("company_modules").delete().eq("module_id", id);
      if (companyModulesError) throw companyModulesError;

      const { error: parcoursModulesError } = await supabase.from("parcours_modules").delete().eq("module_id", id);
      if (parcoursModulesError) throw parcoursModulesError;

      const { error } = await supabase.from("modules").delete().eq("id", id);
      if (error) throw error;
      toast.success("Module supprimé");
      onRefresh();
    } catch (error) {
      console.error("Error deleting module:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleCloneModule = async (module: Module) => {
    try {
      // Calculate next order_num
      const maxOrderNum = modules.reduce((max, m) => Math.max(max, m.order_num), -1);
      const newOrderNum = maxOrderNum + 1;

      // Create a copy of the module without the id
      const { id, ...moduleData } = module;
      
      const clonedModule = {
        ...moduleData,
        title: `${module.title} - Copie`,
        order_num: newOrderNum,
        content_url: moduleData.content_url || null,
        webinar_image_url: moduleData.webinar_image_url || null,
        appointment_calendar_url: moduleData.appointment_calendar_url || null,
        embed_code: moduleData.embed_code || null,
        content_data: moduleData.content_data || null,
        pedagogical_objectives: moduleData.pedagogical_objectives || null,
        key_takeaways: moduleData.key_takeaways || null,
      };

      const { error } = await supabase.from("modules").insert(clonedModule);
      
      if (error) throw error;
      
      toast.success("Module cloné avec succès");
      onRefresh();
    } catch (error) {
      console.error("Error cloning module:", error);
      toast.error("Erreur lors du clonage");
    }
  };

  const handleBulkThemeAssignment = async () => {
    if (bulkThemes.length === 0 || selectedModuleIds.length === 0) {
      toast.error("Veuillez sélectionner au moins un thème et un module");
      return;
    }

    try {
      for (const moduleId of selectedModuleIds) {
        const { error } = await supabase
          .from("modules")
          .update({ theme: bulkThemes })
          .eq("id", moduleId);

        if (error) throw error;
      }

      toast.success(`${selectedModuleIds.length} module(s) mis à jour avec ${bulkThemes.length} thème(s)`);
      setSelectedModuleIds([]);
      setBulkThemes([]);
      setIsThemeDialogOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Error updating modules:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const toggleThemeSelection = (theme: string) => {
    setBulkThemes(prev =>
      prev.includes(theme)
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    );
  };

  const toggleModuleSelection = (moduleId: number) => {
    setSelectedModuleIds(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedModuleIds.length === filteredModules.length) {
      setSelectedModuleIds([]);
    } else {
      setSelectedModuleIds(filteredModules.map(m => m.id));
    }
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
  const resetForm = () => {
    setFormData({
    title: "",
    type: "webinar",
    description: "",
    points: 0,
    content_url: "",
    webinar_date: "",
      webinar_registration_url: "",
      webinar_image_url: "",
      livestorm_session_id: "",
      quiz_questions: [],
      appointment_calendar_url: "",
      content_type: "mixed",
      embed_code: "",
      content_data: {} as any,
      pedagogical_objectives: [],
      estimated_time: 15,
      difficulty_level: 1,
      key_takeaways: [],
      video_url: "",
      video_embed: "",
      themes: [],
      simulator_id: "",
      is_optional: false,
      assigned_companies: [],
      slides_data: { slides: [], transition: 'fade' }
    });
  };
  const openEditDialog = (module: Module) => {
    navigate(`/admin/modules/edit/${module.id}`);
  };

  const openCreateDialog = () => {
    navigate('/admin/modules/edit/new');
  };
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="my-[5px] py-[5px]">Gestion des modules</CardTitle>
              <CardDescription>Créer et modifier les modules de formation</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setImportDialogOpen(true)} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Importer CSV
              </Button>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau module
              </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {selectedModuleIds.length > 0 && (
          <div className="mb-4 p-4 bg-primary/10 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedModuleIds.length} module(s) sélectionné(s)
            </span>
            <div className="flex gap-2">
              <Dialog open={isThemeDialogOpen} onOpenChange={setIsThemeDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" size="sm">
                    Assigner un thème
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Assigner des thèmes aux modules sélectionnés</DialogTitle>
                    <DialogDescription>
                      Sélectionnez un ou plusieurs thèmes à appliquer aux {selectedModuleIds.length} module(s) sélectionné(s)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Thèmes ({bulkThemes.length} sélectionné{bulkThemes.length > 1 ? 's' : ''})</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto p-2 border rounded-md">
                        {availableThemes.map(theme => (
                          <div key={theme} className="flex items-center space-x-2">
                            <Checkbox
                              id={`theme-${theme}`}
                              checked={bulkThemes.includes(theme)}
                              onCheckedChange={() => toggleThemeSelection(theme)}
                            />
                            <Label
                              htmlFor={`theme-${theme}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {theme}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsThemeDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleBulkThemeAssignment}>
                        Appliquer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedModuleIds([])}
              >
                Désélectionner tout
              </Button>
            </div>
          </div>
        )}

        <Tabs value={activeTypeTab} onValueChange={setActiveTypeTab} className="w-full">
          <TabsList className="mb-4 flex-wrap h-auto">
            {moduleTypes.map(type => (
              <TabsTrigger key={type.value} value={type.value} className="gap-2">
                {type.label}
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{type.count}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTypeTab} className="mt-0">
            {viewMode === 'table' ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedModuleIds.length === filteredModules.length && filteredModules.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead><SortButton field="title">Titre</SortButton></TableHead>
                    {activeTypeTab === "all" && (
                      <TableHead><SortButton field="type">Type</SortButton></TableHead>
                    )}
                    {(activeTypeTab === "webinar" || activeTypeTab === "all") && (
                      <TableHead className="w-16 text-center">Lié</TableHead>
                    )}
                    {(activeTypeTab === "webinar" || activeTypeTab === "all") && (
                      <TableHead>Date session</TableHead>
                    )}
                    <TableHead><SortButton field="theme">Thème</SortButton></TableHead>
                    <TableHead><SortButton field="estimated_time">Durée (min)</SortButton></TableHead>
                    <TableHead><SortButton field="points">Points</SortButton></TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedModules.map(module => {
                    const moduleSessions = module.type === "webinar" 
                      ? webinarSessions.filter(s => s.module_id === module.id)
                      : [];
                    const hasNoSessions = module.type === "webinar" && moduleSessions.length === 0;

                    // For non-webinar modules or webinars without sessions: single row
                    if (module.type !== "webinar" || hasNoSessions) {
                      return (
                        <TableRow key={module.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedModuleIds.includes(module.id)}
                              onCheckedChange={() => toggleModuleSelection(module.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{module.title}</TableCell>
                          {activeTypeTab === "all" && (
                            <TableCell>
                              <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary-foreground">
                                {module.type}
                              </span>
                            </TableCell>
                          )}
                          {(activeTypeTab === "webinar" || activeTypeTab === "all") && (
                            <TableCell className="text-center">
                              {module.type === "webinar" ? (
                                <span className="inline-block h-3 w-3 rounded-full bg-muted" title="Aucune session configurée" />
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )}
                          {(activeTypeTab === "webinar" || activeTypeTab === "all") && (
                            <TableCell>
                              {module.type === "webinar" ? (
                                <span className="text-xs text-muted-foreground italic">Aucune session</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {module.theme && module.theme.length > 0 ? (
                                module.theme.map((t, idx) => (
                                  <span key={idx} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{t}</span>
                                ))
                              ) : (
                                <span className="text-xs px-2 py-1 rounded-full bg-muted">Non assigné</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{module.estimated_time || 15}</TableCell>
                          <TableCell>{module.points}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => { setPreviewModule(module); setIsPreviewOpen(true); }} title="Prévisualiser"><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(module)} title="Modifier"><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleCloneModule(module)} title="Cloner"><Copy className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteModule(module.id)} title="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }

                    // Webinar with sessions: one row per session
                    return moduleSessions.map((session, sIdx) => (
                      <TableRow key={`${module.id}-session-${session.id}`} className={sIdx > 0 ? "border-t border-dashed" : ""}>
                        <TableCell>
                          {sIdx === 0 && (
                            <Checkbox
                              checked={selectedModuleIds.includes(module.id)}
                              onCheckedChange={() => toggleModuleSelection(module.id)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {sIdx === 0 ? module.title : (
                            <span className="text-muted-foreground pl-4">↳ session {sIdx + 1}</span>
                          )}
                        </TableCell>
                        {activeTypeTab === "all" && (
                          <TableCell>
                            {sIdx === 0 && (
                              <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary-foreground">
                                {module.type}
                              </span>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          <span
                            className={`inline-block h-3 w-3 rounded-full ${
                              session.livestorm_session_id
                                ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                                : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                            }`}
                            title={
                              session.livestorm_session_id
                                ? `Connecté: ${session.livestorm_session_id}`
                                : "Non connecté à Livestorm"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {format(new Date(session.session_date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                          </span>
                        </TableCell>
                        {sIdx === 0 ? (
                          <>
                            <TableCell rowSpan={moduleSessions.length}>
                              <div className="flex flex-wrap gap-1">
                                {module.theme && module.theme.length > 0 ? (
                                  module.theme.map((t, idx) => (
                                    <span key={idx} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{t}</span>
                                  ))
                                ) : (
                                  <span className="text-xs px-2 py-1 rounded-full bg-muted">Non assigné</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell rowSpan={moduleSessions.length}>{module.estimated_time || 15}</TableCell>
                            <TableCell rowSpan={moduleSessions.length}>{module.points}</TableCell>
                            <TableCell rowSpan={moduleSessions.length}>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => { setPreviewModule(module); setIsPreviewOpen(true); }} title="Prévisualiser"><Eye className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(module)} title="Modifier"><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleCloneModule(module)} title="Cloner"><Copy className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteModule(module.id)} title="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </>
                        ) : null}
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-4">
                <DraggableModuleList
                  modules={sortedModules}
                  onReorder={handleReorder}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteModule}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

    {/* Dialog pour l'import CSV */}
    <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import CSV - Modules</DialogTitle>
          <DialogDescription>
            Importez vos modules depuis un fichier CSV
          </DialogDescription>
        </DialogHeader>
        <ModulesImportTab />
      </DialogContent>
    </Dialog>

    {/* Dialog de prévisualisation du module */}
    <ModulePreviewDialog
      module={previewModule}
      isOpen={isPreviewOpen}
      onClose={() => {
        setIsPreviewOpen(false);
        setPreviewModule(null);
      }}
    />
  </>
  );
};