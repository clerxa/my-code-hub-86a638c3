import { useState, useEffect } from "react";
import { PageMeta } from "@/components/seo/PageMeta";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Target, TrendingUp, Shield, Star, CheckCircle, ArrowRight, Quote, Clock, Users, Award, Zap, Heart, Lightbulb, Gift, Trophy, ThumbsUp, MessageCircle, Calendar, Briefcase, Rocket, Smile, Eye, ArrowLeft, Euro, Home, Calculator, Compass, BookOpen, Landmark, PiggyBank, Scale, FileText, HandCoins, Building, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRdvLink } from "@/hooks/useRdvLink";
import { useAuth } from "@/components/AuthProvider";
import { useBookingReferrer, getStoredUtmCampaignFull, appendUtmParams } from "@/hooks/useBookingReferrer";
import { useEventTracking } from "@/hooks/useEventTracking";
import { useBookingContextMessage } from "@/hooks/useBookingContextMessage";

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
}

interface LandingSettings {
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

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Target, TrendingUp, Shield, Star, CheckCircle, Clock, Users, Award, Zap,
  Heart, Lightbulb, Gift, Trophy, ThumbsUp, MessageCircle, Calendar,
  Briefcase, Rocket, Smile, Eye, Euro, Home, Calculator, Compass,
  BookOpen, Landmark, PiggyBank, Scale, FileText, HandCoins, Building, Wallet
};

