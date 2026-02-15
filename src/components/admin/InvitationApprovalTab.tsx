import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, XCircle, Clock, Building2, Mail, AlertTriangle, RefreshCw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface PendingInvitation {
  id: string;
  colleague_first_name: string;
  colleague_last_name: string;
  colleague_email: string;
  external_company_name: string | null;
  is_external: boolean;
  status: string;
  created_at: string;
  inviter_id: string;
  company_id: string;
  inviter?: { first_name: string | null; last_name: string | null; email: string } | null;
  company?: { name: string } | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  pending_admin_approval: { label: "En attente de validation", variant: "outline", icon: Clock },
  sent: { label: "Approuvé & envoyé", variant: "default", icon: CheckCircle },
  rejected: { label: "Refusé", variant: "destructive", icon: XCircle },
};

export const InvitationApprovalTab = () => {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  useEffect(() => {
    fetchInvitations();
  }, [filter]);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("colleague_invitations")
        .select("*, inviter:profiles!colleague_invitations_inviter_id_fkey(first_name, last_name, email), company:companies!colleague_invitations_company_id_fkey(name)")
        .order("created_at", { ascending: false });

      if (filter === "pending") {
        query = query.eq("status", "pending_admin_approval");
      } else {
        query = query.in("status", ["pending_admin_approval", "rejected"]).eq("is_external", true);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching invitations:", error);
        // Fallback without joins
        const { data: simpleData } = await supabase
          .from("colleague_invitations")
          .select("*")
          .eq("is_external", true)
          .order("created_at", { ascending: false });
        setInvitations((simpleData || []) as any);
      } else {
        setInvitations((data || []) as any);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (invitation: PendingInvitation) => {
    setActionLoading(invitation.id);
    try {
      // Update status
      const { error: updateError } = await supabase
        .from("colleague_invitations")
        .update({ status: "pending", updated_at: new Date().toISOString() })
        .eq("id", invitation.id);

      if (updateError) throw updateError;

      // Send the email
      const { error: emailError } = await supabase.functions.invoke("send-colleague-invitation", {
        body: { invitationId: invitation.id },
      });

      if (emailError) {
        console.error("Email send error:", emailError);
        toast.warning("Invitation approuvée mais l'email n'a pas pu être envoyé");
      } else {
        toast.success("Invitation approuvée et email envoyé !");
      }

      fetchInvitations();
    } catch (err: any) {
      console.error("Error approving:", err);
      toast.error("Erreur lors de l'approbation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from("colleague_invitations")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success("Invitation refusée");
      setRejectDialogId(null);
      fetchInvitations();
    } catch (err: any) {
      console.error("Error rejecting:", err);
      toast.error("Erreur lors du refus");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = invitations.filter(i => i.status === "pending_admin_approval").length;

  const getInviterName = (inv: PendingInvitation) => {
    if (inv.inviter && typeof inv.inviter === "object" && "first_name" in inv.inviter) {
      return `${inv.inviter.first_name || ""} ${inv.inviter.last_name || ""}`.trim() || inv.inviter.email;
    }
    return "—";
  };

  const getCompanyName = (inv: PendingInvitation) => {
    if (inv.company && typeof inv.company === "object" && "name" in inv.company) {
      return inv.company.name;
    }
    return "—";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Validation des invitations externes
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="ml-2">{pendingCount}</Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                Invitations de collaborateurs externes nécessitant une validation manuelle avant l'envoi de l'email.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("pending")}
              >
                <Clock className="h-4 w-4 mr-1" />
                En attente
              </Button>
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                Toutes
              </Button>
              <Button variant="ghost" size="icon" onClick={fetchInvitations}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune invitation en attente de validation</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expéditeur</TableHead>
                    <TableHead>Entreprise source</TableHead>
                    <TableHead>Invité</TableHead>
                    <TableHead>Entreprise déclarée</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => {
                    const statusInfo = statusConfig[inv.status] || statusConfig.pending_admin_approval;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium text-sm">
                          {getInviterName(inv)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {getCompanyName(inv)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{inv.colleague_first_name} {inv.colleague_last_name}</p>
                            <p className="text-xs text-muted-foreground">{inv.colleague_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium">{inv.external_company_name || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(inv.created_at), "d MMM yyyy HH:mm", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {inv.status === "pending_admin_approval" && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(inv)}
                                disabled={actionLoading === inv.id}
                                className="gap-1"
                              >
                                <Mail className="h-3.5 w-3.5" />
                                Approuver
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setRejectDialogId(inv.id)}
                                disabled={actionLoading === inv.id}
                                className="gap-1"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Refuser
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject confirmation dialog */}
      <AlertDialog open={!!rejectDialogId} onOpenChange={(open) => !open && setRejectDialogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refuser cette invitation ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'invitation ne sera pas envoyée et sera marquée comme refusée. L'expéditeur sera informé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rejectDialogId && handleReject(rejectDialogId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmer le refus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
