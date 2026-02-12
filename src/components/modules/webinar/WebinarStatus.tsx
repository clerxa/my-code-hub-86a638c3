import { CheckCircle2, Clock, Award, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WebinarStatusProps {
  status: "registration_pending" | "registration_confirmed" | "joined" | "completed";
  pointsRegistration?: number;
  pointsParticipation?: number;
  pointsAwarded?: number;
}

export const WebinarStatus = ({ 
  status, 
  pointsRegistration = 50, 
  pointsParticipation = 100,
  pointsAwarded = 0 
}: WebinarStatusProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "registration_pending":
        return {
          icon: <Clock className="h-8 w-8 text-yellow-500" />,
          title: "Inscription non finalisée",
          description: "Terminez votre inscription sur Livestorm pour confirmer votre participation",
          badge: "En attente",
          badgeVariant: "outline" as const,
          points: 0,
        };
      case "registration_confirmed":
        return {
          icon: <CheckCircle2 className="h-8 w-8 text-blue-500" />,
          title: "Inscription finalisée via Livestorm",
          description: "Votre inscription est confirmée ! Rejoignez le webinar pour gagner plus de points.",
          badge: "Inscrit",
          badgeVariant: "default" as const,
          points: pointsRegistration,
        };
      case "joined":
        return {
          icon: <Award className="h-8 w-8 text-green-500" />,
          title: "Vous avez participé au webinar",
          description: "Merci d'avoir participé ! Vos points ont été attribués.",
          badge: "Participé",
          badgeVariant: "default" as const,
          points: pointsRegistration + pointsParticipation,
        };
      case "completed":
        return {
          icon: <Award className="h-8 w-8 text-purple-500" />,
          title: "Module complété",
          description: "Félicitations ! Vous avez terminé ce module avec succès.",
          badge: "Complété",
          badgeVariant: "default" as const,
          points: pointsAwarded,
        };
      default:
        return {
          icon: <XCircle className="h-8 w-8 text-muted-foreground" />,
          title: "Statut inconnu",
          description: "",
          badge: "Inconnu",
          badgeVariant: "outline" as const,
          points: 0,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">{config.icon}</div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{config.title}</h3>
              <Badge variant={config.badgeVariant}>{config.badge}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{config.description}</p>
            
            {config.points > 0 && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <Award className="h-5 w-5 text-primary" />
                <span className="font-semibold">+{config.points} points</span>
                <span className="text-sm text-muted-foreground">gagnés</span>
              </div>
            )}

            {status === "registration_pending" && (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Award className="h-4 w-4" />
                  <span>Inscription: +{pointsRegistration} pts</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Award className="h-4 w-4" />
                  <span>Participation: +{pointsParticipation} pts</span>
                </div>
              </div>
            )}

            {status === "registration_confirmed" && (
              <div className="mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span>+{pointsParticipation} pts supplémentaires en participant</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
