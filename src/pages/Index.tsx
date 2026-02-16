import { useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight, GraduationCap, Calculator, Calendar, Shield, TrendingUp, Users, ChevronDown, BookOpen, Target, Lightbulb } from "lucide-react";
import { PageMeta } from "@/components/seo/PageMeta";
import { JsonLdOrganization, JsonLdSoftware } from "@/components/seo/JsonLd";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const invitationToken = searchParams.get("invitation");
    if (invitationToken) {
      const params = new URLSearchParams(searchParams);
      navigate(`/onboarding?${params.toString()}`, { replace: true });
      return;
    }
    checkExistingSession();
  }, [searchParams]);

  const checkExistingSession = async () => {
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      navigate("/reset-password" + hash, { replace: true });
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (roleData?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/employee");
      }
    }
  };

  const features = [
    {
      icon: GraduationCap,
      title: "Modules d'éducation financière",
      description: "Des parcours interactifs et ludiques pour comprendre l'épargne, le crédit, la fiscalité et les placements.",
    },
    {
      icon: Calculator,
      title: "Simulateurs personnalisés",
      description: "Simulez votre capacité d'emprunt, votre épargne de précaution, votre PER et bien plus encore.",
    },
    {
      icon: Calendar,
      title: "Rendez-vous expert certifié",
      description: "Échangez gratuitement avec un conseiller financier certifié, en toute confidentialité.",
    },
    {
      icon: Target,
      title: "Horizon – Planification budgétaire",
      description: "Planifiez vos projets de vie et suivez vos objectifs financiers mois par mois.",
    },
  ];

  const stats = [
    { value: "92%", label: "des salariés satisfaits" },
    { value: "+30", label: "modules disponibles" },
    { value: "100%", label: "confidentiel" },
    { value: "0€", label: "pour le salarié" },
  ];

  const steps = [
    {
      number: "1",
      title: "Votre entreprise active MyFinCare",
      description: "L'employeur souscrit au programme. Aucune démarche pour le salarié.",
    },
    {
      number: "2",
      title: "Vous créez votre espace personnel",
      description: "Inscription en 2 minutes avec votre email professionnel, diagnostic financier inclus.",
    },
    {
      number: "3",
      title: "Vous progressez à votre rythme",
      description: "Modules, simulateurs, rendez-vous experts : tout est accessible depuis votre tableau de bord.",
    },
  ];

  const faqItems = [
    {
      question: "Qu'est-ce que MyFinCare ?",
      answer: "MyFinCare est un programme d'éducation financière conçu pour les salariés. Il propose des modules interactifs, des simulateurs, des rendez-vous avec des experts certifiés et des outils de planification budgétaire.",
    },
    {
      question: "Est-ce que MyFinCare est gratuit pour les salariés ?",
      answer: "Oui, MyFinCare est entièrement gratuit pour les salariés. C'est l'entreprise qui finance le programme dans le cadre de sa politique de bien-être au travail.",
    },
    {
      question: "Mes données financières sont-elles protégées ?",
      answer: "Absolument. Vos données sont chiffrées et strictement confidentielles. Votre employeur n'a accès à aucune information personnelle ou financière.",
    },
    {
      question: "Comment proposer MyFinCare à mon entreprise ?",
      answer: "Vous pouvez remplir le formulaire de contact sur notre page partenariat ou nous écrire directement. Nous prendrons contact avec votre service RH.",
    },
    {
      question: "Quels sujets sont couverts par les modules ?",
      answer: "Épargne, crédit immobilier, fiscalité, retraite, investissement, budget, épargne salariale, assurances... Plus de 30 modules couvrent l'essentiel de la vie financière.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="MyFinCare – L'éducation financière des salariés"
        description="MyFinCare aide chaque salarié à reprendre le pouvoir sur ses finances grâce à des modules interactifs, des simulateurs et des rendez-vous experts personnalisés."
        path="/"
      />
      <JsonLdOrganization />
      <JsonLdSoftware />

      {/* ===== NAVBAR ===== */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <nav className="container max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="text-xl font-bold hero-gradient">
            MyFinCare
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Comment ça marche</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            <Link to="/partenariat" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Entreprises</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Se connecter</Button>
            </Link>
            <Button size="sm" onClick={() => navigate("/onboarding")} className="btn-hero-gradient">
              Commencer
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* ===== HERO ===== */}
        <section className="relative py-16 lg:py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
          <div className="container max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                  <span className="hero-gradient">Redonnez à vos salariés le pouvoir sur leurs finances.</span>
                </h1>
                <p className="text-lg lg:text-xl text-muted-foreground max-w-xl">
                  MyFinCare est le programme d'éducation financière qui accompagne chaque salarié avec des modules interactifs, des simulateurs et des experts certifiés — en toute confidentialité.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="btn-hero-gradient text-base sm:text-lg px-8 py-6"
                    onClick={() => navigate("/onboarding")}
                  >
                    Commencer l'expérience MyFinCare
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base sm:text-lg px-8 py-6"
                    onClick={() => navigate("/partenariat")}
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    Proposer à mes salariés
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center lg:justify-end">
                <div className="w-full max-w-md lg:max-w-full aspect-square overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover rounded-2xl shadow-2xl"
                  >
                    <source src="/video_index3.mp4" type="video/mp4" />
                    Votre navigateur ne supporte pas la lecture de vidéos.
                  </video>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== STATS BAND ===== */}
        <section className="w-full py-12 bg-card/60 backdrop-blur-sm border-y border-border/30">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat, i) => (
                <div key={i}>
                  <p className="text-3xl lg:text-4xl font-bold hero-gradient">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section id="features" className="py-20 lg:py-28 px-4">
          <div className="container max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Des outils concrets pour reprendre le contrôle
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Chaque salarié accède à un espace personnalisé avec tout ce dont il a besoin pour mieux comprendre et gérer ses finances.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <article key={i} className="bg-card rounded-2xl p-6 shadow-card hover:shadow-hover transition-all duration-300 border border-border/50">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== IMPACT ===== */}
        <section className="py-20 lg:py-28 px-4 bg-card/30">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Le bien-être financier, un levier de performance
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Quand les salariés ne s'inquiètent plus de leurs finances, l'entreprise en bénéficie directement.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: TrendingUp, value: "-27%", label: "de turnover", detail: "Les salariés accompagnés restent plus longtemps" },
                { icon: Users, value: "+35%", label: "d'engagement", detail: "Des collaborateurs plus sereins et productifs" },
                { icon: Shield, value: "534€", label: "d'économies/an", detail: "En moyenne pour chaque salarié utilisateur" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <article key={i} className="text-center bg-card rounded-2xl p-8 shadow-card border border-border/50">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-4xl font-bold hero-gradient mb-1">{item.value}</p>
                    <p className="text-base font-medium mb-2">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.detail}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section id="how-it-works" className="py-20 lg:py-28 px-4">
          <div className="container max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Comment ça marche ?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Trois étapes simples pour démarrer votre parcours d'éducation financière.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <article key={i} className="relative text-center">
                  <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-6 text-xl font-bold shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-7 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-border" />
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===== TESTIMONIALS ===== */}
        <section className="py-20 lg:py-28 px-4 bg-card/30">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">Ce qu'en disent nos utilisateurs</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote: "Grâce à MyFinCare, j'ai enfin compris comment optimiser mon épargne salariale. Les modules sont clairs et concrets.",
                  author: "Sophie L.",
                  role: "Responsable marketing",
                },
                {
                  quote: "Le simulateur de capacité d'emprunt m'a permis de préparer mon projet immobilier sereinement. Un vrai gain de temps.",
                  author: "Thomas R.",
                  role: "Développeur",
                },
                {
                  quote: "J'ai pu prendre rendez-vous avec un expert certifié gratuitement. Il m'a aidé à comprendre ma fiche de paie et mes droits.",
                  author: "Amina K.",
                  role: "Assistante RH",
                },
              ].map((t, i) => (
                <article key={i} className="bg-card rounded-2xl p-6 shadow-card border border-border/50 flex flex-col">
                  <blockquote className="text-sm text-muted-foreground italic leading-relaxed flex-1">
                    "{t.quote}"
                  </blockquote>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="font-semibold text-sm">{t.author}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section id="faq" className="py-20 lg:py-28 px-4">
          <div className="container max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">Questions fréquentes</h2>
            <Accordion type="single" collapsible className="space-y-3">
              {faqItems.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-xl border border-border/50 px-6">
                  <AccordionTrigger className="text-left font-medium hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ===== CTA FINAL ===== */}
        <section className="py-20 lg:py-28 px-4 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10">
          <div className="container max-w-3xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Prêt à transformer le bien-être financier de vos équipes ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Rejoignez les entreprises qui investissent dans l'éducation financière de leurs salariés.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="btn-hero-gradient text-lg px-8 py-6"
                onClick={() => navigate("/onboarding")}
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={() => navigate("/partenariat")}
              >
                <Mail className="mr-2 h-5 w-5" />
                Proposer à mon entreprise
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 px-4 border-t border-border bg-card/50">
        <div className="container max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="font-bold text-lg hero-gradient mb-2">MyFinCare</p>
              <p className="text-sm text-muted-foreground">
                Le programme d'éducation financière de Perlib, conçu pour accompagner chaque salarié vers une meilleure maîtrise de ses finances.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-3 text-sm">Navigation</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">Comment ça marche</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
                <li><Link to="/partenariat" className="hover:text-foreground transition-colors">Entreprises</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-3 text-sm">Accès</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/login" className="hover:text-foreground transition-colors">Se connecter</Link></li>
                <li><Link to="/onboarding" className="hover:text-foreground transition-colors">S'inscrire</Link></li>
                <li><Link to="/rdv-expert" className="hover:text-foreground transition-colors">Rendez-vous expert</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} MyFinCare – Programme d'éducation financière de Perlib. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
