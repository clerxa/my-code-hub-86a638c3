import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, ExternalLink } from "lucide-react";
import { format, differenceInDays, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";

interface Appointment {
  id: string;
  event_start_time: string;
  event_end_time: string;
  event_url: string | null;
  reschedule_url: string | null;
  scheduled_with_name: string | null;
  appointment_forms?: { name: string } | null;
}

export function UpcomingAppointmentBanner() {
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchNextAppointment();
  }, [user]);

  const fetchNextAppointment = async () => {
    const { data } = await supabase
      .from("appointments")
      .select(`*, appointment_forms:form_id(name)`)
      .eq("user_id", user!.id)
      .eq("status", "scheduled")
      .gte("event_start_time", new Date().toISOString())
      .order("event_start_time", { ascending: true })
      .limit(1)
      .maybeSingle();

    setAppointment(data as Appointment | null);
    setLoading(false);
  };

  if (loading || !appointment) return null;

  const startDate = new Date(appointment.event_start_time);
  const daysRemaining = differenceInDays(startDate, new Date());

  const getDateLabel = () => {
    if (isToday(startDate)) return "Aujourd'hui";
    if (isTomorrow(startDate)) return "Demain";
    return format(startDate, "EEEE d MMMM", { locale: fr });
  };

  const getDaysLabel = () => {
    if (isToday(startDate)) return "C'est aujourd'hui !";
    if (isTomorrow(startDate)) return "C'est demain !";
    if (daysRemaining < 7) return `Dans ${daysRemaining} jours`;
    return `Dans ${Math.ceil(daysRemaining / 7)} semaine${daysRemaining > 7 ? "s" : ""}`;
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {appointment.appointment_forms?.name || "Rendez-vous planifié"}
              </p>
              <p className="font-semibold text-lg">
                {getDateLabel()} à {format(startDate, "HH:mm")}
              </p>
              <p className="text-sm text-primary font-medium">{getDaysLabel()}</p>
              {appointment.scheduled_with_name && (
                <p className="text-sm text-muted-foreground">
                  Avec {appointment.scheduled_with_name}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {appointment.event_url && (
              <Button
                size="sm"
                onClick={() => window.open(appointment.event_url!, "_blank")}
              >
                <Video className="h-4 w-4 mr-2" />
                Rejoindre
              </Button>
            )}
            {appointment.reschedule_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(appointment.reschedule_url!, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
