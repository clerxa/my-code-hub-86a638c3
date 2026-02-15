import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Save,
  RotateCcw,
  Smartphone,
  Eye,
  GitBranch,
  GraduationCap,
  Monitor,
  Sparkles,
} from "lucide-react";
import {
  OnboardingScreen,
  SCREEN_TYPE_LABELS,
  parseWorkflowPosition,
} from "@/types/onboarding-cms";
import { OnboardingScreenEditor } from "./onboarding-cms/OnboardingScreenEditor";
import { OnboardingSimulator } from "./onboarding-cms/OnboardingSimulator";
import { OnboardingPreview } from "./onboarding-cms/OnboardingPreview";
import { WorkflowVisualizer } from "./onboarding-cms/WorkflowVisualizer";
import { ParcoursAssignmentTab } from "./onboarding-cms/ParcoursAssignmentTab";
import { OnboardingGuideEditor } from "./onboarding-cms/OnboardingGuideEditor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Liste des écrans supprimée : tout se fait désormais via le workflow visuel.
// (Le tri drag&drop et l'UI de liste ont été retirés.)

export function OnboardingCMSTab() {
  const [screens, setScreens] = useState<OnboardingScreen[]>([]);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [simulatorKey, setSimulatorKey] = useState(0);
  const [viewMode, setViewMode] = useState<'workflow' | 'preview' | 'parcours' | 'guide'>('workflow');

  useEffect(() => {
    fetchScreens();
  }, []);

  const fetchScreens = async () => {
    try {
      const { data, error } = await supabase
        .from('onboarding_screens')
        .select('*')
        .eq('flow_id', 'employee-onboarding')
        .order('order_num');

      if (error) throw error;
      
      const parsedData = (data || []).map(screen => ({
        ...screen,
        options: typeof screen.options === 'string' 
          ? JSON.parse(screen.options) 
          : screen.options || [],
        metadata: typeof screen.metadata === 'string'
          ? JSON.parse(screen.metadata)
          : screen.metadata || {},
        workflow_position: parseWorkflowPosition(screen.workflow_position),
      } as OnboardingScreen));
      
      setScreens(parsedData);
      if (parsedData.length > 0 && !selectedScreenId) {
        setSelectedScreenId(parsedData[0].id);
      }
    } catch (error) {
      console.error('Error fetching screens:', error);
      toast.error('Erreur lors du chargement des écrans');
    } finally {
      setLoading(false);
    }
  };


  const handleAddScreen = () => {
    const newScreen: OnboardingScreen = {
      id: `temp-${Date.now()}`,
      flow_id: 'employee-onboarding',
      order_num: screens.length,
      type: 'SINGLE_CHOICE',
      title: 'Nouvel écran',
      subtitle: null,
      options: [],
      metadata: {},
      is_active: true,
      status: 'draft',
      next_step_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setScreens([...screens, newScreen]);
    setSelectedScreenId(newScreen.id);
    setHasChanges(true);
  };


  const handleDeleteScreen = () => {
    if (!deleteConfirmId) return;
    const remaining = screens.filter((s) => s.id !== deleteConfirmId);
    setScreens(remaining);
    if (selectedScreenId === deleteConfirmId) {
      setSelectedScreenId(remaining[0]?.id || null);
    }
    setHasChanges(true);
    setDeleteConfirmId(null);
    toast.success('Écran supprimé');
  };

  const handleScreenUpdate = (updatedScreen: OnboardingScreen) => {
    setScreens(screens.map(s => 
      s.id === updatedScreen.id ? updatedScreen : s
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // First, we need to generate real UUIDs for temp screens before saving
      // so that connections between screens use valid UUIDs
      const tempToRealIdMap: Record<string, string> = {};
      
      // Pre-generate UUIDs for all temp screens
      const newScreens = screens.filter(s => s.id.startsWith('temp-'));
      for (const screen of newScreens) {
        tempToRealIdMap[screen.id] = crypto.randomUUID();
      }
      
      // Update all screens to replace temp IDs in connections
      const updatedScreens = screens.map(screen => {
        let updatedScreen = { ...screen };
        
        // Replace temp ID with real UUID if this is a new screen
        if (screen.id.startsWith('temp-')) {
          updatedScreen.id = tempToRealIdMap[screen.id];
        }
        
        // Replace temp IDs in next_step_id
        if (screen.next_step_id && screen.next_step_id.startsWith('temp-')) {
          updatedScreen.next_step_id = tempToRealIdMap[screen.next_step_id] || null;
        }
        
        // Replace temp IDs in options nextStepId
        if (screen.options && screen.options.length > 0) {
          updatedScreen.options = screen.options.map(opt => {
            if (opt.nextStepId && opt.nextStepId.startsWith('temp-')) {
              return { ...opt, nextStepId: tempToRealIdMap[opt.nextStepId] || undefined };
            }
            return opt;
          });
        }
        
        // Replace temp IDs in transition conditions
        if (screen.metadata?.transitionConditions) {
          const updatedConditions = screen.metadata.transitionConditions.map((cond: any) => {
            if (cond.targetScreenId && cond.targetScreenId.startsWith('temp-')) {
              return { ...cond, targetScreenId: tempToRealIdMap[cond.targetScreenId] };
            }
            return cond;
          });
          updatedScreen.metadata = { ...screen.metadata, transitionConditions: updatedConditions };
        }
        
        return updatedScreen;
      });
      
      // Separate new screens from existing ones (using original temp check)
      const screensToInsert = updatedScreens.filter(s => 
        Object.values(tempToRealIdMap).includes(s.id)
      );
      const existingScreens = updatedScreens.filter(s => 
        !Object.values(tempToRealIdMap).includes(s.id)
      );

      // Delete screens that are no longer in the list
      const { data: currentDbScreens } = await supabase
        .from('onboarding_screens')
        .select('id')
        .eq('flow_id', 'employee-onboarding');
      
      // Get all screen IDs that should remain (both existing and newly inserted)
      const allCurrentIds = updatedScreens.map(s => s.id);
      const idsToDelete = (currentDbScreens || [])
        .filter(s => !allCurrentIds.includes(s.id))
        .map(s => s.id);
      
      console.log('Screens in DB:', currentDbScreens?.map(s => s.id));
      console.log('Screens to keep:', allCurrentIds);
      console.log('Screens to delete:', idsToDelete);

      if (idsToDelete.length > 0) {
        await supabase
          .from('onboarding_screens')
          .delete()
          .in('id', idsToDelete);
      }

      // Update existing screens
      for (const screen of existingScreens) {
        const { error } = await supabase
          .from('onboarding_screens')
          .update({
            order_num: screen.order_num,
            type: screen.type,
            title: screen.title,
            subtitle: screen.subtitle,
            options: JSON.parse(JSON.stringify(screen.options)),
            metadata: JSON.parse(JSON.stringify(screen.metadata)),
            is_active: screen.is_active,
            status: screen.status,
            next_step_id: screen.next_step_id,
            workflow_position: screen.workflow_position ? JSON.parse(JSON.stringify(screen.workflow_position)) : null,
          })
          .eq('id', screen.id);
        
        if (error) throw error;
      }

      // Insert new screens with their pre-generated UUIDs
      for (const screen of screensToInsert) {
        const { error } = await supabase
          .from('onboarding_screens')
          .insert({
            id: screen.id, // Use the pre-generated UUID
            flow_id: screen.flow_id,
            order_num: screen.order_num,
            type: screen.type,
            title: screen.title,
            subtitle: screen.subtitle,
            options: JSON.parse(JSON.stringify(screen.options)),
            metadata: JSON.parse(JSON.stringify(screen.metadata)),
            is_active: screen.is_active,
            status: screen.status,
            next_step_id: screen.next_step_id,
            workflow_position: screen.workflow_position ? JSON.parse(JSON.stringify(screen.workflow_position)) : null,
          });
        
        if (error) throw error;
      }

      // Update local state with the new IDs
      setScreens(updatedScreens);
      
      // Update selected screen ID if it was a temp ID
      if (selectedScreenId && selectedScreenId.startsWith('temp-') && tempToRealIdMap[selectedScreenId]) {
        setSelectedScreenId(tempToRealIdMap[selectedScreenId]);
      }

      setHasChanges(false);
      toast.success('Flow sauvegardé avec succès');
      fetchScreens(); // Refresh to get latest data
    } catch (error) {
      console.error('Error saving flow:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleRestartSimulator = () => {
    setSimulatorKey(prev => prev + 1);
  };

  const handleUpdateConnection = (screenId: string, optionIndex: number | null, targetScreenId: string | null) => {
    setScreens(prevScreens => prevScreens.map(screen => {
      if (screen.id !== screenId) return screen;
      
      if (optionIndex !== null && screen.options && screen.options[optionIndex]) {
        // Update option-level connection
        const newOptions = [...screen.options];
        newOptions[optionIndex] = {
          ...newOptions[optionIndex],
          nextStepId: targetScreenId || undefined,
        };
        return { ...screen, options: newOptions };
      } else {
        // Update screen-level connection
        return { ...screen, next_step_id: targetScreenId };
      }
    }));
    setHasChanges(true);
    toast.success(targetScreenId ? 'Branchement créé' : 'Branchement supprimé');
  };

  const handleUpdatePosition = (screenId: string, position: { x: number; y: number }) => {
    setScreens(prevScreens => prevScreens.map(screen => {
      if (screen.id !== screenId) return screen;
      return { ...screen, workflow_position: position };
    }));
    setHasChanges(true);
  };

  const selectedScreen = screens.find(s => s.id === selectedScreenId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border p-6">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/20 ring-1 ring-primary/30">
              <GitBranch className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Onboarding CMS
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configurez le parcours d'onboarding de vos utilisateurs
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {screens.length} écran{screens.length > 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {screens.filter(s => s.status === 'active').length} actif{screens.filter(s => s.status === 'active').length > 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasChanges && (
              <Badge variant="secondary" className="animate-pulse text-xs bg-orange-500/20 text-orange-700 border-orange-500/30">
                Non sauvegardé
              </Badge>
            )}
            <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="shadow-sm">
              <Save className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
              <span className="sm:hidden">{saving ? '...' : 'Sauver'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'workflow' | 'preview' | 'parcours' | 'guide')}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="workflow" className="gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">Workflow visuel</span>
            <span className="sm:hidden">Workflow</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Preview responsive</span>
            <span className="sm:hidden">Preview</span>
          </TabsTrigger>
          <TabsTrigger value="parcours" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Attribution parcours</span>
            <span className="sm:hidden">Parcours</span>
          </TabsTrigger>
          <TabsTrigger value="guide" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Guide d'accueil</span>
            <span className="sm:hidden">Guide</span>
          </TabsTrigger>
        </TabsList>
        {/* List View supprimée (ne reflétait pas la logique souhaitée) */}

        {/* Workflow View */}
        <TabsContent value="workflow" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Workflow Visualizer */}
            <div className="lg:col-span-8">
              <Card className="h-[500px] lg:h-[calc(100vh-350px)] lg:min-h-[500px]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                      <GitBranch className="h-4 w-4 lg:h-5 lg:w-5" />
                      Vue Workflow
                    </CardTitle>
                    <Button size="sm" onClick={handleAddScreen}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="h-[calc(100%-60px)] p-2">
                  <WorkflowVisualizer
                    screens={screens}
                    selectedScreenId={selectedScreenId}
                    onScreenSelect={setSelectedScreenId}
                    onUpdateConnection={handleUpdateConnection}
                    onUpdatePosition={handleUpdatePosition}
                    onUpdateScreen={handleScreenUpdate}
                    onAddScreen={handleAddScreen}
                    onDeleteScreen={(screenId) => setDeleteConfirmId(screenId)}
                    onSave={handleSave}
                    isSaving={saving}
                    hasChanges={hasChanges}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Editor Panel */}
            <div className="lg:col-span-4 flex flex-col">
              <Card className="flex-1 flex flex-col overflow-hidden max-h-[500px] lg:max-h-[calc(100vh-350px)] lg:min-h-[500px]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                    <Eye className="h-4 w-4 lg:h-5 lg:w-5" />
                    Éditeur
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  {selectedScreen ? (
                    <OnboardingScreenEditor
                      screen={selectedScreen}
                      allScreens={screens}
                      onUpdate={handleScreenUpdate}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Cliquez sur un écran pour l'éditer
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Preview Responsive View */}
        <TabsContent value="preview" className="mt-4">
          <Card className="h-[calc(100vh-350px)] min-h-[600px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                <Monitor className="h-4 w-4 lg:h-5 lg:w-5" />
                Preview Responsive
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-60px)]">
              <OnboardingPreview screens={screens} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parcours Assignment View */}
        <TabsContent value="parcours" className="mt-4">
          <ParcoursAssignmentTab 
            screens={screens}
            onUpdateScreen={handleScreenUpdate}
          />
        </TabsContent>

        {/* Guide d'accueil */}
        <TabsContent value="guide" className="mt-4">
          <OnboardingGuideEditor />
        </TabsContent>

      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet écran ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'écran sera définitivement supprimé du flow.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteScreen}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
