import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import DOMPurify from "dompurify";

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

function stripHtmlAndFormat(html: string): string {
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  return clean.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

const WebinarCatalogDetail = () => {
  const { id: companyId, webinarId } = useParams<{ id: string; webinarId: string }>();
  const navigate = useNavigate();
  const [webinar, setWebinar] = useState<WebinarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showCommKit, setShowCommKit] = useState(false);

  useEffect(() => {
    if (webinarId) fetchWebinar();
  }, [webinarId]);

  const fetchWebinar = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("modules")
      .select("id, title, description, theme, webinar_date, webinar_registration_url, webinar_image_url, duration")
      .eq("id", Number(webinarId))
      .single();

    if (!error && data) setWebinar(data as WebinarDetail);
    setLoading(false);
  };

  const handleCopyLink = async () => {
    if (!webinar?.webinar_registration_url) return;
    await navigator.clipboard.writeText(webinar.webinar_registration_url);
    setCopied(true);
    toast.success("Lien d'inscription copié !");
    setTimeout(() => setCopied(false), 2000);
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
  const isPast = webinar.webinar_date ? new Date(webinar.webinar_date) < new Date() : false;

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
                  {webinar.webinar_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(webinar.webinar_date), "PPP 'à' HH:mm", { locale: fr })}
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

            {/* Right sidebar: Actions */}
            <div className="space-y-4">
              {/* Copy registration link */}
              {webinar.webinar_registration_url && (
                <Card className="border-primary/30">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Copy className="h-4 w-4 text-primary" />
                      Lien d'inscription
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Copiez ce lien et partagez-le à vos collaborateurs par email, Slack, Teams ou intranet.
                    </p>
                    <div className="bg-muted/50 rounded-md p-2.5 text-xs text-muted-foreground break-all font-mono select-all border">
                      {webinar.webinar_registration_url}
                    </div>
                    <Button
                      onClick={handleCopyLink}
                      className="w-full gap-2"
                      variant={copied ? "outline" : "default"}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copié !
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copier le lien
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Communication kit */}
              <Card>
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Kit de communication
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Générez un kit prêt à l'emploi pour promouvoir ce webinar auprès de vos équipes.
                  </p>
                  <Button
                    onClick={() => setShowCommKit(true)}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Générer le kit
                  </Button>
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

      {/* Communication Kit Dialog */}
      <Dialog open={showCommKit} onOpenChange={setShowCommKit}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kit de Communication — {webinar.title}</DialogTitle>
          </DialogHeader>
          <CommunicationKitTab preselectedModuleId={webinar.id} preselectedCompanyId={companyId} />
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default WebinarCatalogDetail;
