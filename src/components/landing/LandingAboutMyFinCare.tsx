import { Shield, Users, GraduationCap, TrendingUp } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const pillars = [
  {
    icon: GraduationCap,
    title: "Éducation financière",
    description: "Des ateliers et contenus pédagogiques pour aider vos collaborateurs à mieux comprendre et gérer leurs finances personnelles.",
  },
  {
    icon: Users,
    title: "Accompagnement individuel",
    description: "Un accès à des experts certifiés pour des consultations confidentielles et personnalisées.",
  },
  {
    icon: Shield,
    title: "100 % confidentiel",
    description: "Aucune donnée personnelle n'est partagée avec l'employeur. La confiance est au cœur de notre approche.",
  },
  {
    icon: TrendingUp,
    title: "Impact mesurable",
    description: "Des indicateurs concrets pour mesurer l'amélioration du bien-être financier et la réduction du stress.",
  },
];

export const LandingAboutMyFinCare = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref as any} className="py-24 px-4 bg-muted/30">
      <div className="container max-w-6xl">
        <div
          className={`text-center space-y-4 mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-sm font-semibold tracking-widest uppercase text-primary">
            Le programme
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            <span className="hero-gradient">MyFinCare</span>, c'est quoi ?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            MyFinCare est le premier programme d'éducation et d'accompagnement financier
            conçu spécifiquement pour les entreprises. Nous aidons vos collaborateurs à
            reprendre le contrôle de leurs finances personnelles — pour un mieux-être au
            travail comme dans la vie.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, i) => (
            <div
              key={i}
              className={`group rounded-2xl border border-border/50 bg-card p-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-500 hover:-translate-y-1 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 100 + 200}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <pillar.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{pillar.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
