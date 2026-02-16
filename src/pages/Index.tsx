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
      description: "Offrez à vos collaborateurs des parcours interactifs sur l'épargne, la fiscalité et les placements — sans mobiliser vos équipes RH.",
    },
    {
      icon: Calculator,
      title: "Simulateurs personnalisés",
      description: "Vos salariés simulent leur capacité d'emprunt, épargne de précaution ou PER en autonomie, avec des résultats concrets.",
    },
    {
      icon: Calendar,
      title: "Rendez-vous experts certifiés",
      description: "Donnez accès à des conseillers financiers certifiés pour un accompagnement individuel et confidentiel, inclus dans le programme.",
    },
    {
      icon: Target,
      title: "Planification budgétaire (Horizon)",
      description: "Aidez vos salariés à anticiper leurs projets de vie grâce à un outil de planification budgétaire mois par mois.",
    },
  ];

  const stats = [
    { value: "92%", label: "de satisfaction collaborateurs" },
    { value: "+30", label: "modules clé en main" },
    { value: "0", label: "charge RH supplémentaire" },
    { value: "100%", label: "confidentiel" },
  ];

  const steps = [
    {
      number: "1",
      title: "Vous activez le programme",
      description: "Déploiement en quelques jours, sans intégration technique. Nous configurons tout pour vous.",
    },
    {
      number: "2",
      title: "Vos salariés s'inscrivent",
      description: "Chaque collaborateur crée son espace en 2 minutes avec son email professionnel.",
    },
    {
      number: "3",
      title: "Vous suivez l'impact",
      description: "Tableau de bord entreprise avec indicateurs d'engagement, de satisfaction et de ROI en temps réel.",
    },
  ];

  const faqItems = [
    {
      question: "Qu'est-ce que MyFinCare apporte à mon entreprise ?",
      answer: "MyFinCare renforce votre marque employeur et réduit le stress financier de vos collaborateurs. Résultat : moins de turnover, plus d'engagement et un avantage social différenciant qui ne coûte rien en charges patronales.",
    },
    {
      question: "Combien de temps faut-il pour déployer MyFinCare ?",
      answer: "Le déploiement se fait en quelques jours. Aucune intégration technique n'est nécessaire : nous configurons la plateforme, vous communiquez à vos équipes.",
    },
    {
      question: "Les données de mes salariés sont-elles protégées ?",
      answer: "Absolument. Les données financières personnelles sont chiffrées et strictement confidentielles. En tant qu'employeur, vous n'avez accès qu'aux indicateurs agrégés et anonymisés.",
    },
    {
      question: "Quel est le coût pour l'entreprise ?",
      answer: "MyFinCare fonctionne sur un modèle d'abonnement par entreprise. Le programme est entièrement gratuit pour les salariés. Contactez-nous pour un devis personnalisé selon la taille de votre effectif.",
    },
    {
      question: "Comment mesurer le retour sur investissement ?",
      answer: "Votre tableau de bord entreprise affiche en temps réel le taux d'adoption, la satisfaction, le nombre de rendez-vous experts et les indicateurs d'engagement — des métriques directement corrélées à la réduction du turnover.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="MyFinCare – Le bien-être financier de vos salariés"
        description="Renforcez votre marque employeur avec MyFinCare : le programme d'éducation financière clé en main pour vos collaborateurs. Réduisez le turnover et boostez l'engagement."
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
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Le programme</a>
            <a href="#impact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Impact</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Déploiement</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Espace client</Button>
            </Link>
            <Button size="sm" onClick={() => navigate("/partenariat")} className="btn-hero-gradient">
              Demander une démo
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
              <div className="space-y-8 order-2 lg:order-1">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                  <span className="hero-gradient">Le bien-être financier au cœur de votre politique RH.</span>
                </h1>
                <p className="text-lg lg:text-xl text-muted-foreground max-w-xl">
                  Offrez à vos collaborateurs un programme d'éducation financière complet : modules interactifs, simulateurs et experts certifiés — sans charge pour vos équipes RH.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="btn-hero-gradient text-base sm:text-lg px-8 py-6"
                    onClick={() => navigate("/partenariat")}
                  >
                    Demander une démo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-base sm:text-lg px-8 py-6"
                    onClick={() => navigate("/partenariat")}
                  >
                    Découvrir le programme
                  </Button>
                </div>
              </div>

              <div className="order-1 lg:order-2 flex items-center justify-center lg:justify-end">
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-full max-h-[35vh] sm:max-h-[40vh] lg:max-h-[60vh] aspect-square overflow-hidden rounded-2xl shadow-2xl">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
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
                Un programme clé en main pour vos équipes
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Déployez un dispositif complet d'accompagnement financier, sans mobiliser vos ressources internes.
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
        <section id="impact" className="py-20 lg:py-28 px-4 bg-card/30">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Un impact mesurable sur votre performance RH
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Le stress financier coûte cher aux entreprises. MyFinCare vous aide à réduire le turnover, l'absentéisme et à renforcer l'engagement.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: TrendingUp, value: "-27%", label: "de turnover", detail: "Vos talents restent plus longtemps dans l'entreprise" },
                { icon: Users, value: "+35%", label: "d'engagement", detail: "Des collaborateurs plus sereins, plus impliqués" },
                { icon: Shield, value: "0€", label: "de charges supplémentaires", detail: "Un avantage social sans cotisations patronales" },
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
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Déploiement simple et rapide</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Trois étapes pour offrir un programme d'éducation financière à vos collaborateurs.
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
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">Ils ont déployé MyFinCare</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote: "MyFinCare nous a permis de proposer un avantage social innovant sans alourdir nos process RH. Le taux d'adoption a dépassé nos attentes.",
                  author: "Caroline M.",
                  role: "DRH – ETI (450 salariés)",
                },
                {
                  quote: "Nos collaborateurs nous remercient pour cet accompagnement. C'est un vrai facteur de fidélisation, surtout chez les jeunes recrues.",
                  author: "Marc D.",
                  role: "Directeur des Ressources Humaines",
                },
                {
                  quote: "Le tableau de bord entreprise nous donne une vision claire de l'engagement. On mesure concrètement l'impact sur le bien-être au travail.",
                  author: "Léa S.",
                  role: "Responsable QVT",
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
              Prêt à investir dans le bien-être financier de vos équipes ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Rejoignez les entreprises qui font de l'éducation financière un pilier de leur politique RH.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="btn-hero-gradient text-lg px-8 py-6"
                onClick={() => navigate("/partenariat")}
              >
                Demander une démo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={() => {
                  window.location.href = "mailto:contact@myfincare.fr?subject=Demande d'information MyFinCare";
                }}
              >
                <Mail className="mr-2 h-5 w-5" />
                Nous contacter
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
                MyFinCare par Perlib — le programme d'éducation financière qui renforce votre marque employeur et accompagne vos collaborateurs au quotidien.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-3 text-sm">Le programme</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
                <li><a href="#impact" className="hover:text-foreground transition-colors">Impact RH</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">Déploiement</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-3 text-sm">Entreprises</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/partenariat" className="hover:text-foreground transition-colors">Demander une démo</Link></li>
                <li><Link to="/login" className="hover:text-foreground transition-colors">Espace client</Link></li>
                <li><Link to="/rdv-expert" className="hover:text-foreground transition-colors">Nos experts</Link></li>
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
