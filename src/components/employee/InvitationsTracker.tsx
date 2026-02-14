import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Users, Handshake, Clock, CheckCircle, XCircle, Mail, Send, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { InviteColleagueDialog } from "./InviteColleagueDialog";

interface ColleagueInvitation {
  id: string;
  colleague_first_name: string;
  colleague_last_name: string;
  colleague_email: string;
  colleague_phone: string | null;
  status: string;
  created_at: string;
  email_sent_at: string | null;
  email_opened_at: string | null;
  link_clicked_at: string | null;
  registered_at: string | null;
}

interface PartnershipRequest {
  id: string;
  contact_email: string;
  contact_first_name: string | null;
  contact_last_name: string | null;
  status: string;
  created_at: string;
  company: { name: string } | null;
}

interface InvitationsTrackerProps {
  userId: string;
  companyId?: string;
  companyName?: string;
  blockConfig?: { title?: string; description?: string };
  hasActivePartnership?: boolean;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", icon: Clock, variant: "secondary" },
  sent: { label: "Envoyé", icon: Mail, variant: "secondary" },
  opened: { label: "Email ouvert", icon: Mail, variant: "outline" },
  clicked: { label: "Lien cliqué", icon: CheckCircle, variant: "default" },
  accepted: { label: "Accepté", icon: CheckCircle, variant: "default" },
  registered: { label: "Inscrit", icon: CheckCircle, variant: "default" },
  declined: { label: "Refusé", icon: XCircle, variant: "destructive" },
  completed: { label: "Terminé", icon: CheckCircle, variant: "default" },
};

