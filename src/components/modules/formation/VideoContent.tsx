import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { AlertCircle, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VideoContentProps {
  embedCode: string;
  title: string;
}

export const VideoContent = ({ embedCode, title }: VideoContentProps) => {
  const getSrc = () => {
    const srcMatch = embedCode.match(/src=["']([^"']+)["']/);
    return srcMatch ? srcMatch[1] : embedCode;
  };

  const src = getSrc();

  if (!src) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="p-6 flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>Code d'intégration vidéo invalide</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Instructions</h3>
              <p className="text-sm text-muted-foreground">
                Regarde cette vidéo attentivement pour valider le module. Prends des notes si nécessaire !
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 overflow-hidden shadow-card group hover:shadow-hover transition-smooth">
        <CardContent className="p-0 relative">
          <AspectRatio ratio={16 / 9} className="bg-muted">
            <iframe
              src={src}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </AspectRatio>
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="backdrop-blur-sm bg-background/80">
              En direct
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-success/30 bg-success/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-success text-lg">💡</span>
            <span>
              <strong className="text-success">Astuce :</strong> N'hésite pas à mettre la vidéo en pause 
              pour bien assimiler les concepts importants.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
