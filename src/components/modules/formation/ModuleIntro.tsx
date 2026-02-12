import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Award, Target, Star, Video, FileText, Presentation, Link } from "lucide-react";
import { RichText } from "@/components/ui/rich-text";
import fincareDeb from "@/assets/fincare_debutant.png";
import fincareInt from "@/assets/fincare_intermediaire.png";
import fincareAdv from "@/assets/fincare_avance.png";

interface ModuleIntroProps {
  title: string;
  description: string;
  objectives: string[];
  estimatedTime: number;
  points: number;
  difficultyLevel: 1 | 2 | 3;
  contentType: "video" | "slides" | "text" | "resources" | "mixed";
  onStart: () => void;
}

const difficultyConfig = {
  1: { label: "Débutant", stars: 1, color: "text-success", image: fincareDeb },
  2: { label: "Intermédiaire", stars: 2, color: "text-primary", image: fincareInt },
  3: { label: "Avancé", stars: 3, color: "text-destructive", image: fincareAdv },
};

const contentTypeConfig = {
  video: { icon: Video, label: "Vidéo", color: "text-primary" },
  slides: { icon: Presentation, label: "Slides", color: "text-secondary" },
  text: { icon: FileText, label: "Guide", color: "text-success" },
  resources: { icon: Link, label: "Ressources", color: "text-destructive" },
  mixed: { icon: FileText, label: "Format mixte", color: "text-primary" },
};

export const ModuleIntro = ({
  title,
  description,
  objectives,
  estimatedTime,
  points,
  difficultyLevel,
  contentType,
  onStart,
}: ModuleIntroProps) => {
  const difficulty = difficultyConfig[difficultyLevel];
  const content = contentTypeConfig[contentType];
  const ContentIcon = content.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <Card className="max-w-3xl w-full border-border/50 shadow-hover bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default" className="gap-1 gradient-primary border-0">
                  <Award className="h-4 w-4" />
                  {points} points
                </Badge>
                <Badge variant="outline" className={`gap-1 ${difficulty.color} border-current`}>
                  {[...Array(difficulty.stars)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                  {difficulty.label}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-4 w-4" />
                  {estimatedTime} min
                </Badge>
                <Badge variant="secondary" className={`gap-1 ${content.color}`}>
                  <ContentIcon className="h-4 w-4" />
                  {content.label}
                </Badge>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-foreground leading-tight">
                  {title}
                </h1>
                <p className="text-lg text-primary font-medium">
                  Ce module va te permettre de maîtriser ces concepts clés
                </p>
                <RichText content={description} className="text-muted-foreground text-base leading-relaxed" />
              </div>
            </div>

            <div className="hidden md:block shrink-0">
              <div className="relative">
                <img
                  src={difficulty.image}
                  alt="Mascotte FinCare"
                  className="w-32 h-32 object-contain animate-bounce"
                  style={{
                    animationDuration: "3s",
                    animationIterationCount: "infinite"
                  }}
                />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-pulse">
                  <Award className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {objectives.length > 0 && (
            <div className="space-y-3 p-5 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 text-foreground">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Objectifs pédagogiques</h3>
              </div>
              <ul className="space-y-3 ml-7">
                {objectives.map((objective, index) => (
                  <li key={index} className="text-muted-foreground flex items-start gap-3 group">
                    <span className="text-primary mt-1 text-xl group-hover:scale-125 transition-transform">
                      ✓
                    </span>
                    <span className="text-base">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-center space-y-4 p-6 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-foreground font-medium text-lg">
              🎯 Chaque module te rend plus confiant financièrement
            </p>
            <p className="text-muted-foreground text-sm">
              Prends ton temps, assimile bien les concepts et valide à ton rythme
            </p>
          </div>

          <Button
            onClick={onStart}
            size="lg"
            className="w-full text-lg h-14 gradient-primary hover:opacity-90 transition-smooth group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Commencer le module
              <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
