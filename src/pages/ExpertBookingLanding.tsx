import { useState, useEffect, useRef } from "react";
import { PageMeta } from "@/components/seo/PageMeta";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Target, TrendingUp, Shield, Star, CheckCircle, ArrowRight, Quote, Clock, Users, Award, Zap, Heart, Lightbulb, Gift, Trophy, ThumbsUp, MessageCircle, Calendar, Briefcase, Rocket, Smile, Eye, ArrowLeft, Euro, Home, Calculator, Compass, BookOpen, Landmark, PiggyBank, Scale, FileText, HandCoins, Building, Wallet, Lock, BadgeCheck, Phone } from "lucide-react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
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

/* ── Scroll-reveal wrapper ── */
function RevealOnScroll({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Floating CTA bar (sticky) ── */
function FloatingCTA({ ctaText, bookingUrl }: { ctaText: string; bookingUrl: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={show ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:bottom-6 md:left-auto md:right-6 md:w-auto"
    >
      <div className="bg-white/90 backdrop-blur-lg border-t md:border md:rounded-2xl shadow-2xl px-6 py-3 flex items-center justify-between md:justify-center gap-4">
        <span className="text-sm font-medium text-slate-700 hidden sm:block">Prêt à être accompagné ?</span>
        <Button asChild size="lg" className="shadow-lg">
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
            <Calendar className="h-4 w-4 mr-2" />
            {ctaText}
          </a>
        </Button>
      </div>
    </motion.div>
  );
}

export default function ExpertBookingLanding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<LandingSettings | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [prefillData, setPrefillData] = useState<{ firstName?: string; lastName?: string; email?: string; company?: string; phone?: string }>({});
  const { user } = useAuth();
  const { rdvUrl, isLoading: bookingLoading } = useRdvLink();
  const fallbackUrl = rdvUrl;

  useBookingReferrer();
  const { contextMessage } = useBookingContextMessage();

  const { trackPageView } = useEventTracking();
  useEffect(() => { trackPageView("expert_booking_page"); }, [trackPageView]);

  const [utmCampaign] = useState(() => getStoredUtmCampaignFull());

  /* Parallax refs */
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

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
      const { data, error } = await supabase.from("expert_booking_landing_settings").select("*").limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setSettings({
          hero_title: data.hero_title || "Prenez rendez-vous avec un expert",
          hero_subtitle: data.hero_subtitle || "Un accompagnement personnalisé pour optimiser vos finances",
          hero_image_url: data.hero_image_url,
          benefits: Array.isArray(data.benefits) ? (data.benefits as unknown as Benefit[]) : [],
          expertises: Array.isArray(data.expertises) ? (data.expertises as unknown as Benefit[]) : [],
          cta_text: data.cta_text || "Réserver mon créneau",
          cta_secondary_text: data.cta_secondary_text || "Gratuit et sans engagement",
          testimonial_enabled: data.testimonial_enabled || false,
          testimonial_text: data.testimonial_text,
          testimonial_author: data.testimonial_author,
          testimonial_role: data.testimonial_role,
          footer_text: data.footer_text || "",
          gallery_title: data.gallery_title || "Ils nous font confiance",
          gallery_subtitle: data.gallery_subtitle || "",
          gallery_images: Array.isArray(data.gallery_images) ? (data.gallery_images as unknown as GalleryImage[]) : [],
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const bookingUrl = buildBookingUrl();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <PageMeta title="Rendez-vous expert financier" description="Prenez rendez-vous avec un expert certifié MyFinCare pour un accompagnement financier personnalisé et confidentiel." path="/rdv-expert" />

      {/* Floating sticky CTA */}
      <FloatingCTA ctaText={settings?.cta_text || "Réserver"} bookingUrl={bookingUrl} />

      {/* ════════ HERO ════════ */}
      <section ref={heroRef} className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Parallax background */}
        <motion.div style={{ y: heroY }} className="absolute inset-0 -top-20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50/60 to-white" />
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/30 rounded-full blur-3xl" />
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="container max-w-6xl mx-auto px-4 py-20 relative z-10">
          {/* Back */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Button variant="ghost" onClick={() => navigate("/employee")} className="gap-2 text-slate-500 hover:text-slate-900 mb-8">
              <ArrowLeft className="h-4 w-4" /> Retour à mon espace
            </Button>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {/* Context message */}
              {contextMessage.dialog_description && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                  className="rounded-xl bg-blue-50 border border-blue-200/60 p-4 flex items-start gap-3"
                >
                  <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">{contextMessage.dialog_title}</p>
                    <p className="text-sm text-blue-600 mt-0.5">{contextMessage.dialog_description}</p>
                  </div>
                </motion.div>
              )}

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]"
              >
                {settings?.hero_title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6 }}
                className="text-lg md:text-xl text-slate-500 max-w-lg leading-relaxed"
              >
                {settings?.hero_subtitle}
              </motion.p>

              {/* Trust badges inline */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                className="flex flex-wrap items-center gap-5 text-sm text-slate-400"
              >
                <span className="flex items-center gap-1.5"><Lock className="h-4 w-4" /> 100% confidentiel</span>
                <span className="flex items-center gap-1.5 text-base font-semibold text-slate-500"><BadgeCheck className="h-5 w-5 text-primary" /> Experts certifiés & récompensés</span>
                <span className="flex items-center gap-1.5"><Gift className="h-4 w-4" /> Gratuit et sans engagement</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 items-start"
              >
                <Button asChild size="lg" className="text-base px-8 py-6 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all">
                  <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                    <Calendar className="h-5 w-5 mr-2" />
                    {settings?.cta_text || "Réserver mon créneau"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </motion.div>

              {settings?.cta_secondary_text && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                  className="text-sm text-slate-400"
                >
                  {settings.cta_secondary_text}
                </motion.p>
              )}
            </div>

            {/* Hero image with float animation */}
            {settings?.hero_image_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative hidden lg:block"
              >
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <img
                    src={settings.hero_image_url}
                    alt="Expert consultation"
                    className="rounded-3xl shadow-2xl shadow-slate-200/60 w-full"
                  />
                </motion.div>
                {/* Decorative badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, type: "spring" }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">+2 000 RDV</p>
                    <p className="text-xs text-slate-400">réalisés cette année</p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </section>

      {/* ════════ GALLERY (reassurance logos) ════════ */}
      {settings?.gallery_images && settings.gallery_images.length > 0 && (
        <section className="py-10 border-y border-slate-100 bg-slate-50/50">
          <div className="container max-w-6xl mx-auto px-4">
            {settings.gallery_title && (
              <RevealOnScroll>
                <p className="text-center text-sm font-medium text-slate-400 uppercase tracking-widest mb-8">{settings.gallery_title}</p>
              </RevealOnScroll>
            )}
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {settings.gallery_images.map((image, i) => (
                <RevealOnScroll key={image.id} delay={i * 0.08}>
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300">
                    <img src={image.url} alt={image.alt || "Partenaire"} className="w-full h-full object-cover" />
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════ BENEFITS ════════ */}
      {settings?.benefits && settings.benefits.length > 0 && (
        <section className="py-20 md:py-28 bg-white">
          <div className="container max-w-6xl mx-auto px-4">
            <RevealOnScroll>
              <p className="text-center text-sm font-semibold text-primary uppercase tracking-widest mb-3">Avantages</p>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-900">
                Pourquoi prendre rendez-vous ?
              </h2>
              <p className="text-center text-slate-400 mb-16 max-w-xl mx-auto">
                Un échange structuré avec un expert pour avancer concrètement sur vos sujets financiers.
              </p>
            </RevealOnScroll>

            <div className="grid md:grid-cols-3 gap-8 [&>*:last-child:nth-child(3n+1)]:md:col-start-2">
              {settings.benefits.map((benefit, index) => {
                const IconComponent = iconMap[benefit.icon] || CheckCircle;
                return (
                  <RevealOnScroll key={index} delay={index * 0.12}>
                    <Card className="group border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white h-full">
                      <CardContent className="p-8 text-center space-y-5">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <IconComponent className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{benefit.title}</h3>
                        <p className="text-slate-500 leading-relaxed">{benefit.description}</p>
                      </CardContent>
                    </Card>
                  </RevealOnScroll>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ════════ EXPERTISES ════════ */}
      {settings?.expertises && settings.expertises.length > 0 && (
        <section className="py-20 md:py-28 bg-gradient-to-b from-slate-50/80 to-white">
          <div className="container max-w-6xl mx-auto px-4">
            <RevealOnScroll>
              <p className="text-center text-sm font-semibold text-primary uppercase tracking-widest mb-3">Domaines</p>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-slate-900">
                Nos expertises
              </h2>
              <p className="text-center text-slate-400 mb-16 max-w-2xl mx-auto">
                Des domaines de compétence variés pour répondre à tous vos besoins financiers
              </p>
            </RevealOnScroll>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {settings.expertises.map((expertise, index) => {
                const IconComponent = iconMap[expertise.icon] || CheckCircle;
                return (
                  <RevealOnScroll key={index} delay={index * 0.08}>
                    <div className="group flex flex-col items-center text-center p-7 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 h-full">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-bold mb-2 text-slate-900">{expertise.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{expertise.description}</p>
                    </div>
                  </RevealOnScroll>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ════════ HOW IT WORKS ════════ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          <RevealOnScroll>
            <p className="text-center text-sm font-semibold text-primary uppercase tracking-widest mb-3">Processus</p>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-slate-900">Comment ça marche ?</h2>
          </RevealOnScroll>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-primary/10 to-transparent hidden md:block" />
            
            {[
              { icon: Calendar, title: "Choisissez un créneau", desc: "Sélectionnez une date et un horaire qui vous conviennent parmi les disponibilités." },
              { icon: Phone, title: "Échangez avec un expert", desc: "Un conseiller certifié vous appelle pour comprendre votre situation et vos objectifs." },
              { icon: Rocket, title: "Recevez votre plan d'action", desc: "Repartez avec des recommandations concrètes et personnalisées à mettre en œuvre." },
            ].map((step, i) => (
              <RevealOnScroll key={i} delay={i * 0.15}>
                <div className="flex items-start gap-6 mb-12 last:mb-0">
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="pt-2">
                    <span className="text-xs font-bold text-primary/50 uppercase tracking-widest">Étape {i + 1}</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">{step.title}</h3>
                    <p className="text-slate-500 mt-2 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ TESTIMONIAL ════════ */}
      {settings?.testimonial_enabled && settings.testimonial_text && (
        <section className="py-20 bg-gradient-to-b from-blue-50/40 to-white">
          <div className="container max-w-4xl mx-auto px-4">
            <RevealOnScroll>
              <Card className="border-0 shadow-xl bg-white overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-[1fr,auto]">
                    <div className="p-10 md:p-14">
                      <Quote className="h-10 w-10 text-primary/20 mb-6" />
                      <blockquote className="text-xl md:text-2xl text-slate-700 mb-8 leading-relaxed font-medium italic">
                        "{settings.testimonial_text}"
                      </blockquote>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {settings.testimonial_author?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{settings.testimonial_author}</p>
                          {settings.testimonial_role && (
                            <p className="text-sm text-slate-400">{settings.testimonial_role}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:block w-2 bg-gradient-to-b from-primary via-primary/60 to-primary/20" />
                  </div>
                </CardContent>
              </Card>
            </RevealOnScroll>
          </div>
        </section>
      )}

      {/* ════════ FINAL CTA ════════ */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.15),transparent_60%)]" />
        
        <div className="container max-w-4xl mx-auto px-4 text-center relative z-10">
          <RevealOnScroll>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-white leading-tight">
              Prêt à prendre en main<br />vos finances ?
            </h2>
            <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto leading-relaxed">
              Réservez votre créneau dès maintenant et bénéficiez d'un accompagnement personnalisé par un expert certifié.
            </p>
            <Button asChild size="lg" className="text-base px-10 py-6 bg-white text-slate-900 hover:bg-slate-100 shadow-2xl">
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                <Calendar className="h-5 w-5 mr-2" />
                {settings?.cta_text || "Réserver mon créneau"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><Lock className="h-4 w-4" /> Confidentiel</span>
              <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4" /> Certifiés & récompensés</span>
              <span className="flex items-center gap-1.5"><Gift className="h-4 w-4" /> Sans engagement</span>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {settings?.footer_text && (
        <div className="py-6 text-center">
          <p className="text-sm text-slate-400">{settings.footer_text}</p>
        </div>
      )}
    </div>
  );
}
