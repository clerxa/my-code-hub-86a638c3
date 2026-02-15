import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, UserPlus, Mail, Eye, BarChart3, Clock, CheckCircle, XCircle, Handshake, Building2, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InviteColleagueConfig {
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

interface EmailTemplate {
  subject: string;
  body: string;
  buttonLink: string;
  buttonText: string;
}

interface ColleagueInvitation {
  id: string;
  colleague_first_name: string;
  colleague_last_name: string;
  colleague_email: string;
  status: string;
  created_at: string;
  email_sent_at: string | null;
  email_opened_at: string | null;
  link_clicked_at: string | null;
  registered_at: string | null;
  is_external: boolean | null;
  external_company_name: string | null;
  inviter: { first_name: string | null; last_name: string | null; email: string } | null;
  company: { name: string } | null;
}

interface PartnershipRequest {
  id: string;
  contact_email: string;
  contact_first_name: string | null;
  contact_last_name: string | null;
  status: string;
  created_at: string;
  sender_first_name: string | null;
  sender_last_name: string | null;
  company: { name: string } | null;
}

interface B2BContactRequest {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
  phone: string | null;
  company_size: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

const defaultInviteConfig: InviteColleagueConfig = {
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

const defaultEmailTemplate: EmailTemplate = {
  subject: "{{inviter_name}} vous invite à rejoindre FinCare",
  buttonLink: "{{registration_link}}",
  buttonText: "Rejoindre FinCare",
  body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px;">
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="color: {{primary_color}}; font-family: Arial, sans-serif; font-size: 24px; margin: 0 0 20px 0;">Bonjour {{colleague_first_name}},</h1>
              <p style="color: #333333; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">{{inviter_name}} vous invite à rejoindre <strong>{{company_name}}</strong> sur FinCare.</p>
              <p style="color: #333333; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; margin: 0 0 10px 0;">FinCare est une plateforme d'éducation financière qui vous permettra de :</p>
              <ul style="color: #333333; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; margin: 0 0 30px 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Simuler vos économies d'impôts</li>
                <li style="margin-bottom: 8px;">Suivre des formations sur la gestion de patrimoine</li>
                <li style="margin-bottom: 8px;">Prendre rendez-vous avec un expert financier</li>
              </ul>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 8px; background-color: {{primary_color}};">
                    <a href="{{button_link}}" target="_blank" style="display: inline-block; padding: 15px 30px; font-family: Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: bold;">{{button_text}}</a>
                  </td>
                </tr>
              </table>
              <p style="color: #666666; font-family: Arial, sans-serif; font-size: 12px; line-height: 18px; margin: 30px 0 0 0;">Ce lien est unique et permet de suivre votre inscription.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  pending_admin_approval: { label: "⏳ Validation requise", variant: "outline" },
  sent: { label: "Envoyé", variant: "outline" },
  opened: { label: "Reçu", variant: "default" },
  clicked: { label: "Cliqué", variant: "default" },
  registered: { label: "Inscrit", variant: "default" },
  accepted: { label: "Accepté", variant: "default" },
  declined: { label: "Refusé", variant: "destructive" },
  rejected: { label: "Refusé", variant: "destructive" },
  completed: { label: "Terminé", variant: "default" },
};

export const ReferralBlockTab = () => {
  const [inviteConfig, setInviteConfig] = useState<InviteColleagueConfig>(defaultInviteConfig);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>(defaultEmailTemplate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Tracking data
  const [invitations, setInvitations] = useState<ColleagueInvitation[]>([]);
  const [partnerships, setPartnerships] = useState<PartnershipRequest[]>([]);
  const [b2bContacts, setB2bContacts] = useState<B2BContactRequest[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchConfigs();
    fetchTrackingData();
  }, []);

  const fetchConfigs = async () => {
    try {
      const [inviteRes, emailRes] = await Promise.all([
        supabase.from("settings").select("value").eq("key", "invite_colleague_config").maybeSingle(),
        supabase.from("settings").select("value").eq("key", "invite_colleague_email_template").maybeSingle(),
      ]);

      if (inviteRes.data?.value) {
        const parsed = JSON.parse(inviteRes.data.value);
        setInviteConfig({ ...defaultInviteConfig, ...parsed, formFields: { ...defaultInviteConfig.formFields, ...parsed.formFields } });
      }
      if (emailRes.data?.value) {
        setEmailTemplate(JSON.parse(emailRes.data.value));
      }
    } catch (error) {
      console.error("Error fetching configs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingData = async () => {
    setTrackingLoading(true);
    try {
      // Fetch colleague invitations (no FK on inviter_id, so we enrich manually)
      const { data: invData, error: invError } = await supabase
        .from("colleague_invitations")
        .select("*")
        .order("created_at", { ascending: false });

      if (invError) {
        console.error("Error fetching invitations:", invError);
        setInvitations([]);
      } else {
        // Enrich with inviter profile and company name
        const enriched = await Promise.all(
          (invData || []).map(async (inv: any) => {
            const [profileRes, companyRes] = await Promise.all([
              inv.inviter_id
                ? supabase.from("profiles").select("first_name, last_name, email").eq("id", inv.inviter_id).maybeSingle()
                : Promise.resolve({ data: null }),
              inv.company_id
                ? supabase.from("companies").select("name").eq("id", inv.company_id).maybeSingle()
                : Promise.resolve({ data: null }),
            ]);
            return {
              ...inv,
              inviter: profileRes.data || null,
              company: companyRes.data || null,
            };
          })
        );
        setInvitations(enriched as any);
      }

      // Fetch partnership requests (employee referrals)
      const { data: partData, error: partError } = await supabase
        .from("partnership_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (partError) {
        console.error("Error fetching partnerships:", partError);
      } else {
        // Enrich with company names
        const enriched = await Promise.all(
          (partData || []).map(async (req: any) => {
            if (req.company_id) {
              const { data: companyData } = await supabase
                .from("companies")
                .select("name")
                .eq("id", req.company_id)
                .single();
              return { ...req, company: companyData };
            }
            return { ...req, company: null };
          })
        );
        setPartnerships(enriched as any);
      }

      // Fetch B2B contact requests (landing page form)
      const { data: b2bData, error: b2bError } = await supabase
        .from("partnership_contact_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (b2bError) {
        console.error("Error fetching B2B contacts:", b2bError);
      } else {
        setB2bContacts((b2bData || []) as B2BContactRequest[]);
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error);
    } finally {
      setTrackingLoading(false);
    }
  };

  const updateInvitationStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("colleague_invitations")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success("Statut mis à jour");
      fetchTrackingData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const approveExternalInvitation = async (inv: ColleagueInvitation) => {
    try {
      // Update status to pending first
      const { error: updateError } = await supabase
        .from("colleague_invitations")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("id", inv.id);

      if (updateError) throw updateError;

      // Trigger email send
      const { error: emailError } = await supabase.functions.invoke("send-colleague-invitation", {
        body: { invitationId: inv.id },
      });

      if (emailError) {
        console.error("Email send error:", emailError);
        toast.warning("Invitation approuvée mais l'email n'a pas pu être envoyé");
      } else {
        toast.success("Invitation approuvée et email envoyé !");
      }
      fetchTrackingData();
    } catch (error) {
      console.error("Error approving invitation:", error);
      toast.error("Erreur lors de l'approbation");
    }
  };

  const rejectExternalInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("colleague_invitations")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success("Invitation refusée");
      fetchTrackingData();
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      toast.error("Erreur lors du refus");
    }
  };

  const updatePartnershipStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("partnership_requests")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success("Statut mis à jour");
      fetchTrackingData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const updateB2bContactStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("partnership_contact_requests")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success("Statut mis à jour");
      fetchTrackingData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const saveInviteConfig = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("settings").upsert({
        key: "invite_colleague_config",
        value: JSON.stringify(inviteConfig),
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

      if (error) throw error;
      toast.success("Configuration des invitations sauvegardée");
    } catch (error) {
      console.error("Error saving invite config:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const saveEmailTemplate = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("settings").upsert({
        key: "invite_colleague_email_template",
        value: JSON.stringify(emailTemplate),
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

      if (error) throw error;
      toast.success("Template d'email sauvegardé");
    } catch (error) {
      console.error("Error saving email template:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const getPreviewHtml = () => {
    const previewButtonLink = emailTemplate.buttonLink === "{{registration_link}}" 
      ? "https://fincare.app/signup?invitation=xxx&company=xxx"
      : emailTemplate.buttonLink;
    
    return emailTemplate.body
      .replace(/\{\{inviter_name\}\}/g, "Jean Dupont")
      .replace(/\{\{company_name\}\}/g, "Acme Corp")
      .replace(/\{\{colleague_first_name\}\}/g, "Marie")
      .replace(/\{\{colleague_last_name\}\}/g, "Martin")
      .replace(/\{\{primary_color\}\}/g, "#3b82f6")
      .replace(/\{\{button_link\}\}/g, previewButtonLink)
      .replace(/\{\{button_text\}\}/g, emailTemplate.buttonText)
      .replace(/\{\{registration_link\}\}/g, previewButtonLink)
      .replace(/\{\{message\}\}/g, "Je te recommande cette super plateforme !")
      .replace(/\{\{#if message\}\}([\s\S]*?)\{\{\/if\}\}/g, "$1");
  };

  const filteredInvitations = statusFilter === "all" 
    ? invitations 
    : invitations.filter(inv => inv.status === statusFilter || (statusFilter === "sent" && inv.email_sent_at));

  const filteredPartnerships = statusFilter === "all"
    ? partnerships
    : partnerships.filter(p => p.status === statusFilter);

  const filteredB2bContacts = statusFilter === "all"
    ? b2bContacts
    : b2bContacts.filter(c => c.status === statusFilter);

  const renderStatus = (status: string) => {
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tracking">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tracking" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Suivi
          </TabsTrigger>
          <TabsTrigger value="invite" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Template email
          </TabsTrigger>
        </TabsList>

        {/* Tab: Suivi */}
        <TabsContent value="tracking" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending_admin_approval">⏳ Validation requise</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="sent">Envoyé</SelectItem>
                  <SelectItem value="opened">Reçu</SelectItem>
                  <SelectItem value="clicked">Cliqué</SelectItem>
                  <SelectItem value="registered">Inscrit</SelectItem>
                  <SelectItem value="declined">Refusé</SelectItem>
                  <SelectItem value="rejected">Refusé (externe)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={fetchTrackingData} disabled={trackingLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${trackingLoading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>

          {/* Invitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invitations de collègues ({filteredInvitations.length})
                {invitations.filter(i => i.status === "pending_admin_approval").length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {invitations.filter(i => i.status === "pending_admin_approval").length} à valider
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Collègues invités à rejoindre la plateforme FinCare
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trackingLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                </div>
              ) : filteredInvitations.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Aucune invitation</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invité</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Invité par</TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Ext.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Envoyé</TableHead>
                      <TableHead>Reçu</TableHead>
                      <TableHead>Cliqué</TableHead>
                      <TableHead>Inscrit</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvitations.map((inv) => (
                      <TableRow key={inv.id} className={inv.status === "pending_admin_approval" ? "bg-amber-500/5" : ""}>
                        <TableCell className="font-medium">
                          {inv.colleague_first_name} {inv.colleague_last_name}
                        </TableCell>
                        <TableCell>{inv.colleague_email}</TableCell>
                        <TableCell>
                          {inv.inviter ? (
                            <div>
                              <p className="font-medium text-sm">{`${inv.inviter.first_name || ""} ${inv.inviter.last_name || ""}`.trim() || "—"}</p>
                              <p className="text-xs text-muted-foreground">{inv.inviter.email}</p>
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>{inv.company?.name || "-"}</TableCell>
                        <TableCell>
                          {inv.is_external ? (
                            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                              <Building2 className="h-3 w-3" />
                              {inv.external_company_name || "Externe"}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(inv.created_at), "d MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {inv.email_sent_at ? (
                            <Badge variant="outline" className="text-green-600">
                              {format(new Date(inv.email_sent_at), "d MMM HH:mm", { locale: fr })}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">-</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {inv.email_opened_at ? (
                            <Badge variant="outline" className="text-blue-600">
                              {format(new Date(inv.email_opened_at), "d MMM HH:mm", { locale: fr })}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">-</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {inv.link_clicked_at ? (
                            <Badge variant="outline" className="text-purple-600">
                              {format(new Date(inv.link_clicked_at), "d MMM HH:mm", { locale: fr })}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">-</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {inv.registered_at ? (
                            <Badge variant="default" className="bg-green-600">
                              {format(new Date(inv.registered_at), "d MMM HH:mm", { locale: fr })}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">-</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {renderStatus(inv.status)}
                        </TableCell>
                        <TableCell>
                          {inv.status === "pending_admin_approval" ? (
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="default" onClick={() => approveExternalInvitation(inv)} className="h-7 px-2 text-xs gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Approuver
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => rejectExternalInvitation(inv.id)} className="h-7 px-2 text-xs gap-1">
                                <XCircle className="h-3 w-3" />
                                Refuser
                              </Button>
                            </div>
                          ) : (
                            <Select
                              value={inv.status}
                              onValueChange={(value) => updateInvitationStatus(inv.id, value)}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">En attente</SelectItem>
                                <SelectItem value="sent">Envoyé</SelectItem>
                                <SelectItem value="opened">Reçu</SelectItem>
                                <SelectItem value="clicked">Cliqué</SelectItem>
                                <SelectItem value="registered">Inscrit</SelectItem>
                                <SelectItem value="declined">Refusé</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Partnership Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Handshake className="h-5 w-5" />
                Demandes de partenariat ({filteredPartnerships.length})
              </CardTitle>
              <CardDescription>
                Propositions de partenariat soumises par les employés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trackingLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                </div>
              ) : filteredPartnerships.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Aucune demande de partenariat</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Proposé par</TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPartnerships.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell className="font-medium">
                          {part.contact_first_name} {part.contact_last_name}
                        </TableCell>
                        <TableCell>{part.contact_email}</TableCell>
                        <TableCell>
                          {part.sender_first_name} {part.sender_last_name}
                        </TableCell>
                        <TableCell>{part.company?.name || "-"}</TableCell>
                        <TableCell>
                          {format(new Date(part.created_at), "d MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>{renderStatus(part.status)}</TableCell>
                        <TableCell>
                          <Select
                            value={part.status}
                            onValueChange={(value) => updatePartnershipStatus(part.id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">En attente</SelectItem>
                              <SelectItem value="accepted">Accepté</SelectItem>
                              <SelectItem value="declined">Refusé</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* B2B Contact Requests (Landing Page) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Demandes de démo B2B ({filteredB2bContacts.length})
              </CardTitle>
              <CardDescription>
                Demandes de contact depuis la page partenariat B2B
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trackingLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                </div>
              ) : filteredB2bContacts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Aucune demande B2B</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Taille</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredB2bContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.phone || "-"}</TableCell>
                        <TableCell>{contact.company}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{contact.company_size || "-"}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={contact.message || ""}>
                          {contact.message || "-"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(contact.created_at), "d MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>{renderStatus(contact.status)}</TableCell>
                        <TableCell>
                          <Select
                            value={contact.status}
                            onValueChange={(value) => updateB2bContactStatus(contact.id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">En attente</SelectItem>
                              <SelectItem value="contacted">Contacté</SelectItem>
                              <SelectItem value="completed">Terminé</SelectItem>
                              <SelectItem value="declined">Refusé</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configuration */}
        <TabsContent value="invite" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Invitation de collègues
                  </CardTitle>
                  <CardDescription>
                    Permet aux collaborateurs d'inviter leurs collègues à rejoindre l'application
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="invite-enabled">Activer</Label>
                  <Switch
                    id="invite-enabled"
                    checked={inviteConfig.enabled}
                    onCheckedChange={(checked) => setInviteConfig({ ...inviteConfig, enabled: checked })}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Titre du bloc</Label>
                  <Input
                    value={inviteConfig.title}
                    onChange={(e) => setInviteConfig({ ...inviteConfig, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Texte du bouton</Label>
                  <Input
                    value={inviteConfig.buttonText}
                    onChange={(e) => setInviteConfig({ ...inviteConfig, buttonText: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={inviteConfig.description}
                  onChange={(e) => setInviteConfig({ ...inviteConfig, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Message de succès</Label>
                <Input
                  value={inviteConfig.successMessage}
                  onChange={(e) => setInviteConfig({ ...inviteConfig, successMessage: e.target.value })}
                />
              </div>

              {/* Configuration des champs du formulaire */}
              <div className="space-y-4">
                <h4 className="font-medium">Champs du formulaire</h4>
                
                {Object.entries(inviteConfig.formFields).map(([key, field]) => (
                  <Card key={key} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={field.enabled}
                          onCheckedChange={(checked) =>
                            setInviteConfig({
                              ...inviteConfig,
                              formFields: {
                                ...inviteConfig.formFields,
                                [key]: { ...field, enabled: checked },
                              },
                            })
                          }
                        />
                        <span className="font-medium">
                          {key === "firstName" ? "Prénom" :
                           key === "lastName" ? "Nom" :
                           key === "email" ? "Email" :
                           key === "phone" ? "Téléphone" : "Message"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Obligatoire</Label>
                        <Switch
                          checked={field.required}
                          onCheckedChange={(checked) =>
                            setInviteConfig({
                              ...inviteConfig,
                              formFields: {
                                ...inviteConfig.formFields,
                                [key]: { ...field, required: checked },
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                    <Input
                      value={field.label}
                      onChange={(e) =>
                        setInviteConfig({
                          ...inviteConfig,
                          formFields: {
                            ...inviteConfig.formFields,
                            [key]: { ...field, label: e.target.value },
                          },
                        })
                      }
                      placeholder="Label du champ"
                    />
                  </Card>
                ))}
              </div>

              <Button onClick={saveInviteConfig} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Template email */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Template d'email d'invitation
                  </CardTitle>
                  <CardDescription>
                    Personnalisez l'email envoyé aux collègues invités
                  </CardDescription>
                </div>
                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Prévisualiser
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Prévisualisation de l'email</DialogTitle>
                    </DialogHeader>
                    <div className="border rounded-lg p-4 bg-white">
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Objet:</strong> {emailTemplate.subject.replace(/\{\{inviter_name\}\}/g, "Jean Dupont")}
                      </p>
                      <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <h5 className="font-medium mb-2">Variables disponibles</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <code className="bg-background px-2 py-1 rounded">{"{{inviter_name}}"}</code>
                  <code className="bg-background px-2 py-1 rounded">{"{{colleague_first_name}}"}</code>
                  <code className="bg-background px-2 py-1 rounded">{"{{colleague_last_name}}"}</code>
                  <code className="bg-background px-2 py-1 rounded">{"{{company_name}}"}</code>
                  <code className="bg-background px-2 py-1 rounded">{"{{primary_color}}"}</code>
                  <code className="bg-background px-2 py-1 rounded">{"{{registration_link}}"}</code>
                  <code className="bg-background px-2 py-1 rounded">{"{{button_link}}"}</code>
                  <code className="bg-background px-2 py-1 rounded">{"{{button_text}}"}</code>
                  <code className="bg-background px-2 py-1 rounded">{"{{message}}"}</code>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Utilisez <code>{"{{#if message}}...{{/if}}"}</code> pour afficher du contenu conditionnel
                </p>
              </div>

              <div className="space-y-2">
                <Label>Objet de l'email</Label>
                <Input
                  value={emailTemplate.subject}
                  onChange={(e) => setEmailTemplate({ ...emailTemplate, subject: e.target.value })}
                  placeholder="{{inviter_name}} vous invite à rejoindre FinCare"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Lien de redirection du bouton</Label>
                  <Input
                    value={emailTemplate.buttonLink}
                    onChange={(e) => setEmailTemplate({ ...emailTemplate, buttonLink: e.target.value })}
                    placeholder="{{registration_link}} ou URL personnalisée"
                  />
                  <p className="text-xs text-muted-foreground">
                    Utilisez <code>{"{{registration_link}}"}</code> pour le lien d'inscription automatique, ou entrez une URL personnalisée
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Texte du bouton</Label>
                  <Input
                    value={emailTemplate.buttonText}
                    onChange={(e) => setEmailTemplate({ ...emailTemplate, buttonText: e.target.value })}
                    placeholder="Rejoindre FinCare"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Corps de l'email (HTML)</Label>
                <Textarea
                  value={emailTemplate.body}
                  onChange={(e) => setEmailTemplate({ ...emailTemplate, body: e.target.value })}
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>

              <Button onClick={saveEmailTemplate} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Sauvegarde..." : "Sauvegarder le template"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
