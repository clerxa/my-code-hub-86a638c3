import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Calendar, Clock, Video, CheckCircle2, User, Shield, Award, ArrowRight, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useExpertBookingUrl } from "@/hooks/useExpertBookingUrl";
import { useQuery } from "@tanstack/react-query";
import { HubSpotMeetingWidget } from "@/components/HubSpotMeetingWidget";


interface Appointment {
  id: string;
  meeting_title: string;
  meeting_start_time: string | null;
  meeting_end_time: string | null;
  meeting_link: string | null;
  host_name: string | null;
  booking_source: string | null;
  created_at: string;
}

// Dedupe appointments: keep only one per (booking_source + meeting_start_time)
const dedupeAppointments = (rows: Appointment[]): Appointment[] => {
  const map = new Map<string, Appointment>();
  for (const apt of rows) {
    const key = `${apt.booking_source ?? "unknown"}|${apt.meeting_start_time ?? apt.created_at}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, apt);
      continue;
    }
    if (new Date(apt.created_at).getTime() > new Date(existing.created_at).getTime()) {
      map.set(key, apt);
    }
  }
  return Array.from(map.values());
};

export function MyAppointmentsSection() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingWidget, setShowBookingWidget] = useState(false);

  // Fetch user profile to get company_id
  const { data: profile } = useQuery({
    queryKey: ['user-profile-for-booking', user?.id],
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

  // Get expert booking URL based on company rank
  const { embedCode, fallbackUrl, isLoading: bookingLoading } = useExpertBookingUrl(profile?.company_id || null);

  useEffect(() => {
    if (!user) return;
    
    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from("hubspot_appointments")
        .select("id, meeting_title, meeting_start_time, meeting_end_time, meeting_link, host_name, booking_source, created_at")
        .eq("user_id", user.id)
        .order("meeting_start_time", { ascending: false });

      if (error) {
        console.error("Error fetching appointments:", error);
      } else {
        setAppointments(dedupeAppointments((data || []) as Appointment[]));
      }
      setLoading(false);
    };

    fetchAppointments();
  }, [user]);

  const getSourceLabel = (source: string | null) => {
    if (!source) return "Rendez-vous";
    if (source === "tax_declaration_help") return "Aide à la déclaration des revenus";
    if (source.startsWith("expert_booking")) return "Expert Financier";
    return "Rendez-vous";
  };

  const getSourceColor = (source: string | null) => {
    if (source === "tax_declaration_help") return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    if (source?.startsWith("expert_booking")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  const hasBookingOption = embedCode || fallbackUrl;

  // Show booking widget in a dialog/modal-like section
  if (showBookingWidget && embedCode) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Planifier un rendez-vous
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowBookingWidget(false)}>
                Retour
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <HubSpotMeetingWidget embedCode={embedCode} utmCampaign="section_mes_rdv" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasAppointments = appointments.length > 0;

  return (
    <div className="space-y-6">
      {/* Appointment Preparation Section - only show if user has appointments */}
      {hasAppointments && <AppointmentPreparationSection />}

      {/* Booking CTA Section */}
      {hasBookingOption && (
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
                {embedCode ? (
                  <Button 
                    size="lg" 
                    className="gap-2"
                    onClick={() => setShowBookingWidget(true)}
                  >
                    <Calendar className="h-4 w-4" />
                    Prendre rendez-vous
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : fallbackUrl ? (
                  <Button 
                    size="lg" 
                    className="gap-2"
                    onClick={() => window.open(fallbackUrl, '_blank')}
                  >
                    <Calendar className="h-4 w-4" />
                    Prendre rendez-vous
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Mes Rendez-vous Confirmés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments list */}
      {!loading && appointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Mes Rendez-vous Confirmés
              <Badge variant="secondary" className="ml-2">{appointments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div 
                  key={apt.id} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{apt.meeting_title}</span>
                      <Badge className={getSourceColor(apt.booking_source)} variant="outline">
                        {getSourceLabel(apt.booking_source)}
                      </Badge>
                    </div>
                    {apt.meeting_start_time ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          Prévu le {format(new Date(apt.meeting_start_time), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          Pris le {format(new Date(apt.created_at), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                        </span>
                      </div>
                    )}
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state - only show if no appointments and no booking loading */}
      {!loading && appointments.length === 0 && !hasBookingOption && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun rendez-vous planifié</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
