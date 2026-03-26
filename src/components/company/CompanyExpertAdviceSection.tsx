import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, UserCheck } from "lucide-react";
import { useRdvLink } from "@/hooks/useRdvLink";
import { setBookingReferrer } from "@/hooks/useBookingReferrer";

interface CompanyExpertAdviceSectionProps {
  companyId: string;
  primaryColor?: string | null;
}

export const CompanyExpertAdviceSection = ({ companyId, primaryColor }: CompanyExpertAdviceSectionProps) => {
  const { rdvUrl: bookingUrl, isLoading } = useRdvLink();
  const color = primaryColor || 'hsl(var(--primary))';

  const handleBooking = () => {
    if (bookingUrl) {
      setBookingReferrer("company-conseils-individualises");
      window.open(bookingUrl, "_blank");
    }
  };

  return (
    <Card className="overflow-hidden" style={{ borderTopColor: color, borderTopWidth: '3px' }}>
      <CardHeader style={{ backgroundColor: `color-mix(in srgb, ${color} 5%, transparent)` }}>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}>
            <UserCheck className="h-5 w-5" style={{ color }} />
          </div>
          Conseils individualisés
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Bénéficiez d'un accompagnement personnalisé avec nos experts en gestion de patrimoine. 
          Ils sont à votre disposition pour répondre à vos questions, analyser votre situation financière 
          et vous aider à définir une stratégie adaptée à vos objectifs.
        </p>
        
        <div 
          className="rounded-lg p-4 space-y-3"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)` }}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" style={{ color }} />
            <span className="text-sm font-medium">Prendre rendez-vous avec un expert</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Échangez en visio avec un conseiller dédié, sans engagement. Votre rendez-vous est confidentiel et gratuit.
          </p>
          <Button
            onClick={handleBooking}
            disabled={isLoading || !bookingUrl}
            className="w-full sm:w-auto"
            style={{ backgroundColor: color }}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Réserver un créneau
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
