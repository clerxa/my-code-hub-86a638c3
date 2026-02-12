import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus, Send, CheckCircle } from "lucide-react";
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
  };
}

interface InviteColleagueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  primaryColor?: string;
  isSpouseInvite?: boolean;
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
  },
};

export const InviteColleagueDialog = ({ 
  open,
  onOpenChange,
  companyId,
  companyName,
  primaryColor = "#3b82f6",
  isSpouseInvite = false,
}: InviteColleagueDialogProps) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<InviteConfig>(defaultConfig);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState<{ first_name: string; last_name: string; email: string } | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (open) {
      fetchConfig();
      fetchUserProfile();
    }
  }, [open]);

  const fetchConfig = async () => {
    try {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "invite_colleague_config")
        .maybeSingle();

      if (data?.value) {
        const parsed = JSON.parse(data.value);
        setConfig({ ...defaultConfig, ...parsed, formFields: { ...defaultConfig.formFields, ...parsed.formFields } });
      }
    } catch (error) {
      console.error("Error fetching invite config:", error);
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
      const { data: invitation, error } = await supabase.from("colleague_invitations").insert({
        inviter_id: user.id,
        company_id: companyId,
        colleague_first_name: formData.firstName,
        colleague_last_name: formData.lastName,
        colleague_email: formData.email,
        colleague_phone: formData.phone || null,
        message: null,
      }).select().single();

      if (error) throw error;

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

      await supabase
        .from("profiles")
        .update({ a_invite_collegue: true })
        .eq("id", user.id);

      setSuccess(true);
      toast.success(config.successMessage);
      
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setFormData({ firstName: "", lastName: "", email: "", phone: "" });
      }, 2000);
    } catch (error: any) {
      console.error("Error submitting invitation:", error);
      toast.error("Erreur lors de l'envoi de l'invitation");
    } finally {
      setSubmitting(false);
    }
  };

  const fields = config.formFields;

  const dialogTitle = isSpouseInvite ? "Invitez votre conjoint(e)" : config.title;
  const dialogDescription = isSpouseInvite 
    ? `Votre conjoint(e) peut aussi bénéficier de l'accompagnement FinCare via ${companyName}`
    : `Invitez un collègue à rejoindre ${companyName} sur FinCare`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {dialogDescription}
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

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
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
  );
};
