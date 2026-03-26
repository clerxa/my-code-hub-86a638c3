import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "./ImageUpload";
import { Loader2, Save, Calendar, ExternalLink, Code, Image, Plus, Trash2, Eye, Search, CheckCircle, Clock, Link2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ExpertBookingLandingPreview } from "./ExpertBookingLandingPreview";
import { IconSelector } from "./IconSelector";
import { ImageGalleryUploader } from "./ImageGalleryUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingContextMessagesEditor } from "./BookingContextMessagesEditor";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
}

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

interface LandingSettings {
  id: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  benefits: Benefit[];
  expertises: Benefit[];
  cta_text: string;
  cta_secondary_text: string;
  testimonial_enabled: boolean;
  testimonial_text: string | null;
  testimonial_author: string | null;
  testimonial_role: string | null;
  footer_text: string;
  gallery_title: string;
  gallery_subtitle: string;
  gallery_images: GalleryImage[];
}

interface HubspotAppointment {
  id: string;
  hubspot_meeting_id: string | null;
  hubspot_contact_id: string | null;
  user_id: string | null;
  user_email: string;
  user_name: string | null;
  meeting_title: string | null;
  meeting_start_time: string | null;
  meeting_end_time: string | null;
  meeting_link: string | null;
  booking_source: string | null;
  company_id: string | null;
  raw_payload: Json | null;
  created_at: string;
}

