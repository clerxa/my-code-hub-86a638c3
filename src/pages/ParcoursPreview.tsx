import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Save, Clock, Award, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RichText, stripHtml } from "@/components/ui/rich-text";

interface Module {
  id: number;
  title: string;
  description: string;
  type: string;
  duration: string | null;
  points: number;
  order_num: number;
}

interface ParcoursModule {
  id: string;
  module_id: number;
  order_num: number;
  module: Module;
}

interface Parcours {
  id: string;
  title: string;
  description: string | null;
  modules: ParcoursModule[];
}

const ModuleTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'webinar':
      return <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">📹</div>;
    case 'quiz':
      return <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-2xl">❓</div>;
    case 'guide':
      return <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-2xl">📚</div>;
    case 'appointment':
      return <div className="w-12 h-12 rounded-full bg-muted/10 flex items-center justify-center text-2xl">📅</div>;
    case 'simulator':
      return <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-2xl">🧮</div>;
    default:
      return <div className="w-12 h-12 rounded-full bg-muted/10 flex items-center justify-center text-2xl">📄</div>;
  }
};

const SortableModuleCard = ({ parcoursModule, index, total }: { parcoursModule: ParcoursModule; index: number; total: number }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: parcoursModule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const module = parcoursModule.module;

  // Ne pas afficher si le module n'existe pas
  if (!module) {
    return null;
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Ligne de connexion verticale */}
      {index < total - 1 && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-1 h-12 bg-gradient-to-b from-primary/50 to-primary/20 z-0" />
      )}
      
      <Card className="relative z-10 hover:shadow-lg transition-shadow bg-card">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing pt-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Module Icon */}
            <div className="flex-shrink-0">
              <ModuleTypeIcon type={module.type} />
            </div>

            {/* Module Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      Module {index + 1}
                    </Badge>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {module.type === 'webinar' ? 'Webinaire' : 
                       module.type === 'quiz' ? 'Quiz' : 
                       module.type === 'guide' ? 'Guide' :
                       module.type === 'video' ? 'Vidéo' :
                       module.type === 'simulator' ? 'Simulateur' :
                       module.type === 'meeting' ? 'Rendez-vous' : module.type}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">
                    {module.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {stripHtml(module.description)}
                  </p>
                </div>
              </div>

              {/* Module Details */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                {module.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{module.duration}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  <span>{module.points} pts</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ParcoursPreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [parcours, setParcours] = useState<Parcours | null>(null);
  const [modules, setModules] = useState<ParcoursModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (id) {
      fetchParcoursData();
    }
  }, [id]);

  const fetchParcoursData = async () => {
    try {
      const { data: parcoursData, error: parcoursError } = await supabase
        .from("parcours")
        .select(`
          id,
          title,
          description,
          modules:parcours_modules(
            id,
            module_id,
            order_num,
            module:modules(*)
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (parcoursError) throw parcoursError;
      
      if (!parcoursData) {
        setParcours(null);
        setLoading(false);
        return;
      }

      // Trier les modules par order_num et filtrer ceux qui ont un module valide
      const sortedModules = (parcoursData.modules || [])
        .filter((pm: any) => pm.module) // Ne garder que les modules valides
        .sort((a: any, b: any) => a.order_num - b.order_num);

      setParcours(parcoursData as any);
      setModules(sortedModules);
    } catch (error) {
      console.error("Error fetching parcours data:", error);
      toast.error("Erreur lors du chargement du parcours");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setModules((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      // Mettre à jour l'ordre des modules
      const updates = modules.map((pm, index) => ({
        id: pm.id,
        order_num: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("parcours_modules")
          .update({ order_num: update.order_num })
          .eq("id", update.id);

        if (error) throw error;
      }

      toast.success("Ordre des modules sauvegardé");
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!parcours) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Parcours introuvable</p>
        </div>
      </div>
    );
  }

  const totalPoints = modules.reduce((sum, pm) => sum + pm.module.points, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl hero-gradient mb-2">
              {parcours.title}
            </h1>
            {parcours.description && (
              <RichText content={parcours.description} className="text-muted-foreground" />
            )}
          </div>
          <Button onClick={handleSaveOrder} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Sauvegarde..." : "Sauvegarder l'ordre"}
          </Button>
        </div>

        {/* Stats */}
        <Card className="mb-8 bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{modules.length}</p>
                <p className="text-sm text-muted-foreground">Modules</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{totalPoints}</p>
                <p className="text-sm text-muted-foreground">Points totaux</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            <strong>Mode prévisualisation :</strong> Glissez-déposez les modules pour réorganiser leur ordre dans le parcours. 
            Cliquez sur "Sauvegarder l'ordre" pour enregistrer les modifications.
          </p>
        </div>

        {/* Roadmap des modules */}
        <div className="space-y-12 relative">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={modules.map(m => m.id)}
              strategy={verticalListSortingStrategy}
            >
              {modules.map((parcoursModule, index) => (
                <SortableModuleCard
                  key={parcoursModule.id}
                  parcoursModule={parcoursModule}
                  index={index}
                  total={modules.length}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {modules.length === 0 && (
          <Card className="bg-muted/30">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                Aucun module dans ce parcours. Ajoutez des modules depuis l'onglet Parcours.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ParcoursPreview;
