import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageMeta } from "@/components/seo/PageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, Clock, Video, User, ArrowLeft, Sparkles,
  CheckCircle2, Shield, Award, ArrowRight, History
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { setBookingReferrer } from "@/hooks/useBookingReferrer";

interface HubspotAppointment {
  id: string;
  meeting_title: string | null;
  meeting_start_time: string | null;
  meeting_end_time: string | null;
  meeting_link: string | null;
  host_name: string | null;
  booking_source: string | null;
  created_at: string;
}

const dedupeAppointments = (rows: HubspotAppointment[]): HubspotAppointment[] => {
  const map = new Map<string, HubspotAppointment>();
  for (const apt of rows) {
    const key = `${apt.booking_source ?? "unknown"}|${apt.meeting_start_time ?? apt.created_at}`;
    const existing = map.get(key);
    if (!existing || new Date(apt.created_at) > new Date(existing.created_at)) {
      map.set(key, apt);
    }
  }
  return Array.from(map.values());
};

const getMeetingTitle = (apt: HubspotAppointment) => {
  const source = apt.booking_source;
  if (source === "tax_declaration_help") return "Aide à la déclaration des revenus";
  if (source?.startsWith("expert_booking")) return "Consultation Expert Financier";
  if (apt.meeting_title && !apt.meeting_title.includes("/") && !apt.meeting_title.includes("http")) {
    return apt.meeting_title;
  }
  return "Rendez-vous Expert";
};

const getSourceLabel = (source: string | null) => {
  if (source === "tax_declaration_help") return "Aide fiscale";
  if (source?.startsWith("expert_booking")) return "Expert Financier";
  return "Rendez-vous";
};

