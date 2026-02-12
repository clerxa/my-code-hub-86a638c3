import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle2, Sparkles, Trophy, ArrowRight, Download, ExternalLink } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import fincareExpert from "@/assets/fincare_expert.png";

interface WebinarEndProps {
  title: string;
  pointsEarned: number;
  badgeLabel?: string;
  keyTakeaways: string[];
  resources?: Array<{ name: string; url: string; type: "pdf" | "link" }>;
  onContinue: () => void;
}

export const WebinarEnd = ({
  title,
  pointsEarned,
  badgeLabel,
  keyTakeaways,
  resources = [],
  onContinue,
}: WebinarEndProps) => {
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ["#3b82f6", "#22c55e", "#06b6d4", "#8b5cf6"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <Card className="max-w-3xl w-full border-border/50 shadow-hover bg-card/95 backdrop-blur-sm overflow-hidden">
        <CardHeader className="text-center space-y-6 pb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-primary/5 to-transparent" />
          
          <div className="relative">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img
                  src={fincareExpert}
                  alt="Mascotte FinCare - Succès"
                  className="w-40 h-40 object-contain animate-bounce"
                  style={{
                    animationDuration: "1s",
                    animationIterationCount: "3"
                  }}
                />
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-success to-success/80 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                  <Trophy className="h-7 w-7 text-success-foreground" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-foreground animate-scale-in">
                🎉 Bravo !
              </h2>
              <p className="text-2xl text-foreground font-semibold">
                Webinar complété avec succès
              </p>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Tu as participé au webinar <span className="text-foreground font-semibold">"{title}"</span>
              </p>
            </div>

            <div className="flex justify-center gap-3 mt-6 flex-wrap">
              <Badge 
                variant="default" 
                className="gap-2 px-6 py-3 text-xl gradient-primary shadow-lg animate-scale-in"
                style={{ animationDelay: "200ms" }}
              >
                <Award className="h-6 w-6" />
                +{pointsEarned} points
              </Badge>

              {badgeLabel && (
                <Badge 
                  variant="outline" 
                  className="gap-2 px-4 py-2 border-success text-success bg-success/5 animate-scale-in"
                  style={{ animationDelay: "400ms" }}
                >
                  <Sparkles className="h-4 w-4" />
                  {badgeLabel}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 relative">
          {/* Points clés */}
          {keyTakeaways.length > 0 && (
            <div 
              className="space-y-4 p-6 rounded-xl bg-muted/30 border border-border/50 animate-fade-in"
              style={{ animationDelay: "600ms" }}
            >
              <div className="flex items-center gap-2 text-foreground">
                <div className="p-2 rounded-lg bg-success/20">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <h3 className="font-semibold text-lg">Points clés du webinar</h3>
              </div>
              <ul className="space-y-3 ml-12">
                {keyTakeaways.map((takeaway, index) => (
                  <li 
                    key={index} 
                    className="text-muted-foreground flex items-start gap-3 group animate-fade-in"
                    style={{ animationDelay: `${700 + index * 100}ms` }}
                  >
                    <span className="text-success font-bold text-xl group-hover:scale-125 transition-transform">
                      ✓
                    </span>
                    <span className="text-base">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ressources complémentaires */}
          {resources.length > 0 && (
            <div 
              className="space-y-4 p-6 rounded-xl bg-muted/30 border border-border/50 animate-fade-in"
              style={{ animationDelay: "800ms" }}
            >
              <div className="flex items-center gap-2 text-foreground">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Ressources complémentaires</h3>
              </div>
              <div className="space-y-2 ml-12">
                {resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {resource.type === "pdf" ? "📄" : "🔗"}
                    </div>
                    <span className="flex-1 text-foreground font-medium group-hover:text-primary transition-colors">
                      {resource.name}
                    </span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Message motivant */}
          <div 
            className="text-center space-y-3 p-6 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in"
            style={{ animationDelay: "1000ms" }}
          >
            <p className="text-foreground font-semibold text-lg">
              💪 Continue sur ta lancée !
            </p>
            <p className="text-muted-foreground text-sm">
              Chaque webinar te donne les clés pour mieux gérer ton argent et ton avenir
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={onContinue}
            size="lg"
            className="w-full text-lg h-14 gradient-primary hover:opacity-90 transition-smooth group relative overflow-hidden animate-fade-in"
            style={{ animationDelay: "1200ms" }}
          >
            <span className="relative z-10 flex items-center gap-2">
              Continuer le parcours
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
