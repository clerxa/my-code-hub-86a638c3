import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ExternalLink, CheckCircle2, AlertCircle, Link as LinkIcon } from "lucide-react";
import { useState, useEffect } from "react";

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: "pdf" | "link" | "checklist" | "case-study";
  url: string;
}

interface ResourcesContentProps {
  resources: Resource[];
  onResourceClick?: (resourceId: string) => void;
  onAllResourcesViewed?: () => void;
}

const resourceIcons = {
  pdf: FileText,
  link: ExternalLink,
  checklist: CheckCircle2,
  "case-study": FileText,
};

const resourceLabels = {
  pdf: "PDF",
  link: "Lien externe",
  checklist: "Checklist",
  "case-study": "Cas pratique",
};

const resourceColors = {
  pdf: "text-destructive",
  link: "text-primary",
  checklist: "text-success",
  "case-study": "text-secondary",
};

export const ResourcesContent = ({ 
  resources, 
  onResourceClick,
  onAllResourcesViewed 
}: ResourcesContentProps) => {
  const [clickedResources, setClickedResources] = useState<Set<string>>(new Set());
  const [allViewed, setAllViewed] = useState(false);

  useEffect(() => {
    if (resources.length > 0 && clickedResources.size === resources.length && !allViewed) {
      setAllViewed(true);
      if (onAllResourcesViewed) {
        onAllResourcesViewed();
      }
    }
  }, [clickedResources, resources.length, allViewed, onAllResourcesViewed]);

  if (!resources || resources.length === 0) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="p-6 flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>Aucune ressource disponible</p>
        </CardContent>
      </Card>
    );
  }

  const handleResourceClick = (resource: Resource) => {
    setClickedResources((prev) => new Set(prev).add(resource.id));
    if (onResourceClick) {
      onResourceClick(resource.id);
    }
    window.open(resource.url, "_blank", "noopener,noreferrer");
  };

  const viewedCount = clickedResources.size;
  const totalCount = resources.length;
  const progressPercentage = Math.round((viewedCount / totalCount) * 100);

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 rounded-lg bg-primary/20">
                <LinkIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Pack de ressources</h3>
                <p className="text-sm text-muted-foreground">
                  Tu dois ouvrir toutes les ressources pour valider ce module
                </p>
              </div>
            </div>
            <Badge 
              variant={allViewed ? "default" : "secondary"} 
              className={allViewed ? "gradient-primary" : ""}
            >
              {viewedCount}/{totalCount}
            </Badge>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Ressources consultées</span>
              <span className="text-primary font-semibold">{progressPercentage}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {resources.map((resource, index) => {
          const Icon = resourceIcons[resource.type];
          const isViewed = clickedResources.has(resource.id);
          const colorClass = resourceColors[resource.type];

          return (
            <Card
              key={resource.id}
              className={`border-border/50 transition-all duration-300 ${
                isViewed 
                  ? "border-success/50 bg-success/5 shadow-card" 
                  : "hover:shadow-hover hover:border-border"
              }`}
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg transition-all ${
                      isViewed ? "bg-success/20 scale-110" : "bg-muted"
                    }`}
                  >
                    {isViewed ? (
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    ) : (
                      <Icon className={`h-6 w-6 ${colorClass}`} />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{resource.title}</h4>
                          {isViewed && (
                            <Badge variant="default" className="bg-success text-success-foreground">
                              ✓ Consulté
                            </Badge>
                          )}
                        </div>
                        {resource.description && (
                          <div 
                            className="text-sm text-muted-foreground line-clamp-2 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: resource.description }}
                          />
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {resourceLabels[resource.type]}
                      </Badge>
                    </div>

                    <Button
                      onClick={() => handleResourceClick(resource)}
                      variant={isViewed ? "secondary" : "default"}
                      size="sm"
                      className="gap-2 transition-smooth group"
                    >
                      {resource.type === "pdf" ? (
                        <>
                          <Download className="h-4 w-4 group-hover:animate-bounce" />
                          {isViewed ? "Télécharger à nouveau" : "Télécharger"}
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          {isViewed ? "Consulter à nouveau" : "Consulter"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {allViewed && (
        <Card className="border-success/50 bg-success/5 animate-scale-in">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-success font-semibold text-lg mb-2">
              Toutes les ressources consultées !
            </p>
            <p className="text-muted-foreground text-sm">
              Tu peux maintenant valider ce module et continuer ton parcours
            </p>
          </CardContent>
        </Card>
      )}

      {!allViewed && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary text-lg">💡</span>
              <span>
                <strong className="text-primary">Astuce :</strong> Ces ressources sont précieuses. 
                Sauvegarde-les pour pouvoir les consulter plus tard !
              </span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
