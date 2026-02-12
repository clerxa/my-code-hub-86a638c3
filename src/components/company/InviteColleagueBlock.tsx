import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus, Send, CheckCircle, Mail } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface InviteConfig {
  enabled: boolean;
  title: string;
  description: string;
  buttonText: string;
  successMessage: string;
  formFields: {
    firstName: { enabled: boolean; label: string; required: boolean };
    lastName: { enabled: boolean; label: string; required: boolean };
    email: { enabled: boolean; label: string; required: boolean };
    phone: { enabled: boolean; label: string; required: boolean };
    message: { enabled: boolean; label: string; required: boolean; placeholder: string };
  };
}

interface InviteColleagueBlockProps {
  companyId: string;
  companyName: string;
  primaryColor?: string;
  blockConfig?: { title?: string; description?: string };
}

const defaultConfig: InviteConfig = {
  enabled: true,
  title: "Invitez vos collègues",
  description: "Invitez vos collègues à rejoindre l'application et à profiter des avantages FinCare.",
  buttonText: "Inviter un collègue",
  successMessage: "L'invitation a été envoyée avec succès !",
  formFields: {
    firstName: { enabled: true, label: "Prénom", required: true },
    lastName: { enabled: true, label: "Nom", required: true },
    email: { enabled: true, label: "Email", required: true },
    phone: { enabled: true, label: "Téléphone", required: false },
    message: { enabled: true, label: "Message personnalisé", required: false, placeholder: "Je te recommande de découvrir FinCare..." },
  },
};

export const InviteColleagueBlock = ({ 
  companyId,
  companyName,
  primaryColor,
  blockConfig 
}: InviteColleagueBlockProps) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<InviteConfig>(defaultConfig);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState<{ first_name: string; last_name: string; email: string } | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
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
        .eq("key", "invite_colleague_config")
        .maybeSingle();

      if (data?.value) {
        const parsed = JSON.parse(data.value);
        // Merge with default to ensure all fields exist
        setConfig({ ...defaultConfig, ...parsed, formFields: { ...defaultConfig.formFields, ...parsed.formFields } });
      }
    } catch (error) {
      console.error("Error fetching invite config:", error);
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

    const fields = config.formFields;
    if (fields.firstName.required && !formData.firstName.trim()) {
      toast.error("Veuillez remplir le prénom");
      return;
    }
    if (fields.lastName.required && !formData.lastName.trim()) {
      toast.error("Veuillez remplir le nom");
      return;
    }
    if (fields.email.required && !formData.email.trim()) {
      toast.error("Veuillez remplir l'email");
      return;
    }

    setSubmitting(true);
    try {
      // Sauvegarder l'invitation
      const { data: invitation, error } = await supabase.from("colleague_invitations").insert({
        inviter_id: user.id,
        company_id: companyId,
        colleague_first_name: formData.firstName,
        colleague_last_name: formData.lastName,
        colleague_email: formData.email,
        colleague_phone: formData.phone || null,
        message: formData.message || null,
      }).select().single();

      if (error) throw error;

      // Envoyer l'email via edge function
      try {
        const { error: emailError } = await supabase.functions.invoke("send-colleague-invitation", {
          body: { invitationId: invitation.id },
        });

        if (emailError) {
          console.error("Email send error:", emailError);
          toast.warning("Invitation enregistrée mais l'email n'a pas pu être envoyé");
        }
      } catch (emailErr) {
        console.error("Email function error:", emailErr);
      }

      // Mettre à jour le profil pour indiquer qu'il a invité quelqu'un
      await supabase
        .from("profiles")
        .update({ a_invite_collegue: true })
        .eq("id", user.id);

      setSuccess(true);
      toast.success(config.successMessage);
      
      setTimeout(() => {
        setDialogOpen(false);
        setSuccess(false);
        setFormData({ firstName: "", lastName: "", email: "", phone: "", message: "" });
      }, 2000);
    } catch (error: any) {
      console.error("Error submitting invitation:", error);
      toast.error("Erreur lors de l'envoi de l'invitation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !config || !config.enabled) return null;

  const fields = config.formFields;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: primaryColor }}>
            <UserPlus className="h-5 w-5" />
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
            <Mail className="h-4 w-4 mr-2" />
            {config.buttonText}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {config.title}
            </DialogTitle>
            <DialogDescription>
              Invitez un collègue à rejoindre {companyName} sur FinCare
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">{config.successMessage}</p>
              <p className="text-sm text-muted-foreground mt-2">Un email a été envoyé à votre collègue</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {userProfile && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Invitation envoyée par: <span className="font-medium text-foreground">
                      {userProfile.first_name} {userProfile.last_name}
                    </span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {fields.firstName.enabled && (
                  <div className="space-y-2">
                    <Label>
                      {fields.firstName.label}
                      {fields.firstName.required && <span className="text-destructive"> *</span>}
                    </Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Prénom"
                      required={fields.firstName.required}
                    />
                  </div>
                )}
                {fields.lastName.enabled && (
                  <div className="space-y-2">
                    <Label>
                      {fields.lastName.label}
                      {fields.lastName.required && <span className="text-destructive"> *</span>}
                    </Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Nom"
                      required={fields.lastName.required}
                    />
                  </div>
                )}
              </div>

              {fields.email.enabled && (
                <div className="space-y-2">
                  <Label>
                    {fields.email.label}
                    {fields.email.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="collegue@entreprise.com"
                    required={fields.email.required}
                  />
                </div>
              )}

              {fields.phone.enabled && (
                <div className="space-y-2">
                  <Label>
                    {fields.phone.label}
                    {fields.phone.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="06 12 34 56 78"
                    required={fields.phone.required}
                  />
                </div>
              )}

              {fields.message.enabled && (
                <div className="space-y-2">
                  <Label>
                    {fields.message.label}
                    {fields.message.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={fields.message.placeholder}
                    required={fields.message.required}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1" style={{ backgroundColor: primaryColor }}>
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Envoi..." : "Envoyer l'invitation"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
