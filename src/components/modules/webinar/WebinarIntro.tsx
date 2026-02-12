import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Award, Target, Users, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { RichText } from "@/components/ui/rich-text";
import fincareInt from "@/assets/fincare_intermediaire.png";

interface WebinarIntroProps {
  title: string;
  description: string;
  webinarDate: string;
  duration: string;
  points: number;
  objectives: string[];
  speakers?: Array<{ name: string; role: string; photo?: string }>;
  imageUrl?: string;
  registrationUrl: string;
  embedCode?: string;
  onRegister: () => void;
  isRegistered?: boolean;
}

export const WebinarIntro = ({
  title,
  description,
  webinarDate,
  duration,
  points,
  objectives,
  speakers = [],
  imageUrl,
  registrationUrl,
  embedCode,
  onRegister,
  isRegistered = false,
}: WebinarIntroProps) => {
  const formattedDate = format(new Date(webinarDate), "EEEE d MMMM yyyy", { locale: fr });
  const formattedTime = format(new Date(webinarDate), "HH:mm", { locale: fr });

  const handleRegister = () => {
    window.open(registrationUrl, "_blank", "noopener,noreferrer");
    onRegister();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <Card className="max-w-4xl w-full border-border/50 shadow-hover bg-card/95 backdrop-blur-sm">
        <CardHeader className="space-y-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default" className="gap-1 gradient-primary border-0">
                  <Award className="h-4 w-4" />
                  {points} points
                </Badge>
                <Badge variant="outline" className="gap-1 border-primary text-primary">
                  <Calendar className="h-4 w-4" />
                  Webinaire en direct
                </Badge>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-foreground leading-tight">
                  {title}
                </h1>
                <p className="text-lg text-primary font-medium">
                  Participe en direct et interagis avec les experts
                </p>
                <RichText content={description} className="text-muted-foreground text-base leading-relaxed" />
              </div>
            </div>

            <div className="hidden md:block shrink-0">
              <div className="relative">
                <img
                  src={fincareInt}
                  alt="Mascotte FinCare"
                  className="w-32 h-32 object-contain animate-bounce"
                  style={{
                    animationDuration: "3s",
                    animationIterationCount: "infinite"
                  }}
                />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-pulse">
                  <Calendar className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Embed code ou Image du webinar */}
          {embedCode ? (
            <div className="relative w-full rounded-xl overflow-hidden bg-background">
              <div 
                className="w-full"
                style={{ minHeight: "480px" }}
                dangerouslySetInnerHTML={{ __html: embedCode }}
              />
            </div>
          ) : imageUrl ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border/50">
              <img
                src={imageUrl}
                alt={title}
                className="object-cover w-full h-full"
              />
              <div className="absolute top-4 right-4">
                <Badge variant="default" className="bg-destructive/90 backdrop-blur-sm">
                  🔴 EN DIRECT
                </Badge>
              </div>
            </div>
          ) : null}

          {/* Informations pratiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/50 bg-muted/30">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Date</p>
                  <p className="font-semibold text-foreground capitalize">{formattedDate}</p>
                  <p className="text-lg font-bold text-primary">{formattedTime}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-muted/30">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Durée</p>
                  <p className="text-lg font-bold text-foreground">{duration}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Intervenants */}
          {speakers.length > 0 && (
            <div className="space-y-3 p-5 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Intervenants</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {speakers.map((speaker, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {speaker.photo ? (
                        <img src={speaker.photo} alt={speaker.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        speaker.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{speaker.name}</p>
                      <p className="text-sm text-muted-foreground">{speaker.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Objectifs pédagogiques */}
          {objectives.length > 0 && (
            <div className="space-y-3 p-5 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 text-foreground">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Ce que tu vas apprendre</h3>
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
              📅 Réserve ta place dès maintenant !
            </p>
            <p className="text-muted-foreground text-sm">
              Ta participation sera automatiquement validée
            </p>
          </div>

          {/* CTA principal */}
          {isRegistered ? (
            <div className="p-6 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground text-lg">✓ Inscription confirmée</p>
                  <p className="text-sm text-muted-foreground">
                    Participez au webinar pour valider le module
                  </p>
                </div>
              </div>
            </div>
          ) : embedCode ? (
            <div className="text-center space-y-3 p-6 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-foreground font-medium text-lg">
                ✓ Inscris-toi directement via le formulaire ci-dessus
              </p>
              <Button
                onClick={onRegister}
                size="lg"
                className="w-full text-lg h-14 gradient-primary hover:opacity-90 transition-smooth"
              >
                Continuer après inscription
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleRegister}
              size="lg"
              className="w-full text-lg h-14 gradient-primary hover:opacity-90 transition-smooth group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                S'inscrire au webinar
                <ExternalLink className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/10 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
