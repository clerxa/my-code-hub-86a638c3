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
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import DOMPurify from "dompurify";

interface CatalogWebinar {
  id: number;
  title: string;
  description: string;
  theme: string[] | null;
  webinar_date: string | null;
  webinar_registration_url: string | null;
  webinar_image_url: string | null;
  duration: string | null;
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
  }, [companyId]);

  useEffect(() => {
    if (user) fetchUserInfo();
  }, [user]);

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

      const { data: modules, error: modError } = await supabase
        .from("modules")
        .select("id, title, description, theme, webinar_date, webinar_registration_url, webinar_image_url, duration, type")
        .in("id", genericModuleIds)
        .eq("type", "webinar")
        .order("webinar_date", { ascending: true, nullsFirst: false });

      if (modError) throw modError;
      setWebinars((modules || []) as CatalogWebinar[]);
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
          {webinars.map((webinar) => (
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
                {webinar.webinar_date && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(webinar.webinar_date), "PPP", { locale: fr })}
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
          ))}
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
