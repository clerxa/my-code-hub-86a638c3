import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight, Target, Calendar, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/30";
      case "medium":
        return "border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/30";
      default:
        return "border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/30";
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
                          className="gap-2 mt-2 sm:mt-3 w-full sm:w-auto border-primary text-primary hover:bg-primary/10"
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
