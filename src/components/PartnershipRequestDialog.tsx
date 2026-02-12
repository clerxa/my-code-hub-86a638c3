import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Send } from "lucide-react";

interface PartnershipRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  userFirstName?: string;
  userLastName?: string;
  userEmail?: string;
}

export function PartnershipRequestDialog({
  open,
  onOpenChange,
  companyId,
  companyName,
  userFirstName = "",
  userLastName = "",
  userEmail = "",
}: PartnershipRequestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    contactFirstName: "",
    contactLastName: "",
    contactEmail: "",
    message: "",
  });

  useEffect(() => {
    if (open) {
      fetchEmailTemplate();
    }
  }, [open]);

  const fetchEmailTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("metadata")
        .eq("key", "partnership_email_template")
        .single();

      if (error) throw error;
      
      if (data?.metadata) {
        const template = data.metadata as any;
        const body = template.body
          .replace("{contact_first_name}", formData.contactFirstName || "[Prénom]")
          .replace("{sender_first_name}", userFirstName)
          .replace("{partnership_url}", `${window.location.origin}/partenariat`);
        
        setEmailTemplate(template);
        setFormData(prev => ({ ...prev, message: body }));
      }
    } catch (error) {
      console.error("Error fetching email template:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      // Enregistrer la demande dans la base de données
      const { error: insertError } = await supabase
        .from("partnership_requests")
        .insert({
          user_id: user.id,
          company_id: companyId,
          sender_first_name: userFirstName,
          sender_last_name: userLastName,
          sender_email: userEmail,
          contact_first_name: formData.contactFirstName,
          contact_last_name: formData.contactLastName,
          contact_email: formData.contactEmail,
          message: formData.message,
          status: "pending",
        });

      if (insertError) throw insertError;

      // Préparer et envoyer l'email
      const subject = encodeURIComponent(emailTemplate?.subject || "Découvrez FinCare");
      const body = encodeURIComponent(formData.message);

      window.location.href = `mailto:${formData.contactEmail}?subject=${subject}&body=${body}`;

      toast.success("Demande de partenariat enregistrée");
      onOpenChange(false);
      
      // Reset form
      setFormData({
        contactFirstName: "",
        contactLastName: "",
        contactEmail: "",
        message: "",
      });
    } catch (error: any) {
      console.error("Error submitting partnership request:", error);
      toast.error(error.message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Proposer un partenariat officiel
          </DialogTitle>
          <DialogDescription>
            Renseignez les coordonnées de la personne à contacter dans votre entreprise
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="senderFirstName">Votre prénom</Label>
              <Input
                id="senderFirstName"
                value={userFirstName}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderLastName">Votre nom</Label>
              <Input
                id="senderLastName"
                value={userLastName}
                disabled
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderEmail">Votre email</Label>
            <Input
              id="senderEmail"
              value={userEmail}
              disabled
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold mb-4">Contact à contacter</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactFirstName">Prénom du destinataire *</Label>
                <Input
                  id="contactFirstName"
                  value={formData.contactFirstName}
                  onChange={(e) => {
                    setFormData({ ...formData, contactFirstName: e.target.value });
                    if (emailTemplate) {
                      const body = emailTemplate.body
                        .replace("{contact_first_name}", e.target.value || "[Prénom]")
                        .replace("{sender_first_name}", userFirstName)
                        .replace("{partnership_url}", `${window.location.origin}/partenariat`);
                      setFormData(prev => ({ ...prev, message: body }));
                    }
                  }}
                  placeholder="Ex: Marie"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactLastName">Nom du destinataire *</Label>
                <Input
                  id="contactLastName"
                  value={formData.contactLastName}
                  onChange={(e) => setFormData({ ...formData, contactLastName: e.target.value })}
                  placeholder="Ex: Dupont"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="contactEmail">Email du destinataire *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="Ex: marie.dupont@entreprise.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (vous pouvez le modifier)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Message..."
              rows={12}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                "Envoi..."
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
