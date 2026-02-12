import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { WebinarModule } from "@/components/modules/WebinarModule";
import { QuizModule } from "@/components/modules/QuizModule";
import { AppointmentModule } from "@/components/modules/AppointmentModule";
import { GuideModule } from "@/components/modules/GuideModule";
import { VideoModule } from "@/components/modules/VideoModule";
import { toast } from "sonner";

interface Module {
  id: number;
  title: string;
  description: string;
  type: string;
  points: number;
  content_url?: string | null;
  webinar_date?: string | null;
  webinar_registration_url?: string | null;
  webinar_image_url?: string | null;
  quiz_questions?: any[] | null;
  appointment_calendar_url?: string | null;
  content_type?: string | null;
  embed_code?: string | null;
  content_data?: any | null;
  pedagogical_objectives?: string[] | null;
  estimated_time?: number | null;
  difficulty_level?: number | null;
  key_takeaways?: string[] | null;
}

interface ModulePreviewDialogProps {
  module: Module | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ModulePreviewDialog = ({ module, isOpen, onClose }: ModulePreviewDialogProps) => {
  const [showFullscreen, setShowFullscreen] = useState(false);

  if (!module) return null;

  // Handler for validation - just shows a toast, no points awarded
  const handlePreviewValidate = () => {
    toast.info("Prévisualisation - Aucun point attribué", {
      description: "En mode prévisualisation, les points ne sont pas attribués."
    });
    onClose();
  };

  // For fullscreen modules (guide, webinar, video)
  if (showFullscreen) {
    if (module.type === "guide") {
      return (
        <div className="fixed inset-0 z-[100] bg-background">
          <div className="absolute top-4 right-4 z-50">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setShowFullscreen(false);
                onClose();
              }}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Fermer la prévisualisation
            </Button>
          </div>
          <GuideModule
            title={module.title}
            description={module.description}
            contentUrl={module.content_url}
            estimatedTime={module.estimated_time || 15}
            points={module.points}
            contentType={module.content_type as any || "mixed"}
            embedCode={module.embed_code || undefined}
            contentData={module.content_data}
            pedagogicalObjectives={module.pedagogical_objectives || []}
            difficultyLevel={(module.difficulty_level as 1 | 2 | 3) || 1}
            keyTakeaways={module.key_takeaways || []}
            autoValidate={false}
            onValidate={handlePreviewValidate}
            moduleId={module.id}
            userId="preview-user"
          />
        </div>
      );
    }

    if (module.type === "webinar") {
      return (
        <div className="fixed inset-0 z-[100] bg-background overflow-auto">
          <div className="absolute top-4 right-4 z-50">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setShowFullscreen(false);
                onClose();
              }}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Fermer la prévisualisation
            </Button>
          </div>
          <div className="container max-w-4xl mx-auto py-8 px-4">
            <WebinarModule
              title={module.title}
              description={module.description}
              webinarDate={module.webinar_date || null}
              webinarImageUrl={module.webinar_image_url || null}
              webinarRegistrationUrl={module.webinar_registration_url || null}
              estimatedTime={module.estimated_time || 30}
              points={module.points}
              onValidate={handlePreviewValidate}
              moduleId={module.id}
              userId="preview-user"
            />
          </div>
        </div>
      );
    }

    if (module.type === "video" && module.embed_code) {
      return (
        <VideoModule
          moduleId={module.id}
          title={module.title}
          description={module.description}
          embedCode={module.embed_code}
          points={module.points}
          userId="preview-user"
          onValidate={handlePreviewValidate}
          onClose={() => {
            setShowFullscreen(false);
            onClose();
          }}
        />
      );
    }
  }

  // Dialog for quiz and appointment modules, or to launch fullscreen modules
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Prévisualisation du module</h2>
              <p className="text-sm text-muted-foreground">
                Mode admin - Aucun point ne sera attribué
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {module.type === "quiz" && module.quiz_questions && module.quiz_questions.length > 0 ? (
            <QuizModule
              title={module.title}
              description={module.description}
              questions={module.quiz_questions}
              points={module.points}
              onValidate={handlePreviewValidate}
            />
          ) : module.type === "meeting" ? (
            <AppointmentModule
              title={module.title}
              description={module.description}
              appointmentCalendarUrl={module.appointment_calendar_url || null}
              estimatedTime={module.estimated_time || 30}
              points={module.points}
              onValidate={handlePreviewValidate}
            />
          ) : module.type === "guide" || module.type === "webinar" || module.type === "video" ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Ce type de module s'affiche en plein écran.
              </p>
              <Button onClick={() => setShowFullscreen(true)}>
                Ouvrir en plein écran
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun contenu à prévisualiser pour ce type de module.</p>
              <p className="text-sm mt-2">Type: {module.type}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
