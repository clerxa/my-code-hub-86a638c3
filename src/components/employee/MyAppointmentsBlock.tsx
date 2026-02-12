import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setBookingReferrer } from "@/hooks/useBookingReferrer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, RefreshCw, User, Mail, Sparkles, CheckCircle2, Shield, Award, ArrowRight } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

interface LegacyAppointment {
  id: string;
  user_full_name: string | null;
  event_start_time: string;
  event_end_time: string;
  timezone: string;
  event_url: string | null;
  reschedule_url: string | null;
  status: string;
  scheduled_with_name: string | null;
  appointment_forms?: { name: string; icon: string; color: string } | null;
}

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

// Dedupe HubSpot appointments: keep only one per (booking_source + meeting_start_time)
const dedupeHubspotAppointments = (rows: HubspotAppointment[]): HubspotAppointment[] => {
  const map = new Map<string, HubspotAppointment>();
  for (const apt of rows) {
    const key = `${apt.booking_source ?? "unknown"}|${apt.meeting_start_time ?? apt.created_at}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, apt);
      continue;
    }
    // Keep the most recent ingestion
    if (new Date(apt.created_at).getTime() > new Date(existing.created_at).getTime()) {
      map.set(key, apt);
    }
  }
  return Array.from(map.values());
};

interface UnifiedAppointment {
  id: string;
  title: string;
  startTime: string;
  endTime: string | null;
  videoLink: string | null;
  hostName: string | null;
  status: "upcoming" | "past" | "today";
  source: "hubspot" | "legacy";
  sourceLabel: string;
  rescheduleUrl?: string | null;
}


export function MyAppointmentsBlock() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<UnifiedAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user profile to get company_id
  const { data: profile } = useQuery({
    queryKey: ['user-profile-for-appointments', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const handleBookAppointment = () => {
    setBookingReferrer('/employee');
    navigate('/expert-booking');
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const getSourceLabel = (source: string | null) => {
    if (!source) return "Rendez-vous";
    if (source === "tax_declaration_help") return "Aide à la déclaration des revenus";
    if (source?.startsWith("expert_booking")) return "Expert Financier";
    return "Rendez-vous";
  };

  const getMeetingTitle = (apt: HubspotAppointment) => {
    const source = apt.booking_source;
    if (source === "tax_declaration_help") return "Aide à la déclaration des revenus";
    if (source?.startsWith("expert_booking")) return "Consultation Expert Financier";
    // Fallback: use meeting_title only if it doesn't look like a URL/link
    if (apt.meeting_title && !apt.meeting_title.includes("/") && !apt.meeting_title.includes("http")) {
      return apt.meeting_title;
    }
    return "Rendez-vous Expert";
  };

  const fetchData = async () => {
    setLoading(true);
    const [hubspotRes, legacyRes] = await Promise.all([
      supabase
        .from("hubspot_appointments")
        .select("id, meeting_title, meeting_start_time, meeting_end_time, meeting_link, host_name, booking_source, created_at")
        .eq("user_id", user!.id),
      supabase
        .from("appointments")
        .select(`*, appointment_forms:form_id(name, icon, color)`)
        .eq("user_id", user!.id),
    ]);

    const unified: UnifiedAppointment[] = [];

    // Process HubSpot appointments (deduplicated)
    if (hubspotRes.data) {
      const deduped = dedupeHubspotAppointments(hubspotRes.data as HubspotAppointment[]);
      deduped.forEach((apt: HubspotAppointment) => {
        const startTime = apt.meeting_start_time || apt.created_at;
        const startDate = new Date(startTime);
        let status: "upcoming" | "past" | "today" = "upcoming";
        
        if (isToday(startDate)) {
          status = "today";
        } else if (isPast(startDate)) {
          status = "past";
        }

        unified.push({
          id: apt.id,
          title: getMeetingTitle(apt),
          startTime: startTime,
          endTime: apt.meeting_end_time,
          videoLink: apt.meeting_link,
          hostName: apt.host_name,
          status,
          source: "hubspot",
          sourceLabel: getSourceLabel(apt.booking_source),
        });
      });
    }

    // Process legacy appointments
    if (legacyRes.data) {
      (legacyRes.data as LegacyAppointment[]).forEach((apt) => {
        const startDate = new Date(apt.event_start_time);
        let status: "upcoming" | "past" | "today" = "upcoming";
        
        if (apt.status === "completed" || isPast(new Date(apt.event_end_time))) {
          status = "past";
        } else if (isToday(startDate)) {
          status = "today";
        }

        unified.push({
          id: apt.id,
          title: apt.appointment_forms?.name || "Rendez-vous",
          startTime: apt.event_start_time,
          endTime: apt.event_end_time,
          videoLink: apt.event_url,
          hostName: apt.scheduled_with_name,
          status,
          source: "legacy",
          sourceLabel: "Rendez-vous",
          rescheduleUrl: apt.reschedule_url,
        });
      });
    }

    // Sort by start time (most recent first for past, soonest first for upcoming)
    unified.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    setAppointments(unified);
    setLoading(false);
  };

  const upcomingAppointments = appointments.filter((a) => a.status === "upcoming" || a.status === "today");
  const pastAppointments = appointments.filter((a) => a.status === "past");

  const getStatusBadge = (apt: UnifiedAppointment) => {
    if (apt.status === "past") {
      return <Badge variant="secondary">Terminé</Badge>;
    }
    if (apt.status === "today") {
      return <Badge className="bg-green-500 text-white">Aujourd'hui</Badge>;
    }
    return <Badge className="bg-blue-500 text-white">À venir</Badge>;
  };

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
      {/* Booking CTA Section */}
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
                Bénéficiez d'une <span className="font-medium text-foreground">session individualisée gratuite et sans engagement</span> pour 
                analyser votre situation personnelle avec un expert certifié.
              </p>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <span>100% gratuit</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span>Sans engagement</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                    <Award className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span>Expert agréé ACPR & AMF</span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <Button 
                size="lg" 
                className="gap-2"
                onClick={handleBookAppointment}
              >
                <Calendar className="h-4 w-4" />
                Prendre rendez-vous
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mes Rendez-vous
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Calendar className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">Section en cours de développement</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Le suivi de vos rendez-vous sera bientôt disponible ici. En attendant, prenez rendez-vous ci-dessus !
              </p>
            </div>
            <Badge variant="secondary" className="mt-2">
              Bientôt disponible
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