export function ExpertBookingTab() {
  const [activeTab, setActiveTab] = useState("config");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Booking URLs settings
  const [defaultExpertBookingUrl, setDefaultExpertBookingUrl] = useState("");
  const [defaultExpertBookingEmbed, setDefaultExpertBookingEmbed] = useState("");
  
  // URLs and embeds by rank
  const [expertBookingUrlRang1, setExpertBookingUrlRang1] = useState("");
  const [expertBookingEmbedRang1, setExpertBookingEmbedRang1] = useState("");
  const [expertBookingUrlRang2, setExpertBookingUrlRang2] = useState("");
  const [expertBookingEmbedRang2, setExpertBookingEmbedRang2] = useState("");
  const [expertBookingUrlRang3, setExpertBookingUrlRang3] = useState("");
  const [expertBookingEmbedRang3, setExpertBookingEmbedRang3] = useState("");
  const [expertBookingUrlRang4, setExpertBookingUrlRang4] = useState("");
  const [expertBookingEmbedRang4, setExpertBookingEmbedRang4] = useState("");
  
  // New rang×revenue URL fields
  const [rdvExpertUrl, setRdvExpertUrl] = useState("");
  const [rdvSeniorUrl, setRdvSeniorUrl] = useState("");
  const [rdvJuniorUrl, setRdvJuniorUrl] = useState("");
  const [rdvAllUrl, setRdvAllUrl] = useState("");
  
  // Landing page settings
  const [landingSettings, setLandingSettings] = useState<LandingSettings>({
    id: "",
    hero_title: "Prenez rendez-vous avec un expert",
    hero_subtitle: "Un accompagnement personnalisé pour optimiser vos finances",
    hero_image_url: null,
    benefits: [
      { icon: "Target", title: "Analyse personnalisée", description: "Un expert analyse votre situation financière en détail" },
      { icon: "TrendingUp", title: "Stratégies optimisées", description: "Des recommandations adaptées à vos objectifs" },
      { icon: "Shield", title: "Accompagnement sécurisé", description: "Un suivi confidentiel et professionnel" }
    ],
    expertises: [],
    cta_text: "Réserver mon créneau",
    cta_secondary_text: "Gratuit et sans engagement",
    testimonial_enabled: false,
    testimonial_text: null,
    testimonial_author: null,
    testimonial_role: null,
    footer_text: "Nos experts sont disponibles du lundi au vendredi, de 9h à 18h.",
    gallery_title: "Ils nous font confiance",
    gallery_subtitle: "Des certifications et reconnaissances qui garantissent notre expertise",
    gallery_images: []
  });

  // HubSpot appointments state
  const [hubspotAppointments, setHubspotAppointments] = useState<HubspotAppointment[]>([]);
  const [hubspotLoading, setHubspotLoading] = useState(true);
  const [hubspotSearchTerm, setHubspotSearchTerm] = useState("");
  const [selectedPayload, setSelectedPayload] = useState<Json | null>(null);
  const [isPayloadDialogOpen, setIsPayloadDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<HubspotAppointment | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchHubspotAppointments();
  }, []);

  const fetchSettings = async () => {
    try {
      // Fetch booking URL settings
      const { data: urlSettings, error: urlError } = await supabase
        .from("settings")
        .select("*")
        .in("key", [
          "default_expert_booking_url", 
          "default_expert_booking_embed",
          "expert_booking_url_rang_1",
          "expert_booking_embed_rang_1",
          "expert_booking_url_rang_2",
          "expert_booking_embed_rang_2",
          "expert_booking_url_rang_3",
          "expert_booking_embed_rang_3",
          "expert_booking_url_rang_4",
          "expert_booking_embed_rang_4",
          "rdv_expert_url",
          "rdv_senior_url",
          "rdv_junior_url",
          "rdv_all_url"
        ]);

      if (urlError) throw urlError;

      urlSettings?.forEach((setting) => {
        if (setting.key === "default_expert_booking_url" && setting.value) {
          try {
            setDefaultExpertBookingUrl(JSON.parse(setting.value));
          } catch {
            setDefaultExpertBookingUrl(setting.value);
          }
        }
        if (setting.key === "default_expert_booking_embed" && setting.value) {
          try {
            setDefaultExpertBookingEmbed(JSON.parse(setting.value));
          } catch {
            setDefaultExpertBookingEmbed(setting.value);
          }
        }
        if (setting.key === "expert_booking_url_rang_1" && setting.value) {
          try {
            setExpertBookingUrlRang1(JSON.parse(setting.value));
          } catch {
            setExpertBookingUrlRang1(setting.value);
          }
        }
        if (setting.key === "expert_booking_embed_rang_1" && setting.value) {
          try {
            setExpertBookingEmbedRang1(JSON.parse(setting.value));
          } catch {
            setExpertBookingEmbedRang1(setting.value);
          }
        }
        if (setting.key === "expert_booking_url_rang_2" && setting.value) {
          try {
            setExpertBookingUrlRang2(JSON.parse(setting.value));
          } catch {
            setExpertBookingUrlRang2(setting.value);
          }
        }
        if (setting.key === "expert_booking_embed_rang_2" && setting.value) {
          try {
            setExpertBookingEmbedRang2(JSON.parse(setting.value));
          } catch {
            setExpertBookingEmbedRang2(setting.value);
          }
        }
        if (setting.key === "expert_booking_url_rang_3" && setting.value) {
          try {
            setExpertBookingUrlRang3(JSON.parse(setting.value));
          } catch {
            setExpertBookingUrlRang3(setting.value);
          }
        }
        if (setting.key === "expert_booking_embed_rang_3" && setting.value) {
          try {
            setExpertBookingEmbedRang3(JSON.parse(setting.value));
          } catch {
            setExpertBookingEmbedRang3(setting.value);
          }
        }
        if (setting.key === "expert_booking_url_rang_4" && setting.value) {
          try {
            setExpertBookingUrlRang4(JSON.parse(setting.value));
          } catch {
            setExpertBookingUrlRang4(setting.value);
          }
        }
        if (setting.key === "expert_booking_embed_rang_4" && setting.value) {
          try {
            setExpertBookingEmbedRang4(JSON.parse(setting.value));
          } catch {
            setExpertBookingEmbedRang4(setting.value);
          }
        }
        // New rang×revenue fields
        const rdvKeys: Record<string, (v: string) => void> = {
          rdv_expert_url: setRdvExpertUrl,
          rdv_senior_url: setRdvSeniorUrl,
          rdv_junior_url: setRdvJuniorUrl,
          rdv_all_url: setRdvAllUrl,
        };
        if (rdvKeys[setting.key] && setting.value) {
          try { rdvKeys[setting.key](JSON.parse(setting.value)); } catch { rdvKeys[setting.key](setting.value); }
        }
      });

      // Fetch landing page settings
      const { data: landingData, error: landingError } = await supabase
        .from("expert_booking_landing_settings")
        .select("*")
        .limit(1)
        .single();

      if (landingError && landingError.code !== 'PGRST116') throw landingError;

      if (landingData) {
        const benefits = Array.isArray(landingData.benefits) 
          ? (landingData.benefits as unknown as Benefit[]) 
          : [];
        const expertises = Array.isArray(landingData.expertises)
          ? (landingData.expertises as unknown as Benefit[])
          : [];
        const galleryImages = Array.isArray(landingData.gallery_images)
          ? (landingData.gallery_images as unknown as GalleryImage[])
          : [];
        setLandingSettings({
          id: landingData.id,
          hero_title: landingData.hero_title || "",
          hero_subtitle: landingData.hero_subtitle || "",
          hero_image_url: landingData.hero_image_url,
          benefits,
          expertises,
          cta_text: landingData.cta_text || "",
          cta_secondary_text: landingData.cta_secondary_text || "",
          testimonial_enabled: landingData.testimonial_enabled || false,
          testimonial_text: landingData.testimonial_text,
          testimonial_author: landingData.testimonial_author,
          testimonial_role: landingData.testimonial_role,
          footer_text: landingData.footer_text || "",
          gallery_title: landingData.gallery_title || "Ils nous font confiance",
          gallery_subtitle: landingData.gallery_subtitle || "",
          gallery_images: galleryImages
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Erreur lors du chargement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save booking URL settings
      const { error: urlError } = await supabase
        .from("settings")
        .upsert([
          {
            key: "default_expert_booking_url",
            value: JSON.stringify(defaultExpertBookingUrl),
          },
          {
            key: "default_expert_booking_embed",
            value: JSON.stringify(defaultExpertBookingEmbed),
          },
          {
            key: "expert_booking_url_rang_1",
            value: JSON.stringify(expertBookingUrlRang1),
          },
          {
            key: "expert_booking_embed_rang_1",
            value: JSON.stringify(expertBookingEmbedRang1),
          },
          {
            key: "expert_booking_url_rang_2",
            value: JSON.stringify(expertBookingUrlRang2),
          },
          {
            key: "expert_booking_embed_rang_2",
            value: JSON.stringify(expertBookingEmbedRang2),
          },
          {
            key: "expert_booking_url_rang_3",
            value: JSON.stringify(expertBookingUrlRang3),
          },
          {
            key: "expert_booking_embed_rang_3",
            value: JSON.stringify(expertBookingEmbedRang3),
          },
          {
            key: "expert_booking_url_rang_4",
            value: JSON.stringify(expertBookingUrlRang4),
          },
          {
            key: "expert_booking_embed_rang_4",
            value: JSON.stringify(expertBookingEmbedRang4),
          },
          { key: "rdv_expert_url", value: JSON.stringify(rdvExpertUrl) },
          { key: "rdv_senior_url", value: JSON.stringify(rdvSeniorUrl) },
          { key: "rdv_junior_url", value: JSON.stringify(rdvJuniorUrl) },
          { key: "rdv_all_url", value: JSON.stringify(rdvAllUrl) }
        ], {
          onConflict: "key"
        });

      if (urlError) throw urlError;

      // Save landing page settings
      const updateData = {
        hero_title: landingSettings.hero_title,
        hero_subtitle: landingSettings.hero_subtitle,
        hero_image_url: landingSettings.hero_image_url,
        benefits: landingSettings.benefits as unknown as Json,
        expertises: landingSettings.expertises as unknown as Json,
        cta_text: landingSettings.cta_text,
        cta_secondary_text: landingSettings.cta_secondary_text,
        testimonial_enabled: landingSettings.testimonial_enabled,
        testimonial_text: landingSettings.testimonial_text,
        testimonial_author: landingSettings.testimonial_author,
        testimonial_role: landingSettings.testimonial_role,
        footer_text: landingSettings.footer_text,
        gallery_title: landingSettings.gallery_title,
        gallery_subtitle: landingSettings.gallery_subtitle,
        gallery_images: landingSettings.gallery_images as unknown as Json,
        updated_at: new Date().toISOString()
      };
      
      const { error: landingError } = await supabase
        .from("expert_booking_landing_settings")
        .update(updateData)
        .eq("id", landingSettings.id);

      if (landingError) throw landingError;
      toast.success("Paramètres enregistrés avec succès");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  // ===== HUBSPOT APPOINTMENTS FUNCTIONS =====
  const fetchHubspotAppointments = async () => {
    setHubspotLoading(true);
    try {
      const { data, error } = await supabase
        .from("hubspot_appointments")
        .select("*")
        .like("booking_source", "expert_booking%")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHubspotAppointments((data || []) as unknown as HubspotAppointment[]);
    } catch (error) {
      console.error("Error fetching HubSpot appointments:", error);
      toast.error("Erreur lors du chargement des RDV HubSpot");
    } finally {
      setHubspotLoading(false);
    }
  };

  const deleteAppointment = async (appointment: HubspotAppointment) => {
    try {
      const { error } = await supabase
        .from("hubspot_appointments")
        .delete()
        .eq("id", appointment.id);

      if (error) throw error;

      setHubspotAppointments(prev => prev.filter(a => a.id !== appointment.id));
      toast.success("RDV supprimé avec succès");
      setAppointmentToDelete(null);
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Erreur lors de la suppression du RDV");
    }
  };

  const viewPayload = (payload: Json | null) => {
    setSelectedPayload(payload);
    setIsPayloadDialogOpen(true);
  };

  const getBookingSourceLabel = (source: string | null): string => {
    if (!source) return "Inconnu";
    if (source === "expert_booking") return "Défaut";
    if (source === "expert_booking_rang_1") return "Rang 1";
    if (source === "expert_booking_rang_2") return "Rang 2";
    if (source === "expert_booking_rang_3") return "Rang 3";
    if (source === "expert_booking_rang_4") return "Rang 4";
    return source;
  };

  const getBookingLinkUsed = (source: string | null): string => {
    if (!source) return "-";
    if (source === "expert_booking_rang_1") {
      return expertBookingEmbedRang1 ? "Embed Rang 1" : (expertBookingUrlRang1 || "URL Rang 1");
    }
    if (source === "expert_booking_rang_2") {
      return expertBookingEmbedRang2 ? "Embed Rang 2" : (expertBookingUrlRang2 || "URL Rang 2");
    }
    if (source === "expert_booking_rang_3") {
      return expertBookingEmbedRang3 ? "Embed Rang 3" : (expertBookingUrlRang3 || "URL Rang 3");
    }
    if (source === "expert_booking_rang_4") {
      return expertBookingEmbedRang4 ? "Embed Rang 4" : (expertBookingUrlRang4 || "URL Rang 4");
    }
    return defaultExpertBookingEmbed ? "Embed Défaut" : (defaultExpertBookingUrl || "URL Défaut");
  };

  const filteredHubspotAppointments = hubspotAppointments.filter(apt => {
    const searchLower = hubspotSearchTerm.toLowerCase();
    return (
      apt.user_email?.toLowerCase().includes(searchLower) ||
      apt.user_name?.toLowerCase().includes(searchLower) ||
      apt.meeting_title?.toLowerCase().includes(searchLower) ||
      apt.booking_source?.toLowerCase().includes(searchLower)
    );
  });

  const addBenefit = () => {
    setLandingSettings(prev => ({
      ...prev,
      benefits: [...prev.benefits, { icon: "Star", title: "", description: "" }]
    }));
  };

  const removeBenefit = (index: number) => {
    setLandingSettings(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const updateBenefit = (index: number, field: keyof Benefit, value: string) => {
    setLandingSettings(prev => ({
      ...prev,
      benefits: prev.benefits.map((b, i) => i === index ? { ...b, [field]: value } : b)
    }));
  };

  const addExpertise = () => {
    setLandingSettings(prev => ({
      ...prev,
      expertises: [...prev.expertises, { icon: "Briefcase", title: "", description: "" }]
    }));
  };

  const removeExpertise = (index: number) => {
    setLandingSettings(prev => ({
      ...prev,
      expertises: prev.expertises.filter((_, i) => i !== index)
    }));
  };

  const updateExpertise = (index: number, field: keyof Benefit, value: string) => {
    setLandingSettings(prev => ({
      ...prev,
      expertises: prev.expertises.map((b, i) => i === index ? { ...b, [field]: value } : b)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight hero-gradient">Prise de rendez-vous expert</h2>
          <p className="text-muted-foreground">
            Configuration des liens de prise de RDV et suivi des rendez-vous confirmés
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            RDV Confirmés ({hubspotAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="context-messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages contextuels
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          {/* Booking URLs Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Liens de prise de rendez-vous
              </CardTitle>
              <CardDescription>
                Configurez les options par défaut pour la prise de rendez-vous avec un expert.
              </CardDescription>
            </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="defaultExpertBookingEmbed" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Code embed par défaut (prioritaire)
            </Label>
            <Textarea
              id="defaultExpertBookingEmbed"
              value={defaultExpertBookingEmbed}
              onChange={(e) => setDefaultExpertBookingEmbed(e.target.value)}
              placeholder='<div class="meetings-iframe-container" data-src="https://meetings.hubspot.com/..."></div>'
              className="min-h-[100px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Le code embed HubSpot pour intégrer le calendrier directement dans l'application.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultExpertBookingUrl">URL par défaut de prise de RDV</Label>
            <div className="flex gap-2">
              <Input
                id="defaultExpertBookingUrl"
                value={defaultExpertBookingUrl}
                onChange={(e) => setDefaultExpertBookingUrl(e.target.value)}
                placeholder="https://calendly.com/..."
                className="flex-1"
              />
              {defaultExpertBookingUrl && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(defaultExpertBookingUrl, "_blank")}
                  title="Tester le lien"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Ce lien sera utilisé si aucun code embed n'est configuré.
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Ordre de priorité :</p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>Code embed selon le rang de l'entreprise (si configuré)</li>
              <li>URL selon le rang de l'entreprise (si configuré)</li>
              <li>Code embed par défaut</li>
              <li>URL par défaut</li>
              <li>Code embed de l'entreprise</li>
              <li>URL de prise de RDV de l'entreprise</li>
            </ol>
          </div>

          {/* New rang×revenue URL fields */}
          <div className="border-t pt-6 mt-6">
            <h4 className="font-medium mb-4">Liens RDV par profil conseiller</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Ces liens sont attribués automatiquement selon le rang de l'entreprise et le profil de revenu du salarié.
            </p>
            <div className="space-y-4">
              {[
                { key: "rdv_expert_url", label: "Lien Expert", state: rdvExpertUrl, setter: setRdvExpertUrl, desc: "Rang 1 (tous) · Rang 2 (revenu &gt;80k) · Rang 3 (revenu &gt;80k)" },
                { key: "rdv_senior_url", label: "Lien Senior", state: rdvSeniorUrl, setter: setRdvSeniorUrl, desc: "Rang 2 (autres) · Rang 3 (revenu 50-80k) · Rang 4 (revenu &gt;80k)" },
                { key: "rdv_junior_url", label: "Lien Junior / Intermédiaire", state: rdvJuniorUrl, setter: setRdvJuniorUrl, desc: "Rang 3 (revenu &lt;50k ou NRP)" },
                { key: "rdv_all_url", label: "Lien Tous conseillers", state: rdvAllUrl, setter: setRdvAllUrl, desc: "Rang 4 (autres)" },
              ].map(({ key, label, state, setter, desc }) => (
                <div key={key} className="border rounded-lg p-4 space-y-2">
                  <Label htmlFor={key}>{label}</Label>
                  <div className="flex gap-2">
                    <Input
                      id={key}
                      value={state}
                      onChange={(e) => setter(e.target.value)}
                      placeholder="https://meetings.hubspot.com/..."
                      className="flex-1"
                    />
                    {state && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(state, "_blank")}
                        title="Tester le lien"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: desc }} />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Landing Page Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Page d'atterrissage
          </CardTitle>
          <CardDescription>
            Personnalisez la page qui s'affiche avant la prise de rendez-vous.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hero Section */}
          <div className="space-y-4">
            <h4 className="font-medium">Section Hero</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="heroTitle">Titre principal</Label>
                <Input
                  id="heroTitle"
                  value={landingSettings.hero_title}
                  onChange={(e) => setLandingSettings(prev => ({ ...prev, hero_title: e.target.value }))}
                  placeholder="Prenez rendez-vous avec un expert"
                />
              </div>
              <div className="space-y-2">
                <ImageUpload
                  label="Image hero (format carré)"
                  value={landingSettings.hero_image_url || ""}
                  onChange={(url) => setLandingSettings(prev => ({ ...prev, hero_image_url: url }))}
                  bucketName="landing-images"
                  aspectRatio="square"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroSubtitle">Sous-titre</Label>
              <Textarea
                id="heroSubtitle"
                value={landingSettings.hero_subtitle}
                onChange={(e) => setLandingSettings(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                placeholder="Un accompagnement personnalisé..."
              />
            </div>
          </div>

          {/* Benefits Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Avantages</h4>
              <Button variant="outline" size="sm" onClick={addBenefit}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
            {landingSettings.benefits.map((benefit, index) => (
              <div key={index} className="grid gap-4 md:grid-cols-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Icône</Label>
                  <IconSelector
                    value={benefit.icon}
                    onChange={(value) => updateBenefit(index, "icon", value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input
                    value={benefit.title}
                    onChange={(e) => updateBenefit(index, "title", e.target.value)}
                    placeholder="Titre de l'avantage"
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label>Description</Label>
                  <Input
                    value={benefit.description}
                    onChange={(e) => updateBenefit(index, "description", e.target.value)}
                    placeholder="Description..."
                  />
                </div>
                <div className="flex items-end">
                  <Button variant="ghost" size="icon" onClick={() => removeBenefit(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Expertises Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Nos expertises</h4>
                <p className="text-xs text-muted-foreground">Affiché entre les avantages et la galerie d'images</p>
              </div>
              <Button variant="outline" size="sm" onClick={addExpertise}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
            {landingSettings.expertises.map((expertise, index) => (
              <div key={index} className="grid gap-4 md:grid-cols-4 p-4 border rounded-lg border-dashed border-primary/30">
                <div className="space-y-2">
                  <Label>Icône</Label>
                  <IconSelector
                    value={expertise.icon}
                    onChange={(value) => updateExpertise(index, "icon", value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input
                    value={expertise.title}
                    onChange={(e) => updateExpertise(index, "title", e.target.value)}
                    placeholder="Titre de l'expertise"
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label>Description</Label>
                  <Input
                    value={expertise.description}
                    onChange={(e) => updateExpertise(index, "description", e.target.value)}
                    placeholder="Description..."
                  />
                </div>
                <div className="flex items-end">
                  <Button variant="ghost" size="icon" onClick={() => removeExpertise(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Gallery Section */}
          <div className="space-y-4">
            <h4 className="font-medium">Galerie d'images</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="galleryTitle">Titre de la section</Label>
                <Input
                  id="galleryTitle"
                  value={landingSettings.gallery_title}
                  onChange={(e) => setLandingSettings(prev => ({ ...prev, gallery_title: e.target.value }))}
                  placeholder="Ils nous font confiance"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gallerySubtitle">Sous-titre</Label>
                <Input
                  id="gallerySubtitle"
                  value={landingSettings.gallery_subtitle}
                  onChange={(e) => setLandingSettings(prev => ({ ...prev, gallery_subtitle: e.target.value }))}
                  placeholder="Des certifications et reconnaissances..."
                />
              </div>
            </div>
            <ImageGalleryUploader
              images={landingSettings.gallery_images}
              onChange={(images) => setLandingSettings(prev => ({ ...prev, gallery_images: images }))}
            />
          </div>

          {/* CTA Section */}
          <div className="space-y-4">
            <h4 className="font-medium">Bouton d'action</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ctaText">Texte du bouton</Label>
                <Input
                  id="ctaText"
                  value={landingSettings.cta_text}
                  onChange={(e) => setLandingSettings(prev => ({ ...prev, cta_text: e.target.value }))}
                  placeholder="Réserver mon créneau"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaSecondary">Texte secondaire</Label>
                <Input
                  id="ctaSecondary"
                  value={landingSettings.cta_secondary_text}
                  onChange={(e) => setLandingSettings(prev => ({ ...prev, cta_secondary_text: e.target.value }))}
                  placeholder="Gratuit et sans engagement"
                />
              </div>
            </div>
          </div>

          {/* Testimonial Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h4 className="font-medium">Témoignage</h4>
              <Switch
                checked={landingSettings.testimonial_enabled}
                onCheckedChange={(checked) => setLandingSettings(prev => ({ ...prev, testimonial_enabled: checked }))}
              />
            </div>
            {landingSettings.testimonial_enabled && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="testimonialText">Texte du témoignage</Label>
                  <Textarea
                    id="testimonialText"
                    value={landingSettings.testimonial_text || ""}
                    onChange={(e) => setLandingSettings(prev => ({ ...prev, testimonial_text: e.target.value }))}
                    placeholder="Le rendez-vous avec l'expert m'a permis..."
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="testimonialAuthor">Auteur</Label>
                    <Input
                      id="testimonialAuthor"
                      value={landingSettings.testimonial_author || ""}
                      onChange={(e) => setLandingSettings(prev => ({ ...prev, testimonial_author: e.target.value }))}
                      placeholder="Marie D."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testimonialRole">Rôle/Titre</Label>
                    <Input
                      id="testimonialRole"
                      value={landingSettings.testimonial_role || ""}
                      onChange={(e) => setLandingSettings(prev => ({ ...prev, testimonial_role: e.target.value }))}
                      placeholder="Responsable RH"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Section */}
          <div className="space-y-2">
            <Label htmlFor="footerText">Texte de pied de page</Label>
            <Input
              id="footerText"
              value={landingSettings.footer_text}
              onChange={(e) => setLandingSettings(prev => ({ ...prev, footer_text: e.target.value }))}
              placeholder="Nos experts sont disponibles..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="lg">
              <Eye className="h-4 w-4 mr-2" />
              Aperçu
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Aperçu de la page</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <ExpertBookingLandingPreview settings={landingSettings} />
            </div>
          </SheetContent>
        </Sheet>
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer tous les paramètres
            </>
          )}
        </Button>
      </div>
        </TabsContent>

        {/* HubSpot Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email, nom, titre, source..."
                value={hubspotSearchTerm}
                onChange={(e) => setHubspotSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={fetchHubspotAppointments} disabled={hubspotLoading}>
              <Loader2 className={`h-4 w-4 mr-2 ${hubspotLoading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{hubspotAppointments.length}</div>
                <div className="text-xs text-muted-foreground">Total RDV confirmés</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-5 w-5 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">
                  {hubspotAppointments.filter(a => a.meeting_start_time && new Date(a.meeting_start_time) > new Date()).length}
                </div>
                <div className="text-xs text-muted-foreground">RDV à venir</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 mx-auto mb-2 text-gray-500" />
                <div className="text-2xl font-bold">
                  {hubspotAppointments.filter(a => a.meeting_start_time && new Date(a.meeting_start_time) <= new Date()).length}
                </div>
                <div className="text-xs text-muted-foreground">RDV passés</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Link2 className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">
                  {new Set(hubspotAppointments.map(a => a.booking_source)).size}
                </div>
                <div className="text-xs text-muted-foreground">Sources différentes</div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          {hubspotLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : filteredHubspotAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun rendez-vous trouvé
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Titre réunion</TableHead>
                    <TableHead>Source / Rang</TableHead>
                    <TableHead>Lien utilisé</TableHead>
                    <TableHead>Date RDV</TableHead>
                    <TableHead>Webhook</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHubspotAppointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{apt.user_name || '-'}</div>
                          <div className="text-sm text-muted-foreground">{apt.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{apt.meeting_title || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getBookingSourceLabel(apt.booking_source)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {getBookingLinkUsed(apt.booking_source)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {apt.meeting_start_time ? (
                          <div>
                            <div>{format(new Date(apt.meeting_start_time), "dd/MM/yyyy", { locale: fr })}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(apt.meeting_start_time), "HH:mm", { locale: fr })}
                            </div>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {apt.raw_payload ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewPayload(apt.raw_payload)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Aucune donnée
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {apt.meeting_link && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <a href={apt.meeting_link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAppointmentToDelete(apt)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="context-messages" className="space-y-6">
          <BookingContextMessagesEditor />
        </TabsContent>
      </Tabs>

      {/* HubSpot Payload Dialog */}
      <Dialog open={isPayloadDialogOpen} onOpenChange={setIsPayloadDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Réponse Webhook HubSpot</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
              {JSON.stringify(selectedPayload, null, 2)}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Appointment Confirmation */}
      <AlertDialog open={!!appointmentToDelete} onOpenChange={() => setAppointmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce rendez-vous ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le rendez-vous de{" "}
              <strong>{appointmentToDelete?.user_name || appointmentToDelete?.user_email}</strong>{" "}
              sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => appointmentToDelete && deleteAppointment(appointmentToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
