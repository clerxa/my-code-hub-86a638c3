import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Save,
  BookOpen, Palette, Users, BarChart, Video, Calculator,
  Sparkles, TrendingUp, Shield, Target, Zap, Award,
  Globe, Heart, Lightbulb, MessageCircle, PieChart, Rocket,
  Star, ThumbsUp, Trophy, Wifi, DollarSign, Gift,
  GraduationCap, Briefcase, Clock, FileText, Layout, Settings
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LandingPageEditor } from "./LandingPageEditor";

interface PartnershipContent {
  hero_title: string;
  hero_description: string;
  benefits: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  cta_title: string;
  cta_description: string;
  form_fields?: {
    firstName_label: string;
    lastName_label: string;
    company_label: string;
    email_label: string;
    phone_label: string;
    companySize_label: string;
    message_label: string;
    submit_button: string;
  };
}




const iconOptions = [
  { value: "BookOpen", label: "Livre" },
  { value: "Palette", label: "Palette" },
  { value: "Users", label: "Utilisateurs" },
  { value: "BarChart", label: "Graphique" },
  { value: "Video", label: "Vidéo" },
  { value: "Calculator", label: "Calculatrice" },
  { value: "Sparkles", label: "Étincelles" },
  { value: "TrendingUp", label: "Tendance" },
  { value: "Shield", label: "Bouclier" },
  { value: "Target", label: "Cible" },
  { value: "Zap", label: "Éclair" },
  { value: "Award", label: "Récompense" },
  { value: "Globe", label: "Globe" },
  { value: "Heart", label: "Cœur" },
  { value: "Lightbulb", label: "Ampoule" },
  { value: "MessageCircle", label: "Message" },
  { value: "PieChart", label: "Camembert" },
  { value: "Rocket", label: "Fusée" },
  { value: "Star", label: "Étoile" },
  { value: "ThumbsUp", label: "Pouce levé" },
  { value: "Trophy", label: "Trophée" },
  { value: "Wifi", label: "Wifi" },
  { value: "DollarSign", label: "Dollar" },
  { value: "Gift", label: "Cadeau" },
  { value: "GraduationCap", label: "Diplôme" },
  { value: "Briefcase", label: "Mallette" },
  { value: "Clock", label: "Horloge" },
  { value: "FileText", label: "Document" },
  { value: "Layout", label: "Mise en page" },
  { value: "Settings", label: "Paramètres" },
];

