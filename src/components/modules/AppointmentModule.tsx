import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Award, Calendar, ExternalLink } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { setBookingReferrer } from "@/hooks/useBookingReferrer";

interface AppointmentModuleProps {
  title: string;
  description: string;
  appointmentCalendarUrl: string | null;
  estimatedTime: number;
  points: number;
  onValidate: () => void;
}

export const AppointmentModule = ({
  title,
  description,
  appointmentCalendarUrl,
  estimatedTime,
  points,
  onValidate,
}: AppointmentModuleProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBookAppointment = () => {
    // Track where the user came from before navigating to expert booking
    setBookingReferrer(location.pathname);
    navigate("/expert-booking");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="mt-2">{description}</CardDescription>
          </div>
          <Badge variant="secondary">
            <Award className="mr-1 h-4 w-4" />
            {points} pts
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3 text-foreground">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span>Durée estimée : {estimatedTime} min</span>
        </div>

        <div className="p-6 bg-muted/50 rounded-lg text-center space-y-4">
          <p className="text-muted-foreground">
            Prenez rendez-vous avec un de nos experts pour bénéficier d'un accompagnement personnalisé.
          </p>
          <Button onClick={handleBookAppointment} size="lg">
            <ExternalLink className="mr-2 h-4 w-4" />
            Prendre rendez-vous avec un expert
          </Button>
        </div>

        <Button onClick={onValidate} className="w-full" size="lg">
          <Calendar className="mr-2 h-4 w-4" />
          J'ai pris mon rendez-vous
        </Button>
      </CardContent>
    </Card>
  );
};
