import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Calendar, Send, CheckCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useExpertBookingUrl } from "@/hooks/useExpertBookingUrl";

interface ReferralConfig {
  enabled: boolean;
  title: string;
  description: string;
  buttonText: string;
  successMessage: string;
  formFields: {
    colleagueName: { enabled: boolean; label: string; required: boolean };
    colleagueEmail: { enabled: boolean; label: string; required: boolean };
    colleaguePhone: { enabled: boolean; label: string; required: boolean };
    message: { enabled: boolean; label: string; required: boolean; placeholder: string };
  };
}

interface ReferralBlockProps {
  companyId: string;
  primaryColor?: string;
  blockConfig?: { title?: string; description?: string };
}

export const ReferralBlock = ({ 
  companyId, 
  primaryColor, 
  blockConfig 
}: ReferralBlockProps) => {
  const { user } = useAuth();
  const { embedCode: expertBookingEmbed, fallbackUrl: expertBookingFallback } = useExpertBookingUrl(companyId);
  const [config, setConfig] = useState<ReferralConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState<{ first_name: string; last_name: string; email: string } | null>(null);
  
  const [formData, setFormData] = useState({
    colleagueName: "",
    colleagueEmail: "",
    colleaguePhone: "",
    message: "",
  });

  useEffect(() => {
    fetchConfig();
    fetchUserProfile();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "referral_block_config")
        .maybeSingle();

      if (data?.value) {
        setConfig(JSON.parse(data.value));
      }
    } catch (error) {
      console.error("Error fetching referral config:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", user.id)
        .single();
      if (data) setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !user) return;

    // Validation
    const fields = config.formFields;
    if (fields.colleagueName.enabled && fields.colleagueName.required && !formData.colleagueName.trim()) {
      toast.error("Veuillez renseigner le nom du collègue");
      return;
    }
    if (fields.colleagueEmail.enabled && fields.colleagueEmail.required && !formData.colleagueEmail.trim()) {
      toast.error("Veuillez renseigner l'email du collègue");
      return;
    }

    setSubmitting(true);
    try {
      // Sauvegarder la demande de parrainage
      const { error } = await supabase.from("referral_requests").insert({
        referrer_id: user.id,
        company_id: companyId,
        colleague_name: formData.colleagueName,
        colleague_email: formData.colleagueEmail,
        colleague_phone: formData.colleaguePhone || null,
        message: formData.message || null,
        expert_booking_url: expertBookingEmbed || expertBookingFallback,
      });

      if (error) throw error;

      setSuccess(true);
      toast.success(config.successMessage);
      
      // Reset après 2 secondes
      setTimeout(() => {
        setDialogOpen(false);
        setSuccess(false);
        setFormData({ colleagueName: "", colleagueEmail: "", colleaguePhone: "", message: "" });
      }, 2000);
    } catch (error: any) {
      console.error("Error submitting referral:", error);
      toast.error("Erreur lors de l'envoi de la demande");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !config || !config.enabled) return null;

  // Vérifier s'il y a un lien de RDV expert configuré
  if (!expertBookingEmbed && !expertBookingFallback) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: primaryColor }}>
            <Users className="h-5 w-5" />
            {blockConfig?.title || config.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {blockConfig?.description || config.description}
          </p>
          <Button 
            onClick={() => setDialogOpen(true)}
            style={{ backgroundColor: primaryColor }}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {config.buttonText}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {config.title}
            </DialogTitle>
            <DialogDescription>
              Proposez à un collègue de prendre rendez-vous avec un expert
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">{config.successMessage}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Informations de l'expéditeur */}
              {userProfile && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    De la part de: <span className="font-medium text-foreground">
                      {userProfile.first_name} {userProfile.last_name}
                    </span>
                  </p>
                </div>
              )}

              {config.formFields.colleagueName.enabled && (
                <div className="space-y-2">
                  <Label>
                    {config.formFields.colleagueName.label}
                    {config.formFields.colleagueName.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input
                    value={formData.colleagueName}
                    onChange={(e) => setFormData({ ...formData, colleagueName: e.target.value })}
                    placeholder="Prénom Nom"
                    required={config.formFields.colleagueName.required}
                  />
                </div>
              )}

              {config.formFields.colleagueEmail.enabled && (
                <div className="space-y-2">
                  <Label>
                    {config.formFields.colleagueEmail.label}
                    {config.formFields.colleagueEmail.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input
                    type="email"
                    value={formData.colleagueEmail}
                    onChange={(e) => setFormData({ ...formData, colleagueEmail: e.target.value })}
                    placeholder="collegue@entreprise.com"
                    required={config.formFields.colleagueEmail.required}
                  />
                </div>
              )}

              {config.formFields.colleaguePhone.enabled && (
                <div className="space-y-2">
                  <Label>
                    {config.formFields.colleaguePhone.label}
                    {config.formFields.colleaguePhone.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input
                    type="tel"
                    value={formData.colleaguePhone}
                    onChange={(e) => setFormData({ ...formData, colleaguePhone: e.target.value })}
                    placeholder="06 12 34 56 78"
                    required={config.formFields.colleaguePhone.required}
                  />
                </div>
              )}

              {config.formFields.message.enabled && (
                <div className="space-y-2">
                  <Label>
                    {config.formFields.message.label}
                    {config.formFields.message.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={config.formFields.message.placeholder}
                    required={config.formFields.message.required}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1" style={{ backgroundColor: primaryColor }}>
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Envoi..." : "Envoyer"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
