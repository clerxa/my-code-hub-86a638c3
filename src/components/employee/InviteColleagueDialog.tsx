import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { UserPlus, Send, CheckCircle, AlertTriangle, Building2 } from "lucide-react";
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

const PERSONAL_DOMAINS = [
  "gmail.com", "googlemail.com", "outlook.com", "outlook.fr", "hotmail.com", "hotmail.fr",
  "yahoo.com", "yahoo.fr", "live.com", "live.fr", "msn.com", "aol.com", "icloud.com",
  "me.com", "mac.com", "orange.fr", "wanadoo.fr", "free.fr", "sfr.fr", "laposte.net",
  "bbox.fr", "numericable.fr", "protonmail.com", "protonmail.ch", "pm.me",
  "gmx.com", "gmx.fr", "yandex.com", "mail.com", "zoho.com",
];

const getDomain = (email: string): string => {
  return email.split("@")[1]?.toLowerCase() || "";
};

const isPersonalDomain = (domain: string): boolean => {
  return PERSONAL_DOMAINS.includes(domain);
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

  // Domain mismatch flow
  const [showDomainAlert, setShowDomainAlert] = useState(false);
  const [isExternal, setIsExternal] = useState(false);
  const [externalCompanyName, setExternalCompanyName] = useState("");
  const [emailError, setEmailError] = useState("");

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
      // Reset state
      setIsExternal(false);
      setExternalCompanyName("");
      setEmailError("");
      setShowDomainAlert(false);
      setSuccess(false);
      setFormData({ firstName: "", lastName: "", email: "", phone: "" });
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

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) return null;
    const domain = getDomain(email);
    if (!domain) return null;
    if (isPersonalDomain(domain)) {
      return "Les adresses email personnelles (Gmail, Outlook, Yahoo…) ne sont pas acceptées. Veuillez utiliser un email professionnel.";
    }
    return null;
  };

  const handleEmailChange = (email: string) => {
    setFormData({ ...formData, email });
    setIsExternal(false);
    setExternalCompanyName("");
    const error = validateEmail(email);
    setEmailError(error || "");
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !user || !userProfile) return;

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
    if (emailError) {
      toast.error(emailError);
      return;
    }

    const invitedDomain = getDomain(formData.email);
    const userDomain = getDomain(userProfile.email);

    // If domains differ, ask for confirmation
    if (invitedDomain && userDomain && invitedDomain !== userDomain) {
      setShowDomainAlert(true);
    } else {
      // Same domain → send immediately
      submitInvitation(false, "");
    }
  };

  const handleDomainConfirmYes = () => {
    // Yes, it's a colleague from the same company (just different email domain)
    setShowDomainAlert(false);
    submitInvitation(false, "");
  };

  const handleDomainConfirmNo = () => {
    // Not a colleague → external, needs company name
    setShowDomainAlert(false);
    setIsExternal(true);
  };

  const handleExternalSubmit = () => {
    if (!externalCompanyName.trim()) {
      toast.error("Veuillez indiquer le nom de l'entreprise du collaborateur");
      return;
    }
    submitInvitation(true, externalCompanyName.trim());
  };

  const submitInvitation = async (external: boolean, extCompanyName: string) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const status = external ? "pending_admin_approval" : "pending";

      const { data: invitation, error } = await supabase.from("colleague_invitations").insert({
        inviter_id: user.id,
        company_id: companyId,
        colleague_first_name: formData.firstName,
        colleague_last_name: formData.lastName,
        colleague_email: formData.email,
        colleague_phone: formData.phone || null,
        message: null,
        status,
        is_external: external,
        external_company_name: external ? extCompanyName : null,
      } as any).select().single();

      if (error) throw error;

      // Only send email immediately if not external
      if (!external) {
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
      }

      await supabase
        .from("profiles")
        .update({ a_invite_collegue: true })
        .eq("id", user.id);

      setSuccess(true);

      if (external) {
        toast.success("Invitation soumise pour validation par un administrateur");
      } else {
        toast.success(config.successMessage);
      }

      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setFormData({ firstName: "", lastName: "", email: "", phone: "" });
        setIsExternal(false);
        setExternalCompanyName("");
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {dialogTitle}
            </DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">
                {isExternal ? "Invitation soumise !" : config.successMessage}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {isExternal
                  ? "Un administrateur validera votre demande avant l'envoi de l'email."
                  : "Un email a été envoyé à votre collègue"}
              </p>
            </div>
          ) : isExternal ? (
            // Step 2: External company name input
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <Building2 className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Invitation externe</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cette invitation sera soumise à un administrateur pour validation avant l'envoi.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">{formData.firstName} {formData.lastName}</p>
                <p className="text-xs text-muted-foreground">{formData.email}</p>
              </div>

              <div className="space-y-2">
                <Label>
                  Nom de l'entreprise du collaborateur <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={externalCompanyName}
                  onChange={(e) => setExternalCompanyName(e.target.value)}
                  placeholder="Ex: Acme Corp"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsExternal(false)} className="flex-1">
                  Retour
                </Button>
                <Button onClick={handleExternalSubmit} disabled={submitting} className="flex-1" style={{ backgroundColor: primaryColor }}>
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Envoi..." : "Soumettre pour validation"}
                </Button>
              </div>
            </div>
          ) : (
            // Step 1: Main form
            <form onSubmit={handlePreSubmit} className="space-y-4">
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
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="collegue@entreprise.com"
                    required={fields.email.required}
                    className={emailError ? "border-destructive" : ""}
                  />
                  {emailError && (
                    <div className="flex items-start gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p className="text-xs">{emailError}</p>
                    </div>
                  )}
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
                <Button type="submit" disabled={submitting || !!emailError} className="flex-1" style={{ backgroundColor: primaryColor }}>
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Envoi..." : "Envoyer l'invitation"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Domain mismatch confirmation */}
      <AlertDialog open={showDomainAlert} onOpenChange={setShowDomainAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Domaine email différent
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                L'adresse <strong>{formData.email}</strong> utilise un domaine différent du vôtre (<strong>{userProfile ? getDomain(userProfile.email) : ""}</strong>).
              </p>
              <p>Est-ce bien un collègue de votre entreprise <strong>{companyName}</strong> ?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleDomainConfirmNo} className="sm:flex-1">
              Non, c'est un externe
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDomainConfirmYes} className="sm:flex-1">
              Oui, c'est un collègue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
