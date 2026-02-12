import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Send, Loader2 } from "lucide-react";

interface Company {
  id: string;
  name: string;
  partnership_type: string | null;
}

interface BetaInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Company[];
  onSuccess: () => void;
}

export function BetaInviteDialog({
  open,
  onOpenChange,
  companies,
  onSuccess,
}: BetaInviteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    emails: "",
    companyId: "",
    firstName: "",
    lastName: "",
    sendEmail: true,
  });

  const handleSubmit = async () => {
    if (!formData.emails.trim()) {
      toast.error("Veuillez entrer au moins une adresse email");
      return;
    }

    if (!formData.companyId) {
      toast.error("Veuillez sélectionner une entreprise");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expirée");
        return;
      }

      // Parse emails (comma, semicolon, or newline separated)
      const emails = formData.emails
        .split(/[,;\n]/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e && e.includes("@"));

      if (emails.length === 0) {
        toast.error("Aucune adresse email valide trouvée");
        return;
      }

      const response = await supabase.functions.invoke("invite-beta-users", {
        body: {
          emails,
          companyId: formData.companyId,
          firstName: formData.firstName || null,
          lastName: formData.lastName || null,
          sendEmail: formData.sendEmail,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      if (result.success) {
        const successCount = result.results.filter((r: any) => r.success).length;
        const failCount = result.results.filter((r: any) => !r.success).length;

        if (failCount === 0) {
          toast.success(`${successCount} utilisateur(s) invité(s) avec succès`);
        } else {
          toast.warning(
            `${successCount} invité(s), ${failCount} erreur(s). Voir console.`
          );
          console.log("Détails:", result.results);
        }

        setFormData({
          emails: "",
          companyId: "",
          firstName: "",
          lastName: "",
          sendEmail: true,
        });
        onOpenChange(false);
        onSuccess();
      } else {
        throw new Error(result.error || "Erreur lors de l'invitation");
      }
    } catch (error: any) {
      console.error("Error inviting beta users:", error);
      toast.error(error.message || "Erreur lors de l'invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Inviter des utilisateurs Beta
          </DialogTitle>
          <DialogDescription>
            Créez des comptes et liez-les directement à une entreprise pour vos
            tests beta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="company">Entreprise *</Label>
            <Select
              value={formData.companyId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, companyId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une entreprise" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                    {company.partnership_type &&
                      company.partnership_type.toLowerCase() !== "aucun" && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({company.partnership_type})
                        </span>
                      )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emails">Adresses email *</Label>
            <Textarea
              id="emails"
              placeholder="email1@example.com&#10;email2@example.com&#10;..."
              value={formData.emails}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, emails: e.target.value }))
              }
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Séparez les adresses par une virgule, point-virgule ou nouvelle
              ligne.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom (optionnel)</Label>
              <Input
                id="firstName"
                placeholder="Jean"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom (optionnel)</Label>
              <Input
                id="lastName"
                placeholder="Dupont"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Si renseignés, ces noms seront appliqués à tous les utilisateurs
            créés.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Inviter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
