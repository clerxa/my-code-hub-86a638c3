import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Bell, Calendar, Eye, Mail, Save, Clock, Building2, User, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Json } from "@/integrations/supabase/types";

interface ReminderConfig {
  enabled: boolean;
  thresholds: {
    "M-1": boolean;
    "S-2": boolean;
    "S-1": boolean;
    "J-1": boolean;
  };
}

interface UpcomingWebinar {
  company_name: string;
  company_id: string;
  module_title: string;
  module_id: number;
  session_date: string;
  contacts: Array<{ id: string; nom: string; email: string }>;
  sent_reminders: Array<{ reminder_type: string; sent_at: string }>;
}

const defaultConfig: ReminderConfig = {
  enabled: true,
  thresholds: { "M-1": true, "S-2": true, "S-1": true, "J-1": true },
};

const THRESHOLDS_META = [
  { key: "M-1" as const, label: "M-1 (1 mois avant)", days: 30 },
  { key: "S-2" as const, label: "S-2 (2 semaines avant)", days: 14 },
  { key: "S-1" as const, label: "S-1 (1 semaine avant)", days: 7 },
  { key: "J-1" as const, label: "J-1 (veille)", days: 1 },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getFirstName(nom: string): string {
  return nom.trim().split(/\s+/)[0] || nom;
}

export function WebinarReminderConfig() {
  const [config, setConfig] = useState<ReminderConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upcomingWebinars, setUpcomingWebinars] = useState<UpcomingWebinar[]>([]);
  const [previewWebinar, setPreviewWebinar] = useState<string>("");
  const [previewContact, setPreviewContact] = useState<string>("");
  const [previewThreshold, setPreviewThreshold] = useState<string>("J-1");

  useEffect(() => {
    fetchConfig();
    fetchUpcomingWebinars();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await supabase
        .from("settings")
        .select("metadata")
        .eq("key", "webinar_reminder_config")
        .maybeSingle();

      if (data?.metadata) {
        const meta = data.metadata as unknown as ReminderConfig;
        setConfig({ ...defaultConfig, ...meta });
      }
    } catch (error) {
      console.error("Error fetching reminder config:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingWebinars = async () => {
    try {
      const { data: selections } = await supabase
        .from("company_webinar_selections")
        .select(`
          company_id, module_id, session_id,
          companies!company_webinar_selections_company_id_fkey(id, name),
          webinar_sessions!company_webinar_selections_session_id_fkey(id, session_date),
          modules!company_webinar_selections_module_id_fkey(id, title)
        `);

      if (!selections) return;

      const webinars: UpcomingWebinar[] = [];
      const now = new Date();

      for (const sel of selections) {
        const s = sel as any;
        if (!s.webinar_sessions?.session_date) continue;
        if (new Date(s.webinar_sessions.session_date) <= now) continue;

        // Get contacts for this company
        const { data: contacts } = await supabase
          .from("company_contacts")
          .select("id, nom, email")
          .eq("company_id", s.companies.id);

        // Get sent reminders
        const { data: reminders } = await supabase
          .from("webinar_reminder_logs")
          .select("reminder_type, sent_at, contact_id")
          .eq("company_id", s.companies.id)
          .eq("session_id", s.webinar_sessions.id);

        webinars.push({
          company_name: s.companies.name,
          company_id: s.companies.id,
          module_title: s.modules.title,
          module_id: sel.module_id,
          session_date: s.webinar_sessions.session_date,
          contacts: contacts || [],
          sent_reminders: reminders || [],
        });
      }

      webinars.sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
      setUpcomingWebinars(webinars);

      if (webinars.length > 0) {
        setPreviewWebinar(`${webinars[0].company_id}|${webinars[0].module_id}`);
        if (webinars[0].contacts.length > 0) {
          setPreviewContact(webinars[0].contacts[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching upcoming webinars:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("settings")
        .select("key")
        .eq("key", "webinar_reminder_config")
        .maybeSingle();

      const metadata: Json = {
        enabled: config.enabled,
        thresholds: config.thresholds,
      };

      const error = existing
        ? (await supabase.from("settings").update({ metadata }).eq("key", "webinar_reminder_config")).error
        : (await supabase.from("settings").insert({ key: "webinar_reminder_config", value: "webinar_reminder_config", metadata })).error;

      if (error) throw error;
      toast.success("Configuration des rappels sauvegardée");
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const selectedWebinar = upcomingWebinars.find(
    (w) => `${w.company_id}|${w.module_id}` === previewWebinar
  );
  const selectedContactObj = selectedWebinar?.contacts.find((c) => c.id === previewContact);

  const thresholdMeta = THRESHOLDS_META.find((t) => t.key === previewThreshold);
  const fakeDaysLeft = thresholdMeta?.days || 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Rappels Webinar
          </h2>
          <p className="text-muted-foreground">
            Envoi automatique d'emails de rappel aux contacts entreprise avant chaque webinar
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      {/* Toggle principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Activation des rappels automatiques
            </span>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
            />
          </CardTitle>
          <CardDescription>
            {config.enabled
              ? "Les rappels sont actifs — les contacts recevront des emails avant chaque webinar verrouillé"
              : "Les rappels sont désactivés — aucun email ne sera envoyé"}
          </CardDescription>
        </CardHeader>
        {config.enabled && (
          <CardContent>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Échéances actives</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {THRESHOLDS_META.map((t) => (
                  <div
                    key={t.key}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-card"
                  >
                    <Switch
                      checked={config.thresholds[t.key]}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          thresholds: { ...config.thresholds, [t.key]: checked },
                        })
                      }
                      id={`threshold-${t.key}`}
                    />
                    <Label htmlFor={`threshold-${t.key}`} className="text-sm cursor-pointer">
                      {t.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Webinars à venir — état des rappels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Webinars à venir — État des rappels
          </CardTitle>
          <CardDescription>
            {upcomingWebinars.length} webinar{upcomingWebinars.length !== 1 ? "s" : ""} verrouillé{upcomingWebinars.length !== 1 ? "s" : ""} à venir
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingWebinars.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Aucun webinar à venir avec session verrouillée
            </p>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {upcomingWebinars.map((w, i) => {
                  const dl = daysUntil(w.session_date);
                  return (
                    <div key={i} className="p-4 rounded-lg border bg-muted/30 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{w.module_title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Building2 className="h-3 w-3" />
                            {w.company_name}
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            {formatDate(w.session_date)}
                          </div>
                        </div>
                        <Badge variant={dl <= 1 ? "destructive" : dl <= 7 ? "default" : "secondary"}>
                          J-{dl}
                        </Badge>
                      </div>

                      {/* Contacts */}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {w.contacts.length} contact{w.contacts.length !== 1 ? "s" : ""}:
                        {w.contacts.map((c) => c.nom).join(", ")}
                      </div>

                      {/* Sent reminders */}
                      <div className="flex flex-wrap gap-1.5">
                        {THRESHOLDS_META.map((t) => {
                          const sent = w.sent_reminders.some(
                            (r) => r.reminder_type === t.key
                          );
                          return (
                            <Badge
                              key={t.key}
                              variant={sent ? "default" : "outline"}
                              className={`text-xs ${
                                sent
                                  ? "bg-green-500/10 text-green-600 border-green-500/30"
                                  : "opacity-50"
                              }`}
                            >
                              {t.key} {sent ? "✓" : "—"}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Prévisualisation de l'email
          </CardTitle>
          <CardDescription>
            Sélectionnez un webinar, un contact et une échéance pour voir le rendu exact
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingWebinars.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Aucun webinar à venir pour la prévisualisation
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Webinar</Label>
                  <Select value={previewWebinar} onValueChange={(v) => {
                    setPreviewWebinar(v);
                    const w = upcomingWebinars.find((w) => `${w.company_id}|${w.module_id}` === v);
                    if (w?.contacts[0]) setPreviewContact(w.contacts[0].id);
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {upcomingWebinars.map((w, i) => (
                        <SelectItem key={i} value={`${w.company_id}|${w.module_id}`}>
                          {w.module_title} — {w.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Contact</Label>
                  <Select value={previewContact} onValueChange={setPreviewContact}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(selectedWebinar?.contacts || []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nom} ({c.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Échéance</Label>
                  <Select value={previewThreshold} onValueChange={setPreviewThreshold}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {THRESHOLDS_META.map((t) => (
                        <SelectItem key={t.key} value={t.key}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Email preview */}
              {selectedWebinar && selectedContactObj && (
                <div className="border rounded-lg overflow-hidden">
                  {/* Email header bar */}
                  <div className="bg-muted px-4 py-2 border-b text-xs text-muted-foreground space-y-1">
                    <p><strong>De :</strong> FinCare &lt;noreply@notifications.fincare.fr&gt;</p>
                    <p><strong>À :</strong> {selectedContactObj.email}</p>
                    <p>
                      <strong>Objet :</strong> 📅 Rappel : Webinar "{selectedWebinar.module_title}" dans {fakeDaysLeft} jour{fakeDaysLeft > 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Email body */}
                  <div style={{ backgroundColor: "#f8f9fa", padding: "24px" }}>
                    <div
                      style={{
                        maxWidth: 600,
                        margin: "0 auto",
                        backgroundColor: "#ffffff",
                        borderRadius: 12,
                        overflow: "hidden",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                          padding: "32px 40px",
                          textAlign: "center",
                        }}
                      >
                        <h1 style={{ color: "#ffffff", fontSize: 22, margin: 0, fontWeight: 600 }}>
                          📅 Rappel Webinar
                        </h1>
                        <p style={{ color: "#e2b75e", fontSize: 14, margin: "8px 0 0", fontWeight: 500 }}>
                          {selectedWebinar.module_title}
                        </p>
                      </div>

                      {/* Body */}
                      <div style={{ padding: 40 }}>
                        <p style={{ fontSize: 16, color: "#333", lineHeight: 1.6, margin: "0 0 20px" }}>
                          Bonjour {getFirstName(selectedContactObj.nom)},
                        </p>
                        <p style={{ fontSize: 16, color: "#333", lineHeight: 1.6, margin: "0 0 20px" }}>
                          Votre prochain webinar est prévu le{" "}
                          <strong>{formatDate(selectedWebinar.session_date)}</strong>, soit dans{" "}
                          <strong>
                            {fakeDaysLeft} jour{fakeDaysLeft > 1 ? "s" : ""}
                          </strong>
                          .
                        </p>
                        <p style={{ fontSize: 16, color: "#333", lineHeight: 1.6, margin: "0 0 24px" }}>
                          N'oubliez pas d'envoyer la relance de communication aux salariés de{" "}
                          <strong>{selectedWebinar.company_name}</strong>.
                        </p>
                        <p style={{ fontSize: 16, color: "#333", lineHeight: 1.6, margin: "0 0 24px" }}>
                          Vous retrouverez les éléments de communication via ce lien :
                        </p>

                        <div style={{ textAlign: "center", padding: "8px 0 32px" }}>
                          <a
                            href={`/company/${selectedWebinar.company_id}/dashboard/webinar/${selectedWebinar.module_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-block",
                              backgroundColor: "#e2b75e",
                              color: "#1a1a2e",
                              fontSize: 16,
                              fontWeight: 600,
                              textDecoration: "none",
                              padding: "14px 32px",
                              borderRadius: 8,
                            }}
                          >
                            Accéder à la page du webinar
                          </a>
                        </div>

                        <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "24px 0" }} />

                        <p style={{ fontSize: 16, color: "#333", lineHeight: 1.6, margin: "0 0 8px" }}>
                          FinCare par Perlib vous remercie pour votre confiance et se tient à votre
                          disposition pour tout renseignement complémentaire.
                        </p>
                        <p style={{ fontSize: 16, color: "#333", lineHeight: 1.6, margin: "24px 0 0", fontWeight: 500 }}>
                          Xavier de FinCare
                        </p>
                      </div>

                      {/* Footer */}
                      <div
                        style={{
                          backgroundColor: "#f8f9fa",
                          padding: "20px 40px",
                          textAlign: "center",
                          borderTop: "1px solid #e5e7eb",
                        }}
                      >
                        <p style={{ fontSize: 12, color: "#999", margin: 0 }}>
                          FinCare est l'application d'éducation financière de Perlib.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
