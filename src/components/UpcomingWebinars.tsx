import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ExternalLink, Mail } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CommunicationKitTab } from "@/components/admin/CommunicationKitTab";

interface Webinar {
  id: number;
  title: string;
  description: string;
  webinar_date: string;
  webinar_registration_url: string | null;
  duration: string | null;
}

interface UpcomingWebinarsProps {
  companyId?: string;
  showCard?: boolean;
}

export const UpcomingWebinars = ({ companyId, showCard = true }: UpcomingWebinarsProps) => {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
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
      // Si on a un companyId en props, on l'utilise, sinon on récupère celui de l'utilisateur
      let targetCompanyId = companyId;

      if (!targetCompanyId) {
        const { data: { user } } = await supabase.auth.getUser();
        
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

      // Collect all module IDs from both sources
      let allModuleIds: number[] = [];

      // 1. Get webinars from parcours
      const { data: parcoursCompanies } = await supabase
        .from("parcours_companies")
        .select("parcours_id")
        .eq("company_id", targetCompanyId);

      if (parcoursCompanies && parcoursCompanies.length > 0) {
        const parcoursIds = parcoursCompanies.map(pc => pc.parcours_id);

        const { data: parcoursModules } = await supabase
          .from("parcours_modules")
          .select("module_id")
          .in("parcours_id", parcoursIds);

        if (parcoursModules) {
          allModuleIds.push(...parcoursModules.map(pm => pm.module_id));
        }
      }

      // 2. Get webinars directly assigned to company
      const { data: directWebinars } = await supabase
        .from("company_webinars")
        .select("module_id")
        .eq("company_id", targetCompanyId);

      if (directWebinars) {
        allModuleIds.push(...directWebinars.map(dw => dw.module_id));
      }

      // Remove duplicates
      allModuleIds = [...new Set(allModuleIds)];

      if (allModuleIds.length === 0) {
        setWebinars([]);
        setLoading(false);
        return;
      }

      // Date limite : webinars qui ne sont pas passés depuis plus d'1 heure
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      // Récupérer les webinaires de ces modules (seulement les futurs ou en cours)
      const { data, error } = await supabase
        .from("modules")
        .select("id, title, description, webinar_date, webinar_registration_url, duration")
        .eq("type", "webinar")
        .in("id", allModuleIds)
        .not("webinar_date", "is", null)
        .gte("webinar_date", oneHourAgo)
        .order("webinar_date", { ascending: true });

      if (error) throw error;
      setWebinars(data || []);
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
          key={webinar.id}
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
              <span>
                {format(new Date(webinar.webinar_date), "d MMM yyyy", { locale: fr })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>
                {format(new Date(webinar.webinar_date), "HH:mm", { locale: fr })}
              </span>
            </div>
            {webinar.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{webinar.duration}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {webinar.webinar_registration_url && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                onClick={() => window.open(webinar.webinar_registration_url!, "_blank")}
              >
                <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {new Date(webinar.webinar_date) < new Date() ? "Voir le replay" : "S'inscrire"}
              </Button>
            )}
            
            {isContactEntreprise && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                    onClick={() => setSelectedWebinarId(webinar.id)}
                  >
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Kit </span>Communication
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-sm sm:text-base">Kit de Communication - {webinar.title}</DialogTitle>
                  </DialogHeader>
                  <CommunicationKitTab preselectedModuleId={webinar.id} preselectedCompanyId={resolvedCompanyId} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  if (!showCard) {
    return webinarsList;
  }

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
