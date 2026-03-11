import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CommunicationKitTab } from "@/components/admin/CommunicationKitTab";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Copy,
  Check,
  Tag,
  Video,
  Mail,
  Users,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Loader2,
  Lightbulb,
  ChevronRight,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import { useAuth } from "@/components/AuthProvider";

interface WebinarDetail {
  id: number;
  title: string;
  description: string;
  theme: string[] | null;
  webinar_date: string | null;
  webinar_registration_url: string | null;
  webinar_image_url: string | null;
  duration: string | null;
}

interface WebinarSession {
  id: string;
  session_date: string;
  registration_url: string | null;
}

function stripHtmlAndFormat(html: string): string {
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  return clean.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

const WebinarCatalogDetail = () => {
  const { id: companyId, webinarId } = useParams<{ id: string; webinarId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [webinar, setWebinar] = useState<WebinarDetail | null>(null);
  const [sessions, setSessions] = useState<WebinarSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showCommKit, setShowCommKit] = useState(false);

  // Workflow state: "info" → "select-date" → "kit"
  const [workflowStep, setWorkflowStep] = useState<"info" | "select-date" | "kit">("info");
  const [selectedSession, setSelectedSession] = useState<WebinarSession | null>(null);
  const [sessionLocked, setSessionLocked] = useState(false);
  const [saving, setSaving] = useState(false);

  // Confirmation dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingDateItem, setPendingDateItem] = useState<{ id: string; date: string; url: string | null } | null>(null);

  useEffect(() => {
    if (webinarId && companyId) {
      fetchWebinar();
      fetchExistingSelection();
    }
  }, [webinarId, companyId]);

  const fetchWebinar = async () => {
    setLoading(true);
    const [moduleRes, sessionsRes] = await Promise.all([
      supabase
        .from("modules")
        .select("id, title, description, theme, webinar_date, webinar_registration_url, webinar_image_url, duration")
        .eq("id", Number(webinarId))
        .single(),
      supabase
        .from("webinar_sessions")
        .select("id, session_date, registration_url")
        .eq("module_id", Number(webinarId))
        .order("session_date", { ascending: true }),
    ]);

    if (!moduleRes.error && moduleRes.data) setWebinar(moduleRes.data as WebinarDetail);
    if (!sessionsRes.error && sessionsRes.data) setSessions(sessionsRes.data);
    setLoading(false);
  };

  const fetchExistingSelection = async () => {
    if (!companyId || !webinarId) return;
    const { data } = await supabase
      .from("company_webinar_selections")
      .select("session_id, webinar_sessions(id, session_date, registration_url)")
      .eq("company_id", companyId)
      .eq("module_id", Number(webinarId))
      .single();

    if (data && data.webinar_sessions) {
      const session = data.webinar_sessions as unknown as WebinarSession;
      setSelectedSession(session);
      setSessionLocked(true);
      setWorkflowStep("kit");
    }
  };

  // Build a combined list of all available dates (sessions table + legacy webinar_date)
  const allDates = (() => {
    const dates: { id: string; date: string; url: string | null; isLegacy: boolean }[] = [];
    
    sessions.forEach((s) => {
      dates.push({ id: s.id, date: s.session_date, url: s.registration_url, isLegacy: false });
    });

    // Add legacy date if no sessions exist or if it's different from all sessions
    if (webinar?.webinar_date) {
      const legacyDate = new Date(webinar.webinar_date).getTime();
      const alreadyExists = sessions.some(
        (s) => Math.abs(new Date(s.session_date).getTime() - legacyDate) < 60000
      );
      if (!alreadyExists) {
        dates.push({
          id: "legacy",
          date: webinar.webinar_date,
          url: webinar.webinar_registration_url,
          isLegacy: true,
        });
      }
    }

    return dates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  })();

  const activeUrl = selectedSession?.registration_url 
    || (selectedSession && allDates.find(d => d.id === "legacy")?.url) 
    || webinar?.webinar_registration_url;

  const handleCopyLink = async (url?: string | null) => {
    const linkToCopy = url || activeUrl;
    if (!linkToCopy) return;
    await navigator.clipboard.writeText(linkToCopy);
    setCopied(true);
    toast.success("Lien d'inscription copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  // Show confirmation dialog instead of directly selecting
  const handleDateClick = (dateItem: { id: string; date: string; url: string | null }) => {
    setPendingDateItem(dateItem);
    setConfirmDialogOpen(true);
  };

  // Confirm and persist the selection
  const handleConfirmSelection = async () => {
    if (!pendingDateItem || !companyId || !webinarId) return;

    // Legacy dates can't be persisted (no session_id in webinar_sessions)
    if (pendingDateItem.id === "legacy") {
      setSelectedSession({ id: pendingDateItem.id, session_date: pendingDateItem.date, registration_url: pendingDateItem.url });
      setSessionLocked(true);
      setWorkflowStep("kit");
      setConfirmDialogOpen(false);
      setPendingDateItem(null);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("company_webinar_selections")
        .insert({
          company_id: companyId,
          module_id: Number(webinarId),
          session_id: pendingDateItem.id,
          selected_by: user?.id,
        });

      if (error) throw error;

      setSelectedSession({ id: pendingDateItem.id, session_date: pendingDateItem.date, registration_url: pendingDateItem.url });
      setSessionLocked(true);
      setWorkflowStep("kit");
      toast.success("Session confirmée ! Vous pouvez maintenant communiquer à vos équipes.");
    } catch (error: any) {
      console.error("Error saving selection:", error);
      if (error?.code === "23505") {
        toast.error("Une session a déjà été sélectionnée pour ce webinar.");
        fetchExistingSelection();
      } else {
        toast.error("Erreur lors de la sauvegarde de votre choix.");
      }
    } finally {
      setSaving(false);
      setConfirmDialogOpen(false);
      setPendingDateItem(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!webinar) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Webinar introuvable</p>
        </div>
      </div>
    );
  }

  const cleanDescription = stripHtmlAndFormat(webinar.description || "");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero section */}
        <div className="relative bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border-b">
          <div className="container mx-auto px-4 py-8 max-w-5xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/company/${companyId}/dashboard?tab=webinars`)}
              className="mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au catalogue
            </Button>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <Badge variant="secondary" className="gap-1.5">
                  <Video className="h-3.5 w-3.5" />
                  Webinar catalogue
                </Badge>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                  {webinar.title}
                </h1>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {allDates.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {allDates.length === 1
                        ? format(new Date(allDates[0].date), "PPP 'à' HH:mm", { locale: fr })
                        : `${allDates.length} dates disponibles`}
                    </div>
                  )}
                  {webinar.duration && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {webinar.duration}
                    </div>
                  )}
                </div>

                {webinar.theme && webinar.theme.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {webinar.theme.map((t, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {webinar.webinar_image_url && (
                <div className="aspect-video rounded-xl overflow-hidden shadow-lg border">
                  <img
                    src={webinar.webinar_image_url}
                    alt={webinar.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-10 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left: Description + Pedagogy */}
            <div className="md:col-span-2 space-y-8">
              {/* Description */}
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  À propos de ce webinar
                </h2>
                <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
                  {cleanDescription}
                </div>
              </div>

              {/* Why propose this webinar */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Pourquoi proposer ce webinar à vos salariés ?
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      {
                        icon: GraduationCap,
                        title: "Éducation financière accessible",
                        desc: "Vos collaborateurs accèdent à un contenu pédagogique conçu par des experts, sans jargon technique.",
                      },
                      {
                        icon: Users,
                        title: "Engagement collaborateur",
                        desc: "Les webinars renforcent le sentiment d'accompagnement et valorisent votre politique sociale.",
                      },
                      {
                        icon: Sparkles,
                        title: "Mise en place immédiate",
                        desc: "Copiez le lien, partagez-le — c'est tout. Aucune logistique supplémentaire.",
                      },
                      {
                        icon: CheckCircle2,
                        title: "Impact mesurable",
                        desc: "Suivez les inscriptions et mesurez l'impact de vos actions de bien-être financier.",
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-lg bg-background/60">
                        <item.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right sidebar: Workflow */}
            <div className="space-y-4">
              {/* Workflow stepper */}
              <Card className="border-primary/30 overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-5 py-3 border-b">
                  <h3 className="text-sm font-semibold">Proposer ce webinar</h3>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <span className={workflowStep === "info" ? "text-primary font-medium" : ""}>
                      1. Découvrir
                    </span>
                    <ChevronRight className="h-3 w-3" />
                    <span className={workflowStep === "select-date" ? "text-primary font-medium" : ""}>
                      2. Choisir la date
                    </span>
                    <ChevronRight className="h-3 w-3" />
                    <span className={workflowStep === "kit" ? "text-primary font-medium" : ""}>
                      3. Communiquer
                    </span>
                  </div>
                </div>

                <CardContent className="p-5 space-y-3">
                  {workflowStep === "info" && (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Vous avez découvert ce webinar. Choisissez maintenant une date pour le proposer à vos salariés.
                      </p>
                      {allDates.length > 0 ? (
                        <Button
                          onClick={() => {
                            if (allDates.length === 1) {
                              handleDateClick(allDates[0]);
                            } else {
                              setWorkflowStep("select-date");
                            }
                          }}
                          className="w-full gap-2"
                        >
                          <Calendar className="h-4 w-4" />
                          {allDates.length === 1 ? "Sélectionner cette date" : "Choisir une date"}
                        </Button>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Aucune date programmée pour le moment.
                        </p>
                      )}
                    </>
                  )}

                  {workflowStep === "select-date" && (
                    <>
                      <p className="text-xs text-muted-foreground mb-2">
                        Sélectionnez la date qui convient le mieux à vos équipes :
                      </p>
                      <div className="space-y-2">
                        {allDates.map((dateItem) => {
                          const dateObj = new Date(dateItem.date);
                          const isDatePast = dateObj < new Date();
                          return (
                            <button
                              key={dateItem.id}
                              disabled={isDatePast}
                              onClick={() => handleDateClick(dateItem)}
                              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                isDatePast
                                  ? "opacity-50 cursor-not-allowed bg-muted/30"
                                  : "hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">
                                    {format(dateObj, "EEEE d MMMM yyyy", { locale: fr })}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(dateObj, "'à' HH:mm", { locale: fr })}
                                  </p>
                                </div>
                                {isDatePast ? (
                                  <Badge variant="outline" className="text-xs">Passé</Badge>
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWorkflowStep("info")}
                        className="w-full mt-1"
                      >
                        <ArrowLeft className="h-3 w-3 mr-1" />
                        Retour
                      </Button>
                    </>
                  )}

                  {workflowStep === "kit" && selectedSession && (
                    <>
                      <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Date sélectionnée</p>
                            <p className="text-sm font-medium">
                              {format(new Date(selectedSession.session_date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                            </p>
                          </div>
                          {sessionLocked && (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        {sessionLocked && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            Ce choix est définitif
                          </p>
                        )}
                      </div>

                      {/* Copy link */}
                      {(selectedSession.registration_url || webinar.webinar_registration_url) && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium">Lien d'inscription</p>
                          <div className="bg-muted/50 rounded-md p-2 text-xs text-muted-foreground break-all font-mono select-all border">
                            {selectedSession.registration_url || webinar.webinar_registration_url}
                          </div>
                          <Button
                            onClick={() => handleCopyLink(selectedSession.registration_url || webinar.webinar_registration_url)}
                            className="w-full gap-2"
                            size="sm"
                            variant={copied ? "outline" : "default"}
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copié !" : "Copier le lien"}
                          </Button>
                        </div>
                      )}

                      {/* Generate kit */}
                      <Button
                        onClick={() => setShowCommKit(true)}
                        variant="outline"
                        className="w-full gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Générer le kit de communication
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Quick stats / encouragement */}
              <Card className="bg-gradient-to-br from-secondary/10 to-accent/10 border-secondary/20">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-secondary" />
                    Le saviez-vous ?
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    78% des salariés déclarent que l'éducation financière proposée par leur employeur 
                    améliore leur bien-être au travail. Proposer ce webinar, c'est investir dans 
                    l'engagement de vos équipes.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation AlertDialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer votre choix de session</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Vous êtes sur le point de sélectionner la session suivante pour le webinar <strong>{webinar.title}</strong> :
              </p>
              {pendingDateItem && (
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-foreground">
                  <p className="font-medium">
                    {format(new Date(pendingDateItem.date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
              )}
              <p className="text-destructive font-medium">
                ⚠️ Attention : ce choix est définitif. Vous ne pourrez pas revenir en arrière ni changer de date.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSelection} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Confirmation...
                </>
              ) : (
                "Confirmer cette date"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Communication Kit Dialog */}
      <Dialog open={showCommKit} onOpenChange={setShowCommKit}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kit de Communication — {webinar.title}</DialogTitle>
          </DialogHeader>
          <CommunicationKitTab preselectedModuleId={webinar.id} preselectedCompanyId={companyId} preselectedSessionId={selectedSession?.id} />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default WebinarCatalogDetail;
