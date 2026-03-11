import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Video, Calendar, Clock, Tag, Lightbulb, Send, Loader2, GraduationCap, ArrowRight } from "lucide-react";
import { format, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import DOMPurify from "dompurify";

interface WebinarSession {
  id: string;
  session_date: string;
  registration_url: string | null;
}

interface CatalogWebinar {
  id: number;
  title: string;
  description: string;
  theme: string[] | null;
  webinar_image_url: string | null;
  duration: string | null;
  sessions: WebinarSession[];
  is_exclusive: boolean;
}

interface WebinarCatalogTabProps {
  companyId: string;
}

function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] })
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

export function WebinarCatalogTab({ companyId }: WebinarCatalogTabProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [webinars, setWebinars] = useState<CatalogWebinar[]>([]);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalSending, setProposalSending] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [proposalData, setProposalData] = useState({
    theme_title: "",
    theme_description: "",
    contact_name: "",
    contact_email: "",
    company_name: "",
  });

  useEffect(() => {
    fetchCatalogWebinars();
    fetchCompanyName();
  }, [companyId]);

  useEffect(() => {
    if (user) fetchUserInfo();
  }, [user]);

  const fetchCompanyName = async () => {
    const { data } = await supabase
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();
    if (data) {
      setCompanyName(data.name);
      setProposalData(prev => ({ ...prev, company_name: data.name }));
    }
  };

  const fetchUserInfo = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .single();
    if (data) {
      setProposalData(prev => ({
        ...prev,
        contact_name: [data.first_name, data.last_name].filter(Boolean).join(" "),
        contact_email: data.email || "",
      }));
    }
  };

  const fetchCatalogWebinars = async () => {
    setLoading(true);
    try {
      const { count: totalCompanies } = await supabase
        .from("companies")
        .select("id", { count: "exact", head: true });

      const { data: allWebinarModules, error: cwError } = await supabase
        .from("company_webinars")
        .select("module_id, company_id");

      if (cwError) throw cwError;

      const moduleCompanyCount: Record<number, number> = {};
      (allWebinarModules || []).forEach(row => {
        moduleCompanyCount[row.module_id] = (moduleCompanyCount[row.module_id] || 0) + 1;
      });

      const genericModuleIds = Object.entries(moduleCompanyCount)
        .filter(([, count]) => count >= (totalCompanies || 0))
        .map(([id]) => Number(id));

      if (genericModuleIds.length === 0) {
        setWebinars([]);
        setLoading(false);
        return;
      }

      // Fetch modules and sessions in parallel
      const [modulesResult, sessionsResult] = await Promise.all([
        supabase
          .from("modules")
          .select("id, title, description, theme, webinar_image_url, duration, type, webinar_category")
          .in("id", genericModuleIds)
          .eq("type", "webinar")
          .eq("webinar_category", "a_la_demande")
          .order("title"),
        supabase
          .from("webinar_sessions")
          .select("id, session_date, registration_url, module_id")
          .in("module_id", genericModuleIds)
          .order("session_date", { ascending: true }),
      ]);

      if (modulesResult.error) throw modulesResult.error;
      if (sessionsResult.error) throw sessionsResult.error;

      // Group sessions by module_id
      const sessionsByModule: Record<number, WebinarSession[]> = {};
      (sessionsResult.data || []).forEach(s => {
        if (!sessionsByModule[s.module_id]) sessionsByModule[s.module_id] = [];
        sessionsByModule[s.module_id].push({
          id: s.id,
          session_date: s.session_date,
          registration_url: s.registration_url,
        });
      });

      const webinarsWithSessions: CatalogWebinar[] = (modulesResult.data || []).map(m => ({
        id: m.id,
        title: m.title,
        description: m.description || "",
        theme: m.theme as string[] | null,
        webinar_image_url: m.webinar_image_url,
        duration: m.duration,
        sessions: sessionsByModule[m.id] || [],
      }));

      setWebinars(webinarsWithSessions);
    } catch (error) {
      console.error("Error fetching catalog webinars:", error);
      setWebinars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendProposal = async () => {
    if (!proposalData.theme_title.trim()) {
      toast.error("Veuillez indiquer un titre de thème");
      return;
    }
    setProposalSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-partnership-email", {
        body: {
          type: "webinar_theme_proposal",
          data: {
            theme_title: proposalData.theme_title,
            theme_description: proposalData.theme_description,
            contact_name: proposalData.contact_name,
            contact_email: proposalData.contact_email,
            company_name: proposalData.company_name,
            company_id: companyId,
          },
        },
      });
      if (error) throw error;
      toast.success("Votre proposition de thème a bien été envoyée !");
      setShowProposalForm(false);
      setProposalData(prev => ({ ...prev, theme_title: "", theme_description: "" }));
    } catch (error) {
      console.error("Error sending proposal:", error);
      toast.error("Erreur lors de l'envoi de votre proposition");
    } finally {
      setProposalSending(false);
    }
  };

  const getNextSession = (sessions: WebinarSession[]) => {
    return sessions.find(s => !isPast(new Date(s.session_date)));
  };

  const getUpcomingSessionsCount = (sessions: WebinarSession[]) => {
    return sessions.filter(s => !isPast(new Date(s.session_date))).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pedagogy header */}
      <div className="rounded-xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border p-6 space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">Catalogue de webinars</h3>
            </div>
            <p className="text-sm text-muted-foreground max-w-xl">
              Proposez ces webinars à vos collaborateurs en quelques clics. 
              Chaque session est conçue par des experts pour accompagner vos salariés 
              dans leur éducation financière — sans effort logistique de votre part.
            </p>
          </div>
          <Button onClick={() => setShowProposalForm(true)} variant="outline" className="gap-2 shrink-0">
            <Lightbulb className="h-4 w-4" />
            Proposer un thème
          </Button>
        </div>
      </div>

      {/* Webinar grid */}
      {webinars.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Video className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Aucun webinar générique disponible pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {webinars.map((webinar) => {
            const nextSession = getNextSession(webinar.sessions);
            const upcomingCount = getUpcomingSessionsCount(webinar.sessions);

            return (
              <Card
                key={webinar.id}
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30 group border-border/60"
                onClick={() => navigate(`/company/${companyId}/dashboard/webinar/${webinar.id}`)}
              >
                {webinar.webinar_image_url && (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={webinar.webinar_image_url}
                      alt={webinar.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-base line-clamp-2">{webinar.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {stripHtml(webinar.description)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {/* Sessions info */}
                  {nextSession ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Prochaine session : </span>
                        <span className="font-medium text-foreground">
                          {format(new Date(nextSession.session_date), "PPP 'à' HH'h'mm", { locale: fr })}
                        </span>
                      </div>
                      {upcomingCount > 1 && (
                        <div className="flex items-center gap-1.5 text-xs text-primary">
                          <span className="inline-block w-3.5" />
                          <span>{upcomingCount} sessions à venir</span>
                        </div>
                      )}
                    </div>
                  ) : webinar.sessions.length > 0 ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground opacity-60">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Aucune session à venir</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground opacity-60">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Dates à définir</span>
                    </div>
                  )}

                  {webinar.duration && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {webinar.duration}
                    </div>
                  )}
                  {webinar.theme && webinar.theme.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {webinar.theme.slice(0, 3).map((t, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                      {webinar.theme.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{webinar.theme.length - 3}</Badge>
                      )}
                    </div>
                  )}
                  <div className="pt-1">
                    <span className="text-xs text-primary font-medium flex items-center gap-1 group-hover:underline">
                      Voir le détail & proposer
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Theme proposal dialog */}
      <Dialog open={showProposalForm} onOpenChange={setShowProposalForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Proposer un nouveau thème
            </DialogTitle>
            <DialogDescription>
              Soumettez une idée de thème pour un prochain webinar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Entreprise</Label>
              <Input
                id="company_name"
                value={proposalData.company_name}
                onChange={(e) => setProposalData(prev => ({ ...prev, company_name: e.target.value }))}
                readOnly
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme_title">Titre du thème *</Label>
              <Input
                id="theme_title"
                placeholder="Ex: Optimisation fiscale pour les expatriés"
                value={proposalData.theme_title}
                onChange={(e) => setProposalData(prev => ({ ...prev, theme_title: e.target.value }))}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme_description">Description / Motivation</Label>
              <Textarea
                id="theme_description"
                placeholder="Décrivez pourquoi ce thème intéresserait vos collaborateurs..."
                value={proposalData.theme_description}
                onChange={(e) => setProposalData(prev => ({ ...prev, theme_description: e.target.value }))}
                maxLength={2000}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Votre nom</Label>
                <Input
                  id="contact_name"
                  value={proposalData.contact_name}
                  onChange={(e) => setProposalData(prev => ({ ...prev, contact_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Votre email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={proposalData.contact_email}
                  onChange={(e) => setProposalData(prev => ({ ...prev, contact_email: e.target.value }))}
                />
              </div>
            </div>
            <Button
              onClick={handleSendProposal}
              disabled={proposalSending || !proposalData.theme_title.trim()}
              className="w-full gap-2"
            >
              {proposalSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {proposalSending ? "Envoi en cours..." : "Envoyer ma proposition"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