export function PartnershipTab() {
  const [content, setContent] = useState<PartnershipContent | null>(null);
  const [emailTemplate, setEmailTemplate] = useState<any>(null);
  const [emailConfig, setEmailConfig] = useState({
    partnership_requests_email: "",
    contact_requests_email: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch content
      const { data: contentData, error: contentError } = await supabase
        .from("settings")
        .select("metadata")
        .eq("key", "partnership_page_content")
        .single();

      if (contentError) throw contentError;
      const partnershipContent = contentData.metadata as unknown as PartnershipContent;
      // Add default form fields if missing
      if (!partnershipContent.form_fields) {
        partnershipContent.form_fields = {
          firstName_label: "Prénom",
          lastName_label: "Nom",
          company_label: "Entreprise",
          email_label: "Email professionnel",
          phone_label: "Téléphone portable",
          companySize_label: "Taille d'entreprise",
          message_label: "Message (optionnel)",
          submit_button: "Envoyer ma demande",
        };
      }
      setContent(partnershipContent);

      // Fetch email template
      const { data: templateData, error: templateError } = await supabase
        .from("settings")
        .select("metadata")
        .eq("key", "partnership_email_template")
        .single();

      if (templateError) throw templateError;
      setEmailTemplate(templateData.metadata);

      // Fetch email config
      const { data: emailConfigData, error: emailConfigError } = await supabase
        .from("settings")
        .select("metadata")
        .eq("key", "partnership_email_config")
        .single();

      if (!emailConfigError && emailConfigData?.metadata) {
        setEmailConfig(emailConfigData.metadata as any);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContent = async () => {
    if (!content || !emailTemplate) return;
    
    setSaving(true);
    try {
      const { error: contentError } = await supabase
        .from("settings")
        .update({ metadata: content as any })
        .eq("key", "partnership_page_content");

      if (contentError) throw contentError;

      const { error: templateError } = await supabase
        .from("settings")
        .update({ metadata: emailTemplate as any })
        .eq("key", "partnership_email_template");

      if (templateError) throw templateError;

      toast.success("Contenu mis à jour");
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmailConfig = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("settings")
        .upsert({
          key: "partnership_email_config",
          value: "email_config",
          metadata: emailConfig as any,
        });

      if (error) throw error;
      toast.success("Configuration email sauvegardée");
    } catch (error) {
      console.error("Error saving email config:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBenefit = (index: number, field: string, value: string) => {
    if (!content) return;
    const newBenefits = [...content.benefits];
    newBenefits[index] = { ...newBenefits[index], [field]: value };
    setContent({ ...content, benefits: newBenefits });
  };

  const handleAddBenefit = () => {
    if (!content) return;
    setContent({
      ...content,
      benefits: [
        ...content.benefits,
        { title: "", description: "", icon: "Sparkles" },
      ],
    });
  };

  const handleRemoveBenefit = (index: number) => {
    if (!content) return;
    const newBenefits = content.benefits.filter((_, i) => i !== index);
    setContent({ ...content, benefits: newBenefits });
  };


  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <Tabs defaultValue="landing" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="landing">Landing Page</TabsTrigger>
        <TabsTrigger value="email-config">Config email</TabsTrigger>
        <TabsTrigger value="email">Template email</TabsTrigger>
      </TabsList>

      <TabsContent value="landing" className="space-y-6">
        <LandingPageEditor />
      </TabsContent>

      <TabsContent value="email-config" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration des emails</CardTitle>
            <CardDescription>
              Configurez les adresses de réception et l'envoi automatique d'emails via Resend
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Configuration de Resend</p>
              <p className="text-sm text-muted-foreground">
                Pour activer l'envoi automatique d'emails, assurez-vous d'avoir :
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>
                  Créé un compte sur{" "}
                  <a 
                    href="https://resend.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Resend.com
                  </a>
                </li>
                <li>
                  Vérifié votre domaine sur{" "}
                  <a 
                    href="https://resend.com/domains" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Resend Domains
                  </a>
                </li>
                <li>Configuré le secret RESEND_API_KEY (déjà fait ✓)</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="partnership-email">
                  Email pour les demandes de partenariat (employés)
                </Label>
                <Input
                  id="partnership-email"
                  type="email"
                  placeholder="partenariats@fincare.com"
                  value={emailConfig.partnership_requests_email}
                  onChange={(e) =>
                    setEmailConfig({ ...emailConfig, partnership_requests_email: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Recevez les demandes faites par les employés pour proposer FinCare à leur entreprise
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-email">
                  Email pour les demandes de contact (page partenariat)
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="contact@fincare.com"
                  value={emailConfig.contact_requests_email}
                  onChange={(e) =>
                    setEmailConfig({ ...emailConfig, contact_requests_email: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Recevez les demandes de contact depuis le formulaire de la page partenariat
                </p>
              </div>
            </div>

            <Button onClick={handleSaveEmailConfig} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Sauvegarde..." : "Sauvegarder la configuration"}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="email" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Template d'email pour les demandes de partenariat</CardTitle>
            <CardDescription>
              Personnalisez le message envoyé par les employés à leurs contacts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Objet de l'email</Label>
              <Input
                value={emailTemplate?.subject || ""}
                onChange={(e) =>
                  setEmailTemplate({ ...emailTemplate, subject: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Corps de l'email</Label>
              <div className="text-sm text-muted-foreground mb-2">
                Variables disponibles : {"{contact_first_name}"}, {"{sender_first_name}"}, {"{partnership_url}"}
              </div>
              <Textarea
                value={emailTemplate?.body || ""}
                onChange={(e) =>
                  setEmailTemplate({ ...emailTemplate, body: e.target.value })
                }
                rows={20}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

    </Tabs>
  );

}
