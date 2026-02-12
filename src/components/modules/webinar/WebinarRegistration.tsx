import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, Clock, ExternalLink } from "lucide-react";
import { format, differenceInDays, differenceInHours, differenceInMinutes, isPast, isWithinInterval, addHours } from "date-fns";
import { fr } from "date-fns/locale";
import fincareDeb from "@/assets/fincare_debutant.png";
import fincareAdv from "@/assets/fincare_avance.png";

interface WebinarRegistrationProps {
  title: string;
  webinarDate: string;
  duration: string;
  registrationUrl: string;
  embedCode?: string;
  onJoinLive: () => void;
  isRegistered?: boolean;
}

export const WebinarRegistration = ({
  title,
  webinarDate,
  duration,
  registrationUrl,
  embedCode,
  onJoinLive,
  isRegistered = false,
}: WebinarRegistrationProps) => {
  const [timeUntil, setTimeUntil] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const webinarStart = new Date(webinarDate);
      const webinarEnd = addHours(webinarStart, 2); // Assume 2h max

      // Vérifie si le webinar est en cours
      const isCurrentlyLive = isWithinInterval(now, { start: webinarStart, end: webinarEnd });
      setIsLive(isCurrentlyLive);

      // Vérifie si le webinar est terminé
      setHasEnded(isPast(webinarEnd));

      if (isCurrentlyLive || hasEnded) {
        setTimeUntil("");
        return;
      }

      const days = differenceInDays(webinarStart, now);
      const hours = differenceInHours(webinarStart, now) % 24;
      const minutes = differenceInMinutes(webinarStart, now) % 60;

      if (days > 0) {
        setTimeUntil(`J-${days}`);
      } else if (hours > 0) {
        setTimeUntil(`Dans ${hours}h ${minutes}min`);
      } else if (minutes > 0) {
        setTimeUntil(`Dans ${minutes} minutes`);
      } else {
        setTimeUntil("Bientôt !");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [webinarDate]);

  const formattedDate = format(new Date(webinarDate), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <Card className="max-w-3xl w-full border-border/50 shadow-hover bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              {/* État de l'inscription */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default" className="gap-1 bg-success text-success-foreground border-0">
                  <CheckCircle className="h-4 w-4" />
                  Inscription confirmée
                </Badge>
                {isLive && (
                  <Badge variant="default" className="gap-1 bg-destructive border-0 animate-pulse">
                    🔴 EN DIRECT
                  </Badge>
                )}
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-foreground leading-tight">
                  {isLive ? "🎥 Le webinar est en cours !" : hasEnded ? "Webinar terminé" : "🎉 Tu es inscrit !"}
                </h1>
                <p className="text-lg text-primary font-medium">
                  {isLive 
                    ? "Rejoins-nous maintenant" 
                    : hasEnded 
                      ? "Valide ta participation avec le code" 
                      : "Rendez-vous bientôt pour le webinar"
                  }
                </p>
                <p className="text-muted-foreground text-base leading-relaxed capitalize">
                  {formattedDate}
                </p>
              </div>
            </div>

            <div className="hidden md:block shrink-0">
              <div className="relative">
                <img
                  src={isLive ? fincareAdv : fincareDeb}
                  alt="Mascotte FinCare"
                  className="w-32 h-32 object-contain"
                  style={{
                    animation: isLive ? "bounce 0.5s ease-in-out infinite" : "none"
                  }}
                />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success-foreground" />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Checklist de progression */}
          <div className="space-y-3 p-5 rounded-xl bg-muted/30 border border-border/50">
            <h3 className="font-semibold text-lg text-foreground mb-4">Progression</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success-foreground" />
                </div>
                <span className="text-foreground font-medium">✅ Inscription</span>
              </div>
              
              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                isLive 
                  ? "bg-primary/10 border border-primary/20" 
                  : "bg-muted/50 border border-border/30"
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isLive ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                }`}>
                  {isLive ? "▶️" : "⏱️"}
                </div>
                <span className={`font-medium ${isLive ? "text-foreground" : "text-muted-foreground"}`}>
                  {isLive ? "En cours" : "☐ Participation"} au webinar
                </span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/30">
                <div className="w-8 h-8 rounded-full bg-muted-foreground/20 flex items-center justify-center text-muted-foreground">
                  🔒
                </div>
                <span className="text-muted-foreground font-medium">☐ Validation finale</span>
              </div>
            </div>
          </div>

          {/* Compte à rebours ou état live */}
          {!hasEnded && (
            <Card className={`border-2 ${
              isLive 
                ? "border-destructive bg-destructive/5 animate-pulse" 
                : "border-primary bg-primary/5"
            }`}>
              <CardContent className="p-6 text-center space-y-4">
                {isLive ? (
                  <>
                    <div className="text-6xl font-bold text-destructive mb-2">
                      🔴 LIVE
                    </div>
                    <p className="text-xl font-semibold text-foreground">
                      Le webinar a commencé !
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Durée : {duration}
                    </p>
                  </>
                ) : (
                  <>
                    <Clock className="h-12 w-12 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Le webinar commence dans</p>
                    <div className="text-5xl font-bold text-primary">
                      {timeUntil}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Message important */}
          <div className="text-center space-y-3 p-6 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-foreground font-semibold text-lg">
              ⚠️ Important
            </p>
            <p className="text-muted-foreground text-sm">
              Un code sera annoncé pendant le webinar.
              <br />
              <span className="text-foreground font-medium">Note-le bien pour valider ta participation !</span>
            </p>
          </div>

          {/* Embed code pour rejoindre le webinar */}
          {embedCode && (
            <div className="relative w-full rounded-xl overflow-hidden bg-background">
              <div 
                className="w-full"
                style={{ minHeight: "480px" }}
                dangerouslySetInnerHTML={{ __html: embedCode }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {isLive ? (
              embedCode ? (
                <Button
                  onClick={onJoinLive}
                  size="lg"
                  className="w-full text-lg h-14 gradient-primary hover:opacity-90 transition-smooth"
                >
                  Continuer vers la validation
                </Button>
              ) : (
                <Button
                  onClick={onJoinLive}
                  size="lg"
                  className="w-full text-lg h-14 bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-smooth group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    🔴 Rejoindre le webinar en direct
                    <ExternalLink className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </span>
                </Button>
              )
            ) : hasEnded ? (
              <Button
                onClick={onJoinLive}
                size="lg"
                className="w-full text-lg h-14 gradient-primary hover:opacity-90 transition-smooth"
              >
                Valider ma participation
              </Button>
            ) : (
              <Button
                disabled
                size="lg"
                className="w-full text-lg h-14"
                variant="secondary"
              >
                <Clock className="mr-2 h-5 w-5" />
                En attente du début ({timeUntil})
              </Button>
            )}

            {!embedCode && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full"
              >
                <a href={registrationUrl} target="_blank" rel="noopener noreferrer">
                  <Calendar className="mr-2 h-4 w-4" />
                  Voir les détails de l'inscription
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
