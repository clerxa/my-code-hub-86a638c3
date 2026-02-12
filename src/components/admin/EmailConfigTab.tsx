import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Plus, X, Save, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Json } from "@/integrations/supabase/types";

interface EmailConfig {
  admin_emails: string[];
  sender_domain: string;
  sender_name: string;
}

const defaultConfig: EmailConfig = {
  admin_emails: ["xavier.clermont@fincare.fr"],
  sender_domain: "notifications.fincare.fr",
  sender_name: "FinCare",
};

export function EmailConfigTab() {
  const [config, setConfig] = useState<EmailConfig>(defaultConfig);
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("metadata")
        .eq("key", "email_admin_config")
        .maybeSingle();

      if (error) throw error;

      if (data?.metadata) {
        const metadata = data.metadata as unknown as EmailConfig;
        setConfig({
          ...defaultConfig,
          ...metadata,
        });
      }
    } catch (error) {
      console.error("Error fetching email config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from("settings")
        .select("key")
        .eq("key", "email_admin_config")
        .maybeSingle();

      const metadata: Json = {
        admin_emails: config.admin_emails,
        sender_domain: config.sender_domain,
        sender_name: config.sender_name,
      };

      let error;
      if (existing) {
        const result = await supabase
          .from("settings")
          .update({ metadata })
          .eq("key", "email_admin_config");
        error = result.error;
      } else {
        const result = await supabase.from("settings").insert({
          key: "email_admin_config",
          value: "email_admin_config",
          metadata,
        });
        error = result.error;
      }

      if (error) throw error;
      toast.success("Configuration email sauvegardée");
    } catch (error) {
      console.error("Error saving email config:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const addEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Format d'email invalide");
      return;
    }

    if (config.admin_emails.includes(email)) {
      toast.error("Cet email est déjà dans la liste");
      return;
    }

    setConfig({
      ...config,
      admin_emails: [...config.admin_emails, email],
    });
    setNewEmail("");
  };

  const removeEmail = (emailToRemove: string) => {
    if (config.admin_emails.length <= 1) {
      toast.error("Vous devez garder au moins un email admin");
      return;
    }

    setConfig({
      ...config,
      admin_emails: config.admin_emails.filter((e) => e !== emailToRemove),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuration Email</h2>
          <p className="text-muted-foreground">
            Gérez les destinataires des emails administratifs
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Tous les emails administratifs (demandes de partenariat, notifications, etc.) 
          seront envoyés à l'ensemble des adresses configurées ci-dessous.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Emails Administrateurs
          </CardTitle>
          <CardDescription>
            Ces adresses recevront toutes les notifications admin de l'application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current emails list */}
          <div className="flex flex-wrap gap-2">
            {config.admin_emails.map((email) => (
              <Badge
                key={email}
                variant="secondary"
                className="px-3 py-1.5 text-sm flex items-center gap-2"
              >
                {email}
                <button
                  onClick={() => removeEmail(email)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Add new email */}
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="nouvel.email@exemple.fr"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addEmail();
                }
              }}
              className="flex-1"
            />
            <Button onClick={addEmail} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration de l'expéditeur</CardTitle>
          <CardDescription>
            Paramètres du domaine d'envoi (configuration Resend)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sender_name">Nom de l'expéditeur</Label>
              <Input
                id="sender_name"
                value={config.sender_name}
                onChange={(e) =>
                  setConfig({ ...config, sender_name: e.target.value })
                }
                placeholder="FinCare"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sender_domain">Domaine d'envoi</Label>
              <Input
                id="sender_domain"
                value={config.sender_domain}
                onChange={(e) =>
                  setConfig({ ...config, sender_domain: e.target.value })
                }
                placeholder="notifications.fincare.fr"
              />
              <p className="text-xs text-muted-foreground">
                Format d'envoi: noreply@{config.sender_domain}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
