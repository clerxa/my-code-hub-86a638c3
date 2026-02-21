import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Heart, Leaf, BadgeCheck, Loader2 } from "lucide-react";
import { ClientLogosMarquee } from "@/components/shared/ClientLogosMarquee";
import { LandingProblems } from "@/components/landing/LandingProblems";
import { LandingSolution } from "@/components/landing/LandingSolution";
import { LandingBenefits } from "@/components/landing/LandingBenefits";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { LandingCTAFinal } from "@/components/landing/LandingCTAFinal";

const LandingPageDynamic = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, error } = useQuery({
    queryKey: ["landing-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Page introuvable</h1>
          <p className="text-muted-foreground">Cette page de destination n'existe pas.</p>
        </div>
      </div>
    );
  }

  const arguments_ = [
    { icon: Heart, text: page.argument_sante_mentale, gradient: "from-primary to-secondary" },
    { icon: Leaf, text: page.argument_performance_rse, gradient: "from-secondary to-accent" },
    { icon: BadgeCheck, text: page.argument_technique_paie, gradient: "from-accent to-primary" },
  ];

  const ctaLabel = page.cta_label || "Prendre rendez-vous";
  const openCalendly = () => window.open("https://calendly.com/myfincare", "_blank");

  // Parse JSONB fields
  const problems = page.problems as any[] | null;
  const solution = page.solution as { title: string; description: string; pillars: any[] } | null;
  const benefits = page.benefits as { title: string; items: any[] } | null;
  const faq = page.faq as { question: string; answer: string }[] | null;
  const ctaFinal = page.cta_final as { title: string; subtitle: string; cta: string } | null;

  return (
    <>
      <PageMeta
        title={page.titre_hero || "MyFinCare"}
        description={page.sous_titre_hero || "Programme d'éducation financière en entreprise"}
        path={`/lp/${slug}`}
      />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-24 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-secondary/8" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-3xl translate-y-1/2 -translate-x-1/4" />

          <div className="container max-w-5xl relative z-10 text-center space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
              <span className="hero-gradient">{page.titre_hero}</span>
            </h1>

            {page.sous_titre_hero && (
              <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {page.sous_titre_hero}
              </p>
            )}

            <div className="pt-4">
              <Button
                size="lg"
                className="btn-hero-gradient text-lg px-10 py-7 shadow-glow"
                onClick={openCalendly}
              >
                {ctaLabel}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {page.image_url && (
              <div className="pt-8">
                <img
                  src={page.image_url}
                  alt={page.titre_hero || "MyFinCare"}
                  className="w-full max-w-3xl mx-auto rounded-2xl shadow-2xl"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </section>

        {/* Problems (if defined) */}
        {problems && problems.length > 0 && (
          <LandingProblems problems={problems} />
        )}

        {/* Arguments */}
        <section className="px-4 py-20 lg:py-28">
          <div className="container max-w-6xl">
            <h2 className="text-3xl lg:text-4xl font-bold text-center text-foreground mb-4">
              Pourquoi choisir <span className="hero-gradient">MyFinCare</span> ?
            </h2>
            <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
              Une approche unique mêlant éducation financière et bien-être au travail.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {arguments_.map((arg, i) => (
                <Card key={i} className="group relative overflow-hidden border-0 shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${arg.gradient}`} />
                  <CardContent className="p-8 space-y-5">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${arg.gradient} flex items-center justify-center shadow-lg`}>
                      <arg.icon className="h-7 w-7 text-white" />
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{arg.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Solution (if defined) */}
        {solution && (
          <LandingSolution
            title={solution.title}
            description={solution.description}
            pillars={solution.pillars}
          />
        )}

        {/* Logos clients */}
        <ClientLogosMarquee title="Ils nous font confiance" />

        {/* Benefits (if defined) */}
        {benefits && benefits.items && benefits.items.length > 0 && (
          <LandingBenefits
            title={benefits.title}
            items={benefits.items}
          />
        )}

        {/* FAQ (if defined) */}
        {faq && faq.length > 0 && (
          <LandingFAQ items={faq} />
        )}

        {/* CTA Final */}
        {ctaFinal ? (
          <LandingCTAFinal
            title={ctaFinal.title}
            subtitle={ctaFinal.subtitle}
            cta={ctaFinal.cta}
            onCTA={openCalendly}
          />
        ) : (
          <section className="px-4 py-20 lg:py-28">
            <div className="container max-w-4xl">
              <div className="relative overflow-hidden rounded-3xl p-[2px] bg-gradient-to-r from-primary via-secondary to-accent">
                <div className="bg-card rounded-3xl p-12 md:p-16 text-center space-y-6">
                  <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                    Prêt à transformer le bien-être financier de vos équipes ?
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Échangeons ensemble sur les besoins spécifiques de votre entreprise.
                  </p>
                  <Button
                    size="lg"
                    className="btn-hero-gradient text-lg px-10 py-7"
                    onClick={openCalendly}
                  >
                    {ctaLabel}
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
};

export default LandingPageDynamic;
