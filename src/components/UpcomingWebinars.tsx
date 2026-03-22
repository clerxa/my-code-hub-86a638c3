import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ExternalLink, Mail } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CommunicationKitTab } from "@/components/admin/CommunicationKitTab";
import { AddToCalendarButton } from "@/components/webinar/AddToCalendarButton";

interface ValidatedWebinar {
  module_id: number;
  title: string;
  description: string;
  session_date: string;
  registration_url: string | null;
  duration: string | null;
}

interface UpcomingWebinarsProps {
  companyId?: string;
  showCard?: boolean;
}

export const UpcomingWebinars = ({ companyId, showCard = true }: UpcomingWebinarsProps) => {
  const [webinars, setWebinars] = useState<ValidatedWebinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [isContactEntreprise, setIsContactEntreprise] = useState(false);
  const [selectedWebinarId, setSelectedWebinarId] = useState<number | null>(null);
  const [resolvedCompanyId, setResolvedCompanyId] = useState<string | undefined>(companyId);

  useEffect(() => {
    fetchUpcomingWebinars();
    checkUserRole();
  }, [companyId]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
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

  const fetchUpcomingWebinars = async () => {
    try {
      let targetCompanyId = companyId;

      if (!targetCompanyId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user.id)
          .single();

        if (!profile?.company_id) { setLoading(false); return; }
        targetCompanyId = profile.company_id;
        setResolvedCompanyId(targetCompanyId);
      }

      // Fetch validated webinar selections for this company
      const { data: selections, error: selError } = await supabase
        .from("company_webinar_selections")
        .select(`
          module_id,
          modules(id, title, description, duration),
          webinar_sessions(id, session_date, registration_url)
        `)
        .eq("company_id", targetCompanyId);

      if (selError) throw selError;

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const items: ValidatedWebinar[] = [];

      for (const sel of (selections || [])) {
        const s = sel as any;
        if (!s.webinar_sessions?.session_date) continue;
        const sessionDate = new Date(s.webinar_sessions.session_date);
        // Only upcoming or very recent sessions
        if (sessionDate < oneHourAgo) continue;
        items.push({
          module_id: s.module_id,
          title: s.modules?.title || "Webinar",
          description: s.modules?.description || "",
          session_date: s.webinar_sessions.session_date,
          registration_url: s.webinar_sessions.registration_url || null,
          duration: s.modules?.duration || null,
        });
      }

      items.sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
      setWebinars(items);
    } catch (error) {
      console.error("Error fetching webinars:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadingContent = (
    <div className="text-center py-4">
      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-r-transparent"></div>
    </div>
  );

  const emptyContent = (
    <p className="text-muted-foreground text-center py-4">
      Aucun webinaire prévu pour le moment
    </p>
  );

  if (loading) {
    if (!showCard) return loadingContent;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Prochains webinaires
          </CardTitle>
        </CardHeader>
        <CardContent>{loadingContent}</CardContent>
      </Card>
    );
  }

  if (webinars.length === 0) {
    if (!showCard) return emptyContent;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Prochains webinaires
          </CardTitle>
        </CardHeader>
        <CardContent>{emptyContent}</CardContent>
      </Card>
    );
  }

  const webinarsList = (
    <div className="space-y-3 sm:space-y-4">
      {webinars.map((webinar) => (
        <div
          key={`${webinar.module_id}-${webinar.session_date}`}
          className="border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 hover:border-primary/50 transition-colors bg-background"
        >
          <div>
            <h4 className="font-semibold text-foreground mb-1 text-sm sm:text-base">{webinar.title}</h4>
            <div 
              className="text-xs sm:text-sm text-muted-foreground line-clamp-2 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: webinar.description }}
            />
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{format(new Date(webinar.session_date), "d MMM yyyy", { locale: fr })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{format(new Date(webinar.session_date), "HH:mm", { locale: fr })}</span>
            </div>
            {webinar.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{webinar.duration}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {webinar.registration_url && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                onClick={() => window.open(webinar.registration_url!, "_blank")}
              >
                <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                S'inscrire
              </Button>
            )}
            
            {isContactEntreprise && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                    onClick={() => setSelectedWebinarId(webinar.module_id)}
                  >
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Kit </span>Communication
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-sm sm:text-base">Kit de Communication - {webinar.title}</DialogTitle>
                  </DialogHeader>
                  <CommunicationKitTab preselectedModuleId={webinar.module_id} preselectedCompanyId={resolvedCompanyId} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  if (!showCard) return webinarsList;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Prochains webinaires
        </CardTitle>
        <CardDescription>
          Ne manquez pas les prochains événements en direct
        </CardDescription>
      </CardHeader>
      <CardContent>
        {webinarsList}
      </CardContent>
    </Card>
  );
};
