import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setBookingReferrer } from "@/hooks/useBookingReferrer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, User, Sparkles, CheckCircle2, Shield, Award, ArrowRight } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";

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

export function MyAppointmentsBlock() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<HubspotAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const handleBookAppointment = () => {
    setBookingReferrer('/employee');
    navigate('/expert-booking');
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hubspot_appointments")
      .select("id, meeting_title, meeting_start_time, meeting_end_time, meeting_link, host_name, booking_source, created_at")
      .eq("user_id", user!.id)
      .order("meeting_start_time", { ascending: true });

    if (!error && data) {
      setAppointments(dedupeAppointments(data as HubspotAppointment[]));
    }
    setLoading(false);
  };

  const upcoming = appointments
    .filter((a) => a.meeting_start_time && !isPast(new Date(a.meeting_start_time)))
    .sort((a, b) => new Date(a.meeting_start_time!).getTime() - new Date(b.meeting_start_time!).getTime());

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mes Rendez-vous
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Booking CTA */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
            <div className="flex-1 space-y-4">
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
                  { icon: CheckCircle2, label: "100% gratuit", bg: "bg-green-100 dark:bg-green-900/30", fg: "text-green-600 dark:text-green-400" },
                  { icon: Shield, label: "Sans engagement", bg: "bg-blue-100 dark:bg-blue-900/30", fg: "text-blue-600 dark:text-blue-400" },
                  { icon: Award, label: "Expert agréé ACPR & AMF", bg: "bg-amber-100 dark:bg-amber-900/30", fg: "text-amber-600 dark:text-amber-400" },
                ].map(({ icon: Icon, label, bg, fg }) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <div className={`p-1 rounded-full ${bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${fg}`} />
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

      {/* Upcoming appointments preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Mes Rendez-vous
              {appointments.length > 0 && (
                <Badge variant="secondary" className="ml-1">{appointments.length}</Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate("/mes-rendez-vous")}>
              Tout voir
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Aucun rendez-vous planifié</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((apt) => {
                const startTime = apt.meeting_start_time || apt.created_at;
                return (
                  <div key={apt.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{getMeetingTitle(apt)}</span>
                        {isToday(new Date(startTime)) && (
                          <Badge className="bg-green-500 text-white text-xs">Aujourd'hui</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {format(new Date(startTime), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                        </span>
                      </div>
                      {apt.host_name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <User className="h-3.5 w-3.5" />
                          <span>Avec {apt.host_name}</span>
                        </div>
                      )}
                      {apt.meeting_link && (
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
              })}
              {appointments.length > 3 && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/mes-rendez-vous")}>
                  Voir tous les rendez-vous ({appointments.length})
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
