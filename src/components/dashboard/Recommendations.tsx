import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight, Target, Calendar, BookOpen, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  icon: "target" | "calendar" | "book";
  cta_text: string;
  cta_action: () => void;
  priority: "high" | "medium" | "low";
}

interface RecommendationsProps {
  recommendations: Recommendation[];
}

const ICON_MAP = {
  target: Target,
  calendar: Calendar,
  book: BookOpen
};

export const Recommendations = ({ recommendations }: RecommendationsProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/30";
      case "medium":
        return "border-secondary/20 bg-secondary/5 dark:border-secondary/20 dark:bg-secondary/5";
      default:
        return "border-primary/20 bg-primary/5 dark:border-primary/20 dark:bg-primary/5";
    }
  };

  const handlePlayVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Card data-coach="recommandations">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Ce que nous vous recommandons maintenant
        </CardTitle>
        <CardDescription>
          Recommandations personnalisées basées sur votre situation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-4xl">🎯</div>
            <p className="text-muted-foreground">
              Excellent ! Vous êtes à jour sur toutes vos optimisations financières.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Video CTA Card */}
            <Card className="relative overflow-hidden group">
              <div className="relative">
                <video
                  ref={videoRef}
                  src="/video_index3.mp4"
                  className="w-full h-40 sm:h-48 object-cover"
                  muted
                  loop
                  playsInline
                  onEnded={() => setIsPlaying(false)}
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
                
                {/* Play button */}
                {!isPlaying && (
                  <button
                    onClick={handlePlayVideo}
                    className="absolute inset-0 flex items-center justify-center"
                    aria-label="Lire la vidéo"
                  >
                    <div className="w-12 h-12 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="h-5 w-5 text-foreground ml-0.5" />
                    </div>
                  </button>
                )}
                {isPlaying && (
                  <button
                    onClick={handlePlayVideo}
                    className="absolute inset-0"
                    aria-label="Mettre en pause"
                  />
                )}

                {/* Bottom text overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-sm font-semibold text-white">
                    💡 Découvrez comment optimiser vos finances en 2 min
                  </p>
                </div>
              </div>
            </Card>

            {recommendations.slice(0, 3).map((rec) => {
              const Icon = ICON_MAP[rec.icon];
              return (
                <Card
                  key={rec.id}
                  className={`border-2 transition-all hover:shadow-md ${getPriorityColor(rec.priority)}`}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0 p-2 sm:p-3 rounded-full bg-primary/10">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      
                      <div className="flex-1 space-y-2 min-w-0 w-full">
                        <h4 className="font-semibold text-foreground text-sm sm:text-base">
                          {rec.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {rec.description}
                        </p>
                        
                        <Button
                          onClick={rec.cta_action}
                          className="gap-2 mt-2 sm:mt-3 w-full sm:w-auto"
                          size="sm"
                          variant="outline"
                        >
                          <span className="truncate">{rec.cta_text}</span>
                          <ArrowRight className="h-4 w-4 flex-shrink-0" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
