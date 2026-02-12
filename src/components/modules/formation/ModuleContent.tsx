import { Button } from "@/components/ui/button";
import { VideoContent } from "./VideoContent";
import { SlidesContent } from "./SlidesContent";
import { TextContent } from "./TextContent";
import { ResourcesContent } from "./ResourcesContent";
import { ProgressBar } from "./ProgressBar";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

interface ModuleContentProps {
  contentType: "video" | "slides" | "text" | "resources" | "mixed";
  title: string;
  embedCode?: string;
  contentData?: any;
  progress: number;
  onValidate: () => void;
  onProgressUpdate?: (newProgress: number) => void;
  autoValidate?: boolean;
  points: number;
}

export const ModuleContent = ({
  contentType,
  title,
  embedCode,
  contentData,
  progress,
  onValidate,
  onProgressUpdate,
  autoValidate,
  points,
}: ModuleContentProps) => {
  const [localProgress, setLocalProgress] = useState(progress);

  const getCurrentStep = () => {
    switch (contentType) {
      case "video":
        return "Visionne la vidéo";
      case "slides":
        return "Parcours la présentation";
      case "text":
        return "Lis le guide";
      case "resources":
        return "Consulte les ressources";
      default:
        return "En cours";
    }
  };

  const ErrorCard = ({ message }: { message: string }) => (
    <Card className="border-destructive/50 bg-destructive/10">
      <CardContent className="p-6 flex items-center gap-3 text-destructive">
        <AlertCircle className="h-5 w-5" />
        <p>{message}</p>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (contentType) {
      case "video":
        return embedCode ? (
          <VideoContent embedCode={embedCode} title={title} />
        ) : (
          <ErrorCard message="Aucune vidéo configurée" />
        );

      case "slides":
        return embedCode ? (
          <SlidesContent 
            embedCode={embedCode} 
            title={title}
            onProgressUpdate={onProgressUpdate}
          />
        ) : (
          <ErrorCard message="Aucune présentation configurée" />
        );

      case "text":
        return contentData?.sections ? (
          <TextContent 
            sections={contentData.sections} 
            onProgressChange={(prog) => setLocalProgress(prog)}
          />
        ) : (
          <ErrorCard message="Aucun contenu texte configuré" />
        );

      case "resources":
        return contentData?.resources ? (
          <ResourcesContent 
            resources={contentData.resources}
            onAllResourcesViewed={() => setLocalProgress(100)}
          />
        ) : (
          <ErrorCard message="Aucune ressource configurée" />
        );

      case "mixed":
        return (
          <div className="space-y-8">
            {embedCode && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  Contenu principal
                </h3>
              {embedCode.includes("slides") || embedCode.includes("canva") || embedCode.includes("docs.google") ? (
                <SlidesContent 
                  embedCode={embedCode} 
                  title={title}
                  onProgressUpdate={onProgressUpdate}
                />
              ) : (
                <VideoContent embedCode={embedCode} title={title} />
              )}
              </div>
            )}
            {contentData?.sections && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  Contenu pédagogique
                </h3>
                <TextContent sections={contentData.sections} />
              </div>
            )}
            {contentData?.resources && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  Ressources complémentaires
                </h3>
                <ResourcesContent resources={contentData.resources} />
              </div>
            )}
          </div>
        );

      default:
        return <ErrorCard message="Type de contenu non supporté" />;
    }
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <ProgressBar
          progress={Math.max(progress, localProgress)}
          currentStep={getCurrentStep()}
          pointsAvailable={points}
        />

        <div className="mt-6">
          {renderContent()}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent backdrop-blur-sm border-t border-border/50">
          <div className="max-w-5xl mx-auto">
            {autoValidate ? (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 text-center">
                  <p className="text-muted-foreground text-sm">
                    Ce module sera validé automatiquement une fois terminé
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Button
                onClick={onValidate}
                size="lg"
                className="w-full text-lg h-14 gradient-primary hover:opacity-90 transition-smooth group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  J'ai terminé ce module
                  <span className="text-2xl group-hover:translate-x-1 transition-transform">✓</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
