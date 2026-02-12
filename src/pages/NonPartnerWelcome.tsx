import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Mail, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "dompurify";

interface Benefit {
  title: string;
  description: string;
}

interface Settings {
  hero_icon: string;
  hero_title: string;
  hero_description: string;
  benefits_title: string;
  benefits: Benefit[];
  contacts_title: string;
  contacts: string[];
  email_subject: string;
  email_body: string;
  primary_button_text: string;
  secondary_button_text: string;
  footer_text: string;
}

export default function NonPartnerWelcome() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      // Load company info and settings in parallel
      const [profileResult, settingsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("company_id, companies(name, partnership_type)")
          .eq("id", user.id)
          .single(),
        supabase
          .from("non_partner_welcome_settings")
          .select("*")
          .limit(1)
          .single()
      ]);

      if (profileResult.data?.companies) {
        setCompanyName((profileResult.data.companies as any).name);
        
        // If company has active partnership (not "Aucun"), redirect to normal flow
        const partnershipType = (profileResult.data.companies as any).partnership_type;
        const hasPartnership = partnershipType && partnershipType.toLowerCase() !== 'aucun';
        if (hasPartnership) {
          navigate("/onboarding-employee");
          return;
        }
      }

      if (settingsResult.data) {
        setSettings({
          ...settingsResult.data,
          benefits: (settingsResult.data.benefits as unknown) as Benefit[],
          contacts: (settingsResult.data.contacts as unknown) as string[],
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const replaceCompanyName = (text: string) => {
    return text.replace(/{companyName}/g, companyName || "votre entreprise");
  };

  const handleInviteCompany = () => {
    if (!settings) return;
    
    const subject = encodeURIComponent(replaceCompanyName(settings.email_subject));
    const body = encodeURIComponent(replaceCompanyName(settings.email_body));
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleContinue = () => {
    navigate("/employee");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <p>Erreur de chargement</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl hero-gradient">
            {replaceCompanyName(settings.hero_title)}
          </CardTitle>
          <CardDescription className="text-lg">
            {replaceCompanyName(settings.hero_description)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {settings.benefits_title}
            </h3>
            <ul className="space-y-3">
              {settings.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{benefit.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {settings.contacts_title}
            </h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              {settings.contacts.map((contact, index) => (
                <li 
                  key={index}
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(`• ${contact}`) 
                  }}
                />
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleInviteCompany}
              className="w-full"
              variant="hero"
              size="lg"
            >
              <Mail className="h-5 w-5 mr-2" />
              {settings.primary_button_text}
            </Button>
            <Button 
              onClick={handleContinue}
              variant="outline"
              className="w-full"
            >
              {settings.secondary_button_text}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {settings.footer_text}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}