export default function ExpertBookingLanding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [prefillData, setPrefillData] = useState<{ firstName?: string; lastName?: string; email?: string; company?: string; phone?: string }>({});
  const { user } = useAuth();
  const { rdvUrl, isLoading: bookingLoading } = useRdvLink();
  const fallbackUrl = rdvUrl;
  
  // Track referrer when user arrives on this page
  useBookingReferrer();
  
  // Get contextual message based on referrer
  const { contextMessage } = useBookingContextMessage();
  
  // Track page view for intention scoring
  const { trackPageView } = useEventTracking();
  useEffect(() => {
    trackPageView("expert_booking_page");
  }, [trackPageView]);
  
  // Get UTM campaign from the referrer — read once and memoize to survive re-renders
  const [utmCampaign] = useState(() => getStoredUtmCampaignFull());

  // Build the final booking URL with UTM + prefill params
  const buildBookingUrl = (): string => {
    if (!fallbackUrl) return '#';
    let url = appendUtmParams(fallbackUrl, utmCampaign);
    try {
      const u = new URL(url);
      if (prefillData.firstName) u.searchParams.set("firstName", prefillData.firstName);
      if (prefillData.lastName) u.searchParams.set("lastName", prefillData.lastName);
      if (prefillData.email) u.searchParams.set("email", prefillData.email);
      if (prefillData.company) u.searchParams.set("company", prefillData.company);
      if (prefillData.phone) u.searchParams.set("phone", prefillData.phone);
      return u.toString();
    } catch { return url; }
  };
  useEffect(() => {
    fetchSettings();
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, first_name, last_name, email, phone_number")
      .eq("id", user.id)
      .maybeSingle();
    if (profile) {
      if (profile.company_id) setCompanyId(profile.company_id);
      // Fetch company name for prefill
      let companyName: string | undefined;
      if (profile.company_id) {
        const { data: company } = await supabase
          .from("companies")
          .select("name")
          .eq("id", profile.company_id)
          .maybeSingle();
        companyName = company?.name || undefined;
      }
      setPrefillData({
        firstName: profile.first_name || undefined,
        lastName: profile.last_name || undefined,
        email: profile.email || user.email || undefined,
        company: companyName,
        phone: profile.phone_number || undefined,
      });
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("expert_booking_landing_settings")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const benefits = Array.isArray(data.benefits) 
          ? (data.benefits as unknown as Benefit[]) 
          : [];
        const expertises = Array.isArray(data.expertises)
          ? (data.expertises as unknown as Benefit[])
          : [];
        const galleryImages = Array.isArray(data.gallery_images)
          ? (data.gallery_images as unknown as GalleryImage[])
          : [];
        setSettings({
          hero_title: data.hero_title || "Prenez rendez-vous avec un expert",
          hero_subtitle: data.hero_subtitle || "Un accompagnement personnalisé pour optimiser vos finances",
          hero_image_url: data.hero_image_url,
          benefits,
          expertises,
          cta_text: data.cta_text || "Réserver mon créneau",
          cta_secondary_text: data.cta_secondary_text || "Gratuit et sans engagement",
          testimonial_enabled: data.testimonial_enabled || false,
          testimonial_text: data.testimonial_text,
          testimonial_author: data.testimonial_author,
          testimonial_role: data.testimonial_role,
          footer_text: data.footer_text || "",
          gallery_title: data.gallery_title || "Ils nous font confiance",
          gallery_subtitle: data.gallery_subtitle || "",
          gallery_images: galleryImages
        });
      }
    } catch (error) {
      console.error("Error fetching landing settings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || bookingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PageMeta title="Rendez-vous expert financier" description="Prenez rendez-vous avec un expert certifié MyFinCare pour un accompagnement financier personnalisé et confidentiel." path="/rdv-expert" />
      {/* Back Button */}
      <div className="container max-w-6xl mx-auto px-4 pt-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/employee")}
          className="gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à mon espace
        </Button>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white" />
        <div className="container max-w-6xl mx-auto px-4 py-16 md:py-24 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {/* Contextual message from booking_context_messages */}
              {contextMessage.dialog_description && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <p className="text-sm font-medium text-blue-700">{contextMessage.dialog_title}</p>
                  <p className="text-sm text-slate-600 mt-1">{contextMessage.dialog_description}</p>
                </div>
              )}
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                {settings?.hero_title}
              </h1>
              <p className="text-xl text-slate-500">
                {settings?.hero_subtitle}
              </p>
              {settings?.gallery_images && settings.gallery_images.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {settings.gallery_images.map((image) => (
                    <div key={image.id} className="w-24 h-24 rounded-lg overflow-hidden shadow-sm border border-border/50">
                      <img
                        src={image.url}
                        alt={image.alt || "Réassurance"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                  <a href={buildBookingUrl()} target="_blank" rel="noopener noreferrer">
                    <Calendar className="h-4 w-4 mr-2" />
                    {settings?.cta_text || "Réserver mon créneau"}
                  </a>
                </Button>
              </div>
              {settings?.cta_secondary_text && (
                <p className="text-sm text-slate-400">
                  {settings.cta_secondary_text}
                </p>
              )}
            </div>
            {settings?.hero_image_url && (
              <div className="relative">
                <img
                  src={settings.hero_image_url}
                  alt="Expert consultation"
                  className="rounded-2xl shadow-2xl"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      {settings?.benefits && settings.benefits.length > 0 && (
        <section className="py-16 md:py-24 bg-slate-50/80">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
              Pourquoi prendre rendez-vous ?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {settings.benefits.map((benefit, index) => {
                const IconComponent = iconMap[benefit.icon] || CheckCircle;
                return (
                  <Card key={index} className="border border-slate-100 shadow-md hover:shadow-lg transition-shadow bg-white">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                        <IconComponent className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900">{benefit.title}</h3>
                      <p className="text-slate-500">{benefit.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Expertises Section */}
      {settings?.expertises && settings.expertises.length > 0 && (
        <section className="py-16 md:py-24 bg-white">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4 text-slate-900">
              Nos expertises
            </h2>
            <p className="text-center text-slate-500 mb-12 max-w-2xl mx-auto">
              Des domaines de compétence variés pour répondre à tous vos besoins financiers
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {settings.expertises.map((expertise, index) => {
                const IconComponent = iconMap[expertise.icon] || CheckCircle;
                return (
                  <div key={index} className="group flex flex-col items-center text-center p-6 rounded-xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2 text-slate-900">{expertise.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{expertise.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Testimonial Section */}
      {settings?.testimonial_enabled && settings.testimonial_text && (
        <section className="py-16 bg-blue-50/50">
          <div className="container max-w-4xl mx-auto px-4">
            <Card className="border border-blue-100 shadow-md bg-white">
              <CardContent className="p-8 md:p-12">
                <Quote className="h-12 w-12 text-blue-200 mb-6" />
                <blockquote className="text-xl md:text-2xl text-slate-700 mb-6 leading-relaxed">
                  "{settings.testimonial_text}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-lg font-semibold text-blue-600">
                      {settings.testimonial_author?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{settings.testimonial_author}</p>
                    {settings.testimonial_role && (
                      <p className="text-sm text-slate-500">{settings.testimonial_role}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {settings?.gallery_images && settings.gallery_images.length > 0 && (
        <section className="py-16 bg-slate-50 rounded-xl mx-4">
          <div className="container max-w-6xl mx-auto px-4">
            {settings.gallery_title && (
              <h2 className="text-3xl font-bold text-center mb-4 text-slate-900">{settings.gallery_title}</h2>
            )}
            {settings.gallery_subtitle && (
              <p className="text-center text-slate-500 mb-12 max-w-2xl mx-auto">{settings.gallery_subtitle}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {settings.gallery_images.map((image) => (
                <div key={image.id} className="space-y-3">
                  <div className="aspect-square rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={image.url}
                      alt={image.alt || "Gallery"}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {image.caption && (
                    <p className="text-sm text-center text-slate-500">{image.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-slate-900">Prêt à démarrer ?</h2>
          <p className="text-xl text-slate-500 mb-8">
            Réservez votre créneau dès maintenant et bénéficiez d'un accompagnement personnalisé.
          </p>
          <Button asChild size="lg">
            <a href={buildBookingUrl()} target="_blank" rel="noopener noreferrer">
              <Calendar className="h-4 w-4 mr-2" />
              {settings?.cta_text || "Réserver mon créneau"}
            </a>
          </Button>
          {settings?.footer_text && (
            <p className="mt-6 text-sm text-slate-400">
              {settings.footer_text}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