export default function MesRendezVous() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<HubspotAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("hubspot_appointments")
      .select("id, meeting_title, meeting_start_time, meeting_end_time, meeting_link, host_name, booking_source, created_at")
      .or(`user_id.eq.${user!.id},user_email.eq.${user!.email}`)
      .order("meeting_start_time", { ascending: false });

    if (!error && data) {
      setAppointments(dedupeAppointments(data as HubspotAppointment[]));
    }
    setLoading(false);
  };

  const handleBookAppointment = () => {
    setBookingReferrer("/mes-rendez-vous");
    navigate("/expert-booking");
  };

  const now = new Date();
  const upcoming = appointments
    .filter((a) => a.meeting_start_time && !isPast(new Date(a.meeting_start_time)))
    .sort((a, b) => new Date(a.meeting_start_time!).getTime() - new Date(b.meeting_start_time!).getTime());
  const past = appointments
    .filter((a) => !a.meeting_start_time || isPast(new Date(a.meeting_start_time)))
    .sort((a, b) => {
      const ta = a.meeting_start_time ? new Date(a.meeting_start_time).getTime() : new Date(a.created_at).getTime();
      const tb = b.meeting_start_time ? new Date(b.meeting_start_time).getTime() : new Date(b.created_at).getTime();
      return tb - ta;
    });

  const nextAppointment = upcoming[0];

  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isToday(d)) return "Aujourd'hui";
    if (isTomorrow(d)) return "Demain";
    return format(d, "EEEE d MMMM yyyy", { locale: fr });
  };

  const getDaysLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = differenceInDays(d, now);
    if (isToday(d)) return "C'est aujourd'hui !";
    if (isTomorrow(d)) return "C'est demain !";
    if (days < 7) return `Dans ${days} jour${days > 1 ? "s" : ""}`;
    const weeks = Math.ceil(days / 7);
    return `Dans ${weeks} semaine${weeks > 1 ? "s" : ""}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageMeta title="Mes rendez-vous" description="Consultez et gérez vos rendez-vous avec nos experts financiers." path="/mes-rendez-vous" />
      <Header />
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate("/employee")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour à mon espace
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold">Mes Rendez-vous</h1>

        {/* Booking CTA */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Prenez rendez-vous avec un expert</h3>
                </div>
                <p className="text-muted-foreground">
                  Bénéficiez d'une <span className="font-medium text-foreground">session individualisée gratuite et sans engagement</span> avec un expert certifié.
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: CheckCircle2, label: "100% gratuit", color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" },
                    { icon: Shield, label: "Sans engagement", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
                    { icon: Award, label: "Expert agréé ACPR & AMF", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-2 text-sm">
                      <div className={`p-1 rounded-full ${color.split(" ").slice(0, 2).join(" ")}`}>
                        <Icon className={`h-3.5 w-3.5 ${color.split(" ").slice(2).join(" ")}`} />
                      </div>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button size="lg" className="gap-2 shrink-0" onClick={handleBookAppointment}>
                <Calendar className="h-4 w-4" />
                Prendre rendez-vous
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <Card>
            <CardContent className="py-12 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
            </CardContent>
          </Card>
        )}

        {/* Next appointment highlight */}
        {!loading && nextAppointment?.meeting_start_time && (
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="py-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {getMeetingTitle(nextAppointment)}
                    </p>
                    <p className="font-semibold text-lg">
                      {getDateLabel(nextAppointment.meeting_start_time)} à {format(new Date(nextAppointment.meeting_start_time), "HH:mm")}
                    </p>
                    <p className="text-sm text-primary font-medium">
                      {getDaysLabel(nextAppointment.meeting_start_time)}
                    </p>
                    {nextAppointment.host_name && (
                      <p className="text-sm text-muted-foreground">
                        Avec {nextAppointment.host_name}
                      </p>
                    )}
                  </div>
                </div>
                {nextAppointment.meeting_link && (
                  <Button size="sm" onClick={() => window.open(nextAppointment.meeting_link!, "_blank")}>
                    <Video className="h-4 w-4 mr-2" />
                    Rejoindre
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming appointments */}
        {!loading && upcoming.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                À venir
                <Badge variant="secondary" className="ml-1">{upcoming.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcoming.map((apt) => (
                <AppointmentRow key={apt.id} apt={apt} variant="upcoming" />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Past appointments */}
        {!loading && past.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                Historique
                <Badge variant="secondary" className="ml-1">{past.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {past.map((apt) => (
                <AppointmentRow key={apt.id} apt={apt} variant="past" />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!loading && appointments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-lg font-medium">Aucun rendez-vous</p>
              <p className="text-muted-foreground">
                Prenez rendez-vous avec un expert pour bénéficier d'un accompagnement personnalisé.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}

function AppointmentRow({ apt, variant }: { apt: HubspotAppointment; variant: "upcoming" | "past" }) {
  const startTime = apt.meeting_start_time || apt.created_at;
  const isPastVariant = variant === "past";

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${isPastVariant ? "bg-muted/30" : "bg-muted/50 hover:bg-muted"}`}>
      <div className={`p-2 rounded-full ${isPastVariant ? "bg-muted" : "bg-primary/10"}`}>
        {isPastVariant ? (
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Calendar className="h-4 w-4 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium truncate ${isPastVariant ? "text-muted-foreground" : ""}`}>
            {getMeetingTitle(apt)}
          </span>
          <Badge variant="outline" className="text-xs">
            {getSourceLabel(apt.booking_source)}
          </Badge>
          {isPastVariant && <Badge variant="secondary" className="text-xs">Terminé</Badge>}
          {!isPastVariant && isToday(new Date(startTime)) && (
            <Badge className="bg-green-500 text-white text-xs">Aujourd'hui</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <Clock className="h-3.5 w-3.5" />
          <span>
            {apt.meeting_start_time
              ? format(new Date(apt.meeting_start_time), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })
              : `Pris le ${format(new Date(apt.created_at), "d MMMM yyyy", { locale: fr })}`}
          </span>
        </div>
        {apt.host_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <User className="h-3.5 w-3.5" />
            <span>Avec {apt.host_name}</span>
          </div>
        )}
        {!isPastVariant && apt.meeting_link && (
          <a
            href={apt.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
          >
            <Video className="h-3.5 w-3.5" />
            Rejoindre le meeting
          </a>
        )}
      </div>
    </div>
  );
}
