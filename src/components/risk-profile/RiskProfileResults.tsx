import { useState, useEffect } from "react";
import { Shield, TrendingUp, AlertCircle, Target, Info, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { RiskProfile } from "@/types/risk-profile";
import { supabase } from "@/integrations/supabase/client";
import { HubSpotMeetingWidget } from "@/components/HubSpotMeetingWidget";
import { useRdvLink } from "@/hooks/useRdvLink";
import { appendUtmParams } from "@/hooks/useBookingReferrer";

interface RiskProfileResultsProps {
  profile: RiskProfile;
  onRetake: () => void;
}

const defaultProfileDetails = {
  'Prudent': {
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    description: "Vous privilégiez la sécurité et la préservation de votre capital",
    characteristics: [
      "Vous préférez minimiser les risques de perte",
      "La stabilité de vos placements est votre priorité",
      "Vous acceptez des rendements modérés pour plus de sécurité",
      "Les variations de marché vous rendent inconfortable"
    ],
    recommendations: [
      "Privilégiez les fonds euros, livrets réglementés",
      "Optez pour des obligations de qualité (investment grade)",
      "Limitez l'exposition aux actions (max 20-30%)",
      "Diversifiez sur différents supports sécurisés"
    ],
    warning: "Attention : Un profil trop prudent peut exposer à l'inflation et limiter le potentiel de croissance à long terme."
  },
  'Équilibré': {
    icon: Target,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    description: "Vous recherchez un équilibre entre sécurité et performance",
    characteristics: [
      "Vous acceptez une volatilité modérée",
      "Vous visez une croissance régulière de votre patrimoine",
      "Vous pouvez supporter des fluctuations temporaires",
      "Vous recherchez un compromis risque/rendement"
    ],
    recommendations: [
      "Mixez placements sécurisés (50-60%) et dynamiques (40-50%)",
      "Diversifiez entre actions, obligations et immobilier",
      "Investissez sur un horizon moyen terme (5-8 ans)",
      "Utilisez l'allocation d'actifs pour lisser la volatilité"
    ],
    warning: "Important : Maintenez une discipline d'investissement même en période de turbulence."
  },
  'Dynamique': {
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    description: "Vous visez la performance et acceptez les fluctuations du marché",
    characteristics: [
      "Vous recherchez activement la croissance de votre capital",
      "Vous tolérez des variations importantes à court terme",
      "Vous investissez sur un horizon long terme (8+ ans)",
      "Vous comprenez et acceptez le risque de marché"
    ],
    recommendations: [
      "Favorisez les actions et fonds actions (60-80%)",
      "Diversifiez géographiquement et sectoriellement",
      "Profitez des baisses de marché pour renforcer",
      "Conservez une poche de sécurité (20-40%)"
    ],
    warning: "Attention : Assurez-vous d'avoir une épargne de précaution avant d'investir massivement."
  },
  'Audacieux': {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    description: "Vous recherchez la performance maximale et acceptez une forte volatilité",
    characteristics: [
      "Vous visez les opportunités de forte croissance",
      "Les fluctuations importantes ne vous déstabilisent pas",
      "Vous avez une excellente connaissance des marchés",
      "Votre horizon d'investissement est très long terme"
    ],
    recommendations: [
      "Investissez majoritairement en actions (80%+)",
      "Considérez les marchés émergents et secteurs innovants",
      "Utilisez potentiellement des produits structurés",
      "Maintenez une allocation diversifiée malgré l'audace"
    ],
    warning: "Critique : Ce profil n'est adapté qu'aux investisseurs expérimentés avec une capacité financière solide et un horizon très long terme."
  }
};

export const RiskProfileResults = ({ profile, onRetake }: RiskProfileResultsProps) => {
  const [profileDetails, setProfileDetails] = useState(defaultProfileDetails);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  
  // Use the new rang×revenue hook for expert booking
  const { rdvUrl: expertBookingFallback } = useRdvLink();
  const expertBookingEmbed: string | null = null;

  useEffect(() => {
    loadCustomTexts();
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileData?.company_id) {
        setCompanyId(profileData.company_id);
        
        const { data: company } = await supabase
          .from('companies')
          .select('primary_color')
          .eq('id', profileData.company_id)
          .single();

        if (company) {
          setPrimaryColor(company.primary_color);
        }
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    }
  };

  const loadCustomTexts = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'risk_profile_texts')
        .maybeSingle();

      if (data?.value) {
        const customTexts = JSON.parse(data.value);
        // Merge custom texts with default profile details to preserve icon components
        const mergedDetails = {
          Prudent: { ...defaultProfileDetails.Prudent, ...customTexts.Prudent },
          Équilibré: { ...defaultProfileDetails.Équilibré, ...customTexts.Équilibré },
          Dynamique: { ...defaultProfileDetails.Dynamique, ...customTexts.Dynamique },
          Audacieux: { ...defaultProfileDetails.Audacieux, ...customTexts.Audacieux }
        };
        setProfileDetails(mergedDetails as any);
      }
    } catch (error) {
      console.error('Error loading custom texts:', error);
    }
  };

  const details = profileDetails[profile.profile_type as keyof typeof profileDetails] || profileDetails['Prudent'];
  const Icon = details.icon;

  return (
    <div className="space-y-6">
      {/* Header with score */}
      <Card className={`${details.borderColor} border-2`}>
        <CardHeader className="text-center">
          <div className={`p-6 rounded-2xl ${details.bgColor} relative`}>
            <Badge className={`absolute top-4 right-4 ${details.bgColor} ${details.color} border-2 ${details.borderColor} text-xs px-2 py-1`}>
              Profil de risque
            </Badge>
            <div className="flex flex-col items-center justify-center pt-4">
              <Icon className={`h-16 w-16 ${details.color} mb-4`} />
              <h2 className={`text-2xl font-bold ${details.color}`}>Profil {profile.profile_type}</h2>
              <p className="text-muted-foreground mt-2 max-w-md">
                {details.description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Score : {profile.total_weighted_score.toFixed(1)} / 100
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-2">
              Dernière évaluation : {new Date(profile.last_updated || '').toLocaleDateString('fr-FR')}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Characteristics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Vos caractéristiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {details.characteristics.map((char, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="mt-1">
                  <div className={`h-2 w-2 rounded-full ${details.bgColor}`} />
                </div>
                <span className="text-sm">{char}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Separator />

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Recommandations adaptées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {details.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="mt-1">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm">{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Warning */}
      <Alert className="border-amber-500/50 bg-amber-500/5">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-sm">
          <strong>À noter :</strong> {details.warning}
        </AlertDescription>
      </Alert>

      {/* Important Notice */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Informations importantes :</strong> Ce profil de risque est indicatif et basé sur vos réponses actuelles. 
            Il est recommandé de le mettre à jour régulièrement (tous les 6-12 mois) ou lors de changements significatifs 
            dans votre situation personnelle ou financière. Consultez un conseiller financier pour un accompagnement personnalisé.
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4 flex-wrap">
        <Button onClick={onRetake} variant="outline">
          Refaire le questionnaire
        </Button>
        
        <HubSpotMeetingWidget
          primaryColor={primaryColor || undefined}
          triggerText="Prendre RDV avec un expert"
          utmCampaign="profil_risque"
        />
      </div>
    </div>
  );
};
