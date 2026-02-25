import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommunicationKitTab } from "@/components/admin/CommunicationKitTab";
import { CompanyDocumentsTab } from "./CompanyDocumentsTab";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Megaphone, Link2, Copy, Check, Calendar, Users, Image as ImageIcon, HelpCircle, Download, ChevronDown, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useExpertBookingUrl } from "@/hooks/useExpertBookingUrl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface CompanyCommunicationTabProps {
  companyId: string;
}

interface LinkItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  url: string | null;
}

interface VisualResource {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: string;
}

interface CompanyFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

function LinkItem({ icon, title, description, url }: LinkItemProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!url) return;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erreur lors de la copie");
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
          {url ? (
            <p className="text-xs text-muted-foreground mt-1 font-mono truncate max-w-md">{url}</p>
          ) : (
            <p className="text-xs text-destructive mt-1">Non configuré</p>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        disabled={!url}
        className="shrink-0"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

const categoryLabels: Record<string, string> = {
  general: "Général",
  social: "Réseaux sociaux",
  email: "Email",
  presentation: "Présentation",
  affichage: "Affichage",
  intranet: "Intranet",
  avantages: "Avantages salariaux",
  fiscalite: "Fiscalité",
  epargne: "Épargne",
  investissement: "Investissement",
  retraite: "Retraite",
  immobilier: "Immobilier",
  accompagnement: "Accompagnement"
};

export function CompanyCommunicationTab({ companyId }: CompanyCommunicationTabProps) {
  const [referralUrl, setReferralUrl] = useState<string | null>(null);
  const [signupUrl, setSignupUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [visualResources, setVisualResources] = useState<VisualResource[]>([]);
  const [faqs, setFaqs] = useState<CompanyFAQ[]>([]);
  const { embedCode, fallbackUrl, isLoading: isLoadingBooking } = useExpertBookingUrl(companyId);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch company data
      const { data: companyData } = await supabase
        .from("companies")
        .select("referral_typeform_url, name, signup_slug")
        .eq("id", companyId)
        .single();

      if (companyData) {
        setReferralUrl(companyData.referral_typeform_url);
        setCompanyName(companyData.name);
        if ((companyData as any).signup_slug) {
          setSignupUrl(`https://myfincare.fr/join/${(companyData as any).signup_slug}`);
        }
      }

      // Fetch visual resources (global ones where company_id is null)
      const { data: resources } = await supabase
        .from("company_visual_resources")
        .select("*")
        .is("company_id", null)
        .order("created_at", { ascending: false });

      if (resources) setVisualResources(resources);

      // Fetch FAQs (global ones where company_id is null)
      const { data: faqsData } = await supabase
        .from("company_faqs")
        .select("*")
        .is("company_id", null)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (faqsData) setFaqs(faqsData);
    };

    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  // Extract URL from embed code if available and add UTM parameters
  const baseExpertBookingUrl = fallbackUrl || (embedCode ? embedCode.match(/src="([^"]+)"/)?.[1] : null);
  
  const expertBookingUrl = (() => {
    if (!baseExpertBookingUrl) return null;
    
    try {
      const url = new URL(baseExpertBookingUrl);
      if (companyName) {
        url.searchParams.set('source_acteur', companyName);
      }
      return url.toString();
    } catch {
      // If URL parsing fails, append params manually
      if (!companyName) return baseExpertBookingUrl;
      const separator = baseExpertBookingUrl.includes('?') ? '&' : '?';
      return `${baseExpertBookingUrl}${separator}source_acteur=${encodeURIComponent(companyName)}`;
    }
  })();

  const handleDownload = async (url: string, title: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Image téléchargée !");
    } catch (error) {
      window.open(url, '_blank');
    }
  };

  // Group FAQs by category
  const faqsByCategory = faqs.reduce((acc, faq) => {
    const cat = faq.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {} as Record<string, CompanyFAQ[]>);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="kit" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="kit" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            <span className="hidden sm:inline">Kit</span>
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Liens</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Visuels</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">FAQ</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Docs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kit" className="mt-6">
          <CommunicationKitTab companyId={companyId} />
        </TabsContent>

        <TabsContent value="links" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                Liens utiles
              </CardTitle>
              <CardDescription>
                Liens à partager avec vos collaborateurs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LinkItem
                icon={<UserPlus className="h-5 w-5" />}
                title="Lien d'inscription à l'application"
                description="Partagez ce lien à vos collaborateurs pour qu'ils s'inscrivent directement"
                url={signupUrl}
              />
              <LinkItem
                icon={<Calendar className="h-5 w-5" />}
                title="Prise de rendez-vous expert"
                description="Lien pour réserver un rendez-vous avec un conseiller financier"
                url={expertBookingUrl}
              />
              <LinkItem
                icon={<Users className="h-5 w-5" />}
                title="Programme de parrainage"
                description="Lien du formulaire de parrainage pour vos collaborateurs"
                url={referralUrl}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Ressources visuelles
              </CardTitle>
              <CardDescription>
                Images et visuels à télécharger pour vos communications internes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {visualResources.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune ressource visuelle disponible</p>
                  <p className="text-sm mt-1">
                    Les visuels partagés par MyFinCare apparaîtront ici
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visualResources.map((resource) => (
                    <div 
                      key={resource.id} 
                      className="border rounded-lg overflow-hidden group hover:shadow-md transition-shadow"
                    >
                      <div className="relative aspect-video bg-muted">
                        <img 
                          src={resource.image_url} 
                          alt={resource.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button 
                            size="sm" 
                            onClick={() => handleDownload(resource.image_url, resource.title)}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Télécharger
                          </Button>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{resource.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {categoryLabels[resource.category] || resource.category}
                          </Badge>
                        </div>
                        {resource.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {resource.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Questions fréquentes
              </CardTitle>
              <CardDescription>
                Réponses aux questions courantes des salariés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {faqs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune FAQ disponible</p>
                  <p className="text-sm mt-1">
                    Les questions fréquentes apparaîtront ici
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
                    <div key={category}>
                      <h3 className="font-semibold text-sm text-primary mb-3 flex items-center gap-2">
                        <Badge variant="outline">{categoryLabels[category] || category}</Badge>
                        <span className="text-muted-foreground text-xs">({categoryFaqs.length})</span>
                      </h3>
                      <Accordion type="single" collapsible className="w-full">
                        {categoryFaqs.map((faq) => (
                          <AccordionItem key={faq.id} value={faq.id}>
                            <AccordionTrigger className="text-left hover:no-underline">
                              <span className="pr-4">{faq.question}</span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="prose prose-sm max-w-none text-muted-foreground pl-4 border-l-2 border-primary/20">
                                {faq.answer}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-3 gap-2"
                                onClick={() => {
                                  navigator.clipboard.writeText(faq.answer);
                                  toast.success("Réponse copiée !");
                                }}
                              >
                                <Copy className="h-3 w-3" />
                                Copier la réponse
                              </Button>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <CompanyDocumentsTab companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
