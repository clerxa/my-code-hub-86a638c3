import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, ExternalLink, ArrowRight, MapPin, Video, Building } from "lucide-react";
import { TaxDeclarationFormData, TaxPermanenceConfig, TYPE_RDV_OPTIONS } from "@/types/tax-declaration";
import { useNavigate } from "react-router-dom";
import { useRdvLink } from "@/hooks/useRdvLink";
import { useAuth } from "@/components/AuthProvider";

interface TaxDeclarationConfirmationProps {
  formData: TaxDeclarationFormData;
  permanenceConfig: TaxPermanenceConfig | null;
  isUpdate?: boolean;
}

export function TaxDeclarationConfirmation({ formData, permanenceConfig, isUpdate = false }: TaxDeclarationConfirmationProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch company_id from profile
  const { data: profile } = useQuery({
    queryKey: ['profile-company', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Get expert booking URL based on company rank
  const { fallbackUrl: expertBookingUrl } = useExpertBookingUrl(profile?.company_id || null);
  
  // Find the selected permanence option
  const selectedOption = permanenceConfig?.options?.find(opt => opt.id === formData.type_rdv && opt.enabled);
  const typeRdvLabel = TYPE_RDV_OPTIONS.find(opt => opt.value === formData.type_rdv)?.label || 
                       selectedOption?.label || 
                       formData.type_rdv;

  const getIcon = () => {
    switch (formData.type_rdv) {
      case 'visio':
        return <Video className="h-8 w-8 text-primary" />;
      case 'bureaux_perlib':
        return <Building className="h-8 w-8 text-primary" />;
      case 'bureaux_entreprise':
        return <MapPin className="h-8 w-8 text-primary" />;
      default:
        return <Calendar className="h-8 w-8 text-primary" />;
    }
  };

  const getNextSteps = () => {
    const steps = [
      "Notre équipe va analyser votre dossier",
      "Vous recevrez un email de confirmation avec les détails",
    ];

    if (formData.type_rdv === 'visio') {
      steps.push("Vous pourrez prendre rendez-vous en visioconférence via le lien ci-dessous");
    } else if (formData.type_rdv === 'bureaux_perlib') {
      steps.push("Prenez rendez-vous dans nos bureaux via le lien ci-dessous");
    } else if (formData.type_rdv === 'bureaux_entreprise') {
      steps.push("Des permanences seront organisées dans les locaux de votre entreprise");
      if (selectedOption?.dates && selectedOption.dates.length > 0) {
        steps.push(`Dates prévues : ${selectedOption.dates.join(', ')}`);
      }
    }

    steps.push("Un expert vous accompagnera pour optimiser votre déclaration fiscale");

    return steps;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-2 text-foreground">
            {isUpdate ? "Demande mise à jour avec succès !" : "Demande envoyée avec succès !"}
          </h1>
          <p className="text-muted-foreground mb-8">
            Merci {formData.prenom}, votre demande d'accompagnement fiscal a bien été {isUpdate ? "mise à jour" : "enregistrée"}.
          </p>

          {/* Type de RDV sélectionné */}
          <div className="bg-muted/30 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              {getIcon()}
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Type de rendez-vous choisi</p>
                <p className="font-semibold text-lg">{typeRdvLabel}</p>
              </div>
            </div>

            {permanenceConfig?.post_submission_message && (
              <p className="text-sm text-muted-foreground mt-4 border-t pt-4">
                {permanenceConfig.post_submission_message}
              </p>
            )}
          </div>

          {/* Prochaines étapes */}
          <div className="text-left mb-8">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-primary" />
              Prochaines étapes
            </h3>
            <ol className="space-y-3">
              {getNextSteps().map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Booking Link - use permanence config or fallback to expert booking URL */}
          {(selectedOption?.booking_url || expertBookingUrl) && (
            <Button
              size="lg"
              className="w-full mb-4 gap-2"
              onClick={() => window.open(selectedOption?.booking_url || expertBookingUrl!, '_blank')}
            >
              <Calendar className="h-5 w-5" />
              Prendre rendez-vous
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}

          {/* Return Button */}
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => navigate('/employee?section=tax-declaration')}
          >
            Retour à mon espace
          </Button>
        </Card>
      </div>
    </div>
  );
}
