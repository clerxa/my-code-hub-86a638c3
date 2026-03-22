import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ExternalLink, Mail, Video, PlayCircle, CheckCircle2, UserCheck, UserX, XCircle } from "lucide-react";
import { AddToCalendarButton } from "@/components/webinar/AddToCalendarButton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CommunicationKitTab } from "@/components/admin/CommunicationKitTab";
import { useAuth } from "@/components/AuthProvider";

interface ValidatedWebinar {
  module_id: number;
  title: string;
  description: string;
  session_date: string;
  registration_url: string | null;
  duration: string | null;
}

interface WebinarRegistration {
  module_id: number;
  registered_at: string | null;
  joined_at: string | null;
  completed_at: string | null;
  registration_status: string;
}

interface MyWebinarsBlockProps {
  companyId?: string;
  onUpcomingCountChange?: (count: number) => void;
}

export const MyWebinarsBlock = ({ companyId, onUpcomingCountChange }: MyWebinarsBlockProps) => {
  const { user } = useAuth();
  const [webinars, setWebinars] = useState<ValidatedWebinar[]>([]);
  const [registrations, setRegistrations] = useState<Map<number, WebinarRegistration>>(new Map());
  const [loading, setLoading] = useState(true);
  const [isContactEntreprise, setIsContactEntreprise] = useState(false);
  const [selectedWebinarId, setSelectedWebinarId] = useState<number | null>(null);
  const [resolvedCompanyId, setResolvedCompanyId] = useState<string | undefined>(companyId);

  const now = new Date();
  const upcomingWebinars = webinars.filter(w => new Date(w.session_date) >= now);
  const pastWebinars = webinars.filter(w => new Date(w.session_date) < now);

  useEffect(() => {
    fetchWebinars();
    checkUserRole();
  }, [companyId, user]);

  useEffect(() => {
    onUpcomingCountChange?.(upcomingWebinars.length);
  }, [upcomingWebinars.length, onUpcomingCountChange]);

  const checkUserRole = async () => {
    if (!user) return;
    try {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsContactEntreprise(roleData?.role === "contact_entreprise" || roleData?.role === "admin");
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  };

  const fetchWebinars = async () => {
    try {
      let targetCompanyId = companyId;

      if (!targetCompanyId) {
        if (!user) {
          setLoading(false);
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user.id)
          .single();

        if (!profile?.company_id) {
          setLoading(false);
          return;
        }
        targetCompanyId = profile.company_id;
        setResolvedCompanyId(targetCompanyId);
      }

      // Fetch validated webinar selections for this company (locked by contact entreprise)
      const { data: selections, error: selError } = await supabase
        .from("company_webinar_selections")
        .select(`
          module_id,
          modules(id, title, description, duration),
          webinar_sessions(id, session_date, registration_url)
        `)
        .eq("company_id", targetCompanyId);

      if (selError) throw selError;

      const items: ValidatedWebinar[] = [];
      for (const sel of (selections || [])) {
        const s = sel as any;
        if (!s.webinar_sessions?.session_date) continue;
        items.push({
          module_id: s.module_id,
          title: s.modules?.title || "Webinar",
          description: s.modules?.description || "",
          session_date: s.webinar_sessions.session_date,
          registration_url: s.webinar_sessions.registration_url || null,
          duration: s.modules?.duration || null,
        });
      }

      // Sort by date
      items.sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
      setWebinars(items);

      // Fetch user's registrations
      if (user && items.length > 0) {
        const moduleIds = items.map(w => w.module_id);
        const { data: regData } = await supabase
          .from("webinar_registrations")
          .select("module_id, registered_at, joined_at, completed_at, registration_status")
          .eq("user_id", user.id)
          .in("module_id", moduleIds);

        if (regData) {
          const regMap = new Map<number, WebinarRegistration>();
          regData.forEach(reg => regMap.set(reg.module_id, reg));
          setRegistrations(regMap);
        }
      }
    } catch (error) {
      console.error("Error fetching webinars:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRegistrationBadge = (webinar: ValidatedWebinar) => {
    const registration = registrations.get(webinar.module_id);
    
    if (!registration) {
      return (
        <Badge variant="outline" className="shrink-0 text-muted-foreground border-muted-foreground/30">
          <UserX className="h-3 w-3 mr-1" />
          Non inscrit
        </Badge>
      );
    }

    if (registration.joined_at || registration.registration_status === 'completed' || registration.registration_status === 'joined') {
      return (
        <Badge variant="default" className="shrink-0 bg-green-600 hover:bg-green-700">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          A participé
        </Badge>
      );
    }

    if (registration.registered_at) {
      const isPast = new Date(webinar.session_date) < now;
      if (isPast) {
        return (
          <Badge variant="destructive" className="shrink-0">
            <XCircle className="h-3 w-3 mr-1" />
            Inscrit - Non participé
          </Badge>
        );
      }
      return (
        <Badge variant="secondary" className="shrink-0 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
          <UserCheck className="h-3 w-3 mr-1" />
          Inscrit
        </Badge>
      );
    }

    return null;
  };

  const renderWebinarCard = (webinar: ValidatedWebinar, isPast: boolean) => {
    const registration = registrations.get(webinar.module_id);
    
    return (
      <div
        key={`${webinar.module_id}-${webinar.session_date}`}
        className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">{webinar.title}</h4>
            <div 
              className="text-sm text-muted-foreground line-clamp-2 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: webinar.description }}
            />
          </div>
          <div className="flex flex-col items-end gap-1">
            {isPast ? (
              <Badge variant="secondary" className="shrink-0">
                <PlayCircle className="h-3 w-3 mr-1" />
                Replay
              </Badge>
            ) : (
              <Badge variant="default" className="shrink-0 bg-green-600 hover:bg-green-700">
                <Video className="h-3 w-3 mr-1" />
                À venir
              </Badge>
            )}
            {getRegistrationBadge(webinar)}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(webinar.session_date), "d MMMM yyyy", { locale: fr })}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{format(new Date(webinar.session_date), "HH:mm", { locale: fr })}</span>
          </div>
          {webinar.duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{webinar.duration}</span>
            </div>
          )}
        </div>

        {registration && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2 space-y-1">
            {registration.registered_at && (
              <p>📝 Inscrit le {format(new Date(registration.registered_at), "d MMMM yyyy à HH:mm", { locale: fr })}</p>
            )}
            {registration.joined_at && (
              <p>✅ A rejoint le webinaire le {format(new Date(registration.joined_at), "d MMMM yyyy à HH:mm", { locale: fr })}</p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {webinar.registration_url && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(webinar.registration_url!, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {isPast ? "Voir le replay" : (registration?.registered_at ? "Accéder au webinaire" : "S'inscrire")}
            </Button>
          )}
          
          {isContactEntreprise && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedWebinarId(webinar.module_id)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Kit Communication
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Kit de Communication - {webinar.title}</DialogTitle>
                </DialogHeader>
                <CommunicationKitTab preselectedModuleId={webinar.module_id} preselectedCompanyId={resolvedCompanyId} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Mes webinaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Mes webinaires
        </CardTitle>
        <CardDescription>
          Retrouvez tous vos webinaires validés par votre entreprise
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {webinars.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucun webinaire validé pour le moment
          </p>
        ) : (
          <>
            {upcomingWebinars.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Prochains webinaires
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {upcomingWebinars.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {upcomingWebinars.map((webinar) => renderWebinarCard(webinar, false))}
                </div>
              </div>
            )}

            {upcomingWebinars.length > 0 && pastWebinars.length > 0 && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Terminés</span>
                </div>
              </div>
            )}

            {pastWebinars.length > 0 && (
              <div className="space-y-3">
                {upcomingWebinars.length === 0 && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Webinaires passés
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {pastWebinars.length}
                    </Badge>
                  </div>
                )}
                <div className="space-y-3 opacity-80">
                  {pastWebinars.map((webinar) => renderWebinarCard(webinar, true))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