export const InvitationsTracker = ({ userId, companyId, companyName, blockConfig, hasActivePartnership = false }: InvitationsTrackerProps) => {
  const [invitations, setInvitations] = useState<ColleagueInvitation[]>([]);
  const [partnerships, setPartnerships] = useState<PartnershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userId, companyId]);

  const fetchData = async () => {
    try {
      // Fetch colleague invitations
      const { data: invData } = await supabase
        .from("colleague_invitations")
        .select("*")
        .eq("inviter_id", userId)
        .order("created_at", { ascending: false });

      if (invData) setInvitations(invData as ColleagueInvitation[]);

      // Fetch partnership requests
      const { data: partData } = await supabase
        .from("partnership_requests")
        .select("*, company:companies(name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (partData) setPartnerships(partData as any);
    } catch (error) {
      console.error("Error fetching invitations data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalCount = invitations.length + partnerships.length;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderStatus = (status: string) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Determine if we need tabs or just show one section
  const hasInvitations = invitations.length > 0;
  const hasPartnerships = partnerships.length > 0;
  const needsTabs = hasInvitations && hasPartnerships;

  // Empty state
  if (totalCount === 0) {
    return (
      <>
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  {blockConfig?.title || "Mes invitations"}
                </CardTitle>
                <CardDescription className="mt-1 sm:mt-2 text-xs sm:text-sm">
                  {blockConfig?.description || (hasActivePartnership 
                    ? "Cette page vous permet de suivre toutes vos invitations envoyées à vos collègues. Invitez vos collègues à rejoindre FinCare et gagnez des points bonus !"
                    : "Cette page vous permet de suivre toutes vos invitations envoyées à vos collègues ainsi que vos propositions de partenariat faites à votre entreprise. Invitez vos collègues à rejoindre FinCare et gagnez des points bonus !"
                  )}
                </CardDescription>
              </div>
              <Button onClick={() => setInviteDialogOpen(true)} className="shrink-0 w-full sm:w-auto" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Inviter un collègue
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Send className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Aucune invitation pour le moment</p>
              <p className="text-sm text-muted-foreground mb-4">
                Invitez vos collègues à rejoindre FinCare pour gagner des points supplémentaires !
              </p>
              <Button variant="outline" onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Envoyer ma première invitation
              </Button>
            </div>
          </CardContent>
        </Card>
        {companyId && companyName && (
          <InviteColleagueDialog 
            open={inviteDialogOpen} 
            onOpenChange={(open) => {
              setInviteDialogOpen(open);
              if (!open) fetchData();
            }}
            companyId={companyId}
            companyName={companyName}
          />
        )}
      </>
    );
  }

  return (
    <>
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-wrap">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="truncate">{blockConfig?.title || "Mes invitations"}</span>
              <Badge variant="secondary">{totalCount}</Badge>
            </CardTitle>
            <CardDescription className="mt-1 sm:mt-2 text-xs sm:text-sm">
              {blockConfig?.description || (hasActivePartnership 
                ? "Cette page vous permet de suivre toutes vos invitations envoyées à vos collègues. Invitez vos collègues à rejoindre FinCare et gagnez des points bonus !"
                : "Cette page vous permet de suivre toutes vos invitations envoyées à vos collègues ainsi que vos propositions de partenariat faites à votre entreprise. Invitez vos collègues à rejoindre FinCare et gagnez des points bonus !"
              )}
            </CardDescription>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)} className="shrink-0 w-full sm:w-auto" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Inviter un collègue
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {needsTabs ? (
          <Tabs defaultValue="invitations" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="invitations" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invitations ({invitations.length})
              </TabsTrigger>
              <TabsTrigger value="partnerships" className="gap-2">
                <Handshake className="h-4 w-4" />
                Partenariats ({partnerships.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="invitations" className="space-y-3">
              <p className="text-xs text-muted-foreground mb-2 p-2 bg-muted/30 rounded">
                📧 Collègues que vous avez invités à rejoindre la plateforme FinCare
              </p>
              {invitations.map((inv) => (
                <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">
                      {inv.colleague_first_name} {inv.colleague_last_name}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{inv.colleague_email}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Invité le {format(new Date(inv.created_at), "d MMM yyyy", { locale: fr })}
                      {inv.email_sent_at && (
                        <> • Email envoyé</>
                      )}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {renderStatus(inv.status)}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="partnerships" className="space-y-3">
              <p className="text-xs text-muted-foreground mb-2 p-2 bg-muted/30 rounded">
                🤝 Propositions de partenariat entreprise que vous avez soumises
              </p>
              {partnerships.map((part) => (
                <div key={part.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">
                      {part.contact_first_name} {part.contact_last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{part.contact_email}</p>
                    <p className="text-xs text-muted-foreground">
                      Proposé le {format(new Date(part.created_at), "d MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  {renderStatus(part.status)}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-3">
            {hasInvitations && (
              <>
                <p className="text-xs text-muted-foreground mb-2 p-2 bg-muted/30 rounded">
                  📧 Collègues que vous avez invités à rejoindre la plateforme FinCare
                </p>
                {invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="font-medium">
                        {inv.colleague_first_name} {inv.colleague_last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{inv.colleague_email}</p>
                      <p className="text-xs text-muted-foreground">
                        Invité le {format(new Date(inv.created_at), "d MMMM yyyy", { locale: fr })}
                        {inv.email_sent_at && (
                          <> • Email envoyé le {format(new Date(inv.email_sent_at), "d MMM", { locale: fr })}</>
                        )}
                      </p>
                    </div>
                    {renderStatus(inv.status)}
                  </div>
                ))}
              </>
            )}
            {hasPartnerships && (
              <>
                <p className="text-xs text-muted-foreground mb-2 p-2 bg-muted/30 rounded">
                  🤝 Propositions de partenariat entreprise que vous avez soumises
                </p>
                {partnerships.map((part) => (
                  <div key={part.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="font-medium">
                        {part.contact_first_name} {part.contact_last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{part.contact_email}</p>
                      <p className="text-xs text-muted-foreground">
                        Proposé le {format(new Date(part.created_at), "d MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    {renderStatus(part.status)}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    {companyId && companyName && (
      <InviteColleagueDialog 
        open={inviteDialogOpen} 
        onOpenChange={(open) => {
          setInviteDialogOpen(open);
          if (!open) fetchData();
        }}
        companyId={companyId}
        companyName={companyName}
      />
    )}
    </>
  );
};
