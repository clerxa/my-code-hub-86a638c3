import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface TextSection {
  type: "heading" | "subheading" | "paragraph" | "list" | "image";
  content: string;
  items?: string[];
  imageUrl?: string;
  imageAlt?: string;
}

interface TextContentProps {
  sections: TextSection[];
  onProgressChange?: (progress: number) => void;
}

export const TextContent = ({ sections, onProgressChange }: TextContentProps) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (onProgressChange) {
      onProgressChange(scrollProgress);
    }
  }, [scrollProgress, onProgressChange]);

  if (!sections || sections.length === 0) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="p-6 flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>Aucun contenu pédagogique disponible</p>
        </CardContent>
      </Card>
    );
  }

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    const progress = scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0;
    setScrollProgress(Math.round(progress));
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Guide pédagogique</h3>
              <p className="text-sm text-muted-foreground">
                Lis attentivement ce guide. La barre de progression avance avec ton scroll.
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Lecture</span>
              <span className="text-primary font-semibold">{scrollProgress}%</span>
            </div>
            <Progress value={scrollProgress} className="h-1.5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-card">
        <ScrollArea 
          className="h-[600px]" 
          onScrollCapture={handleScroll}
        >
          <CardContent className="p-8 space-y-6 max-w-3xl mx-auto">
            {sections.map((section, index) => {
              switch (section.type) {
                case "heading":
                  return (
                    <h2 
                      key={index} 
                      className="text-3xl font-bold text-foreground animate-fade-in scroll-mt-4"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {section.content}
                    </h2>
                  );
                case "subheading":
                  return (
                    <h3 
                      key={index} 
                      className="text-2xl font-semibold text-foreground mt-8 mb-4 scroll-mt-4"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {section.content}
                    </h3>
                  );
                case "paragraph":
                  return (
                    <div 
                      key={index} 
                      className="text-muted-foreground leading-relaxed text-lg animate-fade-in prose prose-lg max-w-none"
                      style={{ animationDelay: `${index * 50}ms` }}
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  );
                case "list":
                  return (
                    <ul key={index} className="space-y-3 my-6">
                      {section.items?.map((item, itemIndex) => (
                        <li 
                          key={itemIndex} 
                          className="text-muted-foreground flex items-start gap-3 group animate-fade-in"
                          style={{ animationDelay: `${(index + itemIndex) * 50}ms` }}
                        >
                          <span className="text-primary mt-1 text-xl group-hover:scale-125 transition-transform">
                            •
                          </span>
                          <span 
                            className="text-base prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: item }}
                          />
                        </li>
                      ))}
                    </ul>
                  );
                case "image":
                  return (
                    <div 
                      key={index} 
                      className="rounded-xl overflow-hidden border border-border/50 my-8 shadow-card animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <img
                        src={section.imageUrl}
                        alt={section.imageAlt || "Illustration"}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  );
                default:
                  return null;
              }
            })}

            {scrollProgress >= 95 && (
              <div className="text-center p-6 rounded-xl bg-success/5 border border-success/30 animate-scale-in">
                <p className="text-success font-semibold text-lg mb-2">
                  🎉 Bravo, tu as tout lu !
                </p>
                <p className="text-muted-foreground text-sm">
                  Tu peux maintenant valider ce module
                </p>
              </div>
            )}
          </CardContent>
        </ScrollArea>
      </Card>

      <Card className="border-success/30 bg-success/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-success text-lg">📚</span>
            <span>
              <strong className="text-success">Note :</strong> Prends ton temps pour bien assimiler 
              chaque concept. Tu pourras revenir sur ce module à tout moment.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
